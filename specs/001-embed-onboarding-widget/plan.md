# Implementation Plan: Embeddable Onboarding Widget

**Branch**: `001-embed-onboarding-widget` | **Date**: 2025-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-embed-onboarding-widget/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Create an embeddable onboarding widget that can be integrated via iframe on external websites. The widget includes existing onboarding form fields (project description, start type, optional URL) plus an email field. When submitted, the system automatically creates accounts (or uses existing ones), generates secure passwords, sends them via email, and triggers project generation. The widget must handle existing users by checking subscription limits before creating projects.

**Technical Approach**: 
- Frontend: Standalone React widget component that can be embedded via iframe
- Backend: New GraphQL mutation for embedded onboarding submission
- Security: Secure password generation using Node.js crypto, iframe security headers (X-Frame-Options, CSP)
- Integration: Reuse existing project generation flow, subscription checking, and email service

## Technical Context

**Language/Version**: TypeScript 5.3.2 (Backend), TypeScript 5.5.3 (Frontend), Node.js 20  
**Primary Dependencies**: 
- Backend: Express 4.19.1, Apollo Server 4.10.1, Socket.IO 4.8.1, Mongoose 8.2.2, Mailtrap 3.3.0, bcrypt 5.1.1
- Frontend: React 18.3.1, Vite 5.4.1, Apollo Client 3.13.8, Socket.IO Client 4.8.1, React Router 6.26.2  
**Storage**: MongoDB (via Mongoose) for user accounts, projects, subscriptions  
**Testing**: Jest (Backend), NEEDS CLARIFICATION for widget integration testing  
**Target Platform**: Web (browser-based iframe widget), Linux server (Node.js backend)  
**Project Type**: Web application (frontend + backend)  
**Performance Goals**: 
- Widget form submission response < 30 seconds (SC-001)
- 95% success rate for account creation (SC-002)
- Email delivery within 2 minutes (SC-003)
- Widget loads correctly on 99% of embedding scenarios (SC-004)  
**Constraints**: 
- Must work across different host domains (CORS, iframe security)
- Must isolate widget CSS from host page
- Must handle existing users gracefully (subscription limit checks)
- Must generate secure passwords (cryptographically random)  
**Scale/Scope**: 
- Embeddable on any external website
- Supports existing user base + new lead generation
- Single widget component, reusable across multiple embedding scenarios

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Note**: The constitution file (`.specify/memory/constitution.md`) appears to be a template and does not contain specific project principles. Proceeding with standard best practices:

- ✅ **Security**: Secure password generation using cryptographically secure random number generator
- ✅ **Integration**: Reuse existing services (project generation, subscription checking, email service)
- ✅ **Isolation**: Widget must be isolated from host page styling and functionality
- ✅ **Error Handling**: Graceful handling of edge cases (existing users, subscription limits, network failures)
- ✅ **Testing**: Widget functionality must be testable independently

**Post-Phase 1 Re-check**: Will validate after design artifacts are complete.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
TRYGO-Backend/
├── src/
│   ├── resolvers/
│   │   └── embeddedOnboarding/          # New: GraphQL resolver for embedded widget
│   ├── services/
│   │   ├── EmbeddedOnboardingService.ts # New: Business logic for embedded onboarding
│   │   └── UserService.ts               # Existing: Extend for password generation
│   ├── utils/
│   │   └── password/
│   │       └── generateSecurePassword.ts # New: Secure password generation utility
│   ├── typeDefs/
│   │   └── embeddedOnboardingTypeDefs.graphql # New: GraphQL schema
│   └── routes/
│       └── embed-widget.ts             # New: Widget embed endpoint (optional, for iframe src)

TRYGO-Front/
├── src/
│   ├── components/
│   │   └── embedded-onboarding/        # New: Widget component directory
│   │       ├── EmbeddedOnboardingWidget.tsx
│   │       ├── EmbeddedOnboardingForm.tsx
│   │       └── EmbedCodeGenerator.tsx  # Optional: For generating embed codes
│   ├── pages/
│   │   └── embed/
│   │       └── widget.tsx              # New: Standalone widget page for iframe
│   └── api/
│       └── embeddedOnboarding.ts       # New: API client for widget submission
```

**Structure Decision**: Web application structure (Option 2) - separate frontend and backend. The widget will be a standalone React component/page that can be embedded via iframe. Backend will expose a new GraphQL mutation for embedded onboarding submissions. The widget component will be isolated in its own directory to maintain separation from the main application.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations identified. Implementation follows standard patterns:
- Reuses existing services and utilities
- Follows existing project structure
- No additional complexity beyond what's necessary for the feature
