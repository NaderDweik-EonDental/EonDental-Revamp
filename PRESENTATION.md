# Architecture presentation

Each section defines a pattern, then why it was chosen, then how it is implemented.

This is not `ARCHITECTURE.md`. That file is the implementation guide. This file is the presentation.

---

## 1. Overview

The system is a single host application that loads independently built feature modules at runtime, scopes product capability per organization, and keeps feature internals isolated behind a small contract.

| Composition | Access | Interior (3 remotes) | Interior (1 remote) |
|---|---|---|---|
| Module Federation | Multi-tenancy | Clean Architecture | Feature-Sliced Design |

---

## 2. Module Federation — definition

Module Federation is a runtime composition model for JavaScript applications. A host application downloads and executes modules that were built and deployed as separate artifacts, without compiling those modules into the host bundle.

It was introduced with Webpack 5 to solve independent delivery of frontend surfaces that still share one user session. The same runtime protocol now exists for Webpack, Rspack, and Vite via `@module-federation/*`.

| Static import | Federated import |
|---|---|
| Resolved at build time. The producer is copied into the consumer bundle. | Resolved when the page runs. The producer is a network request to a deployed entry. |
| Consumer and producer ship on the same release train. | Consumer and producer can ship on different release trains. |
| Version of the producer is whatever was installed when the host was built. | Version of the producer is whichever entry URL the host is configured to load. |

It is not a design system, not an iframe, and not an npm package. npm still copies code at install/build. Federation leaves the producer on its own origin and wires it in after the host has started.

---

## 3. Module Federation — runtime model

| Term | Meaning |
|---|---|
| Host (shell) | The application the browser loads first. Declares remotes and shared libraries. Owns routing, session, and layout. |
| Remote | An independently built application that exposes one or more modules. Serves an entry file the host can fetch. |
| Expose | A named export from a remote, typically a React root. The host imports that name as if it were a local package. |
| `remoteEntry` / `mf-manifest.json` | The catalog the host reads to discover hashed chunk URLs. Manifest-first is the current production pattern. |
| Shared | Libraries that must exist once in the page (React, ReactDOM). Declared as singletons with a required version range. |

If host and remote each bundle their own React, hooks break (`Invalid hook call`). Shared `react` and `react-dom` as singletons with an identical range is not optional.

---

## 4. Module Federation — why

Features in this product have independent owners, independent release cadence, and independent failure domains. They must still appear as one application to the user.

| Alternative | Failure mode |
|---|---|
| Monolith | One pipeline, one bundle. A viewer change is coupled to case submission. Per-tenant capability becomes branching inside one codebase. |
| npm workspace packages only | Still one host build. Updating a package for one tenant updates every tenant at the next deploy. |
| iframes | Separate documents, duplicated auth, no shared React tree, weak layout integration. |
| Separate deployed apps + links | The product is no longer one workspace. Session and navigation split across origins. |

Federation keeps independent deployability without abandoning a single host, a shared React tree, or in-place navigation.

---

## 5. Bundlers — Webpack, Rspack, Vite

Federation is a runtime protocol. The bundler is how artifacts are produced. Webpack created the model; Rspack and Vite consume the same family of plugins.

| | Webpack 5 | Rspack | Vite |
|---|---|---|---|
| Role | Original `ModuleFederationPlugin`. Largest body of examples. | Rust implementation with Webpack-compatible configuration. First-class Federation. | ESM-native development server. Production bundle via Rollup. |
| Development | Bundle-based HMR. Historically slow on large graphs. | Fast production-like compiles. Dev is still a bundling step. | Native ESM and near-instant HMR. |
| Federation maturity | Oldest path. Default reference for most published architectures. | Same runtime lineage as Webpack, substantially faster CI. | Newer. Official plugin. Manifest-first remote entries. |
| Fit | Existing Webpack estates. | Webpack plugin compatibility with higher throughput. | Greenfield React applications where local iteration speed matters. |

**Choice:** Rspack plus `@module-federation/enhanced` (Federation 2.0). Same runtime family as Webpack, faster compiles, first-class `mf-manifest.json`. Vite remains valid for local DX; Webpack remains valid for existing estates.

---

## 6. Module Federation — how

**Host.** `apps/shell` declares remotes by name. Each entry is a manifest URL: localhost ports in development, absolute Pages URLs in production, injected via `VITE_*_REMOTE`. Rspack `ModuleFederationPlugin` from `@module-federation/enhanced`. React is shared as a singleton; the host marks it `eager`.

**Remote.** Each remote sets `manifest: true`, `filename: 'remoteEntry.js'`, and a single expose. Shared block is identical to the host: `react` and `react-dom`, singleton, `requiredVersion: '^19.0.0'`, workspace pin `19.1.0`.

**Consumption.** `FeatureMount` uses `React.lazy(() => import('featureX/FeatureRoot'))`. An error boundary wraps Suspense so a missing or failing remote isolates to that mount. Production manifest URLs are cache-busted with the git SHA because hashed chunks are immutable and stale manifests 404.

| Remote | Name | Dev origin |
|---|---|---|
| case-submission | `featureCaseSubmission` | localhost:5001 |
| smile-simulation | `featureSmileSimulation` | localhost:5002 |
| 3d-viewer | `feature3dViewer` | localhost:5003 |
| treatment-plan | `featureTreatmentPlan` | localhost:5004 |

---

## 7. Remotes and the expose contract

A remote may be internally large. What crosses the federation boundary is one default-exported React component: `FeatureRoot`. No utilities, no CSS, no domain functions.

That component implements `FeatureProps`: `config` (versioned JSON) and `entitlement` (already-resolved access). The remote does not fetch tenancy. The host does not import remote internals.

| Constraint | Rationale |
|---|---|
| One expose | A wide surface becomes a distributed monolith. Independent deployability collapses. |
| Two versions, one bundle | `1.0.0` and `2.1.0` are capability flags in JSON, not two remotes. Duplicate deploys would misstate the product. |
| Remote ignorant of tenant id | Tenant-specific branching inside a feature cannot be sold twice. |

---

## 8. Multi-tenancy — definition

Multi-tenancy is an architecture in which one deployed system serves many isolated customers (tenants). Isolation may be physical (separate databases) or logical (shared runtime, partitioned data and authorization). Software-as-a-service frontends typically use logical tenancy: one application, many organizations, authorization derived from identity.

A tenant is not a git repository and not a folder of white-label code. It is an identity in the authorization model. All tenants execute the same artifacts; they differ in data and in which capabilities those artifacts are allowed to expose.

White-label forks duplicate code per customer. Multi-tenancy reuses one codebase and varies configuration and rights. This system is the latter.

---

## 9. Multi-tenancy — why

The product is sold to organizations, not to a single global user list. Organizations differ in which modules they purchase and which versions they are allowed to run. Users inside an organization further differ in assignment.

Encoding that as `if (organization === …)` inside features couples product code to accounts. Encoding it as data lets operations change access without a frontend release, and lets the same remote serve every tenant.

Federation answers how features ship independently. Multi-tenancy answers how one ship looks different per customer without forking.

---

## 10. Multi-tenancy — how

In this domain a tenant is named a client. Every doctor belongs to exactly one client. There is no unscoped user. Reassignment is a data change (`clientId`), not a structural one.

| Record | Role in tenancy |
|---|---|
| `clients.json` | Tenant rows. Per feature: `enabled`, `allowedVersions` (explicit set, not a max). |
| `doctors.json` | Users scoped by `clientId`. Per feature: optional `assignedVersion`. |
| `feature-catalog.json` | Global inventory. Super-admin does not mint versions; it grants from this set. |

Remotes receive only `config` and `entitlement`. They never read `clientId`. The shell is the only layer that maps identity → tenant → effective access → which JSON blob to pass.

---

## 11. Entitlements — definition

An entitlement is a structured right: a subject may use a capability, optionally at a specific version. It is authorization data, not UI state. Effective entitlement is the right after every governing layer has been applied — never the raw row from a single table.

A ceiling is the set of versions a higher layer permits a lower layer to grant. Hierarchy is the rule that a lower layer cannot exceed that set, including by omission (inherit) or by mistake (assigning a version not in the set).

---

## 12. Entitlements — hierarchy

| Layer | Authority | Limit |
|---|---|---|
| Super-admin | Enable a feature per tenant. Grant an explicit subset of catalog versions (checkboxes). | Cannot invent versions. A max-version dropdown is insufficient: granting `2.1.0` must not imply `1.0.0`. |
| Client-admin | Assign one granted version per doctor, or inherit. | Cannot enable a disabled feature. Cannot assign a version not in the tenant set. |
| Doctor | Consumes remotes for which effective entitlement is enabled. | Cannot self-grant. |

`resolveEffectiveEntitlement` is a pure function in `@eon/core-entitlements`. Feature off → disabled. Assigned version in the allowed set → that version. Assigned version missing or forbidden → highest allowed (semver). Empty allowed set → disabled.

The UI is not the boundary. The mock API sanitizes writes against the tenant ceiling. The same rule belongs on a real backend. The package exists so the wording of the cascade is not reimplemented per view.

---

## 13. Clean Architecture — definition

Clean Architecture (Uncle Bob) is a dependency rule: source code dependencies point inward, toward policy, never toward frameworks or I/O. The center is entities and use cases. Adapters and the UI sit outside. The domain compiles without React, HTTP, or a database.

| Ring | Contains | May depend on |
|---|---|---|
| Domain | Rules, invariants, names of the business | Nothing outward |
| Application | Use cases; orchestrates domain and ports | Domain |
| Infrastructure | Implementations of ports (HTTP, storage) | Application ports, domain types |
| Presentation | UI, hooks, framework bindings | Application, domain |

Ports and adapters (hexagonal architecture) is the same idea with different vocabulary: the application defines interfaces; the outside world implements them.

---

## 14. Clean Architecture — why and how

**Why.** Feature logic (what makes a case valid, which attachments are required) must outlive the current UI library. Putting that logic in components couples product rules to React and makes them untestable without a DOM.

**How.** Applied in `feature-case-submission`, `feature-smile-simulation`, and `feature-3d-viewer`. Folders are numbered so the inward order is visible in the tree:

| Folder | Contents |
|---|---|
| `1-domain` | Pure rules. `isValidCase`, `requiredAttachmentsFor`. Zero React. |
| `2-application` | Named jobs. `submitCase`, `runSimulation`, `loadModel`. Ports. Tests against fakes. |
| `3-infrastructure` | In-memory API clients. Swap the adapter, not the use case. |
| `4-presentation` | Screens and hooks. The only layer that imports React. |
| `FeatureRoot.tsx` | Federation entry. Wires presentation to an adapter instance. |

Import graph: presentation → application → domain. Infrastructure implements application ports. Domain imports neither.

---

## 15. Feature-Sliced Design — definition

Feature-Sliced Design (FSD) is a structural methodology for frontend codebases. The project is divided into layers with a strict import rule: a module may import only from layers below it. Slices isolate features horizontally; segments (`ui`, `model`, `api`) isolate concerns inside a slice.

| Layer | Responsibility |
|---|---|
| app | Application composition, providers, the root. |
| pages | Full screens / route-level composition. |
| widgets | Composite blocks used on pages. |
| features | User actions that change state (edit draft, submit). |
| entities | Business nouns and their rules (treatment plan). |
| shared | UI kit primitives, config, libraries with no business meaning. |

The rule is directional. `pages` may use `widgets`; `entities` must not import `pages`. Cross-import between sibling features is forbidden — extract to `entities` or `shared`.

---

## 16. Feature-Sliced Design — why and how

**Why.** Clean Architecture is strong at isolating policy from I/O. FSD is strong at isolating vertical product slices so screens do not become a dumping ground. Using both in one repository demonstrates that Federation does not prescribe the interior of a remote.

**How.** Applied only in `feature-treatment-plan`. Same `FeatureRoot` contract on the outside.

| Folder | Slice |
|---|---|
| `1-app` | Federation root composition |
| `2-pages` | Planner page |
| `3-widgets` | Plan timeline, visit estimate |
| `4-features` | Edit draft, submit plan |
| `5-entities` | Treatment-plan types and rules |
| `6-shared` | Styles and local helpers |

Path aliases (`@/pages`, `@/features`, …) encode the layers. Versions still arrive as JSON (`maxStages`, `allowVisitEstimate`); FSD does not replace tenancy or Federation.

---

## 17. Shared kernel

Code that is imported at build time lives in `packages/`. Code that is loaded at runtime lives in `remotes/`. Mixing those mechanisms is the most expensive mistake in this architecture.

| Package | Kind | Contents |
|---|---|---|
| `@eon/core-sdk` | Contract | `FeatureProps`, `FeatureComponent`. The only type remotes must implement. |
| `@eon/core-entitlements` | Policy | `FeatureId`, `TenantEntitlement`, `UserEntitlement`, `resolveEffectiveEntitlement`, ceiling sanitization. |
| `@eon/core-config-client` | Port | `ConfigClient` interface. `MockConfigClient` over fetch. A real backend is another class. |

pnpm workspaces (`apps/*`, `packages/*`, `remotes/*`, `mocks/*`). Nx `^build` so libraries compile before consumers. Packages are not federated: changing the resolver must rebuild dependents, because the cascade is one rule.

---

## 18. Configuration as data

Enabling a feature, granting a version, or changing knobs (packages, file formats, shade controls) is a data change. It is not a rebuild of the remote and not a branch in presentation code keyed on tenant name.

| Document | Question it answers |
|---|---|
| `feature-catalog.json` | What features exist, and which version ids are defined. |
| `feature-configs.json` | What each (feature, version) pair actually configures. |
| `clients.json` | Per tenant: enabled, allowedVersions. |
| `doctors.json` | Per user: clientId, assignments. |

MSW intercepts `/api/*` so the host is written against HTTP from day one. `MockConfigClient` is that HTTP. Persistence of admin writes is in-memory for the MVP; refresh reloads JSON seeds.

| Feature | Low version | High version |
|---|---|---|
| case-submission | 1.0.0 — no packages | 2.1.0 — packages, X-ray required |
| smile-simulation | 1.0.0 — no shade | 1.4.0 — shade, whitening |
| 3d-viewer | 1.0.0 — STL | 1.3.1 — STL + PLY |
| treatment-plan | 1.0.0 — 3 stages | 1.1.0 — 5 stages, visit estimate |

---

## 19. Composition

Federation composes applications. Tenancy composes customers onto one deployment. Entitlements compose permission across three roles. Clean Architecture and FSD compose code inside a remote. The SDK is the only type that sits on the Federation boundary.

| Layer | Does not know |
|---|---|
| Remote internals | Which tenant is viewing them. How the host is bundled. |
| Host | Domain rules of a feature. Clean vs FSD inside a remote. |
| Entitlements package | React, Federation, MSW. |
| Config JSON | How screens are implemented. |

Features do not import features. Packages do not import remotes. The host imports remotes only as federated modules, and packages only as workspace libraries.
