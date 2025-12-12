# Research & Analysis: Backend Services Consolidation

**Feature**: Backend Services Consolidation  
**Date**: 2025-01-27  
**Phase**: 0 - Research

## Research Objectives

1. Analyze existing backend service structure and dependencies
2. Analyze semantics-service REST API patterns
3. Identify integration patterns from images-service consolidation
4. Determine MongoDB model compatibility
5. Identify GraphQL schema integration approach
6. Determine environment variable consolidation strategy

## Findings

### 1. Backend Service Structure Analysis

**Decision**: Integrate backend service GraphQL schema and resolvers into TRYGO-Backend

**Rationale**: 
- Backend service uses Apollo Server 4.10.0 with Express
- TRYGO-Backend already uses Apollo Server 4.10.1 - compatible versions
- Both use GraphQL with similar patterns
- Backend has ~50 GraphQL operations (queries + mutations)
- Resolvers are well-structured and can be directly integrated

**Alternatives Considered**:
- **Option A**: Keep backend as separate service and proxy requests
  - **Rejected**: Defeats the purpose of consolidation, adds latency
- **Option B**: Rewrite all GraphQL operations from scratch
  - **Rejected**: Unnecessary effort, risk of breaking changes
- **Option C**: Direct integration (chosen)
  - **Chosen**: Follows images-service pattern, maintains compatibility

**Key Components to Integrate**:
- GraphQL type definitions (`backend/src/schema/typeDefs.ts`)
- GraphQL resolvers (`backend/src/schema/resolvers.ts`)
- MongoDB models (5 models: SeoCluster, SeoBacklogIdea, SeoContentItem, SeoSprintSettings, SeoLanguagePreference)
- Services: contentGeneration, contentIdeas, wordpress, context
- Environment configuration

### 2. Semantics Service REST API Analysis

**Decision**: Integrate semantics-service REST API as Express routes in TRYGO-Backend

**Rationale**:
- Semantics-service provides simple REST API (4 endpoints: GET, POST, PUT, DELETE /clusters)
- Uses Express.js (compatible with TRYGO-Backend)
- Minimal dependencies (cors, express, mongoose)
- Follows same pattern as images-service REST API integration

**API Endpoints to Integrate**:
- `GET /api/clusters?projectId=X&hypothesisId=Y` - List clusters
- `POST /api/clusters` - Create cluster
- `PUT /api/clusters/:id` - Update cluster
- `DELETE /api/clusters/:id` - Delete cluster

**Alternatives Considered**:
- **Option A**: Convert REST API to GraphQL
  - **Rejected**: Breaking change for existing clients, unnecessary complexity
- **Option B**: Keep as REST API (chosen)
  - **Chosen**: Maintains backward compatibility, follows images-service pattern

### 3. MongoDB Model Compatibility

**Decision**: Use existing models from both services, ensure collection name compatibility

**Rationale**:
- Both services use Mongoose with similar patterns
- TRYGO-Backend uses Mongoose 8.2.2, backend uses 7.6.0, semantics-service uses 7.6.0
- Minor version difference should be compatible (Mongoose 7.x → 8.x is mostly backward compatible)
- Models use same field names and types
- Need to ensure collection names match (semantics-service uses "seoAgentClusters" collection)

**Model Integration Strategy**:
- Copy models from `backend/src/db/models/` to `TRYGO-Backend/src/db/models/`
- Copy SeoCluster model from semantics-service (check for differences)
- Ensure collection names are consistent
- Update imports in services to use new model locations

**Collection Names**:
- `SeoCluster`: semantics-service uses "seoAgentClusters", backend uses default "seoclusters"
- **Decision**: Use "seoAgentClusters" to match existing data
- Other models use default collection names (lowercase plural)

### 4. GraphQL Schema Integration

**Decision**: Merge GraphQL type definitions into existing TRYGO-Backend schema structure

**Rationale**:
- TRYGO-Backend uses modular GraphQL files in `typeDefs/` directory
- Backend uses single `typeDefs.ts` file with all definitions
- TRYGO-Backend already has `seoAgentTypeDefs.graphql` file (may be partial)
- Need to merge/update existing SEO Agent types with backend types

**Integration Approach**:
- Extract type definitions from `backend/src/schema/typeDefs.ts`
- Compare with existing `TRYGO-Backend/src/typeDefs/seoAgentTypeDefs.graphql`
- Merge compatible types, update conflicting types
- Ensure all queries and mutations from backend are included
- Maintain backward compatibility with frontend queries

**Resolver Integration**:
- TRYGO-Backend already has `resolvers/seoAgent/` directory
- Compare existing resolvers with backend resolvers
- Merge resolver logic, preserve existing functionality
- Update service imports to use integrated services

### 5. Environment Variable Consolidation

**Decision**: Merge all environment variables into TRYGO-Backend config

**Rationale**:
- Backend uses: `MONGODB_URI`, `FRONTEND_URL`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `GOOGLE_API_KEY`, `WORDPRESS_*`, etc.
- Semantics-service uses: `MONGODB_URI`, `PORT`, `CORS_ORIGIN`
- TRYGO-Backend already has comprehensive env config
- Need to add missing variables and ensure compatibility

**Variables to Add**:
- SEO Agent specific: `TRYGO_BACKEND_URL` (for internal calls - can be removed after integration)
- WordPress: `WORDPRESS_BASE_URL`, `WORDPRESS_USERNAME`, `WORDPRESS_APP_PASSWORD`
- Content generation: Already present (OpenAI, Gemini)
- Semantics: `CORS_ORIGIN` (can use existing CORS config)

### 6. Service Integration Pattern (Following images-service)

**Decision**: Follow the same pattern used for images-service integration

**Pattern from images-service**:
1. Copy service code to `TRYGO-Backend/src/services/[name]/`
2. Create REST API routes in `TRYGO-Backend/src/routes/[name].ts`
3. Integrate routes in `server.ts` after CORS setup
4. Update environment config in `constants/config/env.ts`
5. Update internal service calls to use direct imports (not HTTP)
6. Update `render.yaml` for deployment
7. Update startup scripts (`start-all.sh`, `stop-all.sh`)

**Applied to Backend Consolidation**:
1. Copy GraphQL schema and resolvers
2. Copy MongoDB models
3. Copy service files
4. Integrate GraphQL types into existing schema
5. Integrate resolvers into existing resolver structure
6. Create REST API routes for clusters
7. Update environment config
8. Update internal calls (if any)

### 7. Frontend Compatibility

**Decision**: Frontend requires only environment variable update

**Rationale**:
- Frontend uses `SEO_AGENT_QUERY` and `SEO_AGENT_MUTATE` from `seoAgentClient.ts`
- Client is configured with `VITE_SEO_AGENT_URL` environment variable
- GraphQL queries and mutations remain identical
- Only URL needs to change from `http://localhost:4100/graphql` to `http://localhost:5001/graphql`

**Required Frontend Changes**:
- Update `.env` or `.env.local`: `VITE_SEO_AGENT_URL=http://localhost:5001/graphql`
- No code changes needed
- All existing queries and mutations will work unchanged

### 8. Internal Service Communication

**Decision**: After integration, internal services should use direct function imports

**Rationale**:
- Currently backend may call semantics-service via HTTP
- After integration, both are in same process
- Direct function calls are faster and more reliable
- Follows images-service pattern (internal calls use direct imports)

**Migration Strategy**:
- Identify HTTP calls between services
- Replace with direct function imports
- Remove HTTP client code
- Update error handling for direct calls

## Technical Decisions Summary

| Decision Area | Decision | Rationale |
|--------------|----------|-----------|
| GraphQL Integration | Merge into existing schema | Maintains compatibility, follows existing structure |
| REST API Integration | Add as Express routes | Follows images-service pattern, maintains compatibility |
| MongoDB Models | Copy and adapt models | Ensure collection name compatibility |
| Environment Variables | Merge into TRYGO-Backend config | Centralized configuration |
| Service Structure | Follow images-service pattern | Consistency, proven approach |
| Frontend Changes | Environment variable only | Minimal disruption |
| Internal Communication | Direct function imports | Performance, reliability |

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| GraphQL schema conflicts | High | Compare and merge carefully, test all queries |
| MongoDB collection name mismatches | Medium | Verify collection names, use consistent naming |
| Environment variable conflicts | Low | Merge carefully, test configuration |
| Frontend breaking changes | High | Maintain 100% query/mutation compatibility |
| Service dependency issues | Medium | Test all service integrations thoroughly |

## Next Steps

1. Create data model documentation
2. Define API contracts (GraphQL schema, REST API)
3. Create integration quickstart guide
4. Proceed to implementation planning (tasks.md)

