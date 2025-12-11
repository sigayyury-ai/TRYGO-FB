# Feature Specification: Backend Services Consolidation

**Feature Branch**: `001-backend-consolidation`  
**Created**: 2025-01-27  
**Status**: Draft  
**Input**: User description: "закончи обядинять бекенд @backend  с @TRYGO-Backend  и не забудь заглянуть в фронт чтобы все работало.  используй практику обядинения сервиса images чтобы совершать меньше ошибок не забудь протестировать после объединения , из апи мне нужно создание идей и генерация статьи , а также сразу добавь @semantics-service  так как это все одно и тоже и часто одного"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - SEO Agent GraphQL API Integration (Priority: P1)

As a frontend application, I need to access SEO Agent functionality (content ideas generation, article generation, backlog management, clusters) through the unified TRYGO-Backend GraphQL API, so that I can use a single API endpoint instead of managing multiple backend services.

**Why this priority**: This is the core functionality that the frontend depends on. Without this, the SEO Agent features in the frontend will not work. This must be completed first to maintain system functionality.

**Independent Test**: Frontend can successfully query SEO Agent data (clusters, backlog, content ideas) and execute mutations (generate content, create ideas) through TRYGO-Backend GraphQL endpoint at `/graphql` using the same queries/mutations that previously worked with the separate backend service.

**Acceptance Scenarios**:

1. **Given** a frontend application connected to TRYGO-Backend, **When** I query `seoAgentClusters(projectId, hypothesisId)`, **Then** I receive the same cluster data that was previously available from the separate backend service
2. **Given** a frontend application, **When** I execute `generateContentForBacklogIdea(input)`, **Then** content is generated and returned successfully through TRYGO-Backend
3. **Given** a frontend application, **When** I execute `generateContentIdeas(projectId, hypothesisId, category)`, **Then** content ideas are created and returned successfully
4. **Given** a frontend application, **When** I query all SEO Agent GraphQL operations (backlog, content queue, posting settings), **Then** all operations work identically to the previous separate backend service

---

### User Story 2 - Semantics Service REST API Integration (Priority: P1)

As a backend service or external client, I need to access cluster management functionality through REST API endpoints in TRYGO-Backend, so that cluster operations (create, read, update, delete) work seamlessly without requiring a separate semantics-service.

**Why this priority**: The semantics-service provides cluster management that is frequently used together with SEO Agent functionality. Integrating it ensures all related features work from a single backend.

**Independent Test**: Can successfully perform CRUD operations on clusters via REST API endpoints (`GET /api/clusters`, `POST /api/clusters`, `PUT /api/clusters/:id`, `DELETE /api/clusters/:id`) in TRYGO-Backend, receiving the same responses as the previous separate semantics-service.

**Acceptance Scenarios**:

1. **Given** a client application, **When** I send `GET /api/clusters?projectId=X&hypothesisId=Y` to TRYGO-Backend, **Then** I receive cluster data matching the previous semantics-service response format
2. **Given** a client application, **When** I send `POST /api/clusters` with cluster data, **Then** a new cluster is created and returned with proper validation
3. **Given** a client application, **When** I send `PUT /api/clusters/:id` with updated data, **Then** the cluster is updated and returned
4. **Given** a client application, **When** I send `DELETE /api/clusters/:id`, **Then** the cluster is deleted and success response is returned

---

### User Story 3 - Internal Service Communication (Priority: P2)

As a backend service component, I need to call SEO Agent and semantics functionality internally within TRYGO-Backend without making HTTP requests, so that operations are faster and more efficient.

**Why this priority**: After integration, internal components should use direct function calls instead of HTTP requests for better performance and reliability. This is an optimization that improves system efficiency.

**Independent Test**: Backend services that previously called external HTTP endpoints can now use direct function imports from integrated services, reducing latency and improving reliability.

**Acceptance Scenarios**:

1. **Given** a backend service needs cluster data, **When** it calls the integrated cluster service function directly, **Then** it receives data without HTTP overhead
2. **Given** a backend service needs to generate content, **When** it calls the integrated content generation function directly, **Then** content is generated without external HTTP calls

---

### User Story 4 - Frontend Compatibility (Priority: P1)

As a frontend developer, I need the frontend application to work without code changes after backend consolidation, so that users experience no disruption and all existing features continue to function.

**Why this priority**: The frontend must continue working seamlessly. Any breaking changes would require frontend updates and could cause user-facing issues.

**Independent Test**: All existing frontend API calls work correctly after backend consolidation. No frontend code changes are required, and all SEO Agent features function as before.

**Acceptance Scenarios**:

1. **Given** the frontend uses `SEO_AGENT_QUERY` and `SEO_AGENT_MUTATE` from `seoAgentClient.ts`, **When** the backend consolidation is complete, **Then** these queries and mutations work without frontend code changes (URL configuration may need update)
2. **Given** the frontend displays SEO Agent data, **When** backend consolidation is complete, **Then** all data displays correctly and user interactions work as expected
3. **Given** the frontend generates content and ideas, **When** backend consolidation is complete, **Then** generation operations complete successfully and results are displayed

---

### Edge Cases

- What happens when a GraphQL query requires data from both integrated services (e.g., clusters + content)?
- How does the system handle errors when one integrated service fails but others are working?
- What happens when environment variables for integrated services are missing or misconfigured?
- How does the system handle database connection issues for integrated MongoDB models?
- What happens when external API calls (e.g., OpenAI, WordPress) fail during content generation?
- How does the system handle concurrent requests to the same integrated functionality?
- What happens when frontend makes requests to old service URLs that no longer exist?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: TRYGO-Backend MUST provide all GraphQL queries and mutations previously available in the separate backend service (SEO Agent functionality)
- **FR-002**: TRYGO-Backend MUST provide REST API endpoints for cluster management (`/api/clusters`) matching the previous semantics-service API
- **FR-003**: TRYGO-Backend MUST maintain backward compatibility with existing frontend GraphQL queries and mutations
- **FR-004**: TRYGO-Backend MUST support content idea generation through GraphQL mutations (`generateContentIdeas`)
- **FR-005**: TRYGO-Backend MUST support article/content generation through GraphQL mutations (`generateContentForBacklogIdea`)
- **FR-006**: TRYGO-Backend MUST integrate all MongoDB models from both backend and semantics-service
- **FR-007**: TRYGO-Backend MUST preserve all business logic from integrated services (content generation, idea generation, cluster management)
- **FR-008**: TRYGO-Backend MUST handle environment variables from both integrated services
- **FR-009**: TRYGO-Backend MUST maintain CORS configuration to allow frontend access
- **FR-010**: TRYGO-Backend MUST provide health check endpoints for monitoring
- **FR-011**: System MUST allow internal service components to call integrated functionality via direct function imports (not HTTP)
- **FR-012**: System MUST maintain existing error handling and logging patterns from integrated services
- **FR-013**: System MUST support all content generation features (text rewriting, image generation integration, WordPress publishing)
- **FR-014**: Frontend MUST be able to access all SEO Agent features through a single GraphQL endpoint without code changes (except URL configuration)

### Key Entities *(include if feature involves data)*

- **SeoCluster**: Represents a semantic cluster of keywords with intent classification (COMMERCIAL, TRANSACTIONAL, INFORMATIONAL, NAVIGATIONAL)
- **BacklogIdea**: Represents a content idea in the SEO backlog with status, category, and scheduling information
- **ContentIdea**: Represents a generated content idea with category, type, and dismissal/backlog status
- **ContentItem**: Represents a generated content article with title, content, format, status, and associated metadata
- **PostingSettings**: Represents WordPress publishing configuration and scheduling preferences for a project

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All existing frontend GraphQL queries and mutations work correctly through TRYGO-Backend without frontend code changes (100% compatibility)
- **SC-002**: Content idea generation completes successfully in under 30 seconds for 95% of requests
- **SC-003**: Article/content generation completes successfully in under 60 seconds for 90% of requests
- **SC-004**: Cluster management REST API endpoints respond in under 500ms for 95% of requests
- **SC-005**: System handles all SEO Agent GraphQL operations without errors for existing frontend workflows
- **SC-006**: Internal service calls use direct function imports (no HTTP overhead) for integrated functionality
- **SC-007**: System maintains backward compatibility - no breaking changes for existing API consumers
- **SC-008**: All integrated MongoDB models and data are accessible and functional
- **SC-009**: Error handling provides clear, actionable error messages matching previous service behavior
- **SC-010**: System can be deployed as a single service, reducing infrastructure complexity

## Assumptions

- Frontend will update environment variable `VITE_SEO_AGENT_URL` to point to TRYGO-Backend GraphQL endpoint
- MongoDB connection strings and database configurations remain compatible
- All environment variables from integrated services will be available in TRYGO-Backend environment
- Existing authentication and authorization mechanisms work with integrated services
- Content generation dependencies (OpenAI API, WordPress API) remain accessible
- The separate backend and semantics-service can be decommissioned after successful integration and testing

## Dependencies

- TRYGO-Backend must have GraphQL server infrastructure (already exists)
- TRYGO-Backend must have Express.js routing (already exists)
- MongoDB connection and models must be compatible
- All npm dependencies from integrated services must be available
- Frontend Apollo Client configuration may need URL updates

## Out of Scope

- Changes to frontend code beyond environment variable configuration
- New features beyond what exists in integrated services
- Database migrations or schema changes
- Performance optimizations beyond basic integration
- New API endpoints beyond what exists in integrated services
