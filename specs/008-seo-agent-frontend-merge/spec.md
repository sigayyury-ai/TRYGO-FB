# Feature Specification: SEO Agent Frontend Integration

**Feature Branch**: `008-seo-agent-frontend-merge`  
**Created**: 2025-12-09  
**Status**: Draft  
**Input**: User description: "Integrate SEO Agent frontend module into TRYGO frontend application"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Access SEO Agent Workspace (Priority: P1)

As a SEO specialist using TRYGO, I want to access the SEO Agent module from the main navigation so I can manage SEO tasks without leaving the TRYGO interface.

**Why this priority**: Enabling access to the SEO Agent is the prerequisite for all downstream functionality. Users must be able to discover and navigate to the module.

**Independent Test**: From the TRYGO dashboard, a user can navigate to the SEO Agent via the sidebar menu and see the workspace load with project context.

**Acceptance Scenarios**:

1. **Given** a user with active SEO Agent entitlement, **When** they click "SEO Agent" in the sidebar under "Prototype" section, **Then** the SEO Agent workspace loads with tabs (Plan, Semantics, Content, Analytics, Settings) and displays project context.
2. **Given** a user without SEO Agent entitlement, **When** they attempt to access SEO Agent, **Then** they see an upgrade prompt or locked state indicating subscription is required.
3. **Given** a user is on any TRYGO page, **When** they navigate to SEO Agent, **Then** the URL updates to `/seo-agent` and the sidebar highlights the active menu item.

---

### User Story 2 - View and Manage SEO Content Plan (Priority: P2)

As a content strategist, I want to view and manage my monthly SEO content plan with scheduled publications so I can track what content is planned and when it will be published.

**Why this priority**: Content planning is a core workflow that enables users to organize their SEO strategy and see their publication schedule at a glance.

**Independent Test**: User opens the Plan tab and sees a monthly view with weekly cards showing scheduled content items, can add items from backlog, and can modify scheduled items.

**Acceptance Scenarios**:

1. **Given** a user opens the Plan tab, **When** the page loads, **Then** they see a monthly calendar view with 4 weekly cards, each showing scheduled publication slots (default 2 per week).
2. **Given** a user has backlog items, **When** they click "Add to Plan" on a backlog item, **Then** the item appears in the next available publication slot.
3. **Given** a user views a scheduled item, **When** they click quick actions (Post now, Delete), **Then** the action executes and the plan updates accordingly.

---

### User Story 3 - Manage Keyword Clusters (Priority: P2)

As a SEO specialist, I want to create and manage keyword clusters so I can organize my SEO strategy around semantic groups and generate content ideas based on these clusters.

**Why this priority**: Keyword cluster management enables users to structure their SEO approach and automatically generate relevant content ideas.

**Independent Test**: User navigates to Semantics tab, creates a new cluster with keywords, and sees it appear in the cluster list. Generated ideas from clusters appear in the backlog.

**Acceptance Scenarios**:

1. **Given** a user is on the Semantics tab, **When** they create a new keyword cluster with title, intent, and keywords, **Then** the cluster is saved and appears in the cluster list.
2. **Given** a user has existing clusters, **When** they edit a cluster's keywords or intent, **Then** the changes are saved and reflected immediately.
3. **Given** clusters exist, **When** the system generates backlog ideas, **Then** ideas are automatically created based on cluster metadata and appear in the Plan tab backlog section.

---

### User Story 4 - Review Auto-Generated Content Ideas (Priority: P3)

As a content creator, I want to review auto-generated content ideas organized by strategic categories so I can quickly identify which content types to prioritize.

**Why this priority**: Auto-generated ideas help users discover content opportunities they might not have considered, organized in a way that aligns with their strategy.

**Independent Test**: User opens Content tab and sees generated ideas grouped by category (pains, goals, triggers, product features, benefits, FAQs, informational), can add items to backlog, or dismiss them.

**Acceptance Scenarios**:

1. **Given** a user opens the Content tab, **When** the page loads, **Then** they see auto-generated content ideas grouped by strategic categories with counts per category.
2. **Given** a user views a content idea, **When** they click "Add to Backlog", **Then** the idea is added to the backlog and can be scheduled in the Plan tab.
3. **Given** a user wants to add custom content, **When** they expand the custom entry form, **Then** they can create a new content idea that appears in the appropriate category.

---

### User Story 5 - Configure Publication Settings (Priority: P3)

As a project manager, I want to configure publication cadence and automation settings so the system can automatically schedule content according to my preferences.

**Why this priority**: Settings enable users to customize the SEO Agent behavior to match their workflow and publication schedule.

**Independent Test**: User navigates to Settings tab, updates weekly publication count and preferred days, saves changes, and sees the plan adjust accordingly.

**Acceptance Scenarios**:

1. **Given** a user opens the Settings tab, **When** they update weekly publication count (e.g., from 2 to 4), **Then** the change is saved and the Plan tab reflects the new cadence.
2. **Given** a user configures preferred publication days, **When** they save settings, **Then** future auto-scheduling prioritizes those days.
3. **Given** a user toggles auto-publish, **When** the setting is enabled, **Then** the system automatically publishes content according to the schedule (stubbed in Phase 1).

---

### Edge Cases

- What happens when a user navigates to SEO Agent but has no active project selected? (Handled by RequireProject component - redirects to dashboard)
- How does the system handle navigation when a user's SEO Agent entitlement expires mid-session?
- What occurs when multiple users access the same project's SEO Agent simultaneously?
- How should the workspace respond if project metadata (Lean Canvas, ICP) is incomplete or missing?
- What happens when the backend API is unavailable or returns errors?
- How does the system handle very large numbers of clusters or backlog items (performance)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The TRYGO interface MUST expose a "SEO Agent" navigation entry in the left sidebar under the "Prototype" section, positioned after "Branding".
- **FR-002**: The SEO Agent workspace MUST be accessible via route `/seo-agent` (without projectId parameter) and render within the existing TRYGO Layout component with RequireProject protection.
- **FR-003**: The SEO Agent page MUST display a tabbed interface with five tabs: Plan, Semantics, Content, Analytics, and Settings.
- **FR-004**: The workspace MUST use the active project and hypothesis from existing Zustand stores (useProjectStore.activeProject and useHypothesisStore.activeHypothesis) without requiring hardcoded project IDs in the route or component props.
- **FR-005**: The system MUST check user entitlement status and display appropriate UI (active workspace, upgrade prompt, or locked state) based on subscription status.
- **FR-006**: The Plan tab MUST display a monthly view with weekly cards showing scheduled publication slots, with default of 2 slots per week.
- **FR-007**: The Plan tab MUST include a Backlog section displaying unscheduled content ideas that can be moved into the plan.
- **FR-008**: The Semantics tab MUST allow users to create, edit, and delete keyword clusters with fields: title, intent, and keywords list.
- **FR-009**: The Semantics tab MUST display clusters in a grid or list view with inline editing capabilities.
- **FR-010**: The Content tab MUST display auto-generated content ideas grouped by strategic categories (pains, goals, triggers, product features, benefits, FAQs, informational).
- **FR-011**: The Content tab MUST provide quick actions to add ideas to backlog or dismiss them, plus a collapsed form for custom content entry.
- **FR-012**: The Analytics tab MUST display placeholder content in Phase 1 indicating upcoming analytics features.
- **FR-013**: The Settings tab MUST allow users to configure weekly publication count, preferred publication days, and auto-publish toggle.
- **FR-014**: The system MUST support feature flag toggling for SEO Agent access (`seo_agent.enabled`).
- **FR-015**: The system MUST support UI Testing mode that bypasses API calls and uses simulated responses for development and QA.
- **FR-016**: The workspace MUST display subscription status banners when entitlement is pending or lapsed, with appropriate messaging and CTAs.
- **FR-017**: The sidebar navigation item MUST show a locked state (lock icon) when user lacks entitlement, with tooltip explaining upgrade requirement.
- **FR-018**: All user interactions (tab switches, cluster CRUD, plan modifications) MUST be persisted via GraphQL mutations to the backend using the same GraphQL endpoint and Apollo Client instance as the rest of TRYGO.
- **FR-019**: The workspace MUST handle loading states gracefully with skeleton loaders or spinners during data fetching.
- **FR-020**: The workspace MUST display error states with user-friendly messages when API calls fail.
- **FR-021**: The SEO Agent MUST use the same authentication mechanism as TRYGO, automatically inheriting user session and project context after login without requiring separate authentication.
- **FR-022**: All GraphQL queries and mutations for SEO Agent MUST use the existing Apollo Client configuration and authentication headers, sharing the same database and API backend as other TRYGO modules.
- **FR-023**: The SEO Agent MUST automatically access project and hypothesis data that was loaded during TRYGO initialization, without duplicating data fetching logic.

### Key Entities *(include if feature involves data)*

- **SEO Agent Workspace Session**: Represents the active user session accessing SEO Agent, linked to project and hypothesis context, tracks tabs visited and actions taken.
- **Keyword Cluster**: A semantic grouping of related keywords with intent classification, linked to a project hypothesis, used to generate content ideas.
- **Content Backlog Item**: An unscheduled content idea (blog post, commercial page) with metadata (title, description, category, source cluster), can be moved to plan.
- **Publication Plan Item**: A scheduled content item assigned to a specific week and slot, with status (draft, ready, published), linked to backlog item or cluster.
- **Publication Settings**: Configuration for a project including weekly publication count, preferred days array, and automation toggles, persisted per project.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 95% of users with active SEO Agent entitlement can successfully navigate to the workspace from the sidebar on first attempt without support.
- **SC-002**: Users can complete adding a keyword cluster (create, add keywords, save) in under 30 seconds.
- **SC-003**: The Plan tab displays monthly schedule with all scheduled items loading within 2 seconds of tab activation.
- **SC-004**: 90% of users can successfully move a backlog item to the plan in under 10 seconds.
- **SC-005**: Content ideas are auto-generated and displayed in the Content tab within 5 seconds of workspace initialization for users with existing clusters.
- **SC-006**: Settings changes (cadence, preferred days) are saved and reflected in the Plan tab within 1 second of save action.
- **SC-007**: Users without entitlement see clear upgrade messaging within 1 second of attempting to access SEO Agent.
- **SC-008**: The workspace maintains consistent UI/UX with existing TRYGO modules (matching Layout, Sidebar styling, component patterns).

## Assumptions

- The existing TRYGO frontend architecture (React, Vite, TypeScript, Apollo Client) supports adding new routes and components without major refactoring.
- The backend GraphQL API for SEO Agent will be implemented as extensions to the existing TRYGO GraphQL schema, using the same database and API infrastructure.
- SEO Agent shares the same authentication, project, and hypothesis context as other TRYGO modules through existing Zustand stores.
- All SEO Agent data (clusters, backlog, content queue) will be stored in the same database as TRYGO project data, linked by projectId and hypothesisId.
- Feature flag infrastructure (LaunchDarkly, ConfigCat, or similar) is available for toggling SEO Agent access.
- User entitlement/subscription data is available via existing GraphQL queries or can be extended.
- Project and hypothesis context (Lean Canvas, ICP) is accessible via existing TRYGO GraphQL API.
- The existing Layout, Sidebar, and RequireProject components can accommodate the new SEO Agent module without modification.
- UI Testing mode is primarily for development/QA and does not need to be exposed to end users in production.
- Initial backlog seeding (20+ ideas) happens server-side when workspace is first accessed.
- Implementation will follow existing TRYGO code patterns and conventions (see [CODE_PATTERNS.md](./CODE_PATTERNS.md) and [tasks.md](./tasks.md) for technical implementation guidelines).
