# Feature Specification: Settings Section Overview

**Feature Branch**: `[001-document-settings]`  
**Created**: 2025-11-14  
**Status**: Draft  
**Input**: User description: "давай создадим спецификацию того как сейчас работает раздел настроек и что там есть. и как он связан с другими фичами."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configure Workspace Language (Priority: P1)

Content leads need to set the default language that AI idea generation, draft regeneration, and backlog creation should use for their workspace, while still seeing which language the project metadata auto-detected.

**Why this priority**: Every AI interaction (`/seo/generateIdeas`, draft regeneration, backlog mutations) reads `generationLanguage`; incorrect language selection affects all deliverables and becomes costly to correct later.

**Independent Test**: Switch between auto-detected and manual language values, then trigger idea generation to confirm the payload uses the chosen language and the UI reflects manual overrides with reset controls.

**Acceptance Scenarios**:

1. **Given** a project with detected language `ru-RU`, **When** the user keeps auto mode, **Then** all new ideas/drafts are requested in `ru-RU` and the dropdown stays synced with detections.  
2. **Given** the same project, **When** the user selects `en-US`, **Then** the system marks the source as manual, persists the override for future interactions, and exposes a reset action that returns to the detected value.

---

### User Story 2 - Manage WordPress Credentials (Priority: P1)

Marketing ops must connect WordPress via REST credentials so scheduled/ready content can be enqueued through `/api/wordpress/settings` and later published by the job worker.

**Why this priority**: Without a valid connection, `enqueuePublishJob` throws and the Ready → Published workflow stalls, blocking every downstream automation.

**Independent Test**: Configure credentials (or use env-managed readonly mode), save, and confirm `Save connection` triggers validation, error messaging, and the queue can publish an item using the stored settings.

**Acceptance Scenarios**:

1. **Given** no existing DB connection, **When** the user enters site URL, username, and app password, **Then** the system validates via live API test, stores the config, and reports “Connection saved.”  
2. **Given** the integration is provided via environment variables, **When** the user opens the form, **Then** every credential field is disabled, the UI shows a notice about env management, and POST attempts are blocked server-side.

---

### User Story 3 - Map WordPress Taxonomies & Status (Priority: P2)

Content operations specialists need to keep category/tag/post-type mappings in sync with the WordPress site so queued publish jobs assign correct metadata and default statuses.

**Why this priority**: Wrong taxonomy IDs cause publish errors or misrouted content; these IDs flow into `WordPressPublishJob.payload` for every scheduled auto-publish.

**Independent Test**: Load resources, change mappings, reload to confirm they match remote taxonomy names, and run “Verify connection” to check current status/time of last check.

**Acceptance Scenarios**:

1. **Given** a saved connection, **When** the user fetches resources, **Then** the dropdowns populate with live post types, categories, and tags, falling back to sensible defaults when WordPress returns none.  
2. **Given** a queued publish, **When** settings specify `articleTagIds` and default status `pending`, **Then** the job payload carries those IDs/statuses so WordPress receives the right metadata.

---

### Edge Cases

- Auto-detection unavailable: if `/seo` data lacks `language.detected`, the selector falls back to `en-US` and still allows manual overrides.  
- WordPress managed via env: UI becomes read-only and the backend rejects POST saves, avoiding conflicts between code and UI-managed secrets.  
- Missing app password: when no DB record exists, POST `/api/wordpress/settings` rejects requests without a password even if username/base URL are present.  
- Resource fetch failure: taxonomy reload errors surface as inline alerts, but previously selected IDs remain, preventing silent data loss.  
- Connection outages: status polling displays the last successful handshake timestamp and exposes “Retry” so publishing teams know whether to proceed.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The settings tab MUST display the current content language, indicating whether it is auto-detected from project data or manually overridden, and include the `Reset to project language` action when in manual mode.  
- **FR-002**: Idea generation, draft regeneration, and backlog creation flows MUST read the language selected in the settings tab (auto or manual) and pass it as the `language` parameter to their respective API calls.  
- **FR-003**: The WordPress credentials form MUST require `baseUrl` and `username`, strip trailing slashes from URLs, and only persist a new `appPassword` when the field is filled.  
- **FR-004**: Saving WordPress settings MUST validate credentials via a live REST call before persisting, surfacing backend errors verbatim to the user.  
- **FR-005**: When WordPress configuration is injected via environment variables, the UI MUST render the current summary but disable editing, and the backend MUST reject POST attempts with a descriptive error.  
- **FR-006**: The settings tab MUST expose controls for default publish status, per-format category, tag IDs, and post-type slugs, and store them so `enqueuePublishJob` can assign categories/tags/status/post type without additional user input.  
- **FR-007**: Resource reload actions MUST fetch post types, categories, and tags from the connected WordPress site, display loading/error states, and fall back to default `posts/pages` options when nothing is returned.  
- **FR-008**: Connection status checks MUST report whether the app can currently authenticate with WordPress, the credential source (`env` or `db`), and the timestamp of the last successful check.  
- **FR-009**: The system MUST prevent publish jobs from being enqueued when no active WordPress connection exists, displaying actionable errors inside scheduling and Ready flows.  
- **FR-010**: Success confirmations (“Connection saved”) and failure notices MUST be visible inline within the settings card so operators know whether their changes took effect.

### Key Entities *(include if feature involves data)*

- **WorkspaceLanguagePreference**: Derived from project metadata plus manual overrides; includes `detectedLanguage`, `selectedLanguage`, and `source` (“auto”/“manual”), and drives AI language parameters.  
- **WordPressConnectionSummary**: Aggregates the active credential source, base URL, username, `configured` flag, and default publish status. Used by both UI and backend validation endpoints.  
- **WordPressResourceSnapshot**: Represents the post types, categories, and tags fetched from the connected site; each entry keeps `id`, `slug`, `name`, `viewable` to populate dropdowns and datalists.  
- **WordPressPublishJobPayload**: The bundle passed to the queue when publishing content, containing hero asset URL, status, categories, tags, slug, post type, and reason—built from settings captured in this tab.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 95% of new AI idea generations run within one minute of a language change use the updated language (verified via API logs).  
- **SC-002**: 100% of WordPress “Save connection” attempts either succeed with a confirmation or return a user-readable error within 5 seconds.  
- **SC-003**: 90% of publish jobs queued after taxonomy changes include at least one category or tag derived from the updated settings, confirming mappings propagate end-to-end.  
- **SC-004**: Operators report (via support tickets) fewer than 2 incidents per quarter related to misconfigured WordPress credentials once the settings tab workflow is completed.

## Assumptions & Dependencies

- Language detection originates from `/api/seo` project metadata; no per-idea overrides exist today.  
- WordPress is the only publishing target; all references to “connection” imply the REST API exposed by a single WP site.  
- Publish automation depends on hero images and drafts prepared elsewhere; the settings tab only governs metadata and credentials.  
- The job worker honors whatever status, categories, tags, and post types are stored here—there is no downstream correction layer.
