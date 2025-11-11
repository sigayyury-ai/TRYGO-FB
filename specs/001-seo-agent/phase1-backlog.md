## SEO Agent Phase 1 Backlog

- **Objective**: Ship a functional SEO Agent workspace in dev/staging with UI testing mode and entitlement gating, ready for internal beta.
- **Scope Window**: Weeks 1–2 (per technical plan).
- **Environments**: development, staging.

---

### 1. Deliverables

- Route `/dashboard/:projectId/seo-agent` available behind feature flag.
- Production shell embedding with entitlement-aware navigation entry.
- Dev shell variant for rapid iteration.
- UI Testing mode with simulated responses and visual cues.
- GraphQL endpoints for context, analytics stub, and session logging.
- ChatGPT integration wired to latest GA model, gated by env flag (staging only).
- Token accounting persisted per session (baseline metrics).
- Subscription banners reflecting `active`, `pending`, `lapsed` states (stubbed data acceptable in Phase 1).
- Settings tab enabling posting cadence configuration and manual publish/remove controls wired to stub actions.
- Semantics tab with inline cluster CRUD and ability to surface generated backlog ideas on the Plan tab.

---

### 2. Workstream Breakdown

#### 2.1 Frontend

1. **FE-01**: Feature flag plumbing  
   - Add `seo_agent.enabled`, `seo_agent.devShell`, `seo_agent.ui_testing`.  
   - Wire to LaunchDarkly/ConfigCat SDK.

2. **FE-02**: Navigation entry & routing  
   - Register route and sidebar item (locked state support).  
   - Ensure breadcrumb/top chip integration.

3. **FE-03**: Page layout scaffolding  
   - Implement `SeoAgentPage`, `SeoAgentConsole`.  
   - Add placeholder cards and tab structure consistent with TRYGO shell.

4. **FE-04**: Dev shell variant  
   - Create `DevAgentLayout`, environment pill, parity checks.  
   - Storybook stories for both shells.

5. **FE-05**: UI Testing mode  
   - Toggle component, watermark, `Simulate Response` flow.  
   - Local fixtures and persistence via localStorage.

6. **FE-06**: Subscription/status banners  
   - Implement `AgentStatusBanner` with states: active, pending, lapsed.  
   - Tooltip for locked sidebar item.

7. **FE-07**: Analytics tab skeleton  
   - Shimmer loading, placeholder charts pulling stubbed data.  
   - Hook into GraphQL stub query.

8. **FE-08**: Telemetry hooks  
   - Emit Segment events (`seo_agent_tab_viewed`, `seo_agent_generation_requested`, `seo_agent_ui_testing_toggled`).  
   - Validate instrumentation in dev tools.

9. **FE-09**: Settings tab & quick actions  
   - Build `SeoPostingSettingsPanel` with inputs for weekly cadence, preferred days, auto-publish toggle.  
   - Add manual “Post now” and “Remove from plan” controls on schedule cards (stubbed actions Phase 1).

10. **FE-10**: Semantics clusters + backlog  
   - Implement inline cluster list with create/edit/delete, keyword textarea, and intent filter chips.  
   - Render backlog list on Plan tab fed by Semantics actions, including move-to-sprint/remove controls.  
   - Auto-seed backlog with 20 ideas (articles + commercial pages) derived from clusters at feature flag enablement.

11. **FE-11**: Content ideas & production queue  
   - Surface auto-generated blog/commercial ideas grouped by categories (pains/goals/triggers/product features/benefits/FAQs/info) with quick add/dismiss actions.  
   - Provide collapsed custom entry form; ensure plan seeded with month view uses generated ideas.

#### 2.2 Backend

1. **BE-01**: Schema extensions  
   - Define `SeoAgentContext`, `SeoAgentAnalytics`, `PostingSettings`, session types.  
   - Merge into federated schema.

2. **BE-02**: Context resolver  
   - Aggregate project, hypothesis, Lean Canvas, ICP.  
   - Include entitlement status and token quota fields (mocked values acceptable).

3. **BE-03**: Session logging service  
   - Create `agentSessions` collection, CRUD functions.  
   - Expose mutation `startSeoAgentSession`.

4. **BE-04**: Generation resolver with ChatGPT client  
   - Implement `generateSeoAgentResponse`.  
   - Wrap latest GA ChatGPT model, env-based enablement, and retry logic.

5. **BE-05**: UI testing short-circuit  
   - Allow resolver to return canned payloads when `uiTesting` flag set.  
   - Ensure no external API calls in this mode.

6. **BE-06**: Entitlement stub  
   - Introduce `agentEntitlements` lookup returning `active | pending | lapsed`.  
   - Load from Mongo or in-memory stub for staging.

7. **BE-07**: Analytics stub endpoint  
   - Return sample metric payload with timestamp for frontend skeleton.  
   - Document in schema for later replacement.

8. **BE-08**: Telemetry & logging  
   - Log ChatGPT requests/responses (metadata only).  
   - Emit application metrics (tokens, latency) to monitoring pipeline.

9. **BE-09**: Posting settings persistence  
   - Create `agentPostingSettings` model with default cadence values.  
   - Expose `seoAgentPostingSettings` query and `updateSeoAgentPostingSettings` mutation returning stubbed success in Phase 1.

10. **BE-10**: Cluster & backlog persistence  
    - Scaffold `seoClusters` and `seoBacklogIdeas` collections.  
    - Provide CRUD mutations for clusters and stub generator for backlog ideas consumed by Plan tab.

11. **BE-11**: Content queue scaffolding  
    - Create `seoContentQueue` collection with status transitions, owner metadata, category tagging, and initial seeding routine (monthly plan + 20 backlog ideas).  
    - Expose query/mutations for auto-generated ideas and manual overrides.

#### 2.3 QA & DevOps

1. **QA-01**: Test plan  
   - Draft manual test cases for entitlement states, UI testing mode, dev shell.

2. **QA-02**: Cypress smoke  
   - Automate route load, toggle UI testing, simulate response flow.

3. **DevOps-01**: Secrets management  
   - Store `SEO_AGENT_CHATGPT_API_KEY` in Vault/secret store.  
   - Configure staging env variable.

4. **DevOps-02**: Feature flag rollout scripts  
   - Define default states per environment.  
   - Document toggling process for release.

---

### 3. Dependencies & Coordination

- **Design**: Finalize mockups for context rail, console tabs, banners (due Week 1).  
- **Billing**: Provide interim entitlement data feed or stub contract.  
- **Analytics**: Supply placeholder metrics dataset.  
- **Security**: Review ChatGPT prompt redaction approach.

---

### 4. Exit Criteria

- Feature flag `seo_agent.enabled` ON in staging with internal allowlist.  
- Internal users can:
  - Access agent via sidebar when entitlement active.  
  - See pending/lapsed states when status toggled via stub.  
  - Toggle UI testing mode and receive simulated responses without ChatGPT calls.  
- ChatGPT generation works in staging when UI testing mode off.  
- Tokens logged per session; metrics visible in monitoring dashboard.  
- QA sign-off on smoke suite; no critical bugs open.

---

### 5. Follow-Up (Post Phase 1)

- Replace analytics stub with live connectors.  
- Integrate billing API for real entitlements.  
- Expand ChatGPT prompts and content workflows.  
- Localization & accessibility review.  
- Packaging for pilot beta (Phase 2).

