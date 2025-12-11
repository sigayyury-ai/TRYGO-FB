# Feature Specification: Content Categories Expansion

**Feature Branch**: `009-content-categories-expansion`  
**Created**: 2025-01-27  
**Status**: Draft  
**Input**: User description: "новые категории для бекенда фронтенда если надо дорабатывать для покрывания всех кейсов генерации"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Generate Comparison Content Ideas (Priority: P1)

As a content manager, I need the system to generate comparison article ideas (e.g., "Product vs Competitor", "Method A vs Method B") so we can create competitive content that helps users make informed decisions.

**Why this priority**: Comparison content is a high-value content type that drives conversions and helps users evaluate options. Currently, the generator can suggest comparison ideas but they're mixed with other categories, making it hard to track and manage comparison content separately.

**Independent Test**: Generate comparison content ideas for a project and verify they are properly categorized, displayed in the UI, and can be added to the content backlog.

**Acceptance Scenarios**:

1. **Given** a project with competitors defined in market research, **When** I request comparison content ideas, **Then** the system generates ideas like "[Product] vs [Competitor]: comparison" and categorizes them as COMPARISON
2. **Given** a project without competitor data, **When** I request comparison ideas, **Then** the system generates general comparison ideas (e.g., "Method A vs Method B") based on ICP and Lean Canvas data
3. **Given** comparison content ideas are generated, **When** I view them in the content panel, **Then** they appear in a dedicated "Comparison Content" section with appropriate labels and colors

---

### User Story 2 - Generate Template and Resource Ideas (Priority: P2)

As a content creator, I need the system to generate ideas for downloadable resources (templates, checklists, frameworks, calculators) so we can create lead magnets and valuable free resources.

**Why this priority**: Templates and resources are effective lead magnets and help establish authority. Currently, the generator can suggest template ideas but they're categorized as INFO, making it hard to distinguish resource content from informational articles.

**Independent Test**: Generate template/resource ideas and verify they are properly categorized and can be tracked separately from informational articles.

**Acceptance Scenarios**:

1. **Given** a project with ICP data (pains, goals, triggers), **When** I request template ideas, **Then** the system generates ideas like "[Pain] Assessment Template", "[Goal] Checklist", "[Trigger] Decision Framework" and categorizes them as TEMPLATE
2. **Given** template ideas are generated, **When** I view them in the content panel, **Then** they appear in a "Templates & Resources" section with clear indication that these are downloadable resources
3. **Given** a template idea, **When** I add it to backlog, **Then** the system tracks it with format "resource" or "template" for proper content type management

---

### User Story 3 - Generate Case Study Ideas (Priority: P2)

As a content strategist, I need the system to generate case study content ideas so we can create social proof and demonstrate real-world results.

**Why this priority**: Case studies are powerful conversion tools that show how others achieved success. Currently, case study ideas are mixed with other categories, making it hard to plan and prioritize case study content.

**Independent Test**: Generate case study ideas and verify they are properly categorized and can be managed as a distinct content type.

**Acceptance Scenarios**:

1. **Given** a project with ICP data and Lean Canvas solutions, **When** I request case study ideas, **Then** the system generates ideas like "How [company] achieved [goal] with [solution]" and categorizes them as CASE_STUDY
2. **Given** case study ideas are generated, **When** I view them in the content panel, **Then** they appear in a "Case Studies" section with appropriate visual distinction
3. **Given** a case study idea, **When** I add it to backlog, **Then** the system tracks it with appropriate metadata for case study content planning

---

### User Story 4 - Generate Series Content Ideas (Priority: P3)

As a content manager, I need the system to generate series content ideas (multi-part articles, weekly series) so we can create comprehensive content series that keep users engaged over time.

**Why this priority**: Content series increase engagement and provide opportunities for internal linking. Currently, series ideas are generated but not tracked as a distinct category, making it hard to plan multi-part content.

**Independent Test**: Generate series content ideas and verify they are properly categorized and can be linked together as part of a series.

**Acceptance Scenarios**:

1. **Given** a project with ICP data, **When** I request series ideas, **Then** the system generates ideas like "Week 1: [Topic]", "Part 1: [Topic]", "Series: [Topic]" and categorizes them as SERIES
2. **Given** series ideas are generated, **When** I view them in the content panel, **Then** they appear grouped together with indication of series relationship
3. **Given** multiple series ideas, **When** I add them to backlog, **Then** the system allows linking them together as part of the same series

---

### Edge Cases

- What happens when a content idea could fit multiple categories (e.g., comparison case study)? System should allow manual category override or suggest the most appropriate category
- How does system handle projects without competitor data when generating comparison content? System should generate general comparison ideas based on ICP and industry standards
- What happens when template ideas are generated but no specific pain/goal data exists? System should generate generic template ideas based on project context
- How does system handle series content when only one part is generated? System should allow adding more parts later or suggest completing the series

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support generating content ideas in new categories: COMPARISON, TEMPLATE, CASE_STUDY, SERIES
- **FR-002**: System MUST categorize generated ideas into appropriate categories based on content type and context
- **FR-003**: Frontend MUST display new categories with distinct labels, colors, and visual indicators
- **FR-004**: System MUST allow filtering and grouping content ideas by category in the UI
- **FR-005**: System MUST support adding ideas from new categories to content backlog
- **FR-006**: Backend generator MUST include prompts for new categories that generate appropriate content types
- **FR-007**: System MUST maintain backward compatibility with existing content ideas (existing 7 categories continue to work)
- **FR-008**: GraphQL schema MUST include new category enums: COMPARISON, TEMPLATE, CASE_STUDY, SERIES
- **FR-009**: Database schema MUST support storing new category values in SeoContentItem model
- **FR-010**: System MUST allow users to manually override category assignment for generated ideas
- **FR-011**: For COMPARISON category, generator MUST use competitor data when available, or generate general comparisons based on ICP/Lean Canvas
- **FR-012**: For TEMPLATE category, generator MUST generate ideas for downloadable resources (templates, checklists, frameworks, calculators)
- **FR-013**: For CASE_STUDY category, generator MUST generate ideas that showcase real-world results and success stories
- **FR-014**: For SERIES category, generator MUST generate ideas that can be linked together as multi-part content
- **FR-015**: System MUST provide category-specific generation options (e.g., "Generate comparison ideas", "Generate template ideas")

### Key Entities *(include if feature involves data)*

- **ContentCategory (Extended)**: Enum representing content categories, now including COMPARISON, TEMPLATE, CASE_STUDY, SERIES in addition to existing 7 categories
- **ContentIdea**: Represents a generated content idea with category assignment, supporting new categories with appropriate metadata
- **SeoContentItem**: Database model storing content items, extended to support new category values while maintaining backward compatibility

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: System successfully generates content ideas in all 4 new categories (COMPARISON, TEMPLATE, CASE_STUDY, SERIES) for projects with complete ICP and Lean Canvas data
- **SC-002**: 90% of generated ideas are correctly categorized automatically without manual intervention
- **SC-003**: Users can filter and view content ideas by new categories in the UI within 2 seconds
- **SC-004**: All existing content ideas (in 7 original categories) continue to function correctly after category expansion
- **SC-005**: New categories are available in GraphQL API and can be used in all content generation mutations and queries
- **SC-006**: Database successfully stores and retrieves content items with new category values without data loss
- **SC-007**: Content generation time for new categories does not exceed current generation time by more than 20%
- **SC-008**: Users can successfully add ideas from new categories to content backlog and production queue

## Assumptions

- Existing 7 categories (PAINS, GOALS, TRIGGERS, PRODUCT_FEATURES, BENEFITS, FAQS, INFORMATIONAL) will remain unchanged and continue to work as before
- New categories are additive - they don't replace or modify existing categories
- Competitor data may not always be available, so comparison content generation should work with or without competitor information
- Template/resource ideas may require additional metadata (e.g., file type, download format) which can be added in future iterations
- Series content may require linking mechanism between related parts, which can be implemented as part of this feature or in follow-up
- Users may want to manually adjust category assignments, so system should support category override
- Backend generator prompts for new categories will follow the same pattern as existing categories (using ICP, Lean Canvas, CJM, JTBD context)
