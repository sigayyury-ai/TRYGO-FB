## SEO Agent Technical Plan

- **Feature**: SEO Agent Core Integration
- **Revision**: 2025-11-11
- **Prepared by**: Platform Engineering

---

### 1. Architecture Overview

- **Frontend**: Existing TRYGO SPA (TypeScript, React) served via Node.js/Apollo gateway.
  - Add `seo-agent` module under marketing toolkit namespace.
  - Leverage existing layout shell components (`Sidebar`, `TopBar`, `ContentCanvas`).
- **Backend**: Node.js services with Apollo GraphQL federated schema.
  - Extend `Project` domain schema with agent-related resolvers.
  - Introduce `SeoAgentService` wrapper for ChatGPT API interactions and session logging.
- **Data Sources**:
  - MongoDB collections: `projects`, `hypotheses`, `leanCanvas`, `icpProfiles`, `agentSessions`, `agentEntitlements`.
  - External APIs: ChatGPT (content generation), analytics providers (existing connectors).
- **Infrastructure**:
  - Feature flag via LaunchDarkly/ConfigCat (`seo_agent.enabled`, `seo_agent.ui_testing`).
  - Environment detection: `NODE_ENV`, `TRYGO_ENV` (`development`, `staging`, `production`).

---

### 2. Frontend Modules

1. **Route Registration**
   - Path pattern: `/dashboard/:projectId/seo-agent`
   - Loader fetches:
     - Active project + hypothesis summary.
     - Agent entitlement status for current user.
     - Lean Canvas, ICP snapshots.
     - Analytics rollup (deferred via Suspense).
   - Guards:
     - Redirect to upgrade modal if `entitlement.status !== active`.

2. **Page Layout**
   - Components:
     - `SeoAgentPage`
     - `SeoAgentConsole` (tab shell)
     - `SeoPlanPanel` (schedule + backlog)
     - `SeoSemanticsPanel` (cluster management)
     - `SeoContentPanel` (production queue)
     - `SeoPostingSettingsPanel` (cadence & automation)
     - `UiTestingBanner`
     - `SubscriptionBanner`
   - Dev shell variant toggled by `seo_agent.devShell` flag to render a minimal `DevAgentLayout`.

3. **State Management**
   - Apollo Client queries:
     - `GetSeoAgentContext`
     - `GetSeoAnalytics`
     - `GetSeoPostingSettings`
     - `GetSeoClusters`
     - `GetSeoBacklog`
   - Local Zustand/Context for UI testing mode toggles (`useUiTestingStore`):
     - `isTesting`
     - `scenarioId`
   - `usePostingSettingsStore` to manage cadence edits before saving (fields: `weeklyPublishCount`, `preferredDays`, `autoPublishEnabled`).
   - `useSeoClustersStore` to handle optimistic cluster CRUD and backlog sync (fields: `clusters`, `selectedIntent`, `backlogIdeas`).
   - `useContentQueueStore` to manage drafts status, category filters, and inline edits prior to persistence.
   - Auto-generated content ideas surface through `seoAgentContentQueue` query with metadata for strategic category (pains/goals/triggers/product features/benefits/FAQs/info); UI offers a collapsed custom entry form for manual additions.
   - Token usage overlay shows remaining quota from GraphQL response.

4. **UI Testing Mode**
   - When enabled:
     - `Generate` button disabled; `Simulate` button triggers local mock responses (`fixtures/uiTesting.ts`).
     - Visual watermark.
     - Logging to console for QA.
   - Toggle stored in local storage to persist per browser session.

5. **Dev vs Prod Behavior**
   - `seo_agent.devShell` flag: render standalone layout.
   - Production: embed inside existing shell (default).
   - Shared components ensure parity; storybook stories for both contexts.

---

### 3. Backend Enhancements

1. **GraphQL Schema**
   - Extend `type Query`:
     - `seoAgentContext(projectId: ID!, hypothesisId: ID): SeoAgentContext!`
     - `seoAgentAnalytics(hypothesisId: ID!): SeoAgentAnalytics!`
     - `seoAgentPostingSettings(projectId: ID!): PostingSettings!`
     - `seoAgentClusters(projectId: ID!, hypothesisId: ID): [SeoCluster!]!`
     - `seoAgentBacklog(projectId: ID!, hypothesisId: ID): [BacklogIdea!]!`
     - `seoAgentContentQueue(projectId: ID!, hypothesisId: ID): [ContentWorkItem!]!`
   - Mutations:
     - `startSeoAgentSession(input: StartAgentSessionInput!): SeoAgentSession!`
     - `generateSeoAgentResponse(input: AgentPromptInput!): AgentResponse!`
     - `logSeoAgentAction(input: AgentActionInput!): Boolean!`
     - `updateSeoAgentPostingSettings(input: PostingSettingsInput!): PostingSettings!`
     - `createSeoAgentCluster(input: SeoClusterInput!): SeoCluster!`
     - `updateSeoAgentCluster(id: ID!, input: SeoClusterInput!): SeoCluster!`
     - `deleteSeoAgentCluster(id: ID!): Boolean!`
     - `upsertSeoAgentBacklogItem(input: BacklogIdeaInput!): BacklogIdea!`
     - `upsertSeoAgentContentItem(input: ContentWorkItemInput!): ContentWorkItem!`
     - `deleteSeoAgentContentItem(id: ID!): Boolean!`
   - Types include `AgentEntitlementStatus`, `UiTestingCapabilities`.

2. **Resolvers**
   - `SeoAgentContextResolver`:
     - Aggregates project, hypothesis, Lean Canvas, ICP data with caching (Redis/in-memory).
   - `GenerateSeoAgentResponseResolver`:
     - Enforces entitlement check.
     - Handles UI Testing mode by short-circuiting to canned responses (if `uiTesting = true`).
     - Calls `ChatGptClient` for live generation.
   - `PostingSettingsResolver`:
      - Reads/writes cadence preferences scoped to project or hypothesis.
      - Validates ranges (e.g., max posts per week) and ensures preferred days align with cadence total.
   - `SeoClusterResolver`:
      - Handles CRUD for keyword clusters, keeping versions per hypothesis.
      - Triggers backlog idea generation (Phase 1: mocked suggestions stored server-side).
   - `BacklogResolver`:
      - Returns outstanding backlog items and updates status when scheduled/deleted from Plan tab.
   - `ContentQueueResolver`:
      - Provides CRUD for content work items with status transitions (`draft`, `review`, `ready`).
      - Links work items to backlog ideas or clusters for traceability and seeds initial monthly queue on first load.

3. **Services**
   - `ChatGptClient`:
     - Wraps OpenAI API (latest generally available ChatGPT model; keep alias updated via config, default `gpt-4.1`).
     - Implements retries, token accounting, request/response logging.
   - `AgentSessionService`:
     - Persists session metadata (`projectId`, `hypothesisId`, `userId`, `environment`, `startedAt`, `uiTesting`).
     - Associates `AgentAction` events (tab switches, simulated responses).
   - `EntitlementService`:
     - Retrieves user’s agent license from `agentEntitlements` collection or billing API.
     - Exposes `isActive`, `status`, `renewalDate`.
   - `SeoClusterService`:
      - Manages cluster persistence, intent categorization, and keyword normalization.
      - Generates fallback backlog ideas in dev/staging (fixture-driven) until AI automation is wired.
   - `BacklogService`:
      - Stores backlog items, links them to clusters, marks status when scheduled/archived.
   - `ContentQueueService`:
       - Manages lifecycle of content artifacts, assigns owners, tracks status transitions, and pre-generates initial monthly backlog/plan ideas (minimum 20) based on cluster metadata (pains, goals, triggers, product features, benefits, FAQs).

4. **Data Models (MongoDB)**
   - `agentSessions`
     ```
     {
       _id,
       userId,
       projectId,
       hypothesisId,
       environment, // dev | staging | prod
       uiTesting,
       startedAt,
       endedAt,
       tokensUsed,
       actions: [{ type, payload, createdAt }]
     }
     ```
   - `agentEntitlements`
     ```
     {
       _id,
       userId,
       planId,
       status, // active | pending | lapsed
       effectiveAt,
       expiresAt,
       billingReference
     }
     ```
   - Optionally reuse existing billing store if available.
   - `agentPostingSettings`
     ```
     {
       _id,
       projectId,
       hypothesisId,
       weeklyPublishCount, // number
       preferredDays: [String], // e.g. ['Tuesday', 'Thursday']
       autoPublishEnabled, // boolean
       lastUpdatedBy,
       updatedAt
     }
     ```
   - `seoClusters`
     ```
     {
       _id,
       projectId,
       hypothesisId,
       title,
       intent,
       keywords: [String],
       createdBy,
       createdAt,
       updatedAt
     }
     ```
   - `seoBacklogIdeas`
     ```
     {
       _id,
       projectId,
       hypothesisId,
       clusterId,
       title,
       description,
       status,
       createdBy,
       createdAt,
       updatedAt
     }
     ```
   - `seoContentQueue`
     ```
     {
       _id,
       projectId,
       hypothesisId,
       title,
       format,
       category, // pain | goal | trigger | feature | benefit | faq | info
       ownerId,
       reviewerId,
       channel,
       outline,
       status, // draft | review | ready
       backlogIdeaId,
       dueDate,
       createdAt,
       updatedAt
     }
     ```

---

### 4. Environment & Feature Controls

- **Feature Flags**
  - `seo_agent.enabled`: gate main route.
  - `seo_agent.devShell`: enable standalone dev shell layout.
  - `seo_agent.ui_testing`: enable testing toggle for designated roles/environments.
- **Configuration**
  - `.env` additions:
    - `SEO_AGENT_CHATGPT_MODEL=`
    - `SEO_AGENT_CHATGPT_API_KEY` (pull from secrets manager).
    - `SEO_AGENT_SIMULATION_FIXTURES_PATH` (optional).
- **Role / Entitlement Checks**
  - Frontend:
    - `useEntitlement` hook checks GraphQL result.
  - Backend:
    - `requireAgentEntitlement(userId)` guard.

---

### 5. Token & Cost Management

- Track `tokensUsed` per session.
- Display usage meter in UI (fetched via `seoAgentContext.tokenQuota`).
- UI testing mode: increments a `simulations` counter instead of tokens.
- Admin dashboard (future): aggregate monthly tokens by team.

---

### 6. Logging & Analytics

- **Client**:
  - Send events to Segment / internal analytics (`seo_agent_tab_viewed`, `seo_agent_generation_requested`, `seo_agent_ui_testing_toggled`).
- **Server**:
  - Log ChatGPT calls with prompt hash and cost metadata.
  - Store errors for alerting (PagerDuty on repeated failures).
- **Monitoring**:
  - Add Grafana dashboard for agent response latency, error rates, token usage.

---

### 7. Testing Strategy

- **Unit Tests**:
  - Frontend: component tests (Jest/RTL) for layout, UI testing toggle, subscription banners.
  - Backend: resolver tests mocking ChatGPT client, entitlement checks.
- **Integration Tests**:
  - Cypress/E2E:
    - Production shell flow (active entitlement).
    - Pending/lapsed banner.
    - UI testing mode with simulated responses.
  - Contract tests: ensure GraphQL schema matches frontend fragments.
- **Load Testing**:
  - K6/Postman to validate ChatGPT throughput limits at peak usage scenarios.

---

### 8. Security & Compliance

- Mask PII in ChatGPT prompts; use project/hypothesis IDs instead of raw customer data.
- Enforce RBAC: only roles with `seo_agent_access` permission can hit API.
- Ensure ChatGPT logs stored securely; add retention policy (30 days).

---

### 9. Rollout Plan

1. **Phase 1 (Dev/Staging)**
   - Implement route + UI testing mode with simulated responses.
   - Validate dev shell parity.
2. **Phase 2 (Pilot Beta)**
   - Enable ChatGPT integration for internal team (flagged users).
   - Monitor sessions/tokens, adjust prompts.
3. **Phase 3 (Paid Launch)**
   - Integrate with billing service; enforce entitlements.
   - Release marketing copy & enable production flag.

---

### 10. Open Questions

- How do we monitor OpenAI release cadence to switch configs whenever a newer GA ChatGPT model supersedes the current default?
- Do we centralize agent entitlements in billing service or isolated collection?
- Should UI testing mode support custom JSON fixtures uploaded by QA?
- How do we localize agent copy for non-English users in v1?

---

### 11. Dependencies

- Billing team: API for agent add-on status.
- Analytics team: endpoints for SEO performance metrics.
- DevOps: feature flag configuration, secret management for ChatGPT.
- Design: final UI mockups aligned with bісurrent shell.

---

### 12. Timeline (Draft)

- Week 1–2: Backend schema + service scaffolding, dev shell UI.
- Week 3–4: Integrate ChatGPT, implement UI testing, subscription banners.
- Week 5: Beta stabilization, metrics dashboards, rollout review.
- Week 6: Paid launch readiness (billing integration & QA).

