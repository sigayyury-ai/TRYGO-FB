# Feature Specification: Cookie-Based State Management

**Feature Branch**: `001-cookie-based-state`  
**Created**: 2025-12-09  
**Status**: Draft  
**Input**: User description: "переходим на всем проектена куки там храним id проекта и гипотезы активной для передачи глобальных переменных всем сервисам, мутациям и тд. Надо сделать ресерчь где раньше использовался zustand и заменить его на куки, причем если возможно это сделать сквозным методдом было бы супер, чтобы не переписыать 500 мест ."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consistent Project/Hypothesis Selection (Priority: P1)

Users need their selected project and hypothesis to persist across page reloads and be accessible to all services and mutations without manual state management.

**Why this priority**: This is foundational infrastructure that affects all features. Without consistent state, users lose context when navigating or refreshing pages.

**Independent Test**: User selects a project and hypothesis, refreshes the page, and verifies that the same project/hypothesis is still active. All API calls automatically include the correct IDs.

**Acceptance Scenarios**:

1. **Given** a user has selected a project and hypothesis, **When** they refresh the page, **Then** the same project and hypothesis remain selected
2. **Given** a user switches projects, **When** they navigate to any page, **Then** all API calls use the new project ID
3. **Given** a user selects a hypothesis, **When** any mutation or query executes, **Then** it automatically includes the correct hypothesis ID in headers/parameters

---

### User Story 2 - Centralized State Access (Priority: P1)

Developers need a single, consistent way to access active project and hypothesis IDs across all components, services, and API clients without importing multiple stores.

**Why this priority**: Reduces code duplication, prevents inconsistencies, and simplifies maintenance.

**Independent Test**: Replace all Zustand store imports with a single cookie-based utility function. Verify all existing functionality continues to work.

**Acceptance Scenarios**:

1. **Given** a component needs the active project ID, **When** it calls the utility function, **Then** it receives the ID from cookies
2. **Given** a service needs both project and hypothesis IDs, **When** it calls the utility function, **Then** it receives both values in a single call
3. **Given** an API client needs to add headers, **When** it uses the utility function, **Then** headers are automatically populated with correct IDs

---

### User Story 3 - State Synchronization (Priority: P2)

The system must ensure that when a user changes the active project or hypothesis, all components and services immediately reflect the change.

**Why this priority**: Prevents stale data and ensures consistency across the application.

**Independent Test**: User changes project in header dropdown, verify all components update to use the new project ID within 1 second.

**Acceptance Scenarios**:

1. **Given** a user changes the active project, **When** the change is saved to cookies, **Then** all components reading from cookies see the new value immediately
2. **Given** a user changes the active hypothesis, **When** any API call is made, **Then** it uses the new hypothesis ID

---

### Edge Cases

- What happens when cookies are disabled or blocked?
- How does system handle missing or invalid project/hypothesis IDs in cookies?
- What happens when a user has multiple browser tabs open and changes selection in one tab?
- How does system handle expired or corrupted cookie values?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST store active project ID in cookies with name `activeProjectId`
- **FR-002**: System MUST store active hypothesis ID in cookies with name `activeHypothesisId`
- **FR-003**: System MUST provide a single utility function to read active project and hypothesis IDs from cookies
- **FR-004**: System MUST provide a utility function to set active project and hypothesis IDs in cookies
- **FR-005**: System MUST remove all Zustand store dependencies for project and hypothesis state management
- **FR-006**: System MUST update all components currently using `useProjectStore` or `useHypothesisStore` to use cookie-based utilities
- **FR-007**: System MUST update all API clients to read project/hypothesis IDs from cookies via utility function
- **FR-008**: System MUST ensure cookies persist across page reloads (expires: 365 days)
- **FR-009**: System MUST validate that project/hypothesis IDs exist in user's data before setting them in cookies
- **FR-010**: System MUST handle cases where cookie values are invalid or missing gracefully (fallback to first available project/hypothesis)

### Key Entities

- **Active Project ID**: The currently selected project identifier, stored in cookie `activeProjectId`
- **Active Hypothesis ID**: The currently selected hypothesis identifier, stored in cookie `activeHypothesisId`
- **Cookie Utility**: Centralized functions for reading/writing project and hypothesis IDs

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 30+ files currently using Zustand stores for project/hypothesis are migrated to cookie-based utilities
- **SC-002**: Zero Zustand store imports remain for project/hypothesis state management
- **SC-003**: User's selected project and hypothesis persist across page reloads 100% of the time
- **SC-004**: All API calls include correct project and hypothesis IDs in headers/parameters automatically
- **SC-005**: State changes (project/hypothesis selection) are reflected across all components within 1 second
- **SC-006**: No functionality regression - all existing features work identically after migration
- **SC-007**: Code reduction - single utility function replaces multiple store imports across codebase
