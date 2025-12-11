# Quickstart Guide: Backend Services Consolidation

**Feature**: Backend Services Consolidation  
**Date**: 2025-01-27  
**Phase**: 1 - Design

## Overview

This guide provides step-by-step instructions for integrating the `backend` (SEO Agent) and `semantics-service` into `TRYGO-Backend`. This consolidation follows the same pattern used for `images-service` integration.

## Prerequisites

- TRYGO-Backend is running and accessible
- MongoDB connection is configured
- All environment variables from both services are available
- Frontend is configured to use TRYGO-Backend GraphQL endpoint

## Integration Steps

### Step 1: Copy MongoDB Models

**Source**: `backend/src/db/models/` and `semantics-service/src/db/models/`  
**Target**: `TRYGO-Backend/src/db/models/`

```bash
# Create models directory if it doesn't exist
mkdir -p TRYGO-Backend/src/db/models

# Copy models from backend
cp backend/src/db/models/SeoCluster.ts TRYGO-Backend/src/db/models/
cp backend/src/db/models/SeoBacklogIdea.ts TRYGO-Backend/src/db/models/
cp backend/src/db/models/SeoContentItem.ts TRYGO-Backend/src/db/models/
cp backend/src/db/models/SeoSprintSettings.ts TRYGO-Backend/src/db/models/
cp backend/src/db/models/SeoLanguagePreference.ts TRYGO-Backend/src/db/models/  # If exists

# Note: SeoCluster from semantics-service uses collection "seoAgentClusters"
# Ensure the model uses the correct collection name
```

**Important**: 
- Update import paths in models to match TRYGO-Backend structure
- Ensure `SeoCluster` model uses collection name `"seoAgentClusters"` to match existing data
- Verify Mongoose version compatibility (TRYGO-Backend uses 8.2.2, services use 7.6.0)

### Step 2: Copy Service Files

**Source**: `backend/src/services/`  
**Target**: `TRYGO-Backend/src/services/seoAgent/`

```bash
# Create seoAgent services directory
mkdir -p TRYGO-Backend/src/services/seoAgent

# Copy service files
cp -r backend/src/services/contentGeneration.ts TRYGO-Backend/src/services/seoAgent/
cp -r backend/src/services/contentIdeas/ TRYGO-Backend/src/services/seoAgent/
cp -r backend/src/services/wordpress/ TRYGO-Backend/src/services/seoAgent/
cp -r backend/src/services/context/ TRYGO-Backend/src/services/seoAgent/
```

**Update imports**:
- Change `../db/models/` to `../../db/models/`
- Change `../config/env` to `../../constants/config/env`
- Update all relative imports to match new structure

### Step 3: Copy Semantics Utilities

**Source**: `semantics-service/src/utils/`  
**Target**: `TRYGO-Backend/src/utils/`

```bash
# Copy normalization utilities
cp semantics-service/src/utils/normalise.ts TRYGO-Backend/src/utils/
```

### Step 4: Integrate GraphQL Schema

**Source**: `backend/src/schema/typeDefs.ts`  
**Target**: `TRYGO-Backend/src/typeDefs/seoAgentTypeDefs.graphql`

1. Read existing `TRYGO-Backend/src/typeDefs/seoAgentTypeDefs.graphql`
2. Extract type definitions from `backend/src/schema/typeDefs.ts`
3. Merge compatible types, update conflicting types
4. Ensure all queries and mutations from backend are included
5. Verify `scalar DateTime` is defined in base schema

**Key Operations to Include**:
- All queries: `seoAgentClusters`, `seoAgentBacklog`, `seoAgentContentIdeas`, `seoAgentPostingSettings`, `seoContentQueue`, `contentItemByBacklogIdea`
- All mutations: cluster operations, backlog operations, content generation, WordPress operations

### Step 5: Integrate GraphQL Resolvers

**Source**: `backend/src/schema/resolvers.ts`  
**Target**: `TRYGO-Backend/src/resolvers/seoAgent/`

1. Compare existing resolvers in `TRYGO-Backend/src/resolvers/seoAgent/`
2. Merge resolver logic from `backend/src/schema/resolvers.ts`
3. Update service imports to use integrated services
4. Preserve existing functionality

**Update imports**:
- Change service imports to use `../../services/seoAgent/`
- Change model imports to use `../../db/models/`

### Step 6: Create REST API Routes for Clusters

**Source**: `semantics-service/src/routes/clusters.ts`  
**Target**: `TRYGO-Backend/src/routes/clusters.ts`

```typescript
// Create TRYGO-Backend/src/routes/clusters.ts
// Copy route handlers from semantics-service/src/routes/clusters.ts
// Update imports:
// - Change model imports to use ../db/models/
// - Change utils imports to use ../utils/
```

**Routes to implement**:
- `GET /api/clusters?projectId=X&hypothesisId=Y`
- `POST /api/clusters`
- `PUT /api/clusters/:id`
- `DELETE /api/clusters/:id`

### Step 7: Integrate Routes in server.ts

**File**: `TRYGO-Backend/src/server.ts`

```typescript
// After CORS setup, before GraphQL middleware
import clustersRouter from './routes/clusters';
app.use('/api/clusters', clustersRouter);
```

### Step 8: Update Environment Configuration

**File**: `TRYGO-Backend/src/constants/config/env.ts`

Add environment variables from both services:
- WordPress: `WORDPRESS_BASE_URL`, `WORDPRESS_USERNAME`, `WORDPRESS_APP_PASSWORD`
- Content generation: Already present (OpenAI, Gemini)
- Semantics: CORS origin (can use existing CORS config)

### Step 9: Update render.yaml

**File**: `render.yaml`

1. Remove `backend` service block
2. Remove `semantics-service` service block
3. Add environment variables to `trygo-main-backend` service
4. Update comments to reflect consolidation

### Step 10: Update Startup Scripts

**Files**: `start-all.sh`, `stop-all.sh`

1. Remove backend service startup/shutdown
2. Remove semantics-service startup/shutdown
3. Update port cleanup (remove ports 4100, 4200)
4. Update service list in output messages

### Step 11: Update Frontend Configuration

**File**: `TRYGO-Front/.env` or `.env.local`

```bash
# Change from:
VITE_SEO_AGENT_URL=http://localhost:4100/graphql

# To:
VITE_SEO_AGENT_URL=http://localhost:5001/graphql
```

**No code changes needed** - all GraphQL queries and mutations remain identical.

### Step 12: Test Integration

1. **Start TRYGO-Backend**: `cd TRYGO-Backend && npm run dev`
2. **Test GraphQL**: Use GraphQL playground at `http://localhost:5001/graphql`
   - Test queries: `seoAgentClusters`, `seoAgentBacklog`
   - Test mutations: `generateContentIdeas`, `generateContentForBacklogIdea`
3. **Test REST API**: Use curl or Postman
   ```bash
   curl "http://localhost:5001/api/clusters?projectId=X&hypothesisId=Y"
   ```
4. **Test Frontend**: Verify all SEO Agent features work correctly

## Verification Checklist

- [ ] All MongoDB models are accessible
- [ ] GraphQL queries return correct data
- [ ] GraphQL mutations execute successfully
- [ ] REST API endpoints work correctly
- [ ] Frontend can query SEO Agent data
- [ ] Frontend can generate content and ideas
- [ ] Internal service calls use direct imports (not HTTP)
- [ ] Environment variables are configured
- [ ] No errors in server logs
- [ ] All existing functionality works

## Troubleshooting

### Issue: GraphQL schema conflicts
**Solution**: Compare existing schema with backend schema, merge carefully, test all queries

### Issue: MongoDB collection name mismatch
**Solution**: Ensure `SeoCluster` uses `"seoAgentClusters"` collection name

### Issue: Import path errors
**Solution**: Update all relative imports to match new directory structure

### Issue: Frontend can't connect
**Solution**: Verify `VITE_SEO_AGENT_URL` points to `http://localhost:5001/graphql`

### Issue: Environment variables missing
**Solution**: Add all required variables to `TRYGO-Backend/.env` and `render.yaml`

## Next Steps

After successful integration:
1. Remove separate `backend` and `semantics-service` deployments
2. Update documentation
3. Monitor for any issues
4. Consider optimizing internal service calls
