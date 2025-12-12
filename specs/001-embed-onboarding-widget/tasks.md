# Tasks: Embeddable Onboarding Widget

**Input**: Design documents from `/specs/001-embed-onboarding-widget/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are optional and not included in this task list. Add test tasks if TDD approach is desired.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `TRYGO-Backend/src/`
- **Frontend**: `TRYGO-Front/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create directory structure for embedded onboarding feature in TRYGO-Backend/src/resolvers/embeddedOnboarding/
- [ ] T002 Create directory structure for embedded onboarding feature in TRYGO-Front/src/components/embedded-onboarding/
- [ ] T003 Create directory structure for embedded onboarding feature in TRYGO-Front/src/pages/embed/
- [ ] T004 [P] Create directory structure for password utilities in TRYGO-Backend/src/utils/password/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 [P] Create secure password generation utility in TRYGO-Backend/src/utils/password/generateSecurePassword.ts using Node.js crypto.randomBytes()
- [ ] T006 [P] Extend UserService to support password generation in TRYGO-Backend/src/services/UserService.ts (add method for auto-generated accounts)
- [ ] T007 [P] Create Mailtrap email template for embedded onboarding password delivery (external: Mailtrap dashboard)
- [ ] T008 Update mailTrapTemplates constant to include new embedded onboarding password template in TRYGO-Backend/src/constants/mailTrapTemplates.ts
- [ ] T009 Create email sending utility for embedded onboarding passwords in TRYGO-Backend/src/utils/email/embeddedOnboardingEmail.ts
- [ ] T010 Verify CORS configuration allows widget endpoint requests in TRYGO-Backend/src/server.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 2 - Widget Embedding and Display (Priority: P1) 🎯 MVP Foundation

**Goal**: Enable embedding of the onboarding widget via iframe on external websites. The widget must display correctly, maintain responsive design, and function independently of host page styling.

**Independent Test**: Create an HTML test page with the iframe embed code. Verify the widget loads, displays correctly, maintains its styling regardless of host page CSS, and adapts to different screen sizes.

### Implementation for User Story 2

- [ ] T011 [P] [US2] Create standalone widget page component in TRYGO-Front/src/pages/embed/widget.tsx
- [ ] T012 [P] [US2] Create embedded onboarding widget component in TRYGO-Front/src/components/embedded-onboarding/EmbeddedOnboardingWidget.tsx
- [ ] T013 [P] [US2] Create embedded onboarding form component in TRYGO-Front/src/components/embedded-onboarding/EmbeddedOnboardingForm.tsx with fields: email, startType, info, url (conditional)
- [ ] T014 [US2] Add route for widget page in TRYGO-Front/src/App.tsx or router configuration (path: /embed/widget)
- [ ] T015 [US2] Configure CSS isolation for widget (CSS reset, Tailwind prefix, scoped styles) in TRYGO-Front/src/pages/embed/widget.tsx
- [ ] T016 [US2] Add responsive design support for widget in TRYGO-Front/src/components/embedded-onboarding/EmbeddedOnboardingWidget.tsx
- [ ] T017 [US2] Configure iframe security headers (X-Frame-Options: ALLOWALL) for widget page in TRYGO-Backend/src/server.ts or middleware
- [ ] T018 [US2] Add Content-Security-Policy header for widget page in TRYGO-Backend/src/server.ts

**Checkpoint**: At this point, User Story 2 should be fully functional - widget can be embedded and displays correctly

---

## Phase 4: User Story 1 - Complete Onboarding via Embedded Widget (Priority: P1) 🎯 MVP Core

**Goal**: Enable visitors on external websites to complete onboarding via embedded widget. System automatically creates accounts (or uses existing ones), generates secure passwords, sends them via email, and triggers project generation. Handles both new users and existing users with subscription limit checks.

**Independent Test**: Embed widget on test page, complete form with valid data (new email). Verify: account created, password email sent, project created, generation triggered. Test with existing email (with available slots) - verify project created without duplicate account. Test with existing email (at limit) - verify error message displayed.

### Implementation for User Story 1

- [ ] T019 [P] [US1] Create GraphQL schema for embedded onboarding in TRYGO-Backend/src/typeDefs/embeddedOnboardingTypeDefs.graphql (input, response types, mutation)
- [ ] T020 [P] [US1] Create EmbeddedOnboardingService in TRYGO-Backend/src/services/EmbeddedOnboardingService.ts with submitOnboarding method
- [ ] T021 [US1] Implement email existence check in EmbeddedOnboardingService.submitOnboarding() in TRYGO-Backend/src/services/EmbeddedOnboardingService.ts
- [ ] T022 [US1] Implement new account creation flow (generate password, hash, create user) in EmbeddedOnboardingService.submitOnboarding() in TRYGO-Backend/src/services/EmbeddedOnboardingService.ts
- [ ] T023 [US1] Implement existing user handling (check subscription limits) in EmbeddedOnboardingService.submitOnboarding() in TRYGO-Backend/src/services/EmbeddedOnboardingService.ts
- [ ] T024 [US1] Implement subscription limit check using existing checkIfProjectGenerationAllowed utility in EmbeddedOnboardingService.submitOnboarding() in TRYGO-Backend/src/services/EmbeddedOnboardingService.ts
- [ ] T025 [US1] Implement project creation for new and existing users in EmbeddedOnboardingService.submitOnboarding() in TRYGO-Backend/src/services/EmbeddedOnboardingService.ts
- [ ] T026 [US1] Implement programmatic project generation trigger (adapt existing generateProject flow) in EmbeddedOnboardingService.submitOnboarding() in TRYGO-Backend/src/services/EmbeddedOnboardingService.ts
- [ ] T027 [US1] Implement password email sending for new accounts in EmbeddedOnboardingService.submitOnboarding() in TRYGO-Backend/src/services/EmbeddedOnboardingService.ts
- [ ] T028 [US1] Implement error handling for subscription limit reached scenario in EmbeddedOnboardingService.submitOnboarding() in TRYGO-Backend/src/services/EmbeddedOnboardingService.ts
- [ ] T029 [US1] Create GraphQL resolver for submitEmbeddedOnboarding mutation in TRYGO-Backend/src/resolvers/embeddedOnboarding/embeddedOnboardingResolver.ts
- [ ] T030 [US1] Register embedded onboarding resolver in GraphQL server setup in TRYGO-Backend/src/server.ts
- [ ] T031 [US1] Register embedded onboarding typeDefs in GraphQL server setup in TRYGO-Backend/src/server.ts
- [ ] T032 [P] [US1] Create API client for embedded onboarding submission in TRYGO-Front/src/api/embeddedOnboarding.ts
- [ ] T033 [US1] Integrate API client with EmbeddedOnboardingForm component in TRYGO-Front/src/components/embedded-onboarding/EmbeddedOnboardingForm.tsx
- [ ] T034 [US1] Implement form validation (email format, description length, URL format) in TRYGO-Front/src/components/embedded-onboarding/EmbeddedOnboardingForm.tsx
- [ ] T035 [US1] Implement success message display after form submission in TRYGO-Front/src/components/embedded-onboarding/EmbeddedOnboardingForm.tsx
- [ ] T036 [US1] Implement error message display (including subscription limit errors) in TRYGO-Front/src/components/embedded-onboarding/EmbeddedOnboardingForm.tsx
- [ ] T037 [US1] Add loading state during form submission in TRYGO-Front/src/components/embedded-onboarding/EmbeddedOnboardingForm.tsx
- [ ] T038 [US1] Add embedSource tracking (optional field from iframe referrer) in TRYGO-Front/src/api/embeddedOnboarding.ts

**Checkpoint**: At this point, User Story 1 should be fully functional - widget can capture leads, create accounts, send passwords, and trigger project generation

---

## Phase 5: User Story 3 - Password Delivery and Account Access (Priority: P2)

**Goal**: Ensure users who complete embedded onboarding receive password emails and can successfully log in to access their generated projects.

**Independent Test**: Complete widget form with new email, receive password email, use email and password to log in, verify successful access to account and generated project.

### Implementation for User Story 3

- [ ] T039 [US3] Verify email template includes generated password, login instructions, and welcome message (external: Mailtrap template review)
- [ ] T040 [US3] Verify email template includes login URL in TRYGO-Backend/src/utils/email/embeddedOnboardingEmail.ts
- [ ] T041 [US3] Test email delivery flow end-to-end (create account via widget, verify email received) in TRYGO-Backend/src/services/EmbeddedOnboardingService.ts
- [ ] T042 [US3] Verify existing login flow works with auto-generated passwords in TRYGO-Backend/src/services/AuthService.ts (no changes needed, verify compatibility)
- [ ] T043 [US3] Add logging for password email delivery success/failure in TRYGO-Backend/src/services/EmbeddedOnboardingService.ts

**Checkpoint**: At this point, User Story 3 should be complete - password emails are delivered and users can log in

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T044 [P] Add source tracking to User model (optional field: source: "embedded_widget") in TRYGO-Backend/src/models/UserModel.ts
- [ ] T045 [P] Add analytics tracking for widget submissions (success/failure rates) in TRYGO-Backend/src/services/EmbeddedOnboardingService.ts
- [ ] T046 [P] Add error logging for all error scenarios in TRYGO-Backend/src/services/EmbeddedOnboardingService.ts
- [ ] T047 [P] Add input sanitization and validation edge case handling in TRYGO-Backend/src/services/EmbeddedOnboardingService.ts
- [ ] T048 [P] Add rate limiting consideration for widget endpoint (document or implement) in TRYGO-Backend/src/server.ts
- [ ] T049 [P] Verify widget works across different browsers (Chrome, Firefox, Safari, Edge) in TRYGO-Front/src/components/embedded-onboarding/
- [ ] T050 [P] Verify widget works on mobile devices (responsive design) in TRYGO-Front/src/components/embedded-onboarding/EmbeddedOnboardingWidget.tsx
- [ ] T051 [P] Create embed code documentation/example in docs/ or README
- [ ] T052 [P] Run quickstart.md validation checklist
- [ ] T053 [P] Code cleanup and refactoring across all embedded onboarding files
- [ ] T054 [P] Update main application documentation to mention embedded widget feature

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 2 (Phase 3)**: Depends on Foundational completion - Must complete before User Story 1 (widget must exist before it can be used)
- **User Story 1 (Phase 4)**: Depends on Foundational AND User Story 2 completion - Core feature requires widget to exist
- **User Story 3 (Phase 5)**: Depends on User Story 1 completion - Password delivery is part of account creation flow
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories. **MUST complete before User Story 1**
- **User Story 1 (P1)**: Depends on Foundational (Phase 2) AND User Story 2 (Phase 3) - Requires widget to exist first
- **User Story 1b (Existing User)**: Part of User Story 1 implementation - Handled within Phase 4 tasks
- **User Story 3 (P2)**: Depends on User Story 1 completion - Password delivery happens during account creation

### Within Each User Story

- Models/utilities before services
- Services before resolvers/API
- Resolvers/API before frontend integration
- Core implementation before error handling
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks (T001-T004) can run in parallel
- Foundational tasks T005-T009 can run in parallel (different files)
- User Story 2 tasks T011-T013 can run in parallel (different components)
- User Story 1 tasks T019-T020, T032 can run in parallel (schema, service, API client)
- Polish tasks T044-T054 can all run in parallel (different concerns)

---

## Parallel Example: User Story 2

```bash
# Launch all component creation tasks together:
Task: "Create standalone widget page component in TRYGO-Front/src/pages/embed/widget.tsx"
Task: "Create embedded onboarding widget component in TRYGO-Front/src/components/embedded-onboarding/EmbeddedOnboardingWidget.tsx"
Task: "Create embedded onboarding form component in TRYGO-Front/src/components/embedded-onboarding/EmbeddedOnboardingForm.tsx"
```

---

## Parallel Example: User Story 1

```bash
# Launch schema, service, and API client together:
Task: "Create GraphQL schema for embedded onboarding in TRYGO-Backend/src/typeDefs/embeddedOnboardingTypeDefs.graphql"
Task: "Create EmbeddedOnboardingService in TRYGO-Backend/src/services/EmbeddedOnboardingService.ts"
Task: "Create API client for embedded onboarding submission in TRYGO-Front/src/api/embeddedOnboarding.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 2 + 1)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 2 (Widget Embedding) - **MUST complete first**
4. Complete Phase 4: User Story 1 (Complete Onboarding) - Core feature
5. **STOP and VALIDATE**: Test widget embedding and onboarding flow independently
6. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 2 → Test independently → Widget can be embedded (foundation complete)
3. Add User Story 1 → Test independently → Full onboarding flow works (MVP!)
4. Add User Story 3 → Test independently → Password delivery verified
5. Add Polish → Final refinements
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 2 (Widget Embedding) - **Must complete first**
   - Developer B: Prepares for User Story 1 (can start schema/service in parallel)
3. Once User Story 2 is complete:
   - Developer A: User Story 1 (Complete Onboarding)
   - Developer B: User Story 3 (Password Delivery) - can start after US1 core is done
4. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- User Story 2 (Widget Embedding) MUST be completed before User Story 1 (Complete Onboarding)
- User Story 1b (Existing User) is implemented as part of User Story 1 tasks
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- Widget endpoint CORS must allow all origins (or configured whitelist in production)
- Password generation uses Node.js crypto.randomBytes() for security
- Email template must be created in Mailtrap dashboard before email sending works

---

## Task Summary

- **Total Tasks**: 54
- **Phase 1 (Setup)**: 4 tasks
- **Phase 2 (Foundational)**: 6 tasks
- **Phase 3 (User Story 2)**: 8 tasks
- **Phase 4 (User Story 1)**: 20 tasks
- **Phase 5 (User Story 3)**: 5 tasks
- **Phase 6 (Polish)**: 11 tasks

**MVP Scope**: Phases 1-4 (User Stories 2 + 1) = 38 tasks

**Parallel Opportunities**: 
- Setup: 4 parallel tasks
- Foundational: 6 parallel tasks
- User Story 2: 3 parallel component tasks
- User Story 1: 3 parallel tasks (schema, service, API client)
- Polish: 11 parallel tasks
