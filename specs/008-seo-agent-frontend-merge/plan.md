# Implementation Plan: SEO Agent Frontend Integration

**Feature**: SEO Agent Frontend Integration  
**Branch**: `008-seo-agent-frontend-merge`  
**Created**: 2025-12-09  
**Based on**: [spec.md](./spec.md)

## Overview

This plan details the step-by-step implementation for integrating SEO Agent frontend module into TRYGO. The integration leverages existing TRYGO infrastructure (Apollo Client, Zustand stores, authentication) without duplicating functionality.

## Implementation Phases

### Phase 1: Foundation & Navigation (P1 - Critical Path)
**Goal**: Enable basic navigation and workspace access
**Estimated Time**: 2-3 days

#### Tasks

1. **Add Route & Navigation Entry** (FR-001, FR-002)
   - [ ] Add `/seo-agent` route in `src/App.tsx` with `RequireProject` and `Layout` wrappers
   - [ ] Add "SEO Agent" menu item in `src/components/Sidebar.tsx` under "Prototype" section after "Branding"
   - [ ] Add icon import (Sparkles or Search icon from lucide-react)
   - [ ] Implement locked state for sidebar item when entitlement is missing
   - [ ] Test navigation flow

2. **Create Base Page Component** (FR-003, FR-004)
   - [ ] Create `src/pages/SeoAgentPage.tsx`
   - [ ] Integrate with `useProjectStore` to get `activeProject`
   - [ ] Integrate with `useHypothesisStore` to get `activeHypothesis`
   - [ ] Add redirect logic if no active project (handled by RequireProject)
   - [ ] Add basic page structure with placeholder content

3. **GraphQL Query Structure Setup** (FR-018, FR-022)
   - [ ] Create `src/api/getSeoAgentContext.ts` - placeholder query structure
   - [ ] Use existing Apollo Client instance from `@/config/apollo/client`
   - [ ] Use `activeProject.id` and `activeHypothesis?.id` from stores in queries
   - [ ] Ensure token/auth headers are passed automatically

**Deliverables**:
- Route accessible at `/seo-agent`
- Sidebar menu item visible and functional
- Page loads with project context from stores
- Basic error handling for missing project

---

### Phase 2: Tab Structure & Context Loading (P1 - Critical Path)
**Goal**: Implement tabbed interface and context loading
**Estimated Time**: 2-3 days

#### Tasks

1. **Create Tab Component** (FR-003)
   - [ ] Create `src/components/seo-agent/SeoAgentConsole.tsx`
   - [ ] Implement tabs: Plan, Semantics, Content, Analytics, Settings
   - [ ] Use shadcn/ui Tabs component for consistency
   - [ ] Add tab state management

2. **Implement Context Loading** (FR-004, FR-023)
   - [ ] Complete `src/api/getSeoAgentContext.ts` GraphQL query
   - [ ] Create types/interfaces for context data
   - [ ] Implement context loading in `SeoAgentPage` using Apollo Client `useQuery`
   - [ ] Display loading state with skeleton loader
   - [ ] Handle error states with user-friendly messages

3. **Entitlement Check** (FR-005, FR-016, FR-017)
   - [ ] Create `src/components/seo-agent/SubscriptionBanner.tsx`
   - [ ] Implement entitlement check query (extend existing subscription queries or create new)
   - [ ] Display banners for pending/lapsed subscriptions
   - [ ] Update sidebar item to show locked state when entitlement missing
   - [ ] Add tooltip to locked sidebar item

**Deliverables**:
- Tabbed interface functional
- Context loads from GraphQL using active project
- Entitlement checks work
- Loading and error states handled

---

### Phase 3: Plan Tab Implementation (P2)
**Goal**: Implement monthly content plan view with backlog
**Estimated Time**: 4-5 days

#### Tasks

1. **Plan Tab Layout** (FR-006)
   - [ ] Create `src/components/seo-agent/SeoPlanPanel.tsx`
   - [ ] Design and implement monthly view with 4 weekly cards
   - [ ] Each week displays 2 default publication slots
   - [ ] Use grid/flex layout matching TRYGO design system

2. **Backlog Section** (FR-007)
   - [ ] Create backlog list component
   - [ ] Implement `src/api/getSeoAgentBacklog.ts` GraphQL query
   - [ ] Display unscheduled content ideas
   - [ ] Add "Add to Plan" action buttons
   - [ ] Implement drag-and-drop or click-to-add functionality

3. **Plan Item Management**
   - [ ] Implement quick actions: "Post now" (stub) and "Delete"
   - [ ] Create mutation `src/api/upsertSeoAgentBacklogItem.ts` for moving items
   - [ ] Create mutation for updating plan items
   - [ ] Add optimistic updates for better UX

4. **Integration with Settings**
   - [ ] Read weekly publication count from settings (Phase 4)
   - [ ] Dynamically adjust slots per week based on settings
   - [ ] Add visual indicators for preferred days

**Deliverables**:
- Monthly plan view displays correctly
- Backlog items can be added to plan
- Quick actions work (stubbed where needed)
- Settings integration ready

---

### Phase 4: Settings Tab (P3)
**Goal**: Configure publication cadence and automation
**Estimated Time**: 2-3 days

#### Tasks

1. **Settings Panel** (FR-013)
   - [ ] Create `src/components/seo-agent/SeoPostingSettingsPanel.tsx`
   - [ ] Add weekly publication count input (number)
   - [ ] Add preferred days selector (multi-select checkboxes)
   - [ ] Add auto-publish toggle switch
   - [ ] Use shadcn/ui form components

2. **Settings Persistence**
   - [ ] Create `src/api/getSeoAgentPostingSettings.ts` query
   - [ ] Create `src/api/updateSeoAgentPostingSettings.ts` mutation
   - [ ] Implement form submission and save logic
   - [ ] Add success/error toast notifications
   - [ ] Sync with Plan tab on save

3. **Validation**
   - [ ] Validate weekly count (min 1, max reasonable limit)
   - [ ] Ensure preferred days align with weekly count
   - [ ] Add form validation messages

**Deliverables**:
- Settings tab fully functional
- Settings persist to backend
- Settings affect Plan tab display
- Validation works correctly

---

### Phase 5: Semantics Tab (P2)
**Goal**: Manage keyword clusters
**Estimated Time**: 4-5 days

#### Tasks

1. **Cluster List Display** (FR-009)
   - [ ] Create `src/components/seo-agent/SeoSemanticsPanel.tsx`
   - [ ] Implement grid/list view for clusters
   - [ ] Display cluster title, intent, and keywords preview
   - [ ] Add filtering by intent (if multiple intents exist)

2. **Cluster CRUD Operations** (FR-008)
   - [ ] Create cluster creation form/modal
   - [ ] Create `src/api/getSeoAgentClusters.ts` query
   - [ ] Create `src/api/createSeoAgentCluster.ts` mutation
   - [ ] Create `src/api/updateSeoAgentCluster.ts` mutation
   - [ ] Create `src/api/deleteSeoAgentCluster.ts` mutation
   - [ ] Implement inline editing for cluster fields
   - [ ] Add delete confirmation dialog

3. **Keywords Management**
   - [ ] Add multi-line textarea for keywords
   - [ ] Implement keyword parsing (comma-separated or line-separated)
   - [ ] Add keyword count display
   - [ ] Validate keyword input

4. **Backlog Integration**
   - [ ] Connect cluster changes to backlog generation (backend handles this)
   - [ ] Display notification when backlog ideas are generated from clusters
   - [ ] Link backlog items to source clusters

**Deliverables**:
- Cluster list displays correctly
- Full CRUD operations work
- Keywords managed properly
- Integration with backlog functional

---

### Phase 6: Content Tab (P3)
**Goal**: Review auto-generated content ideas
**Estimated Time**: 3-4 days

#### Tasks

1. **Content Ideas Display** (FR-010)
   - [ ] Create `src/components/seo-agent/SeoContentPanel.tsx`
   - [ ] Create `src/api/getSeoAgentContentQueue.ts` query
   - [ ] Group ideas by strategic categories
   - [ ] Display category headers with counts
   - [ ] Implement collapsible sections per category

2. **Content Actions** (FR-011)
   - [ ] Add "Add to Backlog" button for each idea
   - [ ] Add "Dismiss" action (soft delete or hide)
   - [ ] Create mutations for backlog addition and dismissal
   - [ ] Show success feedback

3. **Custom Content Entry**
   - [ ] Add collapsed form toggle
   - [ ] Create form for manual content idea entry
   - [ ] Add category selector
   - [ ] Submit custom ideas to backend

**Deliverables**:
- Content ideas display grouped by category
- Actions work correctly
- Custom entry form functional

---

### Phase 7: Analytics Tab (P3 - Placeholder)
**Goal**: Placeholder for future analytics
**Estimated Time**: 1 day

#### Tasks

1. **Placeholder Implementation** (FR-012)
   - [ ] Create `src/components/seo-agent/SeoAnalyticsPanel.tsx`
   - [ ] Add placeholder content with "Coming Soon" message
   - [ ] Design structure for future charts/metrics
   - [ ] Add skeleton for future implementation

**Deliverables**:
- Analytics tab shows placeholder
- Structure ready for future implementation

---

### Phase 8: Feature Flags & UI Testing Mode (P2)
**Goal**: Enable feature flags and UI testing
**Estimated Time**: 2-3 days

#### Tasks

1. **Feature Flag Integration** (FR-014)
   - [ ] Integrate feature flag library (LaunchDarkly/ConfigCat/local)
   - [ ] Add `seo_agent.enabled` flag check in route guard
   - [ ] Hide sidebar item when flag is off
   - [ ] Add environment-based defaults

2. **UI Testing Mode** (FR-015)
   - [ ] Create `src/components/seo-agent/UiTestingBanner.tsx`
   - [ ] Create `src/utils/seoAgentFixtures.ts` with mock data
   - [ ] Implement toggle for UI testing mode (localStorage)
   - [ ] Create wrapper/hook to intercept GraphQL queries in testing mode
   - [ ] Add visual watermark when testing mode active
   - [ ] Disable real API calls when testing mode on

3. **Development Mode Detection**
   - [ ] Add environment pill/banner for dev/staging
   - [ ] Show testing mode toggle only in non-production

**Deliverables**:
- Feature flags work correctly
- UI testing mode functional
- Mock data available for QA

---

### Phase 9: Error Handling & Polish (P1)
**Goal**: Robust error handling and UX polish
**Estimated Time**: 2-3 days

#### Tasks

1. **Error Handling** (FR-019, FR-020)
   - [ ] Add comprehensive error boundaries
   - [ ] Implement retry logic for failed queries
   - [ ] Add user-friendly error messages
   - [ ] Handle network errors gracefully
   - [ ] Handle authorization errors (redirect to auth)

2. **Loading States**
   - [ ] Add skeleton loaders for all tabs
   - [ ] Implement optimistic updates where appropriate
   - [ ] Add loading indicators for mutations

3. **Empty States**
   - [ ] Design empty states for each tab
   - [ ] Add helpful CTAs and guidance text
   - [ ] Handle "no clusters", "no backlog items", etc.

4. **Responsive Design**
   - [ ] Ensure mobile responsiveness
   - [ ] Test on various screen sizes
   - [ ] Adjust layouts for tablet/mobile

**Deliverables**:
- Comprehensive error handling
- Polished loading states
- Empty states designed and implemented
- Responsive design verified

---

### Phase 10: Testing & Documentation (Ongoing)
**Goal**: Ensure quality and maintainability
**Estimated Time**: 3-4 days

#### Tasks

1. **Unit Tests**
   - [ ] Write tests for components
   - [ ] Test GraphQL query/mutation hooks
   - [ ] Test store integrations
   - [ ] Test utility functions

2. **Integration Tests**
   - [ ] Test navigation flow
   - [ ] Test data loading and display
   - [ ] Test CRUD operations
   - [ ] Test entitlement checks

3. **E2E Tests** (if applicable)
   - [ ] Test complete user workflows
   - [ ] Test error scenarios
   - [ ] Test with different user roles

4. **Documentation**
   - [ ] Document component APIs
   - [ ] Document GraphQL schema additions needed
   - [ ] Update README if needed
   - [ ] Document feature flag configuration

**Deliverables**:
- Test coverage acceptable
- Documentation complete
- Code reviewed and ready

---

## Technical Implementation Details

### File Structure

```
TRYGO-Front/src/
├── pages/
│   └── SeoAgentPage.tsx
├── components/
│   ├── seo-agent/
│   │   ├── SeoAgentConsole.tsx
│   │   ├── SeoPlanPanel.tsx
│   │   ├── SeoSemanticsPanel.tsx
│   │   ├── SeoContentPanel.tsx
│   │   ├── SeoAnalyticsPanel.tsx
│   │   ├── SeoPostingSettingsPanel.tsx
│   │   ├── SubscriptionBanner.tsx
│   │   └── UiTestingBanner.tsx
│   └── Sidebar.tsx (updated)
├── api/
│   ├── getSeoAgentContext.ts
│   ├── getSeoAgentClusters.ts
│   ├── getSeoAgentBacklog.ts
│   ├── getSeoAgentContentQueue.ts
│   ├── getSeoAgentPostingSettings.ts
│   ├── createSeoAgentCluster.ts
│   ├── updateSeoAgentCluster.ts
│   ├── deleteSeoAgentCluster.ts
│   ├── upsertSeoAgentBacklogItem.ts
│   └── updateSeoAgentPostingSettings.ts
└── utils/
    └── seoAgentFixtures.ts (for UI testing mode)
```

### Key Implementation Patterns

1. **Using Existing Stores**:
   ```typescript
   const activeProject = useProjectStore((state) => state.activeProject);
   const activeHypothesis = useHypothesisStore((state) => state.activeHypothesis);
   ```

2. **GraphQL Query Pattern**:
   ```typescript
   import { QUERY } from '@/config/apollo/client';
   
   export const GET_SEO_AGENT_CONTEXT = gql`
     query GetSeoAgentContext($projectId: ID!, $hypothesisId: ID) {
       seoAgentContext(projectId: $projectId, hypothesisId: $hypothesisId) {
         # fields
       }
     }
   `;
   
   export const getSeoAgentContextQuery = (projectId: string, hypothesisId?: string) => {
     return QUERY({
       query: GET_SEO_AGENT_CONTEXT,
       variables: { projectId, hypothesisId },
       fetchPolicy: 'network-only',
     });
   };
   ```

3. **Component Structure**:
   ```typescript
   const SeoAgentPage = () => {
     const activeProject = useProjectStore((state) => state.activeProject);
     const activeHypothesis = useHypothesisStore((state) => state.activeHypothesis);
     
     if (!activeProject) {
       return <Navigate to="/dashboard" />;
     }
     
     return <SeoAgentConsole projectId={activeProject.id} hypothesisId={activeHypothesis?.id} />;
   };
   ```

## Dependencies & Prerequisites

### Frontend Dependencies
- ✅ React Router (already in use)
- ✅ Apollo Client (already configured)
- ✅ Zustand (already in use)
- ✅ shadcn/ui components (already in use)
- ✅ lucide-react icons (already in use)

### Backend Dependencies (Out of scope, but needed)
- GraphQL schema extensions for SEO Agent
- Database collections: `seoClusters`, `seoBacklogIdeas`, `seoContentQueue`, `agentPostingSettings`
- Resolvers for all queries and mutations

### External Dependencies
- Feature flag service (LaunchDarkly/ConfigCat) or local implementation

## Risk Mitigation

1. **Backend API Not Ready**
   - Risk: Frontend ready but backend queries fail
   - Mitigation: Use UI testing mode with fixtures, stub backend responses

2. **Performance with Large Datasets**
   - Risk: Many clusters/backlog items slow down UI
   - Mitigation: Implement pagination, virtualization, lazy loading

3. **Authentication Issues**
   - Risk: Token expires during session
   - Mitigation: Use existing TRYGO auth refresh mechanism, handle 401 errors

4. **Feature Flag Complexity**
   - Risk: Flag configuration errors block access
   - Mitigation: Default to enabled in development, thorough testing of flag states

## Success Metrics

- ✅ All functional requirements (FR-001 to FR-023) implemented
- ✅ All user stories (P1) testable independently
- ✅ Navigation works seamlessly with TRYGO
- ✅ No duplication of authentication/data fetching logic
- ✅ Consistent UI/UX with existing TRYGO modules
- ✅ Error handling robust and user-friendly

## Timeline Estimate

**Total Estimated Time**: 25-35 days (5-7 weeks)

- Phase 1-2: 4-6 days (Foundation)
- Phase 3-6: 13-17 days (Core features)
- Phase 7-9: 5-7 days (Polish)
- Phase 10: 3-4 days (Testing)

**Note**: Timeline assumes single developer. Parallel work on backend can reduce frontend blocking.

## Next Steps

1. Review and approve this plan
2. Set up feature branch if not already done
3. Begin Phase 1 implementation
4. Coordinate with backend team on GraphQL schema
5. Set up feature flag infrastructure

