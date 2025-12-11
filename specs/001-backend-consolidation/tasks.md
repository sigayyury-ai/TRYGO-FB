# Tasks: Backend Services Consolidation

**Input**: Design documents from `/specs/001-backend-consolidation/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: Manual testing via GraphQL playground and curl/Postman (no automated tests requested)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Phase 1: Setup (Project Structure)

**Purpose**: Prepare project structure for integration

- [X] T001 Create db/models directory structure in TRYGO-Backend/src/db/models/
- [X] T002 Create seoAgent services directory structure in TRYGO-Backend/src/services/seoAgent/
- [ ] T003 [P] Verify npm dependencies from backend and semantics-service are available in TRYGO-Backend/package.json

**Checkpoint**: Project structure ready for model and service integration

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### MongoDB Models Integration

- [X] T004 [P] Copy SeoCluster model from backend/src/db/models/SeoCluster.ts to TRYGO-Backend/src/db/models/SeoCluster.ts
- [X] T005 [P] Copy SeoBacklogIdea model from backend/src/db/models/SeoBacklogIdea.ts to TRYGO-Backend/src/db/models/SeoBacklogIdea.ts
- [X] T006 [P] Copy SeoContentItem model from backend/src/db/models/SeoContentItem.ts to TRYGO-Backend/src/db/models/SeoContentItem.ts
- [X] T007 [P] Copy SeoSprintSettings model from backend/src/db/models/SeoSprintSettings.ts to TRYGO-Backend/src/db/models/SeoSprintSettings.ts
- [X] T008 [P] Copy SeoLanguagePreference model from backend/src/db/models/SeoLanguagePreference.ts to TRYGO-Backend/src/db/models/SeoLanguagePreference.ts (if exists)
- [X] T009 Update import paths in all copied models to match TRYGO-Backend structure (change relative paths)
- [X] T010 Ensure SeoCluster model uses collection name "seoAgentClusters" in TRYGO-Backend/src/db/models/SeoCluster.ts
- [X] T011 Verify all model indexes are preserved in TRYGO-Backend/src/db/models/

### Service Files Integration

- [X] T012 [P] Copy contentGeneration.ts from backend/src/services/contentGeneration.ts to TRYGO-Backend/src/services/seoAgent/contentGeneration.ts
- [X] T013 [P] Copy contentIdeas directory from backend/src/services/contentIdeas/ to TRYGO-Backend/src/services/seoAgent/contentIdeas/
- [X] T014 [P] Copy wordpress directory from backend/src/services/wordpress/ to TRYGO-Backend/src/services/seoAgent/wordpress/
- [X] T015 [P] Copy context directory from backend/src/services/context/ to TRYGO-Backend/src/services/seoAgent/context/
- [X] T016 Update all import paths in copied service files to match TRYGO-Backend structure (change ../db/models/ to ../../db/models/, ../config/env to ../../constants/config/env)

### Utilities Integration

- [X] T017 [P] Copy normalise.ts from semantics-service/src/utils/normalise.ts to TRYGO-Backend/src/utils/normalise.ts
- [X] T018 Update import paths in normalise.ts to match TRYGO-Backend structure

### Environment Configuration

- [X] T019 Update TRYGO-Backend/src/constants/config/env.ts to add WordPress environment variables (WORDPRESS_BASE_URL, WORDPRESS_USERNAME, WORDPRESS_APP_PASSWORD)
- [ ] T020 Verify all required environment variables from backend and semantics-service are available in TRYGO-Backend/.env

**Checkpoint**: Foundation ready - MongoDB models, services, and utilities are integrated. User story implementation can now begin.

---

## Phase 3: User Story 1 - SEO Agent GraphQL API Integration (Priority: P1) 🎯 MVP

**Goal**: Frontend can access all SEO Agent functionality (content ideas generation, article generation, backlog management, clusters) through TRYGO-Backend GraphQL API at `/graphql`

**Independent Test**: Frontend can successfully query SEO Agent data (clusters, backlog, content ideas) and execute mutations (generate content, create ideas) through TRYGO-Backend GraphQL endpoint using the same queries/mutations that previously worked with the separate backend service.

### GraphQL Schema Integration

- [X] T021 [US1] Read existing TRYGO-Backend/src/typeDefs/seoAgentTypeDefs.graphql to identify existing types
- [X] T022 [US1] Extract GraphQL type definitions from backend/src/schema/typeDefs.ts
- [X] T023 [US1] Merge type definitions into TRYGO-Backend/src/typeDefs/seoAgentTypeDefs.graphql (add missing types, update conflicting types)
- [X] T024 [US1] Ensure all enums are included: SeoClusterIntent, BacklogCategory, BacklogStatus, ContentCategory, ContentFormat, ContentStatus, ContentType
- [X] T025 [US1] Ensure all types are included: SeoCluster, BacklogIdea, ContentIdea, ContentItem, PostingSettings, and all result types
- [X] T026 [US1] Ensure all input types are included: ClusterInput, BacklogIdeaInput, ContentItemInput, GenerateContentInput, GenerateImageInput, etc.
- [X] T027 [US1] Verify scalar DateTime is defined in TRYGO-Backend/src/typeDefs/overallTypeDefs.graphql or base schema

### GraphQL Queries Integration

- [ ] T028 [US1] Ensure Query type includes seoAgentClusters in TRYGO-Backend/src/typeDefs/seoAgentTypeDefs.graphql
- [ ] T029 [US1] Ensure Query type includes seoAgentBacklog in TRYGO-Backend/src/typeDefs/seoAgentTypeDefs.graphql
- [ ] T030 [US1] Ensure Query type includes seoAgentContentIdeas in TRYGO-Backend/src/typeDefs/seoAgentTypeDefs.graphql
- [ ] T031 [US1] Ensure Query type includes seoAgentPostingSettings in TRYGO-Backend/src/typeDefs/seoAgentTypeDefs.graphql
- [ ] T032 [US1] Ensure Query type includes seoContentQueue in TRYGO-Backend/src/typeDefs/seoAgentTypeDefs.graphql
- [ ] T033 [US1] Ensure Query type includes contentItemByBacklogIdea in TRYGO-Backend/src/typeDefs/seoAgentTypeDefs.graphql
- [ ] T034 [US1] Ensure Query type includes wordpressCategories, wordpressTags, wordpressPostTypes in TRYGO-Backend/src/typeDefs/seoAgentTypeDefs.graphql

### GraphQL Mutations Integration

- [ ] T035 [US1] Ensure Mutation type includes all cluster operations (createSeoAgentCluster, updateSeoAgentCluster, deleteSeoAgentCluster) in TRYGO-Backend/src/typeDefs/seoAgentTypeDefs.graphql
- [ ] T036 [US1] Ensure Mutation type includes all backlog operations (updateSeoAgentBacklogIdea, deleteSeoAgentBacklogIdea, addContentIdeaToBacklog) in TRYGO-Backend/src/typeDefs/seoAgentTypeDefs.graphql
- [ ] T037 [US1] Ensure Mutation type includes content idea operations (dismissContentIdea, createCustomContentIdea) in TRYGO-Backend/src/typeDefs/seoAgentTypeDefs.graphql
- [ ] T038 [US1] Ensure Mutation type includes updateSeoAgentPostingSettings in TRYGO-Backend/src/typeDefs/seoAgentTypeDefs.graphql
- [ ] T039 [US1] Ensure Mutation type includes content item operations (upsertContentItem, deleteContentItem) in TRYGO-Backend/src/typeDefs/seoAgentTypeDefs.graphql
- [ ] T040 [US1] Ensure Mutation type includes generateContentForBacklogIdea in TRYGO-Backend/src/typeDefs/seoAgentTypeDefs.graphql
- [ ] T041 [US1] Ensure Mutation type includes generateImageForContent in TRYGO-Backend/src/typeDefs/seoAgentTypeDefs.graphql
- [ ] T042 [US1] Ensure Mutation type includes generateContentIdeas in TRYGO-Backend/src/typeDefs/seoAgentTypeDefs.graphql
- [ ] T043 [US1] Ensure Mutation type includes regenerateContent, rewriteTextSelection, approveContentItem in TRYGO-Backend/src/typeDefs/seoAgentTypeDefs.graphql
- [ ] T044 [US1] Ensure Mutation type includes WordPress operations (publishToWordPress, testWordPressConnection) in TRYGO-Backend/src/typeDefs/seoAgentTypeDefs.graphql
- [ ] T045 [US1] Ensure Mutation type includes logFrontendMessage in TRYGO-Backend/src/typeDefs/seoAgentTypeDefs.graphql

### GraphQL Resolvers Integration

- [ ] T046 [US1] Read existing resolvers in TRYGO-Backend/src/resolvers/seoAgent/seoAgentQueryResolver.ts
- [ ] T047 [US1] Read existing resolvers in TRYGO-Backend/src/resolvers/seoAgent/seoAgentMutationResolver.ts
- [ ] T048 [US1] Extract resolver logic from backend/src/schema/resolvers.ts
- [ ] T049 [US1] Merge query resolvers into TRYGO-Backend/src/resolvers/seoAgent/seoAgentQueryResolver.ts (add missing resolvers, preserve existing functionality)
- [ ] T050 [US1] Merge mutation resolvers into TRYGO-Backend/src/resolvers/seoAgent/seoAgentMutationResolver.ts (add missing resolvers, preserve existing functionality)
- [ ] T051 [US1] Update service imports in resolvers to use ../../services/seoAgent/ instead of ../services/
- [ ] T052 [US1] Update model imports in resolvers to use ../../db/models/ instead of ../db/models/
- [ ] T053 [US1] Update resolver context usage to match TRYGO-Backend context structure
- [ ] T054 [US1] Ensure all resolver functions handle errors properly and match previous service behavior

### Service Integration for GraphQL

- [ ] T055 [US1] Update contentGeneration.ts service to use integrated images API (change from HTTP call to direct import from ../../services/images/generateImage)
- [ ] T056 [US1] Update contentIdeas/generator.ts to use correct import paths for TRYGO-Backend structure
- [ ] T057 [US1] Update wordpress services to use correct import paths for TRYGO-Backend structure
- [ ] T058 [US1] Update context services to use correct import paths for TRYGO-Backend structure
- [ ] T059 [US1] Verify all service dependencies are resolved (OpenAI, Gemini, WordPress API clients)

### Resolver Registration

- [ ] T060 [US1] Verify seoAgent resolvers are registered in TRYGO-Backend/src/resolvers/_indexResolvers.ts
- [ ] T061 [US1] Test GraphQL schema compilation (verify no type errors)

**Checkpoint**: At this point, User Story 1 should be fully functional - frontend can query and mutate SEO Agent data through TRYGO-Backend GraphQL endpoint

---

## Phase 4: User Story 2 - Semantics Service REST API Integration (Priority: P1)

**Goal**: Cluster management functionality is available through REST API endpoints in TRYGO-Backend, matching previous semantics-service API

**Independent Test**: Can successfully perform CRUD operations on clusters via REST API endpoints (GET /api/clusters, POST /api/clusters, PUT /api/clusters/:id, DELETE /api/clusters/:id) in TRYGO-Backend, receiving the same responses as the previous separate semantics-service.

### REST API Routes Creation

- [ ] T062 [US2] Create clusters.ts route file in TRYGO-Backend/src/routes/clusters.ts
- [ ] T063 [US2] Copy GET /clusters route handler from semantics-service/src/routes/clusters.ts to TRYGO-Backend/src/routes/clusters.ts
- [ ] T064 [US2] Copy POST /clusters route handler from semantics-service/src/routes/clusters.ts to TRYGO-Backend/src/routes/clusters.ts
- [ ] T065 [US2] Copy PUT /clusters/:id route handler from semantics-service/src/routes/clusters.ts to TRYGO-Backend/src/routes/clusters.ts
- [ ] T066 [US2] Copy DELETE /clusters/:id route handler from semantics-service/src/routes/clusters.ts to TRYGO-Backend/src/routes/clusters.ts
- [ ] T067 [US2] Update import paths in clusters.ts to use ../db/models/SeoCluster and ../utils/normalise
- [ ] T068 [US2] Update persistCluster function to use TRYGO-Backend model and utils
- [ ] T069 [US2] Add request validation for all cluster routes (projectId, hypothesisId, userId required)
- [ ] T070 [US2] Add error handling middleware for cluster routes
- [ ] T071 [US2] Add logging for cluster API requests in TRYGO-Backend/src/routes/clusters.ts

### Route Integration

- [ ] T072 [US2] Import clustersRouter in TRYGO-Backend/src/server.ts
- [ ] T073 [US2] Add app.use('/api/clusters', clustersRouter) in TRYGO-Backend/src/server.ts after CORS setup and before GraphQL middleware
- [ ] T074 [US2] Verify CORS configuration allows cluster API access

**Checkpoint**: At this point, User Story 2 should be fully functional - REST API endpoints for clusters work correctly

---

## Phase 5: User Story 3 - Internal Service Communication (Priority: P2)

**Goal**: Internal backend components can call SEO Agent and semantics functionality via direct function imports instead of HTTP requests

**Independent Test**: Backend services that previously called external HTTP endpoints can now use direct function imports from integrated services, reducing latency and improving reliability.

### Identify HTTP Calls

- [ ] T075 [US3] Search for HTTP calls to semantics-service in TRYGO-Backend codebase (grep for SEMANTICS_SERVICE_URL or localhost:4200)
- [ ] T076 [US3] Search for HTTP calls to backend service in TRYGO-Backend codebase (grep for TRYGO_BACKEND_URL or localhost:4100)
- [ ] T077 [US3] Document all HTTP calls that should be replaced with direct imports

### Replace HTTP Calls with Direct Imports

- [ ] T078 [US3] Replace HTTP calls to /api/clusters with direct import from ../../services/seoAgent/clusters (if cluster service exists) or use model directly
- [ ] T079 [US3] Replace HTTP calls to content generation with direct import from ../../services/seoAgent/contentGeneration
- [ ] T080 [US3] Replace HTTP calls to content ideas generation with direct import from ../../services/seoAgent/contentIdeas/generator
- [ ] T081 [US3] Update error handling for direct function calls (remove HTTP error handling, use try/catch for function errors)
- [ ] T082 [US3] Update logging to reflect direct function calls instead of HTTP requests

### Remove HTTP Client Code

- [ ] T083 [US3] Remove fetch/HTTP client code that was used for inter-service communication
- [ ] T084 [US3] Remove environment variables for inter-service URLs (SEMANTICS_SERVICE_URL, TRYGO_BACKEND_URL) if no longer needed

**Checkpoint**: At this point, User Story 3 should be complete - internal services use direct function imports

---

## Phase 6: User Story 4 - Frontend Compatibility (Priority: P1)

**Goal**: Frontend application works without code changes after backend consolidation

**Independent Test**: All existing frontend API calls work correctly after backend consolidation. No frontend code changes are required, and all SEO Agent features function as before.

### Frontend Configuration Update

- [ ] T085 [US4] Update TRYGO-Front/.env or .env.local to change VITE_SEO_AGENT_URL from http://localhost:4100/graphql to http://localhost:5001/graphql
- [ ] T086 [US4] Verify frontend Apollo Client configuration in TRYGO-Front/src/config/apollo/client/seoAgentClient.ts uses VITE_SEO_AGENT_URL environment variable

### Frontend Testing

- [ ] T087 [US4] Test frontend can query seoAgentClusters through TRYGO-Backend GraphQL endpoint
- [ ] T088 [US4] Test frontend can query seoAgentBacklog through TRYGO-Backend GraphQL endpoint
- [ ] T089 [US4] Test frontend can query seoAgentContentIdeas through TRYGO-Backend GraphQL endpoint
- [ ] T090 [US4] Test frontend can execute generateContentIdeas mutation through TRYGO-Backend GraphQL endpoint
- [ ] T091 [US4] Test frontend can execute generateContentForBacklogIdea mutation through TRYGO-Backend GraphQL endpoint
- [ ] T092 [US4] Test frontend can execute all SEO Agent mutations through TRYGO-Backend GraphQL endpoint
- [ ] T093 [US4] Verify all frontend SEO Agent features work correctly (clusters, backlog, content ideas, content generation)

**Checkpoint**: At this point, User Story 4 should be complete - frontend works without code changes

---

## Phase 7: Deployment & Infrastructure Updates

**Purpose**: Update deployment configuration and startup scripts

### Render Configuration

- [ ] T094 Remove backend service block from render.yaml
- [ ] T095 Remove semantics-service service block from render.yaml
- [ ] T096 Update render.yaml comments to reflect backend consolidation
- [ ] T097 Add WordPress environment variables to trygo-main-backend service in render.yaml (if not already present)
- [ ] T098 Verify all required environment variables are in trygo-main-backend service envVars in render.yaml

### Startup Scripts

- [ ] T099 Update start-all.sh to remove backend service startup section
- [ ] T100 Update start-all.sh to remove semantics-service startup section
- [ ] T101 Update start-all.sh port cleanup to remove ports 4100 and 4200
- [ ] T102 Update start-all.sh output messages to reflect consolidated services
- [ ] T103 Update stop-all.sh to remove backend service shutdown (port 4100)
- [ ] T104 Update stop-all.sh to remove semantics-service shutdown (port 4200)

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final integration testing, error handling, and documentation

### Integration Testing

- [ ] T105 Test all GraphQL queries work correctly through TRYGO-Backend
- [ ] T106 Test all GraphQL mutations work correctly through TRYGO-Backend
- [ ] T107 Test REST API cluster endpoints work correctly
- [ ] T108 Test content idea generation end-to-end (generateContentIdeas mutation)
- [ ] T109 Test article generation end-to-end (generateContentForBacklogIdea mutation)
- [ ] T110 Test image generation integration (generateImageForContent mutation uses integrated images API)
- [ ] T111 Test WordPress publishing integration (publishToWordPress mutation)
- [ ] T112 Verify error handling matches previous service behavior
- [ ] T113 Verify logging patterns match previous service behavior

### Error Handling & Logging

- [ ] T114 [P] Review and update error messages to be consistent across integrated services
- [ ] T115 [P] Ensure all service errors are properly logged with context
- [ ] T116 [P] Verify error responses match previous service format for backward compatibility

### Documentation

- [ ] T117 Update API documentation to reflect consolidated endpoints
- [ ] T118 Update deployment documentation to reflect single backend service
- [ ] T119 Run quickstart.md validation checklist

### Cleanup

- [ ] T120 Remove unused environment variables from TRYGO-Backend/.env (if any)
- [ ] T121 Verify no hardcoded references to old service URLs remain in codebase

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User Story 1 (P1): Can start after Foundational - Core GraphQL API
  - User Story 2 (P1): Can start after Foundational - REST API (can run in parallel with US1)
  - User Story 3 (P2): Depends on US1 and US2 completion - Internal optimization
  - User Story 4 (P1): Depends on US1 completion - Frontend testing
- **Deployment (Phase 7)**: Can start after US1 and US2 are complete
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Can run in parallel with US1
- **User Story 3 (P2)**: Depends on US1 and US2 - Needs integrated services to optimize
- **User Story 4 (P1)**: Depends on US1 - Needs GraphQL API working to test frontend

### Within Each User Story

- GraphQL Schema before Resolvers (US1)
- Models before Services (all stories)
- Services before Endpoints/Routes (all stories)
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational model tasks (T004-T008) can run in parallel
- All Foundational service tasks (T012-T015) can run in parallel
- User Story 1 and User Story 2 can be worked on in parallel (after Foundational)
- GraphQL schema tasks (T021-T045) can be worked on in parallel with REST API tasks (T062-T071)
- All Polish tasks marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all GraphQL type definition tasks together:
Task: "Merge type definitions into TRYGO-Backend/src/typeDefs/seoAgentTypeDefs.graphql"
Task: "Ensure all enums are included"
Task: "Ensure all types are included"
Task: "Ensure all input types are included"

# Launch all query integration tasks together:
Task: "Ensure Query type includes seoAgentClusters"
Task: "Ensure Query type includes seoAgentBacklog"
Task: "Ensure Query type includes seoAgentContentIdeas"
# ... etc
```

---

## Parallel Example: User Story 2

```bash
# Launch all REST API route tasks together:
Task: "Copy GET /clusters route handler"
Task: "Copy POST /clusters route handler"
Task: "Copy PUT /clusters/:id route handler"
Task: "Copy DELETE /clusters/:id route handler"
```

---

## Implementation Strategy

### MVP First (User Stories 1, 2, 4)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (GraphQL API)
4. Complete Phase 4: User Story 2 (REST API) - can run parallel with US1
5. Complete Phase 6: User Story 4 (Frontend Compatibility)
6. **STOP and VALIDATE**: Test all P1 stories independently
7. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Core GraphQL API working
3. Add User Story 2 → Test independently → REST API working
4. Add User Story 4 → Test independently → Frontend working (MVP!)
5. Add User Story 3 → Test independently → Internal optimization complete
6. Add Deployment updates → Infrastructure ready
7. Add Polish → Production ready
8. Each phase adds value without breaking previous work

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (GraphQL API)
   - Developer B: User Story 2 (REST API)
3. After US1 and US2:
   - Developer A: User Story 4 (Frontend testing)
   - Developer B: User Story 3 (Internal optimization)
4. Both: Deployment updates and Polish

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Follow images-service integration pattern for consistency
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Test after each user story completion
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
