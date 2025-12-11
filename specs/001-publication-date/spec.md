# Feature Specification: Publication Date Selector

**Feature Branch**: `[001-publication-date]`  
**Created**: 2025-11-14  
**Status**: Draft  
**Input**: User description: "нужно создать поле дата публикации и его можно менять при редактировании материалов. Тогда материалы будут занимать только свой день . основой для поля будут даты из спринта, только эти даты можно выбрать в этом поле.  и тогда у нас материал будет жостко привязан к дате в спринте"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Lock publish date when marking Ready (Priority: P1)

Editors need to pick the exact publication day for a piece when they move it into the sprint/Ready state, so the slot is locked and the WordPress job is queued for that day.

**Why this priority**: Without a locked date the sprint board reshuffles items, confusing stakeholders and risking double-posting.

**Independent Test**: Toggle a draft to Ready, choose a sprint date, and confirm the item now occupies that exact day and no other slot changes.

**Acceptance Scenarios**:

1. **Given** a draft without a publish date, **When** an editor marks it Ready and selects “Fri, Nov 14”, **Then** the item appears only on Nov 14 and the publish job is queued for Nov 14 09:00.
2. **Given** a sprint date already reserved, **When** another item is marked Ready, **Then** that date is not offered in the picker and the editor must choose another slot.

---

### User Story 2 - Adjust publish date while editing (Priority: P2)

Editors sometimes need to move a piece to a different sprint day; they must be able to edit the publish date directly inside the content item without deleting/re-adding it.

**Why this priority**: Plans evolve; manual re-entry wastes time and causes scheduling mistakes.

**Independent Test**: Open a Ready item, change its publish date to a different offered slot, save, and confirm the board and queued job both update.

**Acceptance Scenarios**:

1. **Given** an item scheduled for Nov 14, **When** the editor edits it and selects Nov 17, **Then** the card moves to the Nov 17 column and the WordPress job reschedules to Nov 17 09:00.
2. **Given** an editor cancels the edit, **When** they exit without saving, **Then** the previously scheduled date remains unchanged.

---

### User Story 3 - Respect sprint calendar constraints (Priority: P3)

Operations managers must ensure every date used in the sprint belongs to the currently generated sprint calendar and aligns with allowed publication days.

**Why this priority**: Prevents off-calendar posts that break reporting and automation.

**Independent Test**: Attempt to pick a date outside the current sprint (past or future) and verify the system blocks the action with guidance.

**Acceptance Scenarios**:

1. **Given** the sprint calendar only covers Nov 10–23, **When** a user tries to set Dec 1, **Then** the UI rejects the action with a “date not in sprint” message.
2. **Given** the sprint regenerates (new weeks added), **When** an editor opens the picker, **Then** the options reflect the refreshed calendar immediately.

---

### Edge Cases

- A date is selected but the corresponding WordPress publish job already fired before the editor saves → system must warn that the post is already published and disallow date change without duplicating.
- All sprint dates are occupied → picker displays “No available dates” and user cannot mark additional items Ready until a slot frees up or a new sprint week is generated.
- Editor loses network connection mid-change → existing date remains, and the UI shows that the update failed without corrupting the queue.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Each content item MUST store a `publishDate` (date-only) that defaults to `null` until set.
- **FR-002**: When an editor moves an item to Ready, the UI MUST require selection of a publish date from the currently generated sprint dates (week grid) before saving.
- **FR-003**: The date picker MUST exclude dates that either (a) are outside the sprint window or (b) already have another Ready item assigned, unless the user explicitly confirms an override with a warning.
- **FR-004**: Editing a Ready item MUST allow changing the publish date; saving MUST update both the content record and any queued WordPress job to the new date (still publishing at 09:00 project-local time).
- **FR-005**: If an item is already published (status `published`), the date field MUST become read-only and display the actual publish date that occurred.
- **FR-006**: When a publish date changes, the sprint board MUST immediately move the card into the matching week/day slot without reshuffling other cards.
- **FR-007**: The API MUST validate incoming publish dates server-side, rejecting requests with dates not in the sprint calendar and returning a descriptive error.
- **FR-008**: The system MUST log every publish-date change (who changed it, previous date, new date, timestamp) for auditing.
- **FR-009**: If the sprint calendar regenerates (e.g., new weeks added), the picker MUST refresh its options without requiring reloading the entire workspace.

### Key Entities *(include if feature involves data)*

- **Content Item**: Represents planned marketing material. Key attributes for this feature: `id`, `title`, `status`, `publishDate`, `dueDate` (legacy auto-slot), `sprintWeekId`.
- **WordPress Publish Job**: Represents scheduled publication. Key attributes: `draftId`, `publishAt` (derived from `publishDate` + 09:00 time), `status`, `message`.
- **Sprint Calendar Slot**: Abstract representation of an available publication day (weekday + date) generated from sprint settings. Attributes: `date`, `capacity`, `occupiedByContentId`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of Ready items display a non-null publish date that matches an existing sprint slot.
- **SC-002**: Editors can change a publish date in under 30 seconds end-to-end (open item, change date, save) during usability testing.
- **SC-003**: No more than 1% of scheduled posts in a sprint are published on the wrong day (measured over a month).
- **SC-004**: Support tickets about “content moved to wrong day” drop by at least 80% within one sprint after launch.

## Assumptions

- Sprint calendars remain weekly (Mon–Sun) with at most one publication slot per day; future changes will extend the slot generator but will still feed the picker.
- Publication time remains fixed at 09:00 project-local time; this feature only manages the date portion.
- There is always at least one upcoming sprint generated; otherwise editors cannot mark items Ready (existing behavior).
