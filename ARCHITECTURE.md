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
  simulation, 3D viewer, treatment plan) are built and deployed independently of the shell and of each other.
- **Multi-tenant** — a "client" in our domain language is a tenant. Tenant-scoping is everywhere.
- **Hierarchical entitlement resolution** — super admin enables features per client and checks
  which static versions that client may use; the client admin assigns one of those versions to
  each doctor; a doctor can never receive a version the client was not granted.
- **Single shell** — one host application. It contains three role-based views (super admin,
  client admin, doctor), switched by a view switcher, not three separate deployed apps. This can
  be split into separate host apps later without touching the remotes — the views are already
  isolated by folder and by lazy-loaded route.

---

## 2. Non-negotiable principles

- **Business logic never imports a UI framework.** `1-domain/` and `2-application/` layers inside
  every feature are plain TypeScript. No `react`, no `react-dom`, no CSS. If you find yourself
  writing `import { useState }` in `1-domain/` or `2-application/`, stop — that logic belongs in
  `4-presentation/` or in a hook that wraps the use-case, not inside the use-case itself.
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

Three roles: **super admin**, **client admin** (a "client" = tenant), **doctor**. Every doctor
belongs to exactly one client. Doctors can be reassigned between clients — that's a data change
(a `clientId` on the doctor record plus an audit trail), not an architectural one.

**The cascade:**

- The super admin owns the global feature catalog (which features exist, and the two static
  versions of each) and sets, per client, which features are enabled and **which of those
  versions the client may use**. Super-admin does not create new versions. A dropdown max
  ceiling is not enough — only checked versions are granted.
- The client admin, within that ceiling, assigns an actual version to each of its doctors.
- **Effective access for a doctor is always the narrower of the two limits above it.** A client
  can never grant a doctor more than its own ceiling allows, even by mistake — the resolver
  enforces this, it is never left to UI validation alone.

```ts
// packages/core-entitlements/src/types.ts

export type FeatureId =
  | 'case-submission'
  | 'smile-simulation'
  | '3d-viewer'
  | 'treatment-plan';

export interface TenantEntitlement {
  clientId: string;
  featureId: FeatureId;
  enabled: boolean;
  allowedVersions: string[]; // exact versions super admin grants this client
}

export interface UserEntitlement {
  userId: string;
  clientId: string; // every doctor belongs to exactly one client
  featureId: FeatureId;
  assignedVersion?: string; // set by client admin
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
  tenant: TenantEntitlement,
  user: UserEntitlement,
): EffectiveEntitlement {
  if (!tenant.enabled) {
    return { featureId: user.featureId, enabled: false, version: null };
  }

  const allowed = tenant.allowedVersions;
  const requested = user.assignedVersion;
  const version =
    requested && allowed.includes(requested)
      ? requested
      : allowed.sort(semver.compare).at(-1) ?? null;

  if (!version) {
    return { featureId: user.featureId, enabled: false, version: null };
  }

  return { featureId: user.featureId, enabled: true, version };
}
```

**Required tests before this is considered done** (write these first, not after):
tenant disabled → disabled result; doctor assigned a version not in the allowed set → clamped
to the highest allowed version; doctor assigned an allowed version → that version; doctor with
no assignment → defaults to the highest allowed version.

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
│       ├── rspack.config.ts           # host federation config
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
│   │   │   ├── 1-domain/              # pure rules, zero framework imports
│   │   │   ├── 2-application/         # use-cases orchestrating domain + ports
│   │   │   ├── 3-infrastructure/      # API adapters (mock today, real API later)
│   │   │   ├── 4-presentation/        # React components, the only layer that imports React
│   │   │   └── FeatureRoot.tsx        # the exposed entry point, implements FeatureComponent
│   │   └── rspack.config.ts           # remote federation config
│   ├── feature-smile-simulation/      # same internal shape (1-domain / 2-application / 3-infrastructure / 4-presentation)
│   ├── feature-3d-viewer/             # same internal shape
│   └── feature-treatment-plan/        # same federation contract; FSD internally (1-app / 2-pages / 3-widgets / 4-features / 5-entities / 6-shared)

│
├── mocks/
│   └── config-api/
│       ├── data/
│       │   ├── clients.json
│       │   ├── doctors.json
│       │   ├── feature-catalog.json
│       │   └── feature-configs.json
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

MVP config is plain JSON in `mocks/config-api/data/`. Remotes trust the object the shell passes in; product rules still live in `isValid*` use-cases.

---

## 6. Internal structure of a feature — worked example: `case-submission`

```
remotes/feature-case-submission/src/
├── 1-domain/
│   └── caseRules.ts        # e.g. isValidCase(), requiredAttachmentsFor()
├── 2-application/
│   ├── submitCase.ts       # orchestrates domain rules + infrastructure calls
│   └── submitCase.test.ts  # tested against a fake infrastructure, no network, no DOM
├── 3-infrastructure/
│   └── caseApiClient.ts    # talks to mocks/config-api today; swap base URL later, nothing else
├── 4-presentation/
│   ├── CaseSubmissionScreen.tsx   # renders state, calls application/ via a hook
│   └── useCaseSubmission.ts       # the only place React and application/ meet
└── FeatureRoot.tsx          # implements FeatureComponent, the federation entry point
```

The dependency direction is strict and one-way: `4-presentation` → `2-application` → `1-domain`, with
`3-infrastructure` implementing application ports. `1-domain` depends on nothing. This is what makes
the business logic genuinely portable — `1-domain/caseRules.ts` and `2-application/submitCase.ts`
would work identically if this were rebuilt in a different framework a decade from now.

---

## 7. Module Federation setup

**Tooling:** use **Rspack** with **`@module-federation/enhanced`** (Module Federation 2.0).
Follow the **manifest-first** production pattern: each remote publishes an `mf-manifest.json`
at build time; the host loads exposed modules through that catalog rather than a hardcoded
chunk URL. Shared `react` / `react-dom` must be **singletons** with an identical
`requiredVersion` in the host and every remote.

```ts
// remotes/feature-case-submission/rspack.config.ts (shape)
import { ModuleFederationPlugin } from '@module-federation/enhanced/rspack';

new ModuleFederationPlugin({
  name: 'featureCaseSubmission',
  filename: 'remoteEntry.js',
  manifest: true,
  exposes: { './FeatureRoot': './src/FeatureRoot.tsx' },
  shared: {
    react: { singleton: true, requiredVersion: '^19.0.0' },
    'react-dom': { singleton: true, requiredVersion: '^19.0.0' },
  },
});
```

The host (`apps/shell/rspack.config.ts`) declares `remotes` pointing at each manifest URL (localhost
during dev, a real CDN/host URL in each deploy environment) with the same `shared` block.
The host marks React as `eager` so the first paint does not wait on an async share.

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
  { "featureId": "smile-simulation", "versions": ["1.0.0", "1.4.0"] },
  { "featureId": "3d-viewer", "versions": ["1.0.0", "1.3.1"] },
  { "featureId": "treatment-plan", "versions": ["1.0.0", "1.1.0"] }
]
```

Each feature ships **exactly two static versions**. Super-admin does not add versions; they only
turn a feature on for a client and **check which of those versions the client may use**. Client-admin
assigns one of the checked versions to each doctor. The mock API returns a
**per-version config** (`GET /api/features/:featureId/config?version=`), so switching version
actually changes the feature UI:

- **case-submission** `1.0.0` no packages / `2.1.0` with packages
- **smile-simulation** `1.0.0` no shade or whitening / `1.4.0` target shade + whitening preview
- **3d-viewer** `1.0.0` STL only / `1.3.1` STL and PLY

```json
// mocks/config-api/data/clients.json
[
  {
    "clientId": "eon-dental",
    "entitlements": [
      { "featureId": "case-submission", "enabled": true, "allowedVersions": ["2.1.0"] },
      { "featureId": "3d-viewer", "enabled": false, "allowedVersions": [] }
    ]
  }
]
```

```json
// mocks/config-api/data/doctors.json
[
  { "userId": "doc_123", "clientId": "eon-dental", "role": "doctor",
    "assignments": [{ "featureId": "case-submission", "assignedVersion": "2.1.0" }] }
]
```

`core-config-client` exposes one interface; `MockConfigClient` implements it against this JSON
today. When a real backend exists, a new implementation is written behind the same interface —
nothing in `apps/shell` or any `remotes/*` changes.

---

## 9. The shell: view switcher

The header **View as** dropdown flips between super-admin / client-admin / doctor views. It is a
**development convenience**, not a production "view as" feature. It is on by default (this POC
needs it to demo tenancy). Set `VITE_ENABLE_VIEW_SWITCHER=false` to hide it. It lists **every
doctor and client** from the mock config API so adding rows to `doctors.json` / `clients.json` —
or creating a client in super-admin — shows up in the menu.

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
- **Write the test for a use-case before wiring it into a UI.** `2-application/` functions are
  pure-ish and cheap to test in isolation; do that first, not after the screen "looks done."
- **No speculative abstraction.** Build `case-submission` completely and for real before pulling
  anything shared into `core-sdk` or `core-entitlements`. A second feature confirming the pattern
  is the trigger to generalize — not before.
- **Config is JSON.** Feature versions and tenant rows live in `mocks/config-api/data/`. Refresh
  the page to reset in-memory edits back to those files.
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
Build `feature-case-submission` completely: all four layers, federation config.
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
