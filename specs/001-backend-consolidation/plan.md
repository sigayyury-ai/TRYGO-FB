# Implementation Plan: Backend Services Consolidation

**Branch**: `001-backend-consolidation` | **Date**: 2025-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-backend-consolidation/spec.md`

## Summary

Consolidate the separate `backend` (SEO Agent) and `semantics-service` into `TRYGO-Backend` as a unified API Gateway. This consolidation eliminates separate service deployments, reduces infrastructure costs, and provides a single entry point for all backend functionality. The integration will maintain backward compatibility with existing frontend GraphQL queries and mutations while adding REST API endpoints for cluster management.

**Primary Requirement**: Integrate all GraphQL operations from `backend` service and REST API endpoints from `semantics-service` into TRYGO-Backend, ensuring frontend compatibility and internal service communication.

**Technical Approach**: 
- Copy and adapt GraphQL type definitions and resolvers from backend service
- Integrate MongoDB models from both services
- Create REST API routes for cluster management (semantics-service functionality)
- Integrate all business logic services (content generation, idea generation, cluster management)
- Update environment configuration to support all integrated services
- Maintain HTTP compatibility for existing internal calls
- Follow the same pattern used for images-service integration

## Technical Context

**Language/Version**: TypeScript 5.3.2, Node.js 20+  
**Primary Dependencies**: 
- Express 4.19.1 (routing)
- @apollo/server 4.10.1 (GraphQL)
- Apollo Server 4.10.0 (from backend)
- Mongoose 8.2.2 (TRYGO-Backend) / 7.6.0 (backend, semantics-service)
- OpenAI SDK 5.23.2 (content generation)
- GraphQL 16.9.0 (from backend)

**Storage**: 
- MongoDB (shared database for all services)
- Local file system for generated images (already integrated)

**Testing**: Manual testing via GraphQL playground, curl/Postman for REST endpoints, integration tests with existing frontend  
**Target Platform**: Node.js server (Render deployment)  
**Project Type**: Web application (backend service consolidation)  
**Performance Goals**: 
- GraphQL queries respond in under 500ms for 95% of requests
- Content idea generation completes in under 30 seconds for 95% of requests
- Article generation completes in under 60 seconds for 90% of requests
- REST API endpoints respond in under 500ms for 95% of requests

**Constraints**: 
- Must maintain 100% backward compatibility with existing frontend GraphQL queries/mutations
- CORS must be configured for frontend access
- MongoDB connection must support all integrated models
- Environment variables from both services must be available
- Internal service calls should use direct function imports (not HTTP) after integration

**Scale/Scope**: 
- ~50 GraphQL queries/mutations to integrate
- ~5 REST API endpoints to integrate
- ~10 MongoDB models to integrate
- ~2000+ lines of service code to migrate
- Single backend service consolidation

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**No constitution file found** - proceeding with standard implementation approach following existing TRYGO-Backend patterns.

## Project Structure

### Documentation (this feature)

```text
specs/001-backend-consolidation/
├── plan.md              # This file (/speckit.plan command output)
├── spec.md              # Feature specification
├── research.md          # Phase 0 output (research findings)
├── data-model.md        # Phase 1 output (data models)
├── quickstart.md        # Phase 1 output (integration guide)
├── contracts/           # Phase 1 output (API contracts)
│   ├── graphql-schema.graphql
│   └── rest-api.yaml
└── checklists/
    └── requirements.md  # Quality checklist
```

### Source Code (repository root)

```text
TRYGO-Backend/
├── src/
│   ├── server.ts                    # Main Express server (UPDATE: add routes, GraphQL types)
│   ├── routes/
│   │   ├── images.ts                # Existing: Images API
│   │   └── clusters.ts              # NEW: Clusters REST API (from semantics-service)
│   ├── services/
│   │   ├── images/                  # Existing: Image generation
│   │   ├── seoAgent/                # NEW: SEO Agent services (from backend)
│   │   │   ├── contentGeneration.ts
│   │   │   ├── contentIdeas/
│   │   │   ├── clusters/
│   │   │   └── wordpress/
│   │   └── semantics/               # NEW: Semantics services (from semantics-service)
│   ├── schema/                       # NEW: GraphQL schema from backend
│   │   ├── typeDefs.ts              # GraphQL type definitions
│   │   └── resolvers.ts             # GraphQL resolvers
│   ├── db/
│   │   └── models/                   # NEW: MongoDB models from both services
│   │       ├── SeoCluster.ts
│   │       ├── SeoBacklogIdea.ts
│   │       ├── SeoContentItem.ts
│   │       ├── SeoSprintSettings.ts
│   │       └── SeoLanguagePreference.ts
│   ├── typeDefs/
│   │   └── seoAgentTypeDefs.graphql  # UPDATE: Add SEO Agent types
│   ├── resolvers/
│   │   └── seoAgent/                 # UPDATE: Add SEO Agent resolvers
│   ├── constants/
│   │   └── config/
│   │       └── env.ts                # UPDATE: Add SEO Agent and semantics config
│   └── utils/
│       └── normalise.ts              # NEW: Cluster normalization (from semantics-service)
│
backend/                              # SOURCE: Code to be migrated
├── src/
│   ├── schema/
│   │   ├── typeDefs.ts              # SOURCE: GraphQL types
│   │   └── resolvers.ts             # SOURCE: GraphQL resolvers
│   ├── services/                     # SOURCE: Business logic
│   │   ├── contentGeneration.ts
│   │   ├── contentIdeas/
│   │   └── wordpress/
│   └── db/
│       └── models/                   # SOURCE: MongoDB models
│
semantics-service/                    # SOURCE: Code to be migrated
├── src/
│   ├── routes/
│   │   └── clusters.ts              # SOURCE: REST API routes
│   ├── db/
│   │   └── models/
│   │       └── SeoCluster.ts         # SOURCE: Cluster model
│   └── utils/
│       └── normalise.ts              # SOURCE: Normalization utilities
```

**Structure Decision**: Single backend project structure. All SEO Agent and semantics functionality will be integrated into TRYGO-Backend's existing Express server and GraphQL schema, following the existing patterns for routes, services, and resolvers. The `backend` and `semantics-service` directories will remain as reference but will not be deployed separately.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations identified. This is a service consolidation following the same pattern as images-service integration, within an existing Express/GraphQL application.

## Phase 0: Research & Analysis

**Status**: ✅ Complete

See [research.md](./research.md) for detailed findings and technical decisions.

**Key Decisions**:
- Integrate GraphQL schema and resolvers directly (no rewriting)
- Integrate REST API as Express routes (maintain compatibility)
- Use existing MongoDB models with collection name compatibility
- Follow images-service integration pattern
- Frontend requires only environment variable update

## Phase 1: Design & Contracts

**Status**: ✅ Complete

### Data Model

See [data-model.md](./data-model.md) for complete MongoDB model documentation.

**Integrated Models**:
- SeoCluster (collection: `seoAgentClusters`)
- SeoBacklogIdea
- SeoContentItem
- SeoSprintSettings
- SeoLanguagePreference (if exists)

### API Contracts

**GraphQL Schema**: [contracts/graphql-schema.graphql](./contracts/graphql-schema.graphql)
- All queries and mutations from backend service
- Complete type definitions
- Input types for all mutations

**REST API**: [contracts/rest-api.yaml](./contracts/rest-api.yaml)
- OpenAPI 3.0 specification
- 4 endpoints: GET, POST, PUT, DELETE /api/clusters
- Request/response schemas

### Quickstart Guide

See [quickstart.md](./quickstart.md) for step-by-step integration instructions.

**Integration Steps**:
1. Copy MongoDB models
2. Copy service files
3. Copy semantics utilities
4. Integrate GraphQL schema
5. Integrate GraphQL resolvers
6. Create REST API routes
7. Integrate routes in server.ts
8. Update environment configuration
9. Update render.yaml
10. Update startup scripts
11. Update frontend configuration
12. Test integration

## Phase 2: Implementation Planning

**Status**: ⏳ Pending

Implementation tasks will be generated by `/speckit.tasks` command based on this plan and the feature specification.
