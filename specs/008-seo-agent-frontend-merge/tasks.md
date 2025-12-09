# Implementation Tasks: SEO Agent Frontend Integration

**Feature**: SEO Agent Frontend Integration  
**Branch**: `008-seo-agent-frontend-merge`  
**Created**: 2025-12-09  
**Based on**: [spec.md](./spec.md) and [plan.md](./plan.md)

## Overview

This document contains actionable, dependency-ordered tasks for integrating SEO Agent frontend module into TRYGO. Tasks are organized by user stories to enable independent implementation and testing.

## Implementation Patterns & Guidelines

**IMPORTANT**: Before starting implementation, review these patterns from existing TRYGO codebase to ensure consistency.

### Apollo Client & GraphQL Queries

- **Location**: `src/config/apollo/client/index.ts`
- **Token**: Automatically retrieved from cookies via `Cookies.get('token')` and added to headers as `Bearer ${token}`
- **Exports**: Use `QUERY` and `MUTATE` exported from `@/config/apollo/client`
- **Pattern**: All API files follow: `gql` definition → TypeScript interfaces → wrapper function
- **Example**:
  ```typescript
  import { gql } from '@apollo/client';
  import { QUERY } from '@/config/apollo/client';
  
  export const GET_QUERY = gql`...`;
  export interface ResponseType { ... }
  export const getQuery = () => QUERY<ResponseType>({ query: GET_QUERY, fetchPolicy: 'network-only' });
  ```

### Using Zustand Stores

- **Active Project**: `useProjectStore((state) => state.activeProject)` - contains current project with `id`
- **Active Hypothesis**: `useHypothesisStore((state) => state.activeHypothesis)` - contains current hypothesis with `id`
- **No new stores needed**: Use existing stores for project/hypothesis context
- **Pattern**: Always get `projectId` from `activeProject.id`, `hypothesisId` from `activeHypothesis?.id`

### Sidebar Navigation Pattern

- **Location**: `src/components/Sidebar.tsx`
- **Icons**: Import from `lucide-react`, use size `h-4 w-4 mr-2`
- **Active state**: `bg-blue-100 text-gray-900`
- **Inactive state**: `text-gray-700 hover:bg-blue-100 hover:text-gray-900`
- **Structure**: Section header (`text-gray-400 text-xs px-2`) → Links in `flex flex-col gap-1`
- **isActive check**: `pathname === path` using `useLocation()` from `react-router-dom`

### Route & Layout Pattern

- **Route structure**: Always wrap with `<RequireProject><Layout>{Component}</Layout></RequireProject>`
- **Location**: `src/App.tsx`
- **RequireProject**: Ensures projects are loaded, doesn't redirect (just wraps children)
- **Layout**: Provides Header + Sidebar structure, handles mobile sidebar

### UI Components & Styling

- **Component library**: Use shadcn/ui components (Tabs, Button, Card, Form, etc.)
- **Icons**: `lucide-react` with consistent sizing (`h-4 w-4`)
- **Styling**: Tailwind CSS following existing color scheme (blue-100, blue-600, gray-700, etc.)
- **Forms**: Use `react-hook-form` with shadcn/ui Form components

### Environment Configuration

- **GraphQL endpoint**: Uses `import.meta.env.VITE_SERVER_URL` from `.env` file
- **No new env vars needed**: SEO Agent uses same endpoint as rest of TRYGO
- **Token handling**: Automatic via Apollo Client authLink, no manual token passing needed

### File Organization

- **API files**: `src/api/getSeoAgent*.ts` (queries) and `src/api/*SeoAgent*.ts` (mutations)
- **Components**: `src/components/seo-agent/SeoAgent*.tsx`
- **Pages**: `src/pages/SeoAgentPage.tsx`
- **Types**: Co-located with API files or in separate `types/` directory if shared

**Reference**: See [CODE_PATTERNS.md](./CODE_PATTERNS.md) for detailed patterns and examples.

## Task Summary

- **Total Tasks**: 85
- **User Story 1 (P1)**: 15 tasks
- **User Story 2 (P2)**: 18 tasks
- **User Story 3 (P2)**: 20 tasks
- **User Story 4 (P3)**: 12 tasks
- **User Story 5 (P3)**: 10 tasks
- **Polish & Cross-cutting**: 10 tasks

## MVP Scope

**Minimum Viable Product**: User Story 1 (Access SEO Agent Workspace)
- Enables users to navigate to SEO Agent workspace
- Basic page structure with tabs
- Project context loading from stores
- Entitlement checking

## Dependencies

**Story Completion Order**:
1. **User Story 1** (P1) - Must complete first (blocks all other stories)
2. **User Story 5** (P3) - Complete before User Story 2 (Settings needed for Plan)
3. **User Story 2** (P2) - Depends on User Story 1 and User Story 5
4. **User Story 3** (P2) - Depends on User Story 1
5. **User Story 4** (P3) - Depends on User Story 1

**Parallel Opportunities**:
- User Stories 3 and 4 can be developed in parallel after User Story 1
- Multiple components within a story can be developed in parallel (marked with [P])

---

## Phase 1: Setup

**Goal**: Project initialization and structure setup

- [ ] T001 Create directory structure `src/components/seo-agent/` for SEO Agent components
- [ ] T002 Verify existing Apollo Client configuration in `src/config/apollo/client/index.ts` is accessible
- [ ] T003 Verify existing stores `useProjectStore` and `useHypothesisStore` are accessible and functional
- [ ] T004 Review existing TRYGO design patterns and component structure for consistency

---

## Phase 2: Foundational Tasks

**Goal**: Blocking prerequisites that must complete before user stories

- [ ] T005 Review and understand existing `RequireProject` component implementation in `src/components/RequireProject.tsx`
- [ ] T006 Review existing subscription/entitlement query patterns in `src/api/` to understand entitlement check approach
- [ ] T007 Verify GraphQL endpoint configuration (`VITE_SERVER_URL`) in environment variables

---

## Phase 3: User Story 1 - Access SEO Agent Workspace (P1)

**Goal**: Enable basic navigation and workspace access  
**Independent Test**: From TRYGO dashboard, user navigates to SEO Agent via sidebar and sees workspace load with project context

### Navigation & Route Setup

- [ ] T008 [US1] Add `/seo-agent` route in `src/App.tsx` with `RequireProject` and `Layout` wrappers wrapping `SeoAgentPage` component
- [ ] T009 [US1] Import `Sparkles` icon from `lucide-react` in `src/components/Sidebar.tsx`
- [ ] T010 [US1] Add "SEO Agent" menu item link in `src/components/Sidebar.tsx` under "Prototype" section after "Branding" with route `/seo-agent`
- [ ] T011 [US1] Implement `isActive` check for SEO Agent menu item in `src/components/Sidebar.tsx` to highlight when route matches

### Base Page Component

- [ ] T012 [US1] Create `src/pages/SeoAgentPage.tsx` as functional component
- [ ] T013 [US1] Import and use `useProjectStore` hook in `src/pages/SeoAgentPage.tsx` to get `activeProject`
- [ ] T014 [US1] Import and use `useHypothesisStore` hook in `src/pages/SeoAgentPage.tsx` to get `activeHypothesis`
- [ ] T015 [US1] Add redirect logic in `src/pages/SeoAgentPage.tsx` using `Navigate` from `react-router-dom` to `/dashboard` if no active project (though RequireProject should handle this)

### GraphQL Query Foundation

- [ ] T016 [US1] Create `src/api/getSeoAgentContext.ts` file with placeholder GraphQL query structure
- [ ] T017 [US1] Import `gql` from `@apollo/client` and `QUERY` helper from `@/config/apollo/client` in `src/api/getSeoAgentContext.ts`
- [ ] T018 [US1] Define `GET_SEO_AGENT_CONTEXT` GraphQL query in `src/api/getSeoAgentContext.ts` with variables `projectId: ID!` and optional `hypothesisId: ID`
- [ ] T019 [US1] Create TypeScript interface `SeoAgentContext` for query response in `src/api/getSeoAgentContext.ts`
- [ ] T020 [US1] Export query function `getSeoAgentContextQuery` in `src/api/getSeoAgentContext.ts` that accepts `projectId` and optional `hypothesisId`, uses `QUERY` helper with `fetchPolicy: 'network-only'`

### Tab Structure

- [ ] T021 [US1] Create `src/components/seo-agent/SeoAgentConsole.tsx` component
- [ ] T022 [US1] Import `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` from `@/components/ui/tabs` in `src/components/seo-agent/SeoAgentConsole.tsx`
- [ ] T023 [US1] Implement tab structure in `src/components/seo-agent/SeoAgentConsole.tsx` with tabs: Plan, Semantics, Content, Analytics, Settings
- [ ] T024 [US1] Add tab state management using `useState` in `src/components/seo-agent/SeoAgentConsole.tsx` to track active tab
- [ ] T025 [US1] Integrate `SeoAgentConsole` component in `src/pages/SeoAgentPage.tsx`, passing `projectId` from `activeProject.id` and optional `hypothesisId` from `activeHypothesis?.id`

### Entitlement & Subscription Banner

- [ ] T026 [US1] Create `src/components/seo-agent/SubscriptionBanner.tsx` component for displaying subscription status
- [ ] T027 [US1] Implement entitlement check query or extend existing subscription query to get SEO Agent entitlement status
- [ ] T028 [US1] Add conditional rendering in `src/components/seo-agent/SubscriptionBanner.tsx` to show banners for pending/lapsed subscriptions with appropriate messaging
- [ ] T029 [US1] Integrate `SubscriptionBanner` component at top of `src/pages/SeoAgentPage.tsx`
- [ ] T030 [US1] Update sidebar item in `src/components/Sidebar.tsx` to show locked state (lock icon) when entitlement is missing, using conditional rendering
- [ ] T031 [US1] Add tooltip to locked sidebar item in `src/components/Sidebar.tsx` with message "Upgrade to access SEO Agent" using shadcn/ui Tooltip component

---

## Phase 4: User Story 5 - Configure Publication Settings (P3)

**Goal**: Configure publication cadence and automation settings  
**Independent Test**: User navigates to Settings tab, updates weekly publication count and preferred days, saves changes, and sees plan adjust accordingly

**Note**: This story is implemented before User Story 2 because Settings are needed for Plan tab functionality.

### Settings Panel Component

- [ ] T032 [US5] Create `src/components/seo-agent/SeoPostingSettingsPanel.tsx` component
- [ ] T033 [US5] Import form components from shadcn/ui (`Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`) in `src/components/seo-agent/SeoPostingSettingsPanel.tsx`
- [ ] T034 [US5] Add weekly publication count input (number type) field in `src/components/seo-agent/SeoPostingSettingsPanel.tsx` with min value 1
- [ ] T035 [US5] Add preferred days selector (multi-select checkboxes) for days of week in `src/components/seo-agent/SeoPostingSettingsPanel.tsx`
- [ ] T036 [US5] Add auto-publish toggle switch component in `src/components/seo-agent/SeoPostingSettingsPanel.tsx` using shadcn/ui Switch component

### Settings API Integration

- [ ] T037 [US5] Create `src/api/getSeoAgentPostingSettings.ts` file with GraphQL query `GET_SEO_AGENT_POSTING_SETTINGS` accepting `projectId: ID!`
- [ ] T038 [US5] Create TypeScript interface `PostingSettings` for settings response in `src/api/getSeoAgentPostingSettings.ts`
- [ ] T039 [US5] Export query function `getSeoAgentPostingSettingsQuery` in `src/api/getSeoAgentPostingSettings.ts`
- [ ] T040 [US5] Create `src/api/updateSeoAgentPostingSettings.ts` file with GraphQL mutation `UPDATE_SEO_AGENT_POSTING_SETTINGS` accepting `PostingSettingsInput`
- [ ] T041 [US5] Export mutation function `updateSeoAgentPostingSettingsMutation` in `src/api/updateSeoAgentPostingSettings.ts`

### Settings Form Logic

- [ ] T042 [US5] Implement form submission handler in `src/components/seo-agent/SeoPostingSettingsPanel.tsx` using `useMutation` from Apollo Client
- [ ] T043 [US5] Add form validation in `src/components/seo-agent/SeoPostingSettingsPanel.tsx` to ensure weekly count is between 1 and maximum reasonable limit
- [ ] T044 [US5] Add validation to ensure preferred days count aligns with weekly publication count in `src/components/seo-agent/SeoPostingSettingsPanel.tsx`
- [ ] T045 [US5] Add success toast notification on save in `src/components/seo-agent/SeoPostingSettingsPanel.tsx` using existing toast system
- [ ] T046 [US5] Add error toast notification on save failure in `src/components/seo-agent/SeoPostingSettingsPanel.tsx`
- [ ] T047 [US5] Integrate `SeoPostingSettingsPanel` component into Settings tab content in `src/components/seo-agent/SeoAgentConsole.tsx`

---

## Phase 5: User Story 2 - View and Manage SEO Content Plan (P2)

**Goal**: Implement monthly content plan view with backlog  
**Independent Test**: User opens Plan tab and sees monthly view with weekly cards showing scheduled items, can add items from backlog, and can modify scheduled items

### Plan Tab Layout

- [ ] T048 [US2] Create `src/components/seo-agent/SeoPlanPanel.tsx` component
- [ ] T049 [US2] Design and implement monthly view layout in `src/components/seo-agent/SeoPlanPanel.tsx` with 4 weekly cards using grid/flex layout matching TRYGO design system
- [ ] T050 [US2] Implement weekly card components in `src/components/seo-agent/SeoPlanPanel.tsx` that display 2 default publication slots per week (read from settings when available)
- [ ] T051 [US2] Add visual indicators for preferred days from settings in `src/components/seo-agent/SeoPlanPanel.tsx` (highlight preferred days in weekly cards)

### Backlog Section

- [ ] T052 [US2] Create backlog list component section in `src/components/seo-agent/SeoPlanPanel.tsx`
- [ ] T053 [US2] Create `src/api/getSeoAgentBacklog.ts` file with GraphQL query `GET_SEO_AGENT_BACKLOG` accepting `projectId: ID!` and optional `hypothesisId: ID`
- [ ] T054 [US2] Create TypeScript interface `BacklogItem` for backlog response in `src/api/getSeoAgentBacklog.ts`
- [ ] T055 [US2] Export query function `getSeoAgentBacklogQuery` in `src/api/getSeoAgentBacklog.ts`
- [ ] T056 [US2] Implement backlog list display in `src/components/seo-agent/SeoPlanPanel.tsx` using `useQuery` hook from Apollo Client
- [ ] T057 [US2] Add "Add to Plan" action button for each backlog item in `src/components/seo-agent/SeoPlanPanel.tsx`

### Plan Item Management

- [ ] T058 [US2] Create `src/api/upsertSeoAgentBacklogItem.ts` file with GraphQL mutation `UPSERT_SEO_AGENT_BACKLOG_ITEM` for moving items between backlog and plan
- [ ] T059 [US2] Export mutation function `upsertSeoAgentBacklogItemMutation` in `src/api/upsertSeoAgentBacklogItem.ts`
- [ ] T060 [US2] Implement "Add to Plan" click handler in `src/components/seo-agent/SeoPlanPanel.tsx` that calls mutation to move item to next available publication slot
- [ ] T061 [US2] Add quick action "Post now" button (stub) to scheduled items in `src/components/seo-agent/SeoPlanPanel.tsx`
- [ ] T062 [US2] Add quick action "Delete" button to scheduled items in `src/components/seo-agent/SeoPlanPanel.tsx` with confirmation dialog
- [ ] T063 [US2] Implement delete handler in `src/components/seo-agent/SeoPlanPanel.tsx` that calls mutation to remove item from plan
- [ ] T064 [US2] Add optimistic updates in `src/components/seo-agent/SeoPlanPanel.tsx` for better UX when moving items or deleting

### Settings Integration

- [ ] T065 [US2] Read weekly publication count from settings query result in `src/components/seo-agent/SeoPlanPanel.tsx` to dynamically adjust slots per week

---

## Phase 6: User Story 3 - Manage Keyword Clusters (P2)

**Goal**: Manage keyword clusters for SEO strategy  
**Independent Test**: User navigates to Semantics tab, creates new cluster with keywords, sees it appear in cluster list. Generated ideas from clusters appear in backlog

### Cluster List Display

- [ ] T066 [US3] Create `src/components/seo-agent/SeoSemanticsPanel.tsx` component
- [ ] T067 [US3] Implement grid/list view layout in `src/components/seo-agent/SeoSemanticsPanel.tsx` for displaying clusters
- [ ] T068 [US3] Display cluster title, intent, and keywords preview in cluster cards in `src/components/seo-agent/SeoSemanticsPanel.tsx`
- [ ] T069 [US3] Add filtering by intent functionality in `src/components/seo-agent/SeoSemanticsPanel.tsx` if multiple intents exist (using filter chips or dropdown)

### Cluster CRUD Operations

- [ ] T070 [US3] Create `src/api/getSeoAgentClusters.ts` file with GraphQL query `GET_SEO_AGENT_CLUSTERS` accepting `projectId: ID!` and optional `hypothesisId: ID`
- [ ] T071 [US3] Create TypeScript interface `SeoCluster` for cluster data in `src/api/getSeoAgentClusters.ts`
- [ ] T072 [US3] Export query function `getSeoAgentClustersQuery` in `src/api/getSeoAgentClusters.ts`
- [ ] T073 [US3] Create `src/api/createSeoAgentCluster.ts` file with GraphQL mutation `CREATE_SEO_AGENT_CLUSTER` accepting `SeoClusterInput`
- [ ] T074 [US3] Export mutation function `createSeoAgentClusterMutation` in `src/api/createSeoAgentCluster.ts`
- [ ] T075 [US3] Create `src/api/updateSeoAgentCluster.ts` file with GraphQL mutation `UPDATE_SEO_AGENT_CLUSTER` accepting `id: ID!` and `SeoClusterInput`
- [ ] T076 [US3] Export mutation function `updateSeoAgentClusterMutation` in `src/api/updateSeoAgentCluster.ts`
- [ ] T077 [US3] Create `src/api/deleteSeoAgentCluster.ts` file with GraphQL mutation `DELETE_SEO_AGENT_CLUSTER` accepting `id: ID!`
- [ ] T078 [US3] Export mutation function `deleteSeoAgentClusterMutation` in `src/api/deleteSeoAgentCluster.ts`

### Cluster Forms & Editing

- [ ] T079 [US3] Create cluster creation form/modal component in `src/components/seo-agent/SeoSemanticsPanel.tsx` with fields: title, intent, keywords list
- [ ] T080 [US3] Implement inline editing for cluster fields in `src/components/seo-agent/SeoSemanticsPanel.tsx` (edit mode toggle on cluster cards)
- [ ] T081 [US3] Add delete confirmation dialog in `src/components/seo-agent/SeoSemanticsPanel.tsx` using shadcn/ui AlertDialog component

### Keywords Management

- [ ] T082 [US3] Add multi-line textarea for keywords input in cluster form/modal in `src/components/seo-agent/SeoSemanticsPanel.tsx`
- [ ] T083 [US3] Implement keyword parsing logic in `src/components/seo-agent/SeoSemanticsPanel.tsx` to handle comma-separated or line-separated keywords
- [ ] T084 [US3] Add keyword count display in cluster cards in `src/components/seo-agent/SeoSemanticsPanel.tsx`
- [ ] T085 [US3] Add keyword input validation in `src/components/seo-agent/SeoSemanticsPanel.tsx` (non-empty, reasonable length)

---

## Phase 7: User Story 4 - Review Auto-Generated Content Ideas (P3)

**Goal**: Review auto-generated content ideas organized by categories  
**Independent Test**: User opens Content tab and sees generated ideas grouped by category, can add items to backlog, or dismiss them

### Content Ideas Display

- [ ] T086 [US4] Create `src/components/seo-agent/SeoContentPanel.tsx` component
- [ ] T087 [US4] Create `src/api/getSeoAgentContentQueue.ts` file with GraphQL query `GET_SEO_AGENT_CONTENT_QUEUE` accepting `projectId: ID!` and optional `hypothesisId: ID`
- [ ] T088 [US4] Create TypeScript interface `ContentWorkItem` for content queue response in `src/api/getSeoAgentContentQueue.ts`
- [ ] T089 [US4] Export query function `getSeoAgentContentQueueQuery` in `src/api/getSeoAgentContentQueue.ts`
- [ ] T090 [US4] Implement grouping logic in `src/components/seo-agent/SeoContentPanel.tsx` to group ideas by strategic categories (pains, goals, triggers, product features, benefits, FAQs, informational)
- [ ] T091 [US4] Display category headers with counts in `src/components/seo-agent/SeoContentPanel.tsx`
- [ ] T092 [US4] Implement collapsible sections per category in `src/components/seo-agent/SeoContentPanel.tsx` using shadcn/ui Collapsible component

### Content Actions

- [ ] T093 [US4] Add "Add to Backlog" button for each content idea in `src/components/seo-agent/SeoContentPanel.tsx`
- [ ] T094 [US4] Add "Dismiss" action button for each content idea in `src/components/seo-agent/SeoContentPanel.tsx`
- [ ] T095 [US4] Implement "Add to Backlog" click handler in `src/components/seo-agent/SeoContentPanel.tsx` that calls mutation to add item to backlog (reuse upsert mutation from User Story 2)
- [ ] T096 [US4] Implement "Dismiss" click handler in `src/components/seo-agent/SeoContentPanel.tsx` that calls mutation to soft delete or hide item
- [ ] T097 [US4] Add success feedback toast notifications for actions in `src/components/seo-agent/SeoContentPanel.tsx`

### Custom Content Entry

- [ ] T098 [US4] Add collapsed form toggle button in `src/components/seo-agent/SeoContentPanel.tsx` for custom content entry
- [ ] T099 [US4] Create form component in `src/components/seo-agent/SeoContentPanel.tsx` for manual content idea entry with fields: title, description, category selector
- [ ] T100 [US4] Implement form submission handler in `src/components/seo-agent/SeoContentPanel.tsx` that submits custom ideas to backend using mutation

---

## Phase 8: Analytics Tab Placeholder

**Goal**: Placeholder for future analytics features

- [ ] T101 Create `src/components/seo-agent/SeoAnalyticsPanel.tsx` component
- [ ] T102 Add placeholder content with "Coming Soon" message in `src/components/seo-agent/SeoAnalyticsPanel.tsx`
- [ ] T103 Design structure for future charts/metrics in `src/components/seo-agent/SeoAnalyticsPanel.tsx` (skeleton layout)
- [ ] T104 Integrate `SeoAnalyticsPanel` component into Analytics tab content in `src/components/seo-agent/SeoAgentConsole.tsx`

---

## Phase 9: Feature Flags & UI Testing Mode

**Goal**: Enable feature flags and UI testing functionality

### Feature Flag Integration

- [ ] T105 Create feature flag utility/hook for checking `seo_agent.enabled` flag (integrate with LaunchDarkly/ConfigCat or create local implementation)
- [ ] T106 Add feature flag check in route guard in `src/App.tsx` to conditionally render SEO Agent route
- [ ] T107 Hide sidebar item in `src/components/Sidebar.tsx` when feature flag is off
- [ ] T108 Add environment-based defaults for feature flags (enabled in development, configurable in production)

### UI Testing Mode

- [ ] T109 Create `src/components/seo-agent/UiTestingBanner.tsx` component to display testing mode indicator
- [ ] T110 Create `src/utils/seoAgentFixtures.ts` file with mock data structures matching GraphQL response types
- [ ] T111 Implement toggle for UI testing mode in `src/components/seo-agent/UiTestingBanner.tsx` that stores state in localStorage
- [ ] T112 Create wrapper/hook `useSeoAgentTesting` in `src/hooks/useSeoAgentTesting.ts` to intercept GraphQL queries in testing mode and return mock data
- [ ] T113 Add visual watermark in `src/components/seo-agent/UiTestingBanner.tsx` when testing mode is active
- [ ] T114 Integrate UI testing mode check in all SEO Agent queries to bypass API calls when testing mode is on

---

## Phase 10: Polish & Cross-Cutting Concerns

**Goal**: Robust error handling, loading states, empty states, and responsive design

### Error Handling

- [ ] T115 Add error boundary component `SeoAgentErrorBoundary` in `src/components/seo-agent/SeoAgentErrorBoundary.tsx` using React Error Boundary pattern
- [ ] T116 Implement retry logic for failed GraphQL queries in SEO Agent components using Apollo Client retry functionality
- [ ] T117 Add user-friendly error messages throughout SEO Agent components for network errors, API errors, and validation errors
- [ ] T118 Handle authorization errors (401) in SEO Agent queries by redirecting to `/auth` using existing TRYGO auth error handling

### Loading States

- [ ] T119 Add skeleton loaders for all tabs in `src/components/seo-agent/SeoAgentConsole.tsx` using shadcn/ui Skeleton component
- [ ] T120 Implement optimistic updates in mutation handlers where appropriate for better UX (clusters, backlog items, plan items)
- [ ] T121 Add loading indicators for mutations (disable buttons, show spinners) in all SEO Agent components

### Empty States

- [ ] T122 Design and implement empty state for Plan tab in `src/components/seo-agent/SeoPlanPanel.tsx` when no items scheduled
- [ ] T123 Design and implement empty state for Semantics tab in `src/components/seo-agent/SeoSemanticsPanel.tsx` when no clusters exist
- [ ] T124 Design and implement empty state for Content tab in `src/components/seo-agent/SeoContentPanel.tsx` when no content ideas available
- [ ] T125 Add helpful CTAs and guidance text in empty states directing users to create clusters or check back later

### Responsive Design

- [ ] T126 Ensure mobile responsiveness for all SEO Agent components by testing on mobile breakpoints and adjusting layouts
- [ ] T127 Test SEO Agent components on tablet screen sizes and adjust layouts as needed
- [ ] T128 Verify tab navigation works correctly on mobile devices (consider swipe gestures or stacked layout)

---

## Implementation Strategy

### MVP First Approach

1. **Start with User Story 1** (Access SEO Agent Workspace)
   - Enables basic navigation and access
   - Establishes foundation for all other stories
   - Can be tested independently

2. **Incremental Delivery**
   - Complete each user story phase fully before moving to next
   - Test each story independently after completion
   - Integrate stories progressively

3. **Parallel Development Opportunities**
   - After User Story 1: User Stories 3 and 4 can be developed in parallel
   - Within stories: Multiple components can be developed in parallel (marked with [P])

### Testing Strategy

- Test each user story independently after completion
- Use UI Testing mode for development and QA without backend dependencies
- Integration testing after all stories complete

### Deployment Strategy

- Feature flag allows gradual rollout
- Can deploy User Story 1 first as MVP
- Subsequent stories deploy incrementally

