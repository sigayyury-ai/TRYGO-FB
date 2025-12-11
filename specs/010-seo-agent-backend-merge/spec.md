# SEO Agent Backend Integration Specification

## Overview

**Feature**: Merge SEO Agent Backend (`backend/`) into TRYGO Backend (`TRYGO-Backend/`)
**Status**: Draft
**Created**: 2025-01-27
**Priority**: P1

## Problem Statement

Currently, we have two separate backends:
- `TRYGO-Backend/` - Main TRYGO GraphQL API server (port 5001)
- `backend/` - SEO Agent GraphQL API server (port 4100)

The frontend expects SEO Agent endpoints (`seoAgentClusters`, `seoAgentBacklog`, `seoAgentPostingSettings`) to be available in the main TRYGO backend. The separate SEO Agent backend has partial implementation but uses different naming conventions and structure.

## Goals

1. **Unified Backend**: Single GraphQL API server for all TRYGO functionality including SEO Agent
2. **Consistent API**: SEO Agent endpoints follow TRYGO naming conventions (`seoAgent*`)
3. **Shared Infrastructure**: Reuse existing TRYGO authentication, database connections, and services
4. **Data Migration**: Preserve existing SEO Agent data models and extend them if needed

## Current State Analysis

### TRYGO-Backend Structure
- GraphQL schema files in `src/typeDefs/*.graphql`
- Resolvers in `src/resolvers/` organized by feature
- Models in `src/models/` using Mongoose
- Services in `src/services/`
- Apollo Server with Express middleware
- MongoDB connection via `src/configuration/db.ts`
- Authentication via JWT tokens in context

### SEO Agent Backend Structure (`backend/`)
- GraphQL schema in `src/schema/typeDefs.ts` (single file)
- Resolvers in `src/schema/resolvers.ts`
- Models in `src/db/models/`:
  - `SeoCluster.ts`
  - `SeoBacklogIdea.ts`
  - `SeoContentItem.ts`
  - `SeoSprintSettings.ts`
- Separate MongoDB connection
- Different naming: `seoClusters` vs `seoAgentClusters`

## Requirements

### Functional Requirements

**FR-001: GraphQL Schema Integration**
- Integrate SEO Agent types into TRYGO schema
- Maintain naming convention: `seoAgent*` for all SEO Agent queries/mutations
- Support optional `hypothesisId` parameter (nullable)

**FR-002: Data Models**
- Migrate Mongoose models from `backend/src/db/models/` to `TRYGO-Backend/src/models/`
- Ensure compatibility with existing TRYGO model patterns
- Support both project-level and hypothesis-level scoping

**FR-003: Resolvers**
- Implement query resolvers:
  - `seoAgentClusters(projectId: ID!, hypothesisId: ID): [SeoAgentCluster!]!`
  - `seoAgentBacklog(projectId: ID!, hypothesisId: ID): [SeoAgentBacklogIdea!]!`
  - `seoAgentPostingSettings(projectId: ID!): SeoAgentPostingSettings`
- Implement mutation resolvers:
  - `createSeoAgentCluster(...)`
  - `updateSeoAgentCluster(...)`
  - `deleteSeoAgentCluster(...)`
  - `updateSeoAgentPostingSettings(...)`

**FR-004: Authentication & Authorization**
- Reuse existing TRYGO JWT authentication
- Ensure user can only access their own projects' data
- Support project/hypothesis ownership validation

**FR-005: Database Integration**
- Use existing MongoDB connection from TRYGO-Backend
- Ensure collections are created properly
- Support data migration if needed

### Technical Requirements

**TR-001: Schema Files**
- Create `src/typeDefs/seoAgentTypeDefs.graphql`
- Follow TRYGO pattern: separate file per feature
- Use `extend type Query` and `extend type Mutation`

**TR-002: Resolver Organization**
- Create `src/resolvers/seoAgent/` directory
- Separate query and mutation resolvers
- Follow TRYGO resolver patterns (error handling, context usage)

**TR-003: Model Organization**
- Create models in `src/models/`:
  - `SeoAgentClusterModel.ts`
  - `SeoAgentBacklogIdeaModel.ts`
  - `SeoAgentPostingSettingsModel.ts`
- Follow existing TRYGO model patterns (Mongoose schemas, TypeScript interfaces)

**TR-004: Service Layer** (Optional)
- Consider creating service layer if business logic is complex
- Follow existing service patterns

**TR-005: Type Compatibility**
- Ensure TypeScript types match frontend expectations
- Use shared types if possible

## Implementation Plan

### Phase 1: Schema & Types (Foundation)
1. Create `seoAgentTypeDefs.graphql` with all types, enums, queries, mutations
2. Verify schema compiles without errors
3. Test schema introspection

### Phase 2: Models
1. Migrate `SeoCluster` model → `SeoAgentClusterModel`
2. Migrate `SeoBacklogIdea` model → `SeoAgentBacklogIdeaModel`
3. Create `SeoAgentPostingSettingsModel` (if not exists in SEO backend)
4. Update field names to match GraphQL schema
5. Add indexes for performance

### Phase 3: Resolvers - Queries
1. Implement `seoAgentClusters` resolver
2. Implement `seoAgentBacklog` resolver
3. Implement `seoAgentPostingSettings` resolver
4. Add authentication/authorization checks
5. Add error handling

### Phase 4: Resolvers - Mutations
1. Implement `createSeoAgentCluster`
2. Implement `updateSeoAgentCluster`
3. Implement `deleteSeoAgentCluster`
4. Implement `updateSeoAgentPostingSettings`
5. Add validation and error handling

### Phase 5: Integration & Testing
1. Register resolvers in `_indexResolvers.ts`
2. Test all endpoints via GraphQL Playground
3. Verify frontend integration
4. Test with real data

### Phase 6: Cleanup
1. Remove stub resolvers created earlier
2. Remove `backend/` directory if no longer needed
3. Update documentation

## Data Model Mapping

### SEO Backend → TRYGO Backend

**SeoCluster → SeoAgentCluster**
- `projectId`: string (same)
- `hypothesisId`: string? (optional, same)
- `title`: string (same)
- `intent`: enum (same values: INFORMATIONAL, NAVIGATIONAL, TRANSACTIONAL, COMMERCIAL)
- `keywords`: string[] (same)
- `createdBy` → Add if missing
- `updatedBy` → Add if missing
- `createdAt`: Date (same)
- `updatedAt`: Date (same)

**SeoBacklogIdea → SeoAgentBacklogIdea**
- `projectId`: string (same)
- `hypothesisId`: string? (optional, same)
- `title`: string (same)
- `description`: string? (same)
- `contentType`: enum → Map to `BacklogContentType`
- `clusterId`: string? (optional, same)
- `status`: enum → Map to `BacklogStatus`
- `createdBy` → Add if missing
- `updatedBy` → Add if missing
- `createdAt`: Date (same)
- `updatedAt`: Date (same)

**PostingSettings** (May need to create)
- `projectId`: string
- `hypothesisId`: string? (optional)
- `weeklyPublishCount`: number
- `preferredDays`: string[]
- `autoPublishEnabled`: boolean
- `updatedAt`: Date

## Success Criteria

1. ✅ All SEO Agent GraphQL queries return data without 400 errors
2. ✅ All SEO Agent mutations work correctly
3. ✅ Data persists correctly in MongoDB
4. ✅ Authentication/authorization works
5. ✅ Frontend can create/edit/delete clusters
6. ✅ Frontend can view and manage backlog
7. ✅ Frontend can update posting settings
8. ✅ No conflicts with existing TRYGO functionality
9. ✅ Code follows TRYGO patterns and conventions

## Migration Notes

- **Database**: Collections should work as-is if using same MongoDB instance
- **Field Mapping**: Pay attention to enum values (uppercase/lowercase)
- **Timestamps**: Ensure ISO string format for frontend compatibility
- **IDs**: Use MongoDB ObjectId as string

## Risks & Considerations

1. **Data Loss**: Backup existing data before migration
2. **Breaking Changes**: Frontend already expects specific field names - maintain compatibility
3. **Performance**: Ensure indexes are properly set on frequently queried fields
4. **Testing**: Test thoroughly with real data before removing old backend

## Open Questions

1. Should we keep `backend/` as reference or remove it?
2. Do we need to migrate existing data from separate backend?
3. Should we add additional SEO Agent features during merge?

