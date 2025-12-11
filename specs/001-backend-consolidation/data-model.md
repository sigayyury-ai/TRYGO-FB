# Data Model: Backend Services Consolidation

**Feature**: Backend Services Consolidation  
**Date**: 2025-01-27  
**Phase**: 1 - Design

## Overview

This document describes the MongoDB data models that will be integrated into TRYGO-Backend from the `backend` and `semantics-service` services. All models use Mongoose and share the same MongoDB database.

## Integrated Models

### 1. SeoCluster

**Source**: `backend/src/db/models/SeoCluster.ts` and `semantics-service/src/db/models/SeoCluster.ts`

**Purpose**: Represents a semantic cluster of keywords with intent classification for SEO content organization.

**Schema**:
```typescript
{
  projectId: string (required, indexed)
  hypothesisId: string (required, indexed)
  title: string (required)
  intent: "commercial" | "transactional" | "informational" | "navigational" (required)
  keywords: string[] (default: [])
  createdBy: string (required)
  updatedBy: string (required)
  createdAt: Date (auto)
  updatedAt: Date (auto)
}
```

**Collection Name**: `seoAgentClusters` (from semantics-service, to maintain compatibility)

**Indexes**:
- Compound index: `{ projectId: 1, hypothesisId: 1 }`
- Individual indexes on `projectId` and `hypothesisId`

**Validation Rules**:
- `projectId` and `hypothesisId` are required
- `title` must be non-empty string
- `intent` must be one of the enum values
- `keywords` is an array of strings (normalized)

**State Transitions**: None (static entity, updated via PUT operations)

**Relationships**:
- Belongs to Project (via `projectId`)
- Belongs to Hypothesis (via `hypothesisId`)
- Referenced by BacklogIdea (via `clusterId`)

### 2. SeoBacklogIdea

**Source**: `backend/src/db/models/SeoBacklogIdea.ts`

**Purpose**: Represents a content idea in the SEO backlog with status, category, and scheduling information.

**Schema**:
```typescript
{
  projectId: string (required, indexed)
  hypothesisId: string (required, indexed)
  clusterId: string (optional)
  title: string (required)
  description: string (required)
  category: "pain" | "goal" | "trigger" | "feature" | "benefit" | "faq" | "info" (required)
  status: "backlog" | "scheduled" | "archived" | "pending" | "in_progress" | "completed" | "published" (default: "pending", indexed)
  scheduledDate: Date (optional)
  createdBy: string (required)
  updatedBy: string (required)
  createdAt: Date (auto)
  updatedAt: Date (auto)
}
```

**Collection Name**: `seoagentbacklogideas` (default Mongoose pluralization)

**Indexes**:
- Individual indexes on `projectId`, `hypothesisId`, `status`
- Compound index: `{ projectId: 1, hypothesisId: 1 }`

**Validation Rules**:
- `projectId`, `hypothesisId`, `title`, `description` are required
- `category` must be one of the enum values
- `status` must be one of the enum values
- `scheduledDate` must be a valid Date if provided

**State Transitions**:
- `pending` → `scheduled` (when scheduledDate is set)
- `pending` → `in_progress` (when content generation starts)
- `in_progress` → `completed` (when content is generated)
- `completed` → `published` (when published to WordPress)
- Any status → `archived` (when archived)

**Relationships**:
- Belongs to Project (via `projectId`)
- Belongs to Hypothesis (via `hypothesisId`)
- Optional: Belongs to Cluster (via `clusterId`)
- Referenced by ContentItem (via `backlogIdeaId`)

### 3. SeoContentItem

**Source**: `backend/src/db/models/SeoContentItem.ts`

**Purpose**: Represents a generated content article with title, content, format, status, and associated metadata.

**Schema**:
```typescript
{
  projectId: string (required, indexed)
  hypothesisId: string (required, indexed)
  backlogIdeaId: string (optional)
  title: string (required)
  category: "pain" | "goal" | "trigger" | "feature" | "benefit" | "faq" | "info" (required)
  format: "blog" | "commercial" | "faq" (required, default: "blog")
  ownerId: string (optional)
  reviewerId: string (optional)
  channel: string (optional)
  outline: string (optional)
  content: string (optional) // Full generated article content
  imageUrl: string (optional) // Generated image URL
  status: "draft" | "review" | "ready" | "published" | "archived" (default: "draft", indexed)
  createdBy: string (required)
  updatedBy: string (required)
  dueDate: Date (optional)
  createdAt: Date (auto)
  updatedAt: Date (auto)
}
```

**Collection Name**: `seocontentitems` (default Mongoose pluralization)

**Indexes**:
- Individual indexes on `projectId`, `hypothesisId`, `status`
- Compound index: `{ projectId: 1, hypothesisId: 1 }`

**Validation Rules**:
- `projectId`, `hypothesisId`, `title`, `category` are required
- `category` must be one of the enum values
- `format` must be one of the enum values
- `status` must be one of the enum values
- `content` and `imageUrl` are optional (generated later)

**State Transitions**:
- `draft` → `review` (when submitted for review)
- `review` → `ready` (when approved)
- `ready` → `published` (when published to WordPress)
- Any status → `archived` (when archived)

**Relationships**:
- Belongs to Project (via `projectId`)
- Belongs to Hypothesis (via `hypothesisId`)
- Optional: Belongs to BacklogIdea (via `backlogIdeaId`)
- References User (via `ownerId`, `reviewerId`, `createdBy`, `updatedBy`)

### 4. SeoSprintSettings

**Source**: `backend/src/db/models/SeoSprintSettings.ts`

**Purpose**: Represents WordPress publishing configuration and scheduling preferences for a project.

**Schema**:
```typescript
{
  projectId: string (required, indexed, unique)
  hypothesisId: string (optional)
  weeklyPublishCount: number (required, default: 0)
  preferredDays: string[] (required, default: [])
  timezone: string (optional)
  autoPublishEnabled: boolean (required, default: false)
  language: string (optional)
  wordpressBaseUrl: string (optional)
  wordpressUsername: string (optional)
  wordpressAppPassword: string (optional, encrypted)
  wordpressPostType: string (optional)
  wordpressDefaultCategoryId: number (optional)
  wordpressDefaultTagIds: number[] (required, default: [])
  updatedAt: Date (auto)
}
```

**Collection Name**: `seosprintsettings` (default Mongoose pluralization)

**Indexes**:
- Unique index on `projectId`

**Validation Rules**:
- `projectId` is required and unique
- `weeklyPublishCount` must be non-negative integer
- `preferredDays` is array of strings (day names)
- `wordpressDefaultTagIds` is array of numbers

**State Transitions**: None (settings entity, updated via PUT operations)

**Relationships**:
- Belongs to Project (via `projectId`, one-to-one)
- Optional: Belongs to Hypothesis (via `hypothesisId`)

### 5. SeoLanguagePreference

**Source**: `backend/src/db/models/SeoLanguagePreference.ts`

**Purpose**: Stores language preferences for content generation (if exists).

**Note**: This model may not exist or may be minimal. Verify during implementation.

## Data Relationships

```
Project (1) ──< (N) SeoCluster
Project (1) ──< (N) SeoBacklogIdea
Project (1) ──< (N) SeoContentItem
Project (1) ──< (1) SeoSprintSettings

Hypothesis (1) ──< (N) SeoCluster
Hypothesis (1) ──< (N) SeoBacklogIdea
Hypothesis (1) ──< (N) SeoContentItem

SeoCluster (1) ──< (N) SeoBacklogIdea (via clusterId)

SeoBacklogIdea (1) ──< (N) SeoContentItem (via backlogIdeaId)
```

## Data Migration Considerations

1. **Collection Names**: Ensure `SeoCluster` uses `seoAgentClusters` collection name to match existing data
2. **Field Compatibility**: All fields are compatible between services
3. **Indexes**: Ensure all indexes are created during model integration
4. **Data Validation**: Mongoose schemas include validation, ensure it's preserved

## Integration Notes

- All models use Mongoose with timestamps (createdAt, updatedAt)
- Models follow consistent naming: `Seo*` prefix
- All models require `projectId` and most require `hypothesisId`
- User tracking via `createdBy` and `updatedBy` fields
- Status fields use enums for type safety
