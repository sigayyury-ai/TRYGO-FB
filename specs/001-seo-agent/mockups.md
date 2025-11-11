## SEO Agent Mockup Brief

- **Feature**: SEO Agent Core Integration
- **Scope**: High-level wireframes for embedding the agent into the existing TRYGO dashboard and supporting dev/test modes.
- **Current Stack Context**: Node.js + Apollo GraphQL + MongoDB + TypeScript frontend shell.

---

### 1. Navigation Entry (Production Shell)

- **Location**: Left sidebar → `Prototype` → `SEO Agent` (new item below `Branding`).
- **Route**: Reuse current marketing toolkit pattern (`/dashboard/:projectId/seo-agent`).
- **States**:
  - `Active`: Highlight with icon badge (spark icon) when the module is open.
  - `Locked`: If user lacks agent entitlement, show lock icon and tooltip `Upgrade to access SEO Agent`.
- **Header Chips**: Reuse hypothesis/project dropdown bar at top; add `SEO Agent` label to right-aligned chip row.

```
[TRYGO] ─────────────────────────────────────────────────────────────
│ Core │ ICP │ Research │ Validation │ Packing │ Branding │ SEO Agent│
│      │     │          │            │        │          │          │
│-------------------------------------------------------------- header
```
- **CTA**: No standalone CTA; central workspace opens within main content region.

---

### 2. Agent Workspace Layout (Production)

- **Primary Canvas**: Single-column workspace aligned with existing module shell; sidebar hosts nav only.
- **Top Controls**:
  - Header chip bar shows project + hypothesis + module context.
  - Environment pill (Dev Shell) only in non-prod builds.
- **Tab Strip**: `Plan`, `Semantics`, `Content`, `Analytics`, `Settings`.
  - `Plan` tab: Monthly sprint schedule rendered as four weekly cards with two publish slots each. Each slot exposes quick actions: `Post now` (play icon) and `Delete` (×), plus click-through to editing on card body.
  - `Semantics`: Grid of prioritized keyword clusters with inline create/edit/delete (keywords captured in multi-line inputs) and quick actions (`✓` save, `✕` delete, `Generate Ideas to Backlog` inline button removed in favor of auto backlog creation).
  - `Plan` also displays a Backlog panel listing ideas pushed from Semantics (pre-seeded with monthly set) with quick actions to move into the sprint or remove.
  - `Content`: Auto-generated blog/commercial idea list grouped by strategic categories (articles by pains, goals, triggers; commercial pages by product features, benefits; FAQ + informational entries) with quick add-to-backlog/dismiss icons; collapsed custom entry form accessible via toggle.
  - `Analytics`: Placeholder panels in Phase 1 with copy to indicate upcoming workflows.
  - `Settings`: Cadence controls (weekly frequency, preferred days, content mix) and toggles (auto-publish) with save/reset actions.
- **UI Testing Toggle**: Lives in overflow menu (Phase 1: dev shell banner).
- **Notification Banner**: If subscription status pending/lapsed, display inline banner below header with appropriate messaging.

```
┌──────────────┬──────────────────────────────────────────────┐
│                     Agent Console                           │
│ tabs: Plan | Semantics | Content | Analytics | Settings     │
│ ----------------------------------------------------------- │
│ | Sprint schedule (4 weeks) with quick actions + notes    | │
│ | Settings tab: cadence inputs, preferred days, auto post | │
└─────────────────────────────────────────────────────────────┘
```

---

### 3. Development Shell Variant

- **Layout**: Full-width standalone window.
  - Top bar includes environment pill `Dev Shell`.
  - Navigation replicates production but simplified: horizontal nav bar with `Dashboard`, `Projects`, `SEO Agent`.
- **Purpose**: Rapid iteration without touching production styling.
- **Toggle**: Banner reminding designers to verify parity before release.

```
┌─────────────────────────────────────────────────────────┐
│ Dev Shell | Projects ▼ | Hypothesis ▼ | UI Testing ◯    │
│---------------------------------------------------------│
│                   Standalone Agent UI                   │
└─────────────────────────────────────────────────────────┘
```

---

### 4. UI Testing Mode (Token-Free)

- **Activation**: Toggle in top-right of agent console.
- **Visual Cue**: When enabled, prompt area shows watermark `UI Testing – no ChatGPT calls`.
- **Behavior**:
  - Disable `Generate` button; replace with `Simulate Response`.
  - Provide dropdown to load canned scenarios (`Happy Path`, `Empty State`, `Error Alert`).
  - Log to console `UI testing mode active` for QA visibility.

---

### 5. Subscription Messaging

- **Access Pending**:
  - Banner color: yellow.
  - Copy: `Your SEO Agent add-on is pending activation. You’ll receive access within 24 hours.`
  - Actions: `Manage Plan`, `Contact Support`.
- **Access Lapsed**:
  - Banner color: red.
  - Copy: `SEO Agent access paused. Update payment to resume.` with CTA `Update Billing`.
- **Navigation Tooltip**:
  - Hovering locked sidebar item shows `Requires SEO Agent add-on`.

---

### 6. Empty States & Loading

- **First Launch**:
  - Placeholder cards encouraging completion of Lean Canvas (`Add Problems`, `Define ICP`).
  - CTA `Open Blueprint Form`.
- **Analytics Tab Loading**:
  - Skeleton charts with shimmer effect.
- **Chat History Empty**:
  - Illustrative icon + text `Use the Generate button to start a plan suggestion.`

---

### 7. Mobile Considerations (Deferred)

- MVP focuses on desktop; mobile/Tablet breakpoints noted as follow-up.
- Record in backlog for responsive design iteration.

