# Tasks: Integrate Images Service into TRYGO-Backend

**Input**: Design documents from `/specs/009-integrate-images-api/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Tests**: Manual testing via Postman/curl - no automated test tasks included per spec requirements.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `TRYGO-Backend/src/`, `backend/src/`
- Paths shown below follow the project structure from plan.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create services/images/ directory structure in TRYGO-Backend/src/services/images/
- [X] T002 [P] Create storage directory structure at TRYGO-Backend/storage/draft-images/
- [X] T003 [P] Add storage directory patterns to .gitignore (keep structure, ignore files)
- [X] T004 [P] Review existing TRYGO-Backend route patterns in TRYGO-Backend/src/routes/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Add image configuration to TRYGO-Backend/src/constants/config/env.ts with IMAGE_CONFIG object
- [X] T006 [P] Copy buildImagePrompt.ts from images-service/src/services/buildImagePrompt.ts to TRYGO-Backend/src/services/images/buildImagePrompt.ts
- [X] T007 [P] Create imageProvider.ts abstraction interface in TRYGO-Backend/src/services/images/imageProvider.ts
- [X] T008 [P] Create imageStorage.ts utility for file operations in TRYGO-Backend/src/services/images/imageStorage.ts
- [X] T009 Create openaiProvider.ts implementation in TRYGO-Backend/src/services/images/openaiProvider.ts
- [X] T010 Verify OpenAI SDK 5.23.2 is available in TRYGO-Backend/package.json

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Internal Backend Image Generation (Priority: P1) 🎯 MVP

**Goal**: Backend services can generate images for content items through a unified API endpoint within the same backend, eliminating the need for a separate service.

**Independent Test**: Make an internal API call from backend code to POST /api/images/generate with contentItemId and title, verify image is created and URL is returned.

### Implementation for User Story 1

- [X] T011 [US1] Implement generateImage.ts main service function in TRYGO-Backend/src/services/images/generateImage.ts
- [X] T012 [US1] Create images.ts route handler with Express Router in TRYGO-Backend/src/routes/images.ts
- [X] T013 [US1] Implement POST /api/images/generate endpoint in TRYGO-Backend/src/routes/images.ts with validation for contentItemId and title
- [X] T014 [US1] Add error handling middleware for image generation errors in TRYGO-Backend/src/routes/images.ts
- [X] T015 [US1] Add logging for image generation requests in TRYGO-Backend/src/routes/images.ts
- [X] T016 [US1] Integrate images routes into server.ts in TRYGO-Backend/src/server.ts after CORS setup
- [X] T017 [US1] Update backend/src/config/env.ts to add TRYGO_BACKEND_URL environment variable
- [X] T018 [US1] Update backend/src/services/contentGeneration.ts to use new endpoint URL (change from imagesServiceUrl to trygoBackendUrl/api/images/generate)

**Checkpoint**: At this point, User Story 1 should be fully functional - internal backend calls can generate images via the unified API

---

## Phase 4: User Story 2 - External API Access for Image Generation (Priority: P2)

**Goal**: External clients (frontend, third-party) can generate images through the same API with proper CORS configuration and authentication.

**Independent Test**: Make an API request from external client (Postman/curl) to POST /api/images/generate, verify CORS allows the request and it succeeds.

### Implementation for User Story 2

- [X] T019 [US2] Verify CORS configuration in TRYGO-Backend/src/server.ts allows image API access
- [X] T020 [US2] Add authentication middleware check to POST /api/images/generate endpoint in TRYGO-Backend/src/routes/images.ts (if required)
- [X] T021 [US2] Ensure error responses return consistent format for external clients in TRYGO-Backend/src/routes/images.ts
- [ ] T022 [US2] Test external API access with CORS from frontend domain

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - both internal and external clients can generate images

---

## Phase 5: User Story 3 - Image File Serving and Access (Priority: P2)

**Goal**: Generated images are accessible via public URLs so they can be embedded in content and displayed in frontend applications.

**Independent Test**: Generate an image, then access the returned URL directly in browser or via HTTP request, verify image file is served correctly with proper content-type.

### Implementation for User Story 3

- [X] T023 [US3] Configure static file serving for /media path in TRYGO-Backend/src/server.ts using express.static('./storage')
- [X] T024 [US3] Ensure imageStorage.ts generates correct public URLs using PUBLIC_URL configuration in TRYGO-Backend/src/services/images/imageStorage.ts
- [X] T025 [US3] Verify image files are saved with correct MIME type extensions in TRYGO-Backend/src/services/images/imageStorage.ts
- [ ] T026 [US3] Test image file serving via GET /media/draft-images/{contentItemId}/{filename}

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should work - images can be generated and accessed via public URLs

---

## Phase 6: User Story 4 - Image Deletion (Priority: P3)

**Goal**: Users and services can delete generated images when no longer needed, helping manage storage and maintain data hygiene.

**Independent Test**: Generate an image, then make DELETE request to /api/images/:id, verify file is removed from storage and subsequent access attempts return 404.

### Implementation for User Story 4

- [X] T027 [US4] Implement DELETE /api/images/:id endpoint in TRYGO-Backend/src/routes/images.ts
- [X] T028 [US4] Add image file deletion logic to imageStorage.ts in TRYGO-Backend/src/services/images/imageStorage.ts
- [X] T029 [US4] Add validation for image ID existence before deletion in TRYGO-Backend/src/routes/images.ts
- [X] T030 [US4] Add error handling for deletion failures (file not found, permission errors) in TRYGO-Backend/src/routes/images.ts
- [ ] T031 [US4] Test image deletion via DELETE /api/images/:id and verify file removed and 404 on subsequent access

**Checkpoint**: All user stories should now be independently functional - full image generation, access, and deletion capabilities

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final deployment preparation

- [X] T032 [P] Update render.yaml to remove images-service from services list in render.yaml
- [X] T033 [P] Add image-related environment variables documentation (IMAGE_PROVIDER, PUBLIC_URL, STORAGE_ROOT, etc.)
- [X] T034 Code cleanup: Remove unused imageRoutes.ts if not needed in TRYGO-Backend/src/routes/imageRoutes.ts (imageRoutes.ts is used for S3 uploads, keep it)
- [X] T035 Ensure consistent error handling across all image API endpoints in TRYGO-Backend/src/routes/images.ts
- [X] T036 Verify logging is appropriate for all image operations in TRYGO-Backend/src/routes/images.ts
- [ ] T037 Test end-to-end: Generate image → Access URL → Delete image → Verify 404
- [ ] T038 [P] Update backend service environment variables on Render to point to TRYGO-Backend URL
- [ ] T039 Verify storage directory is created on deployment and has write permissions

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Depends on US1 (uses same endpoint, adds CORS/auth)
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Depends on US1 (needs image generation to work first)
- **User Story 4 (P3)**: Can start after Foundational (Phase 2) - Depends on US1 and US3 (needs images to exist and be accessible)

### Within Each User Story

- Services before routes
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T002, T003, T004)
- All Foundational tasks marked [P] can run in parallel (T006, T007, T008)
- Once Foundational phase completes, User Stories 2 and 3 can start in parallel (both depend on US1)
- Polish tasks marked [P] can run in parallel (T032, T033, T038)

---

## Parallel Example: User Story 1

```bash
# These can run in parallel (different files):
Task: "Copy buildImagePrompt.ts from images-service to TRYGO-Backend/src/services/images/buildImagePrompt.ts"
Task: "Create imageProvider.ts abstraction interface in TRYGO-Backend/src/services/images/imageProvider.ts"
Task: "Create imageStorage.ts utility for file operations in TRYGO-Backend/src/services/images/imageStorage.ts"

# These must run sequentially:
Task: "Implement generateImage.ts main service function" (depends on imageProvider and imageStorage)
Task: "Create images.ts route handler" (depends on generateImage service)
Task: "Integrate images routes into server.ts" (depends on routes/images.ts)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently - internal backend can generate images
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP - internal image generation works!)
3. Add User Story 2 → Test independently → Deploy/Demo (External API access enabled)
4. Add User Story 3 → Test independently → Deploy/Demo (Image serving works)
5. Add User Story 4 → Test independently → Deploy/Demo (Full CRUD for images)
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (P1 - MVP)
   - Developer B: Prepares for User Story 2 (waits for US1)
   - Developer C: Prepares for User Story 3 (waits for US1)
3. After US1 completes:
   - Developer A: User Story 2 (P2 - External access)
   - Developer B: User Story 3 (P2 - File serving) - can run in parallel with US2
4. After US2 and US3 complete:
   - Developer A: User Story 4 (P3 - Deletion)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- Manual testing via Postman/curl is sufficient per spec requirements (no automated tests needed)

---

## Task Summary

- **Total Tasks**: 39
- **Phase 1 (Setup)**: 4 tasks
- **Phase 2 (Foundational)**: 6 tasks
- **Phase 3 (User Story 1 - P1)**: 8 tasks
- **Phase 4 (User Story 2 - P2)**: 4 tasks
- **Phase 5 (User Story 3 - P2)**: 4 tasks
- **Phase 6 (User Story 4 - P3)**: 5 tasks
- **Phase 7 (Polish)**: 8 tasks

**Suggested MVP Scope**: Phases 1, 2, and 3 (User Story 1) - enables internal backend image generation, the primary use case.
