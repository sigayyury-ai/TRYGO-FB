# Feature Specification: Integrate Images Service into TRYGO-Backend

**Feature Branch**: `009-integrate-images-api`  
**Created**: 2025-01-27  
**Status**: Draft  
**Input**: User description: "давай начнем с малого @images-service добавь в @TRYGO-Backend  все что мне нужно чтобы было APi к которому мы потмо сможем образатсья как внутри так и их наружи. Нужно обэеденить два бекенда"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Internal Backend Image Generation (Priority: P1)

Backend services need to generate images for content items (articles, pages) as part of the content creation workflow. The system should allow internal services to request image generation through a unified API endpoint within the same backend.

**Why this priority**: This is the primary use case - existing backend services already call images-service via HTTP. Integrating it eliminates the need for a separate service and reduces infrastructure costs.

**Independent Test**: Can be fully tested by making an internal API call from backend code to generate an image for a content item, verifying the image is created and a URL is returned.

**Acceptance Scenarios**:

1. **Given** a backend service needs to generate an image for a content item, **When** it makes a POST request to the images API endpoint with contentItemId, title, and optional description, **Then** the system generates an image and returns a publicly accessible URL
2. **Given** an image generation request is made, **When** the request includes all required fields (contentItemId, title), **Then** the system validates the input and proceeds with generation
3. **Given** an image generation request is missing required fields, **When** the request is submitted, **Then** the system returns a validation error with clear message
4. **Given** image generation completes successfully, **When** the backend receives the response, **Then** it contains an imageUrl that can be used to access the generated image

---

### User Story 2 - External API Access for Image Generation (Priority: P2)

External clients (frontend applications, third-party integrations) need to generate images through the same API, ensuring consistent functionality regardless of the caller's origin.

**Why this priority**: Enables frontend and external integrations to use the same image generation capabilities, providing a unified interface for all consumers.

**Independent Test**: Can be fully tested by making an API request from an external client (e.g., frontend or Postman) to generate an image, verifying CORS is properly configured and the request succeeds.

**Acceptance Scenarios**:

1. **Given** an external client wants to generate an image, **When** it makes an authenticated POST request to the images API endpoint, **Then** the system processes the request and returns an image URL
2. **Given** an external request is made, **When** CORS is properly configured, **Then** the request is accepted from allowed origins
3. **Given** an external request lacks proper authentication, **When** authentication is required, **Then** the system returns an appropriate error response
4. **Given** an external client requests image generation, **When** the request is valid, **Then** it receives the same response format as internal calls

---

### User Story 3 - Image File Serving and Access (Priority: P2)

Generated images must be accessible via public URLs so they can be embedded in content, displayed in frontend applications, and shared externally.

**Why this priority**: Images are useless without the ability to access them. This ensures generated images can be used in the intended contexts (articles, pages, UI).

**Independent Test**: Can be fully tested by generating an image, then accessing the returned URL directly in a browser or via HTTP request, verifying the image file is served correctly.

**Acceptance Scenarios**:

1. **Given** an image has been generated, **When** a client accesses the image URL, **Then** the system serves the image file with appropriate content-type headers
2. **Given** an image URL is requested, **When** the image file exists, **Then** the system returns the image with correct MIME type (e.g., image/png, image/jpeg)
3. **Given** an image URL is requested, **When** the image file does not exist, **Then** the system returns a 404 error
4. **Given** images are stored in a storage directory, **When** the system serves images, **Then** it uses efficient file serving mechanisms

---

### User Story 4 - Image Deletion (Priority: P3)

Users and services need the ability to delete generated images when they are no longer needed, helping manage storage and maintain data hygiene.

**Why this priority**: While not critical for initial functionality, deletion capability is important for storage management and user control over generated content.

**Independent Test**: Can be fully tested by generating an image, then making a DELETE request to remove it, verifying the file is removed from storage and subsequent access attempts fail.

**Acceptance Scenarios**:

1. **Given** an image exists, **When** a DELETE request is made to the image endpoint with the image ID, **Then** the system removes the image file from storage
2. **Given** a deletion request is made, **When** the image ID is valid, **Then** the system confirms successful deletion with an appropriate response
3. **Given** a deletion request is made, **When** the image ID does not exist, **Then** the system returns a 404 error
4. **Given** an image is deleted, **When** subsequent requests are made to access the image URL, **Then** the system returns a 404 error

---

### Edge Cases

- What happens when image generation fails due to API provider errors (OpenAI/Gemini unavailable)?
- How does the system handle concurrent image generation requests for the same content item?
- What happens when storage directory is full or inaccessible?
- How does the system handle invalid image provider configuration (missing API keys)?
- What happens when image generation times out?
- How does the system handle very long titles or descriptions in generation requests?
- What happens when an image URL is accessed before generation completes?
- How does the system handle requests with malformed JSON payloads?
- What happens when the same contentItemId is used for multiple image generation requests?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a REST API endpoint for image generation that accepts contentItemId, title, and optional description
- **FR-002**: System MUST generate images using configured AI provider (OpenAI DALL-E or Google Gemini) based on provided content metadata
- **FR-003**: System MUST store generated images in a persistent storage location accessible via file system
- **FR-004**: System MUST return a publicly accessible URL for each generated image
- **FR-005**: System MUST serve generated image files via HTTP with appropriate content-type headers
- **FR-006**: System MUST validate required fields (contentItemId, title) before processing image generation requests
- **FR-007**: System MUST handle errors gracefully and return appropriate HTTP status codes and error messages
- **FR-008**: System MUST support both internal backend calls and external API requests to the same endpoints
- **FR-009**: System MUST configure CORS appropriately to allow external clients to access the API
- **FR-010**: System MUST provide a DELETE endpoint to remove generated images by ID
- **FR-011**: System MUST build image generation prompts using title, description, and variant type (hero/inline)
- **FR-012**: System MUST support configurable image provider (OpenAI or Gemini) via environment variables
- **FR-013**: System MUST maintain backward compatibility with existing internal service calls that expect the same request/response format
- **FR-014**: System MUST log image generation requests and errors for debugging and monitoring
- **FR-015**: System MUST handle image storage path configuration via environment variables

### Key Entities *(include if feature involves data)*

- **Image Generation Request**: Represents a request to generate an image, containing contentItemId (required), title (required), description (optional), and metadata about the content
- **Generated Image**: Represents a successfully created image file, stored on disk with a unique identifier, accessible via a public URL, associated with a contentItemId
- **Image Provider Configuration**: Represents the settings for AI image generation, including provider type (OpenAI/Gemini), API keys, model selection, and base URLs

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Backend services can successfully generate images through the unified API with 95% success rate (excluding provider API failures)
- **SC-002**: Image generation requests complete within 30 seconds for 90% of requests
- **SC-003**: External clients can successfully access the image generation API with proper authentication and CORS configuration
- **SC-004**: Generated images are accessible via returned URLs within 5 seconds of generation completion
- **SC-005**: System maintains backward compatibility - all existing internal service calls continue to work without modification
- **SC-006**: Image deletion requests complete successfully for 99% of valid deletion requests
- **SC-007**: API returns appropriate error responses (400, 404, 500) with clear messages for all error scenarios
- **SC-008**: System reduces infrastructure costs by eliminating the separate images-service deployment

## Assumptions

- Image generation will use existing AI provider APIs (OpenAI DALL-E or Google Gemini) - no new provider integrations needed
- Storage will use local file system initially - cloud storage migration can be handled separately if needed
- Authentication for external API access can leverage existing TRYGO-Backend authentication mechanisms
- Image file formats will be determined by the AI provider (typically PNG or JPEG)
- The storage directory structure will organize images by contentItemId for easier management
- Existing internal service calls use HTTP fetch - these can be updated to use internal function calls for better performance, but HTTP compatibility will be maintained
- CORS configuration will allow requests from the frontend application domain
- Image generation prompts will follow the existing buildImagePrompt logic from images-service

## Dependencies

- TRYGO-Backend must have Express.js configured (already present)
- OpenAI or Gemini API keys must be available in environment variables
- File system write permissions for image storage directory
- Existing backend services that call images-service need to be updated to use new endpoint URLs (or internal function calls)

## Out of Scope

- Image editing or manipulation capabilities
- Image optimization or compression
- Multiple image variants generation in a single request
- Image metadata management (EXIF, tags, etc.)
- Image search or discovery features
- Batch image generation
- Image format conversion
- Cloud storage integration (S3, etc.) - can be added later
- Image CDN integration
- Rate limiting or quota management for image generation (can be added later)
