# Feature Specification: Idea History & Deduplication

**Feature Branch**: `008-idea-history`  
**Created**: 2025-11-13  
**Status**: Draft  
**Input**: User request — “Even deleted ideas must be remembered so we don’t regenerate them again; ideas moved to backlog or published should also be excluded from future suggestions.”

---

## Problem Statement

- AI suggestions sometimes repeat ideas that were already generated earlier in the discovery flow.
- Deleted ideas silently disappear, so the generator has no memory and can resurface them.
- Manually curated backlog and published content must stay unique per hypothesis/cluster to avoid wasting generation credits and analyst time.

We need a persistent memory of every AI-generated idea (accepted, dismissed, or published) and a deduplication layer that filters suggestions before the user sees them.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Remember past ideas (Priority: P1)

As an SEO strategist, when I delete or publish an idea, I never want to see the same suggestion again.

**Why**: Prevents duplicate research and noisy backlog management.

**Acceptance Criteria**

1. Given an AI-suggested idea that was deleted, when a new “Generate ideas” request runs, then the system MUST exclude that idea (or semantically equivalent variants) from the result.
2. Given a backlog idea that was promoted to content or published, when I rerun ideation, then suggestions MUST skip all previously accepted titles.

### User Story 2 — Traceability & audit (Priority: P2)

As an operations lead, I need a searchable log of all generated ideas and their final disposition so I can audit ideation coverage.

**Acceptance Criteria**

1. Every generated idea MUST be stored with: project, hypothesis, cluster (if available), category, normalized title, raw title, summary, timestamp, and lifecycle status (`suggested`, `dismissed`, `backlog`, `draft`, `published`).
2. The log MUST expose filters by date range, lifecycle status, project, hypothesis, and keyword cluster.

### User Story 3 — Reset & overrides (Priority: P3)

As a senior editor, I need a way to manually restore an idea so it can be suggested again (e.g., if business priorities change).

**Acceptance Criteria**

1. Given an archived idea history entry, when I select “Allow resurfacing”, then the record MUST switch to `unblocked` and the generator can reuse it.
2. The action MUST be tracked with user, timestamp, and optional note for audit.

### Edge Scenarios

- Ideas generated before this feature launch: treat them as “unknown” and backfill from current backlog/drafts where feasible.
- Cross-language duplicates: the deduper MUST normalise by lowercase ASCII, strip punctuation, and optionally hash lemmatised tokens.
- Similar-but-not-identical titles: implement fuzzy matching (Levenshtein, trigram, or embedding cosine) with a configurable threshold to decide if an idea is “close enough” to skip.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Persist every AI-generated idea in a new collection `SeoIdeaHistory` with the attributes described above.
- **FR-002**: Update the record’s `lifecycle` field whenever an idea is:
  - Accepted into backlog (`backlog`)
  - Promoted to drafted content (`draft`)
  - Published to WordPress (`published`)
  - Dismissed/removed (`dismissed`)
- **FR-003**: The idea generator API MUST:
  1. Normalise each candidate title (trim, lowercase, collapse whitespace, remove stop symbols).
  2. Check `SeoIdeaHistory` for any record with the same project/hypothesis and matching `normalizedTitle` (exact or fuzzy hit within the threshold).
  3. Exclude those ideas from the final payload unless the history entry is explicitly marked `unblocked`.
- **FR-004**: Store metadata about the source model, prompt, and seed keywords to help debug duplicates.
- **FR-005**: Expose a lightweight admin UI in the Content tab:
  - Table of historical ideas with filters.
  - “Allow resurfacing” / “Block again” toggle per idea.
  - Export to CSV for audit.
- **FR-006**: The system MUST throttle repeated duplicate hits: if the generator produces N ideas but only M survive dedupe, the API should optionally rerun once to backfill (configurable, default off).

### Non-Functional Requirements

- History writes MUST be idempotent: repeated saves for the same idea within a request should not create duplicates.
- Deduplication checks must complete within <150ms for 100 candidate titles (indexing + caching strategy required).
- The historical table MUST support pagination (default 25 rows) and respond under 500ms on the typical dataset (<50k ideas).

### Data Model Sketch

`SeoIdeaHistory`
| Field                | Type        | Notes |
|----------------------|-------------|-------|
| `projectId`          | ObjectId    | required |
| `hypothesisId`       | ObjectId    | required |
| `clusterId`          | ObjectId    | optional |
| `category`           | enum        | pain, goal, trigger, benefit, faq, info, feature |
| `normalizedTitle`    | string      | lowercase + sanitized |
| `title`              | string      | original display title |
| `summary`            | string      | optional idea description |
| `lifecycle`          | enum        | suggested/backlog/draft/published/dismissed/unblocked |
| `origin`             | object      | `{ sourceModel, promptVersion, generatedAt }` |
| `lastTransition`     | object      | `{ from, to, userId, timestamp }` |
| `flags`              | object      | `{ blocked: boolean, allowResurface: boolean }` |
| `createdAt/updatedAt`| date        | default timestamps |

Indexes:
- Unique compound index on `(projectId, hypothesisId, normalizedTitle)` with `partialFilterExpression` to ignore `allowResurface: true`.
- Secondary index on `lifecycle` for reporting.

### API Updates

- `POST /api/seo/generate-ideas`:
  - Accept optional `allowDuplicates: boolean` flag (default false).
  - Response payload should include `filteredOutCount`.
- `POST /api/seo/ideas/history/reset`:
  - Body `{ ideaId, reason }` to toggle `allowResurface`.
- `GET /api/seo/ideas/history`:
  - Query params for project/hypothesis/cluster/lifecycle/date.

### Success Metrics

- **SC-001**: Duplicate idea occurrences reported by users drop by 90% in the first week.
- **SC-002**: Idea generation latency stays within SLA despite dedupe (< 2.5s end-to-end).
- **SC-003**: Audit table adoption — at least 3 power users export or filter history during pilot.

### Assumptions

- All current idea generation flows send requests through a single backend gateway — dedupe can live there.
- WordPress publishing and backlog mutations already emit events we can hook into; otherwise, we will add lightweight triggers.
- Similarity heuristics can initially be conservative (exact match) and evolve to fuzzy matching based on feedback.

### Open Questions

1. Do we need project-wide dedupe (cross-hypothesis) or only within the same hypothesis? (Default: within hypothesis.)
2. Should we dedupe across languages or treat each locale separately?
3. How should we handle manual ideas typed by users — do they enter history as well?
4. What retention policy is acceptable (keep forever vs. archive after X months)?

---

## Release Plan

1. **Phase 1 (P1)** — Implement storage + generator filter, log lifecycle updates.
2. **Phase 2 (P2)** — Admin UI for audit/reset, add reporting endpoints.
3. **Phase 3 (P3)** — Introduce fuzzy matching & optional auto-regeneration for filtered ideas.

All phases must include migrations and backfill scripts for existing backlog/draft/published items to seed the history.






