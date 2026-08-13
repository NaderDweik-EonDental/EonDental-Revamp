# Frontend Architecture & Implementation Guide

## 0. Read this first — how to use this document

This is the single source of truth for how this frontend gets built. It is not a suggestion.
If you (the implementer, human or AI) think a different approach is better than what's written
here, say so and ask before changing it — don't silently reinterpret the architecture because it
seemed easier in the moment.

Two things this project optimizes for, in priority order:

1. **Longevity** — every feature must be independently buildable, versionable, deployable, and
   removable, for the next decade, without touching unrelated code.
2. **Clarity over cleverness** — every abstraction must earn its place. If a pattern isn't
   repeated at least twice, don't generalize it yet. Do not build a "framework" before you have a
   second feature that needs it.

If something below is ambiguous, that's a flag to ask a question, not to guess and fill the gap
with whatever seems reasonable — a wrong guess here isn't a small bug, it's a structural mistake
that gets baked into every feature built after it.

---

## 1. What we're building — the architecture's name

**A federated, multi-tenant micro-frontend architecture with hierarchical entitlement
resolution, served from a single shell.**

Four ingredients, each a standard pattern in its own right:

- **Micro-frontends via Module Federation** — feature modules (case submission, smile
  simulation, 3D viewer) are built and deployed independently of the shell and of each other.
- **Multi-tenant** — a "client" in our domain language is a tenant. Tenant-scoping is everywhere.
- **Hierarchical entitlement resolution** — super admin sets a ceiling per client; the client
  assigns to its doctors within that ceiling; the effective access a doctor gets is always the
  narrower of the two. Independent doctors (no client) get assigned directly by the super admin.
- **Single shell** — one host application. It contains three role-based views (super admin,
  client admin, doctor), switched by a view switcher, not three separate deployed apps. This can
  be split into separate host apps later without touching the remotes — the views are already
  isolated by folder and by lazy-loaded route.

---

## 2. Non-negotiable principles

- **Business logic never imports a UI framework.** `domain/` and `application/` layers inside
  every feature are plain TypeScript. No `react`, no `react-dom`, no CSS. If you find yourself
  writing `import { useState }` in `domain/` or `application/`, stop — that logic belongs in
  `presentation/` or in a hook that wraps the use-case, not inside the use-case itself.
- **Features never import each other.** `feature-case-submission` must never import anything from
  `feature-smile-simulation` or `feature-3d-viewer`, directly or transitively. If two features
  need to share something, that something belongs in a `packages/` package, not in one feature
  reaching into another.
- **Config is data, not code.** Enabling a feature, changing its version, or changing a client's
  ceiling must always be a JSON/data change (today: mock JSON; later: a real API response) — never
  a code change or redeploy.
- **Every remote must fail gracefully.** A network blip, a bad deploy, or a version mismatch on
  one remote must never crash the shell or another feature. Every remote mount is wrapped in an
  error boundary and a suspense fallback.
- **No premature abstraction.** Build `case-submission` first, fully, for real. Only pull shared
  behavior into `core-sdk` / `core-entitlements` once a second feature actually needs it. Don't
  pre-build scaffolding for `smile-simulation` or `3d-viewer` "for consistency" before they exist.
- **Ask, don't guess, at architecture boundaries.** Naming a new top-level folder, changing the
  manifest schema, changing the entitlement model — these need a conversation, not a silent
  decision made mid-implementation.

---

## 3. The three roles and the entitlement model

Three roles: **super admin**, **client admin** (a "client" = tenant), **doctor**. A doctor either
belongs to exactly one client, or is independent (belongs to none). Doctors can be reassigned
between clients — that's a data change (a nullable `clientId` on the doctor record plus an audit
trail), not an architectural one.

**The cascade:**

- The super admin owns the global feature catalog (which features exist, which versions of each
  exist) and sets, per client, an **entitlement ceiling**: which features are enabled for that
  client, and the range/max version they're allowed to offer.
- The client admin, within that ceiling, assigns an actual version to each of its doctors.
- An independent doctor has no client tier — the super admin assigns directly.
- **Effective access for a doctor is always the narrower of the two limits above it.** A client
  can never grant a doctor more than its own ceiling allows, even by mistake — the resolver
  enforces this, it is never left to UI validation alone.

```ts
// packages/core-entitlements/src/types.ts

export type FeatureId = 'case-submission' | 'smile-simulation' | '3d-viewer';

export interface TenantEntitlement {
  clientId: string;
  featureId: FeatureId;
  enabled: boolean;
  allowedVersionRange: { min?: string; max: string }; // the ceiling, set by super admin
}

export interface UserEntitlement {
  userId: string;
  clientId: string | null; // null = independent doctor
  featureId: FeatureId;
  assignedVersion?: string; // set by client admin, or by super admin if independent
}

export interface EffectiveEntitlement {
  featureId: FeatureId;
  enabled: boolean;
  version: string | null; // null when disabled
}
```

```ts
// packages/core-entitlements/src/resolveEffectiveEntitlement.ts
// Pure function. No fetch, no React, no side effects. This is the single place
// the cascade rule lives — every view (doctor, client-admin, super-admin preview)
// calls this same function. Never re-implement this logic anywhere else.

import semver from 'semver';
import type { TenantEntitlement, UserEntitlement, EffectiveEntitlement } from './types';

export function resolveEffectiveEntitlement(
  tenant: TenantEntitlement | null,
  user: UserEntitlement,
): EffectiveEntitlement {
  // Independent doctor: no client tier, no ceiling to clamp against.
  if (tenant === null) {
    if (!user.assignedVersion) {
      return { featureId: user.featureId, enabled: false, version: null };
    }
    return { featureId: user.featureId, enabled: true, version: user.assignedVersion };
  }

  if (!tenant.enabled) {
    return { featureId: user.featureId, enabled: false, version: null };
  }

  const requested = user.assignedVersion ?? tenant.allowedVersionRange.max;
  const ceiling = tenant.allowedVersionRange.max;
  const effective = semver.gt(requested, ceiling) ? ceiling : requested;

  return { featureId: user.featureId, enabled: true, version: effective };
}
```

**Required tests before this is considered done** (write these first, not after):
tenant disabled → disabled result; independent doctor with no assignment → disabled; independent
doctor with assignment → that version; doctor assigned above ceiling → clamped to ceiling; doctor
assigned below ceiling → their own version; doctor with no assignment → defaults to ceiling max.

---

## 4. Repo layout (canonical — do not deviate without discussion)

Package manager: **pnpm** (workspace-native, disk-efficient, the standard choice for this kind of
monorepo). Task runner: **Nx** (project graph, caching, and affected commands across apps /
packages / remotes).

```
eon-frontend/
├── apps/
│   └── shell/                        # the single host app
│       ├── src/
│       │   ├── app-shell/
│       │   │   ├── Layout.tsx
│       │   │   ├── router.tsx        # lazy-loads each views/* module
│       │   │   └── AuthProvider.tsx
│       │   ├── view-switcher/
│       │   │   ├── ViewSwitcherContext.tsx
│       │   │   └── ViewSwitcherDropdown.tsx   # env-gated, see §9
│       │   ├── views/
│       │   │   ├── super-admin/       # CRUD: clients, global catalog, ceilings
│       │   │   ├── client-admin/       # CRUD: assign doctor versions within ceiling
│       │   │   └── doctor/
│       │   │       ├── FeatureMount.tsx        # mounts federated remotes, see §7
│       │   │       └── pages/
│       │   └── main.tsx
│       ├── vite.config.ts             # host federation config
│       └── package.json
│
├── packages/                          # shared libraries — imported normally, not federated
│   ├── core-design-system/
│   ├── core-sdk/                      # the feature contract every remote implements
│   │   └── src/FeatureModule.ts
│   ├── core-entitlements/             # the resolver from §3, pure logic + tests
│   └── core-config-client/            # ConfigClient interface + MockConfigClient today
│
├── remotes/                           # independently built & deployed federation apps
│   ├── feature-case-submission/
│   │   ├── src/
│   │   │   ├── domain/                # pure rules, zero framework imports
│   │   │   ├── application/           # use-cases orchestrating domain + infra
│   │   │   ├── infrastructure/        # API adapters (mock today, real API later)
│   │   │   ├── presentation/          # React components, the only layer that imports React
│   │   │   ├── manifest.json
│   │   │   └── FeatureRoot.tsx        # the exposed entry point, implements FeatureComponent
│   │   └── vite.config.ts             # remote federation config
│   ├── feature-smile-simulation/      # same internal shape
│   └── feature-3d-viewer/             # same internal shape
│
├── mocks/
│   └── config-api/
│       ├── data/
│       │   ├── clients.json
│       │   ├── doctors.json
│       │   └── feature-catalog.json
│       └── handlers.ts                # MSW handlers serving the JSON above
│
├── nx.json
├── pnpm-workspace.yaml
└── ARCHITECTURE.md                    # this file
```

**Why `packages/` and `remotes/` are separate top-level folders, not one `libs/` folder:**
`packages/` code is consumed via a normal workspace import and gets bundled into whatever
consumes it. `remotes/` code is built as its own independently deployable artifact and consumed
at *runtime* via Module Federation, never via a static import. Mixing these up — importing a
remote's internals directly instead of through federation — silently defeats the entire point of
this architecture (independent deployability), so the folder split makes the distinction
impossible to miss.

---

## 5. The feature contract (`core-sdk`)

Every remote exposes exactly one thing to the shell: a React component matching this shape.
Nothing else is exposed across the federation boundary — no utility functions, no raw data, no
internal components. This keeps the contract small enough to actually hold steady for years.

```ts
// packages/core-sdk/src/FeatureModule.ts
import type { ComponentType } from 'react';
import type { EffectiveEntitlement } from '@eon/core-entitlements';

export interface FeatureProps<TConfig = Record<string, unknown>> {
  config: TConfig;
  entitlement: EffectiveEntitlement;
}

export type FeatureComponent<TConfig = Record<string, unknown>> = ComponentType<
  FeatureProps<TConfig>
>;
```

Every remote also ships a `manifest.json` — this is metadata *about* the feature, read by the
shell and by the admin views, never imported by code:

```json
{
  "featureId": "case-submission",
  "displayName": "Case submission",
  "owner": "clinical-team",
  "allowedRoles": ["doctor"],
  "versions": [
    { "version": "1.0.0", "status": "deprecated" },
    { "version": "2.1.0", "status": "active" }
  ],
  "configSchema": {
    "type": "object",
    "properties": {
      "requireXray": { "type": "boolean" },
      "maxAttachments": { "type": "number" }
    },
    "required": ["requireXray", "maxAttachments"]
  }
}
```

**Rule:** any config object passed into a feature is validated against `configSchema` at the
boundary (in the feature's own `infrastructure/`, using something like `ajv`) before it reaches
`presentation/`. Never trust the config object blindly — a bad or stale client config is the most
likely source of a silent, hard-to-diagnose bug in this system, so fail loud and early instead.

---

## 6. Internal structure of a feature — worked example: `case-submission`

```
remotes/feature-case-submission/src/
├── domain/
│   └── caseRules.ts        # e.g. isValidCase(), requiredAttachmentsFor()
├── application/
│   ├── submitCase.ts       # orchestrates domain rules + infrastructure calls
│   └── submitCase.test.ts  # tested against a fake infrastructure, no network, no DOM
├── infrastructure/
│   └── caseApiClient.ts    # talks to mocks/config-api today; swap base URL later, nothing else
├── presentation/
│   ├── CaseSubmissionScreen.tsx   # renders state, calls application/ via a hook
│   └── useCaseSubmission.ts       # the only place React and application/ meet
├── manifest.json
└── FeatureRoot.tsx          # implements FeatureComponent, the federation entry point
```

The dependency direction is strict and one-way: `presentation` → `application` → `domain`, with
`infrastructure` called only from `application`. `domain` depends on nothing. This is what makes
the business logic genuinely portable — `domain/caseRules.ts` and `application/submitCase.ts`
would work identically if this were rebuilt in a different framework a decade from now.

---

## 7. Module Federation setup

**Tooling:** use **`@module-federation/vite`** (the official module-federation.io Vite plugin),
not the older `@originjs/vite-plugin-federation`. Follow the **manifest-first** production
pattern it recommends: each remote publishes an `mf-manifest.json` at build time; the host loads
exposed modules through the plugin's runtime rather than a hardcoded URL. This gets you the
version-pinning-per-client behavior almost for free — the shell can decide which manifest URL to
load per user, based on the resolved entitlement version.

**Shared dependencies:** `react` and `react-dom` must be declared as **singletons** with an
identical required version in the host and in every remote. A drifted version here is the single
most common cause of a micro-frontend bug (duplicate React copies → broken hooks, `Invalid hook
call` errors that only show up once a component is federated). Keep `react`/`react-dom` version
ranges byte-identical across every `package.json` in `apps/` and `remotes/`, and verify at
runtime — during development — that only one copy of React is actually loaded.

```ts
// remotes/feature-case-submission/vite.config.ts (shape, not final)
import { defineConfig } from 'vite';
import { federation } from '@module-federation/vite';

export default defineConfig({
  plugins: [
    federation({
      name: 'featureCaseSubmission',
      filename: 'remoteEntry.js',
      exposes: { './FeatureRoot': './src/FeatureRoot.tsx' },
      shared: {
        react: { singleton: true, requiredVersion: '^19.0.0' },
        'react-dom': { singleton: true, requiredVersion: '^19.0.0' },
      },
    }),
  ],
  build: { target: 'esnext' },
});
```

The host (`apps/shell/vite.config.ts`) declares `remotes` pointing at each manifest URL (localhost
during dev, a real CDN/host URL in each deploy environment) with the same `shared` block.

**Consuming a remote in the doctor view:**

```tsx
// apps/shell/src/views/doctor/FeatureMount.tsx
import { lazy, Suspense, useMemo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import type { FeatureId } from '@eon/core-entitlements';
import type { FeatureProps } from '@eon/core-sdk';

const remoteLoaders: Record<FeatureId, () => Promise<{ default: React.ComponentType<FeatureProps> }>> = {
  'case-submission': () => import('featureCaseSubmission/FeatureRoot'),
  'smile-simulation': () => import('featureSmileSimulation/FeatureRoot'),
  '3d-viewer': () => import('feature3dViewer/FeatureRoot'),
};

export function FeatureMount({ featureId, config, entitlement }: FeatureMountProps) {
  const Component = useMemo(() => lazy(remoteLoaders[featureId]), [featureId]);
  return (
    <ErrorBoundary fallback={<FeatureLoadError featureId={featureId} />}>
      <Suspense fallback={<FeatureLoadingSkeleton />}>
        <Component config={config} entitlement={entitlement} />
      </Suspense>
    </ErrorBoundary>
  );
}
```

Note the error boundary wraps the suspense, not the other way around — a failed remote load must
be catchable, and this ordering is what makes that reliable.

---

## 8. Config API (mocked today)

`mocks/config-api` serves three JSON documents via MSW (Mock Service Worker), so the shell talks
to something that looks exactly like a real API from day one — swapping in a real backend later
means changing `core-config-client`'s implementation, nothing upstream of it.

```json
// mocks/config-api/data/feature-catalog.json
[
  { "featureId": "case-submission", "versions": ["1.0.0", "2.1.0"] },
  { "featureId": "smile-simulation", "versions": ["1.4.0"] },
  { "featureId": "3d-viewer", "versions": ["1.0.0"] }
]
```

```json
// mocks/config-api/data/clients.json
[
  {
    "clientId": "eon-dental",
    "entitlements": [
      { "featureId": "case-submission", "enabled": true, "allowedVersionRange": { "max": "2.1.0" } },
      { "featureId": "3d-viewer", "enabled": false, "allowedVersionRange": { "max": "1.0.0" } }
    ]
  }
]
```

```json
// mocks/config-api/data/doctors.json
[
  { "userId": "doc_123", "clientId": "eon-dental", "role": "doctor",
    "assignments": [{ "featureId": "case-submission", "assignedVersion": "2.1.0" }] },
  { "userId": "doc_456", "clientId": null, "role": "doctor",
    "assignments": [{ "featureId": "case-submission", "assignedVersion": "1.0.0" }] }
]
```

`core-config-client` exposes one interface; `MockConfigClient` implements it against this JSON
today. When a real backend exists, a new implementation is written behind the same interface —
nothing in `apps/shell` or any `remotes/*` changes.

---

## 9. The shell: view switcher

The dropdown that flips between super-admin / client-admin / doctor views is a **development
convenience for now**, not a production "view as" feature. Gate it explicitly:

```tsx
// apps/shell/src/view-switcher/ViewSwitcherDropdown.tsx
if (import.meta.env.VITE_ENABLE_VIEW_SWITCHER !== 'true') return null;
```

If this later becomes a real feature (a super admin genuinely switching into a client's view to
help them), that's a different, more serious thing — it needs a persistent "you are viewing as
X" banner and an audit log entry, and should be treated as a deliberate feature with its own
design pass, not an extension of this dev toggle. Flag it explicitly when that need comes up
rather than quietly promoting the dev toggle into production.

Each of `views/super-admin`, `views/client-admin`, `views/doctor` is its own lazy-loaded route
tree (`React.lazy` per view in `router.tsx`), so a doctor's browser never downloads the admin
screens, and vice versa, even though they ship in the same build.

---

## 10. Coding standards (read before writing any code)

- **TypeScript strict mode everywhere.** No implicit `any`. If `any` is genuinely unavoidable, it
  must have a `// TODO(reason):` comment explaining why and what would remove it.
- **Named exports everywhere**, except each feature's single federation entry point
  (`FeatureRoot.tsx`), which needs a default export for the federation plugin to consume cleanly.
- **No feature imports another feature.** No `packages/` package reaches into `remotes/`. Enforce
  this with an ESLint import boundary rule, not just convention — convention gets violated the
  first time someone's in a hurry.
- **Write the test for a use-case before wiring it into a UI.** `application/` functions are
  pure-ish and cheap to test in isolation; do that first, not after the screen "looks done."
- **No speculative abstraction.** Build `case-submission` completely and for real before pulling
  anything shared into `core-sdk` or `core-entitlements`. A second feature confirming the pattern
  is the trigger to generalize — not before.
- **Validate config at the boundary, always.** Every feature validates its incoming `config`
  against its own `configSchema` in `infrastructure/`, and fails loud (a clear error state, not a
  silent `undefined`) if it doesn't match.
- **Small, scoped commits.** A single PR touching `shell/`, `core-entitlements/`, and
  `feature-case-submission/` simultaneously is a sign scope crept — split it into three.
- **Ask when this document doesn't cover something**, rather than inventing a convention on the
  spot. Update this document once the answer is settled, so the next decision doesn't repeat the
  same question.

---

## 11. Build order (follow in sequence — do not jump ahead)

**Phase 0 — Monorepo skeleton, zero UI**
Set up pnpm workspaces + Nx. Build `core-sdk` (types only) and `core-entitlements`
(resolver + full test suite from §3) with no UI involved at all.
*Done when:* `pnpm test` passes for `core-entitlements` with every branch from §3 covered.

**Phase 1 — First remote, standalone**
Build `feature-case-submission` completely: all four layers, `manifest.json`, federation config.
*Done when:* the remote builds and serves its own `remoteEntry.js`/manifest with no shell involved.

**Phase 2 — Shell + doctor view consuming that one remote**
Build `apps/shell` with federation host config, the `doctor` view, `FeatureMount`, error boundary,
and `core-config-client`'s `MockConfigClient` wired to `mocks/config-api`.
*Done when:* a mocked doctor session renders `case-submission`, loaded from its independently
built bundle, inside the shell.

**Phase 3 — Real entitlement wiring**
Replace any hardcoded "feature is on" assumption with a live call through
`resolveEffectiveEntitlement` using mock tenant/user data.
*Done when:* editing the mock JSON (disable a tenant, lower a ceiling, change an assignment)
changes what renders, without rebuilding the shell or the remote.

**Phase 4 — Second and third remotes**
Repeat Phase 1's pattern for `smile-simulation` and `3d-viewer`.
*Done when:* all three remotes build independently and none imports from another.

**Phase 5 — Admin views**
Build `client-admin` (assign versions within ceiling) and `super-admin` (manage clients, set
ceilings, manage the catalog) against the mock API. Wire up the (dev-gated) view switcher.
*Done when:* changing an assignment in `client-admin` view is reflected in the `doctor` view
after a refetch.

**Phase 6 — Hardening**
Define the real backend integration point (new `ConfigClient` implementation, same interface).
Add CI: typecheck + lint + test + build across every package on every PR. Add basic error
reporting for remote-load failures.

---

## 12. Glossary

- **Remote** — an independently built/deployed feature module (case submission, smile
  simulation, 3D viewer).
- **Host / shell** — the app that loads and renders remotes at runtime.
- **Tenant / client** — same thing, our domain calls it "client."
- **Ceiling** — the maximum a super admin allows a given client, per feature.
- **Effective entitlement** — the final resolved answer for one doctor: enabled or not, and which
  version, after applying the cascade.
- **View** — one of the three role-based UIs living inside the single shell (not a separate app).
