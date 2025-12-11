# Feature Specification: OpenAPI-Powered Content Ideation

**Feature Branch**: `[001-openapi-content-ideas]`  
**Created**: 2025-11-11  
**Status**: Draft  
**Input**: User description: "Давай подключим OPEN API к генерации идеи в разделе контент. Пока генерируем только  идею для проекта  и гипотезы. Для этого нам нужно сделать промт который будет включать в себя описание проекта, описание гипотезы, UVP из Lean canvas  и ICP привязанного к этой гипотезе. В контент у нас есть несколько типов материалов - статьи и коммерческие страницы. Статьи  генерируются на основе Pains, Goals, Trigers, Benefits из ICP.  Коммерческие страницы из кластеров.  А FAQ статьи из понимания ICP и возможных возражений . Инфо статьи создаются из JTBD b CJM в ICP"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Generate ideas with full context (Priority: P1)

As a marketing strategist, I want the system to generate fresh article or page ideas for the selected project and hypothesis using project, hypothesis, UVP, and ICP context, so that suggestions reflect our positioning and buyer pains.

**Why this priority**: Without high-quality contextual prompts, generated ideas will not match the go-to-market narrative, making the feature unusable.

**Independent Test**: Populate project, hypothesis, Lean Canvas UVP, and ICP data; trigger idea generation for one category; review that returned ideas reference this context and appear in the correct category bucket.

**Acceptance Scenarios**:

1. **Given** a project with UVP, ICP (pains, goals, triggers, benefits, JTBD, CJM, objections), and a hypothesis description, **When** the user requests new article ideas, **Then** the system sends a prompt that references these data points and returns at least three distinct ideas tagged with the requested category.
2. **Given** a hypothesis without ICP data, **When** the user requests ideas, **Then** the system informs them which inputs are missing instead of generating low-quality placeholders.

---

### User Story 2 - Support multiple content formats (Priority: P2)

As a strategist, I want to choose whether the AI generates blog posts, commercial pages, FAQ entries, or informational articles, so that each idea aligns with the right funnel stage.

**Why this priority**: Different content types require different angles (e.g., commercial pages depend on clusters, FAQs on objections).

**Independent Test**: Request ideas for each format and verify that prompts and resulting suggestions use the correct inputs (pains/goals for blogs, clusters for commercial, objections for FAQ, JTBD/CJM for informational).

**Acceptance Scenarios**:

1. **Given** an ICP with documented pains and goals, **When** the user chooses "Blog article" generation, **Then** the returned ideas explicitly target those pains/goals and are stored under "Articles" (grouped by pain/goal/trigger/benefit/FAQ/info) without automatic backlog insertion.
2. **Given** cluster records for the hypothesis, **When** the user chooses "Commercial page" generation, **Then** ideas reference cluster keywords or intents and appear under the "Site pages" list until the user manually adds them to backlog.

---

### User Story 3 - Manage generation lifecycle (Priority: P3)

As a strategist, I want to see status, handle errors, and prevent accidental re-generation spam, so that the ideation workflow remains reliable.

**Why this priority**: AI calls cost money and take time; users need feedback and retry controls when something fails.

**Independent Test**: Simulate slow or failed OpenAPI responses to ensure the UI shows loading states, error messages, and throttle guards.

**Acceptance Scenarios**:

1. **Given** an OpenAPI error or timeout, **When** the user triggers idea generation, **Then** the UI displays an actionable error, logs the incident, and allows a retry after a cooldown period.
2. **Given** multiple rapid clicks on "Generate ideas", **When** the system is already processing a request, **Then** it prevents additional API calls and maintains a single pending state.

---

### Edge Cases

- Missing ICP segments (e.g., no triggers recorded) should gracefully omit that slice from the prompt while warning the user.
- Lean Canvas UVP not yet filled: system should fall back to project positioning summary if available; otherwise, block generation until filled.
- Rate limit or quota exhaustion from OpenAPI must present a specific message and log for operations to adjust usage.
- Translations/localization: if project language differs from English, prompt must include language instruction; when unknown, default to project language setting.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST assemble a prompt that includes project summary, hypothesis summary, Lean Canvas UVP, and ICP profile (pains, goals, triggers, benefits, JTBD, CJM, objections) before calling OpenAPI for idea generation.
- **FR-002**: The system MUST allow the user to request generation for each supported content type: blog article, commercial page, FAQ article, informational article.
- **FR-003**: For blog articles, the system MUST emphasize ICP pains/goals/triggers/benefits in the prompt and tag generated ideas into the appropriate pain/goal/trigger/benefit categories.
- **FR-004**: For commercial pages, the system MUST incorporate relevant SEO clusters (title, intent, keywords) into the prompt and store generated ideas in the "Site pages" section without applying article categories.
- **FR-011**: The content workspace MUST display AI-generated ideas in two sections: articles grouped by ICP categories (pain, goal, trigger, benefit, FAQ, info) and site pages listed without categories; moving an idea to backlog requires an explicit user action.
- **FR-005**: For FAQ articles, the system MUST leverage ICP objections/questions to produce Q&A style ideas, ensuring each idea contains a question and answer angle.
- **FR-006**: For informational articles, the system MUST draw from ICP JTBD and CJM insights to produce educational or awareness-stage angles.
- **FR-007**: The system MUST return at least three ideas per request (or the maximum allowed by prompt guardrails), display them in the content tab, and require an explicit user action (e.g., “Add to backlog”) before persisting any idea as a backlog item with metadata indicating the generation source and content type.
- **FR-008**: The system MUST display loading/progress states, handle API errors with clear user messaging, and enforce a throttle (e.g., one active request per 10 seconds per user) to avoid accidental spamming.
- **FR-009**: The system MUST log prompt inputs and responses (excluding sensitive tokens) for auditing and troubleshooting while adhering to security guidelines.
- **FR-010**: If required context is missing (project description, hypothesis description, UVP, ICP), the system MUST block the generation request and list which fields need completion.
- **FR-011**: The content workspace MUST display AI-generated ideas in two sections: articles grouped by ICP categories (pain, goal, trigger, benefit, FAQ, info) and site pages listed without categories; moving an idea to backlog requires an explicit user action.
- **FR-012**: The “Add custom piece” form MUST save both the manually entered title and outline as part of the idea queue (staying in the Content tab until the user explicitly moves it to backlog), keep the category list in sync with current article subcategories / site pages, and drop deprecated fields (e.g., Owner) so subsequent generations reuse the captured outline.

### Key Entities *(include if feature involves data)*

- **Project Context Snapshot**: Collated data view containing project description, Lean Canvas UVP, brand voice, and other positioning notes.
- **Hypothesis Context Snapshot**: Summary of the selected hypothesis including problem statement, target segment, and success metric.
- **ICP Profile**: Structured data capturing pains, goals, triggers, benefits, JTBD, CJM stages, and objection list tied to the hypothesis.
- **SEO Cluster**: Entity describing cluster title, intent, and keywords used to guide commercial page ideas.
- **Generated Idea**: Result object containing title, description/angle, recommended content type, linked source context, and AI provenance metadata.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 95% of generation requests with complete context return at least three usable ideas within 10 seconds in staging tests.
- **SC-002**: 100% of generated ideas include references to at least one contextual element (e.g., pain, cluster keyword) relevant to the selected content type during QA review.
- **SC-003**: Error handling covers 100% of simulated failure scenarios (missing data, API error, rate limit) with clear user-facing messaging and retry guidance.
- **SC-004**: At least 80% of beta user survey respondents report that AI-generated ideas are "relevant" or better after introducing the context-rich prompting.

### Assumptions

- OpenAPI (OpenAI) access and billing are already configured for the environment; this feature only consumes the API.
- Data sources (Lean Canvas UVP, ICP profile, SEO clusters) are maintained elsewhere and exposed via the existing backend.
- Content generation currently targets a single project/hypothesis context per request; multi-project batching remains out of scope for this phase.
