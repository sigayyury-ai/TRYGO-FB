# Implementation Plan: Integrate Images Service into TRYGO-Backend

**Branch**: `009-integrate-images-api` | **Date**: 2025-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-integrate-images-api/spec.md`

## Summary

Integrate the standalone `images-service` into `TRYGO-Backend` as REST API endpoints, enabling both internal backend calls and external API access. This consolidation eliminates the separate service deployment, reduces infrastructure costs, and provides a unified API interface. The integration will maintain backward compatibility with existing HTTP-based internal calls while adding support for direct function calls and external client access.

**Primary Requirement**: Create REST API endpoints (`/api/images/generate`, `/api/images/:id`, `/media/*`) in TRYGO-Backend that replicate images-service functionality, accessible both internally and externally.

**Technical Approach**: 
- Copy and adapt images-service code into TRYGO-Backend structure
- Create Express routes for image generation and deletion
- Integrate image generation services (OpenAI DALL-E / Gemini)
- Configure static file serving for generated images
- Update environment configuration
- Maintain HTTP compatibility for existing internal calls

## Technical Context

**Language/Version**: TypeScript 5.3.2, Node.js 20+  
**Primary Dependencies**: Express 4.19.1, OpenAI SDK 5.23.2, @google/generative-ai (if Gemini support needed)  
**Storage**: Local file system (storage directory), MongoDB (for metadata if needed later)  
**Testing**: Manual testing via Postman/curl, integration tests with existing backend  
**Target Platform**: Node.js server (Render deployment)  
**Project Type**: Web application (backend service)  
**Performance Goals**: Image generation requests complete within 30 seconds for 90% of requests  
**Constraints**: 
- Must maintain backward compatibility with existing HTTP calls
- CORS must be configured for external access
- Storage directory must be accessible and writable
- API keys must be available in environment variables
**Scale/Scope**: Single backend service consolidation, ~500 lines of code to integrate

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**No constitution file found** - proceeding with standard implementation approach.

## Project Structure

### Documentation (this feature)

```text
specs/009-integrate-images-api/
├── plan.md              # This file (/speckit.plan command output)
├── spec.md              # Feature specification
└── checklists/
    └── requirements.md  # Quality checklist
```

### Source Code (repository root)

```text
TRYGO-Backend/
├── src/
│   ├── server.ts                    # Main Express server (UPDATE: add routes)
│   ├── routes/
│   │   ├── imageRoutes.ts           # Existing (may be unused)
│   │   └── images.ts                # NEW: Images API routes
│   ├── services/
│   │   └── images/                  # NEW: Image generation services
│   │       ├── generateImage.ts     # Image generation logic
│   │       ├── buildImagePrompt.ts  # Prompt building logic
│   │       └── imageProvider.ts     # Provider abstraction (OpenAI/Gemini)
│   ├── constants/
│   │   └── config/
│   │       └── env.ts               # UPDATE: Add image config
│   └── utils/
│       └── imageStorage.ts          # NEW: File storage utilities
│
images-service/                       # SOURCE: Code to be migrated
├── src/
│   ├── routes/
│   │   └── images.ts                # SOURCE: Route handlers
│   ├── services/
│   │   ├── generateImage.ts         # SOURCE: Generation logic
│   │   └── buildImagePrompt.ts       # SOURCE: Prompt building
│   └── config/
│       └── env.ts                    # SOURCE: Environment config
│
backend/                              # EXISTING: Uses images-service
└── src/
    └── services/
        └── contentGeneration.ts     # UPDATE: Update service URL
```

**Structure Decision**: Single backend project structure. Images functionality will be integrated into TRYGO-Backend's existing Express server, following the existing patterns for routes and services. The `images-service` directory will remain as reference but will not be deployed separately.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations identified. This is a straightforward service consolidation within an existing Express application.

## Phase 0: Research & Analysis

### 0.1 Current State Analysis

**Objective**: Understand existing images-service implementation and TRYGO-Backend integration points.

**Tasks**:
- [x] Review images-service code structure and dependencies
- [x] Identify all API endpoints and their functionality
- [x] Map environment variables and configuration requirements
- [x] Identify existing internal callers (backend/src/services/contentGeneration.ts)
- [x] Review TRYGO-Backend server structure and route patterns
- [x] Check for existing image-related code in TRYGO-Backend

**Findings**:
- **images-service** has 2 main endpoints: `POST /api/images/generate`, `DELETE /api/images/:id`
- Uses Express Router, OpenAI/Gemini for generation, local file storage
- Current implementation has placeholder logic (TODO comments)
- **backend** calls images-service via HTTP fetch to `env.imagesServiceUrl`
- TRYGO-Backend already has Express, CORS configured, route structure exists
- Existing `routes/imageRoutes.ts` exists but appears unused (commented in server.ts)

### 0.2 Integration Points

**Objective**: Identify where and how to integrate images-service into TRYGO-Backend.

**Integration Points**:
1. **Server Setup**: Add routes in `server.ts` after CORS configuration
2. **Route Handlers**: Create `routes/images.ts` following existing patterns
3. **Services**: Create `services/images/` directory with generation logic
4. **Configuration**: Extend `constants/config/env.ts` with image provider settings
5. **Storage**: Create storage directory structure and file serving
6. **Internal Calls**: Update `backend/src/services/contentGeneration.ts` to use new endpoint

### 0.3 Dependencies Check

**Objective**: Verify all required dependencies are available in TRYGO-Backend.

**Required Dependencies**:
- ✅ Express 4.19.1 (already present)
- ✅ OpenAI SDK 5.23.2 (already present)
- ⚠️ Google Generative AI SDK (may need to add if Gemini support required)
- ✅ dotenv (already present)
- ✅ path, fs (Node.js built-in)

**Action Required**: Check if Gemini SDK is needed or if OpenAI-only is acceptable initially.

## Phase 1: Design & Data Model

### 1.1 API Contract Design

**Objective**: Define REST API endpoints and request/response formats.

**Endpoints**:

1. **POST /api/images/generate**
   - **Request Body**:
     ```typescript
     {
       contentItemId: string;  // Required
       title: string;          // Required
       description?: string;   // Optional
     }
     ```
   - **Response** (200):
     ```typescript
     {
       imageUrl: string;  // Public URL to access generated image
     }
     ```
   - **Error Responses**:
     - 400: Missing required fields
     - 500: Generation failed

2. **DELETE /api/images/:id**
   - **Response** (200):
     ```typescript
     {
       success: boolean;
       id: string;
     }
     ```
   - **Error Responses**:
     - 404: Image not found
     - 500: Deletion failed

3. **GET /media/:path** (Static file serving)
   - Serves generated image files
   - Returns image with appropriate content-type
   - 404 if file doesn't exist

### 1.2 Service Architecture

**Objective**: Design service layer for image generation.

**Service Structure**:
```
services/images/
├── generateImage.ts       # Main generation function
├── buildImagePrompt.ts    # Prompt building (from images-service)
├── imageProvider.ts       # Provider abstraction
│   ├── openaiProvider.ts  # OpenAI DALL-E implementation
│   └── geminiProvider.ts  # Gemini implementation (if needed)
└── imageStorage.ts        # File storage utilities
```

**Flow**:
1. Request → Route Handler → Validation
2. Route Handler → generateImage() service
3. generateImage() → buildImagePrompt() → imageProvider.generate()
4. imageProvider → AI API (OpenAI/Gemini)
5. Save image file → Return public URL

### 1.3 Configuration Design

**Objective**: Define environment variables and configuration structure.

**Environment Variables** (add to TRYGO-Backend):
```typescript
IMAGE_PROVIDER = "openai" | "gemini"  // Default: "openai"
OPENAI_API_KEY                        // Already exists
OPENAI_IMAGE_MODEL = "dall-e-2"      // Default: "dall-e-2"
GEMINI_API_KEY                        // If Gemini support needed
GEMINI_IMAGE_MODEL = "gemini-2.5-flash-image"
GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
PUBLIC_URL                            // Base URL for image URLs
STORAGE_ROOT = "./storage"            // Storage directory path
```

**Configuration Object** (in `constants/config/env.ts`):
```typescript
IMAGE_CONFIG: {
  provider: "openai" | "gemini",
  openAiApiKey: string,
  openAiImageModel: string,
  geminiApiKey?: string,
  geminiImageModel?: string,
  geminiApiBaseUrl?: string,
  publicUrl: string,
  storageRoot: string
}
```

### 1.4 Storage Structure

**Objective**: Define file storage organization.

**Directory Structure**:
```
storage/
└── draft-images/
    └── {contentItemId}/
        ├── hero-{timestamp}.png
        └── inline-{timestamp}.png
```

**File Naming**: `{variant}-{timestamp}.{ext}` (e.g., `hero-1763049170351.png`)

**Public URL Format**: `{PUBLIC_URL}/media/draft-images/{contentItemId}/{filename}`

## Phase 2: Implementation Tasks

### 2.1 Setup & Configuration

**Tasks**:
- [ ] Create `services/images/` directory structure
- [ ] Add image configuration to `constants/config/env.ts`
- [ ] Add environment variables to `.env.example` (if exists)
- [ ] Create storage directory structure (`storage/draft-images/`)
- [ ] Add storage directory to `.gitignore` (keep structure, ignore files)

**Files to Create/Modify**:
- `TRYGO-Backend/src/constants/config/env.ts` (UPDATE)
- `TRYGO-Backend/src/services/images/` (NEW directory)
- `TRYGO-Backend/storage/` (NEW directory, gitignored)

### 2.2 Core Services Implementation

**Tasks**:
- [ ] Copy and adapt `buildImagePrompt.ts` from images-service
- [ ] Create `imageProvider.ts` with provider abstraction
- [ ] Implement `openaiProvider.ts` for OpenAI DALL-E
- [ ] Implement `geminiProvider.ts` for Gemini (optional, if needed)
- [ ] Create `imageStorage.ts` for file operations
- [ ] Implement `generateImage.ts` main service function

**Files to Create**:
- `TRYGO-Backend/src/services/images/buildImagePrompt.ts`
- `TRYGO-Backend/src/services/images/imageProvider.ts`
- `TRYGO-Backend/src/services/images/openaiProvider.ts`
- `TRYGO-Backend/src/services/images/geminiProvider.ts` (optional)
- `TRYGO-Backend/src/services/images/imageStorage.ts`
- `TRYGO-Backend/src/services/images/generateImage.ts`

**Key Implementation Notes**:
- Adapt environment variable access to TRYGO-Backend's config pattern
- Implement actual OpenAI DALL-E API calls (replace placeholder)
- Handle file saving with proper error handling
- Generate unique filenames with timestamps
- Return public URLs based on PUBLIC_URL configuration

### 2.3 API Routes Implementation

**Tasks**:
- [ ] Create `routes/images.ts` with Express Router
- [ ] Implement `POST /api/images/generate` endpoint
- [ ] Implement `DELETE /api/images/:id` endpoint
- [ ] Add request validation
- [ ] Add error handling middleware
- [ ] Add logging for requests/responses

**Files to Create**:
- `TRYGO-Backend/src/routes/images.ts`

**Key Implementation Notes**:
- Follow existing route patterns in TRYGO-Backend
- Validate required fields (contentItemId, title)
- Use async/await with proper error handling
- Return consistent error response format
- Log requests for debugging

### 2.4 Server Integration

**Tasks**:
- [ ] Add images routes to `server.ts`
- [ ] Configure static file serving for `/media` path
- [ ] Ensure CORS allows image API access
- [ ] Add health check endpoint if needed
- [ ] Test server startup with new routes

**Files to Modify**:
- `TRYGO-Backend/src/server.ts`

**Integration Points**:
```typescript
// After CORS setup
import imagesRouter from './routes/images';
app.use('/api/images', imagesRouter);

// Static file serving (before GraphQL middleware)
app.use('/media', express.static('./storage'));
```

### 2.5 Internal Service Updates

**Tasks**:
- [ ] Update `backend/src/services/contentGeneration.ts` to use new endpoint
- [ ] Update `backend/src/config/env.ts` to point to TRYGO-Backend URL
- [ ] Test internal calls work correctly
- [ ] Consider adding direct function import option (optional optimization)

**Files to Modify**:
- `backend/src/services/contentGeneration.ts`
- `backend/src/config/env.ts`

**Update Pattern**:
```typescript
// Change from:
const response = await fetch(`${env.imagesServiceUrl}/api/images/generate`, ...)

// To:
const response = await fetch(`${env.trygoBackendUrl}/api/images/generate`, ...)
// Or use internal function call if same process
```

### 2.6 Testing & Validation

**Tasks**:
- [ ] Test image generation via POST /api/images/generate
- [ ] Test image deletion via DELETE /api/images/:id
- [ ] Test static file serving via GET /media/*
- [ ] Test error handling (missing fields, invalid IDs)
- [ ] Test CORS configuration with external requests
- [ ] Test internal backend calls still work
- [ ] Verify storage directory structure
- [ ] Test with both OpenAI and Gemini (if implemented)

**Test Scenarios**:
1. Generate image with valid request → verify image created and URL returned
2. Generate image with missing fields → verify 400 error
3. Access generated image URL → verify file served correctly
4. Delete image → verify file removed
5. Delete non-existent image → verify 404 error
6. External API call with CORS → verify request succeeds

## Phase 3: Deployment & Migration

### 3.1 Environment Configuration

**Tasks**:
- [ ] Add image-related environment variables to Render dashboard
- [ ] Set IMAGE_PROVIDER (default: "openai")
- [ ] Configure PUBLIC_URL (Render service URL)
- [ ] Set STORAGE_ROOT (default: "./storage")
- [ ] Verify OPENAI_API_KEY is set (or GEMINI_API_KEY if using Gemini)

### 3.2 Deployment

**Tasks**:
- [ ] Ensure storage directory is created on deployment
- [ ] Verify file permissions allow write access
- [ ] Test deployment on Render staging (if available)
- [ ] Monitor logs for errors

### 3.3 Migration Strategy

**Tasks**:
- [ ] Deploy updated TRYGO-Backend with images API
- [ ] Update backend service environment variables
- [ ] Verify both services can communicate
- [ ] Monitor for any issues
- [ ] Remove images-service from render.yaml (after verification)

**Migration Steps**:
1. Deploy TRYGO-Backend with new images API
2. Update backend service to use new endpoint URL
3. Test end-to-end image generation
4. Monitor for 24-48 hours
5. Remove images-service from deployment configuration

### 3.4 Rollback Plan

**If issues occur**:
1. Revert backend service to use old images-service URL
2. Keep images-service running until issues resolved
3. Fix issues in TRYGO-Backend
4. Retry migration

## Phase 4: Documentation & Cleanup

### 4.1 Documentation

**Tasks**:
- [ ] Update API documentation with new endpoints
- [ ] Document environment variables
- [ ] Add code comments for complex logic
- [ ] Update deployment documentation

### 4.2 Code Cleanup

**Tasks**:
- [ ] Remove unused imageRoutes.ts if not needed
- [ ] Clean up any temporary code
- [ ] Ensure consistent error handling
- [ ] Verify logging is appropriate

### 4.3 Future Enhancements

**Optional improvements** (out of scope for this phase):
- Direct function calls instead of HTTP for internal use
- Image metadata storage in MongoDB
- Image optimization/compression
- Cloud storage integration (S3)
- Rate limiting for image generation

## Risk Assessment

### Technical Risks

1. **File Storage Permissions**: Storage directory may not be writable on deployment
   - **Mitigation**: Ensure proper directory creation and permissions in deployment
   
2. **API Provider Failures**: OpenAI/Gemini API may be unavailable
   - **Mitigation**: Implement proper error handling and retry logic
   
3. **Backward Compatibility**: Existing internal calls may break
   - **Mitigation**: Maintain HTTP endpoint compatibility, test thoroughly

4. **CORS Configuration**: External requests may be blocked
   - **Mitigation**: Verify CORS settings allow frontend domain

### Operational Risks

1. **Storage Space**: Generated images may fill disk space
   - **Mitigation**: Implement cleanup job or storage limits (future enhancement)

2. **Performance**: Image generation may slow down main backend
   - **Mitigation**: Monitor performance, consider async processing if needed

## Success Metrics

- ✅ Image generation API accessible at `/api/images/generate`
- ✅ External clients can access API with CORS
- ✅ Internal backend calls work without modification
- ✅ Generated images accessible via `/media/*` URLs
- ✅ All existing functionality preserved
- ✅ Infrastructure cost reduced (one less service)

## Next Steps

1. Begin Phase 2.1: Setup & Configuration
2. Implement core services (Phase 2.2)
3. Create API routes (Phase 2.3)
4. Integrate into server (Phase 2.4)
5. Test and deploy (Phase 3)

