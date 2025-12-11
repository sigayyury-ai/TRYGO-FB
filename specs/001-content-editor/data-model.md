# Data Model: Backlog Content Editor

## Entities

### ContentDraft

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Primary key |
| `ideaId` | ObjectId | Reference to `SeoBacklogIdea` |
| `projectId` | ObjectId | Reference to project (denormalized for queries) |
| `hypothesisId` | ObjectId | Reference to hypothesis |
| `title` | string | Draft working title (editable) |
| `summary` | string | Short synopsis (≤ 280 chars) |
| `persona` | string | Target ICP/persona tag |
| `status` | enum (`generated`, `editing`, `ready_for_export`) | Editor workflow state |
| `bodyHtml` | string | Serialized HTML content |
| `outline` | array of section descriptors | Ordered sections with heading level + anchor |
| `currentVersion` | ObjectId | Pointer to latest `ContentDraftVersion` |
| `autosaveVersion` | number | Incremented on every autosave/save for optimistic locking |
| `createdBy` | ObjectId | User who triggered first generation |
| `updatedBy` | ObjectId | Last user who saved |
| `createdAt` | Date | Timestamp |
| `updatedAt` | Date | Timestamp |

### ContentDraftVersion

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Primary key |
| `draftId` | ObjectId | Parent `ContentDraft` |
| `source` | enum (`ai_text`, `ai_regenerate`, `manual_save`, `autosave`) | Origin of version |
| `bodyHtml` | string | Full snapshot |
| `summaryDiff` | string | Human-readable summary of changes |
| `promptContextId` | ObjectId | Reference to `PromptContextSnapshot` |
| `imageIds` | ObjectId[] | Images attached to this version |
| `tokensUsed` | number | Token count (text generation) |
| `createdBy` | ObjectId | User/system actor |
| `createdAt` | Date | Timestamp |

### DraftImageAsset

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Primary key |
| `draftId` | ObjectId | Associated draft |
| `versionId` | ObjectId | Version where image introduced |
| `url` | string | S3/object storage path |
| `thumbnailUrl` | string | Optional resized preview |
| `provider` | enum (`google_banana`, `manual_upload`) | Source |
| `prompt` | string | Prompt/description used |
| `negativePrompt` | string | Optional negative prompt |
| `altText` | string | Accessibility text |
| `caption` | string | Optional caption |
| `width` / `height` | number | Dimensions |
| `mimeType` | string | MIME type |
| `checksum` | string | Hash for deduplication |
| `createdBy` | ObjectId | User |
| `createdAt` | Date | Timestamp |

### PromptContextSnapshot

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Primary key |
| `projectId` | ObjectId | Project reference |
| `hypothesisId` | ObjectId | Hypothesis reference |
| `ideaId` | ObjectId | Backlog idea reference |
| `icpSnapshot` | object | Persona data (goals, pains, objections, JTBD) |
| `leanCanvas` | object | UVP, solution, problem, channels |
| `clusterMetadata` | object | If applicable: cluster title, intent, keywords |
| `promptTemplateVersion` | string | Version string |
| `rawPrompt` | string | Prompt sent to AI |
| `responseMeta` | object | Token usage, latency, model name |
| `createdAt` | Date | Timestamp |

## Relationships

- `ContentDraft` 1—N `ContentDraftVersion`
- `ContentDraft` 1—N `DraftImageAsset`
- `ContentDraftVersion` N—M `DraftImageAsset` (via `imageIds`, maintain referential integrity)
- `ContentDraftVersion` 1—1 `PromptContextSnapshot`

## Indexing

- `ContentDraft.ideaId` (unique) to enforce one active draft per idea.
- Compound index on `ContentDraft.projectId + status` to support dashboard filters.
- TTL or archived flag for `DraftImageAsset` cleanup (no TTL by default).
- `ContentDraftVersion.draftId + createdAt` descending for quick history retrieval.

## Validation Rules

- `status` transitions: `generated → editing → ready_for_export` (allow revert to `editing`).
- Max outline length: 25 sections; enforce unique anchors.
- Image upload size ≤ 5 MB, allowed MIME types `image/png`, `image/jpeg`, `image/webp`.
- Autosave requires `autosaveVersion` match; backend returns 409 on mismatch.
