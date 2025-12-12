# Feature Specification: Embeddable Onboarding Widget

**Feature Branch**: `001-embed-onboarding-widget`  
**Created**: 2025-01-27  
**Status**: Draft  
**Input**: User description: "I want to embed an onboarding widget on external sites via iframe. The widget should include the existing onboarding form fields (project description, start type, URL if importing) plus an email field. When a user completes the form, an account should be automatically created for them, the project generation flow should be triggered, and a password should be sent to their email. This creates a lead magnet that can be embedded anywhere on our site."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Complete Onboarding via Embedded Widget (Priority: P1)

A visitor on an external website encounters an embedded onboarding widget. They fill out the form with their project description, choose how to start (from scratch or import from URL), optionally provide a website URL, and enter their email address. Upon submission, the system automatically creates an account for them, triggers project generation, and sends a password to their email. The user receives immediate feedback that their request is being processed.

**Why this priority**: This is the core value proposition - enabling lead capture and automatic account creation through an embeddable widget. Without this, the feature has no purpose.

**Independent Test**: Can be fully tested by embedding the widget on a test page, completing the form with valid data, and verifying that an account is created, generation starts, and password email is sent. This delivers immediate lead capture capability.

**Acceptance Scenarios**:

1. **Given** a visitor is on an external website with the embedded widget, **When** they fill out all required fields (project description, start type, email) and submit, **Then** an account is created, project generation is triggered, and a password is sent to their email
2. **Given** a visitor selects "Import from website" option, **When** they provide a valid URL and submit, **Then** the system uses the URL in project generation
3. **Given** a visitor enters an email that already exists in the system, **When** they submit the form and their subscription allows creating more projects, **Then** a new project is created for their existing account and generation is triggered
4. **Given** a visitor enters an email that already exists in the system, **When** they submit the form but their subscription limit is reached, **Then** they see an appropriate message explaining the limit and are not prompted to create a new account
5. **Given** a visitor completes the form, **When** they submit, **Then** they see a confirmation message indicating their request is being processed

---

### User Story 1b - Existing User Project Creation (Priority: P1)

An existing user encounters the embedded onboarding widget on an external website. They fill out the form with their project description and email (which already exists in the system). The system recognizes the existing account, checks their subscription limits, and either creates a new project (if limits allow) or displays an appropriate message if they've reached their limit.

**Why this priority**: This is a critical edge case that affects user experience. Existing users should be able to use the widget seamlessly if their subscription allows, or receive clear feedback if it doesn't.

**Independent Test**: Can be fully tested by submitting the widget form with an existing email address and verifying that the system correctly checks limits, creates projects when allowed, or shows appropriate error messages when limits are reached. This delivers proper handling of existing user scenarios.

**Acceptance Scenarios**:

1. **Given** an existing user with available project slots in their subscription, **When** they submit the widget form with their email, **Then** a new project is created and generation is triggered without creating a duplicate account
2. **Given** an existing user who has reached their project limit, **When** they submit the widget form, **Then** they see a clear message explaining their subscription limit and no project is created
3. **Given** an existing user submits the widget form, **When** the system processes it, **Then** no password email is sent (since they already have an account)

---

### User Story 2 - Widget Embedding and Display (Priority: P1)

A website owner wants to embed the onboarding widget on their site. They receive an embed code (iframe snippet) that they can place anywhere on their page. The widget displays correctly, maintains responsive design, and functions independently of the host page's styling.

**Why this priority**: Without the ability to embed the widget, the feature cannot be used. This is a foundational requirement.

**Independent Test**: Can be fully tested by creating an HTML page with the iframe embed code and verifying the widget loads, displays correctly, and functions independently. This delivers the embedding capability.

**Acceptance Scenarios**:

1. **Given** a website owner has the embed code, **When** they insert it into their HTML page, **Then** the widget loads and displays correctly
2. **Given** the widget is embedded, **When** the page loads, **Then** the widget maintains its styling and functionality regardless of host page CSS
3. **Given** the widget is embedded in a responsive page, **When** the page is viewed on different screen sizes, **Then** the widget adapts appropriately

---

### User Story 3 - Password Delivery and Account Access (Priority: P2)

A user who completed the embedded onboarding form receives an email with their automatically generated password. They can use this password along with their email to log into the system and access their generated project.

**Why this priority**: Users need to access their accounts after the initial onboarding. This completes the user journey.

**Independent Test**: Can be fully tested by completing the widget form, receiving the email, and successfully logging in with the provided credentials. This delivers account access capability.

**Acceptance Scenarios**:

1. **Given** a user has completed the embedded onboarding form, **When** the account is created, **Then** an email with the generated password is sent to their email address
2. **Given** a user receives the password email, **When** they use the email and password to log in, **Then** they successfully access their account
3. **Given** a user receives the password email, **When** they view the email, **Then** it contains clear instructions on how to log in

---

### Edge Cases

- What happens when a user submits the form with an invalid email format?
- How does the system handle network failures during form submission?
- What happens if project generation fails after account creation?
- How does the system handle duplicate email submissions (same email used multiple times)?
- What happens when an existing user submits the form but has reached their project limit?
- How does the system determine subscription limits for existing users?
- What happens if the email service is unavailable when trying to send the password?
- How does the widget handle iframe security restrictions (X-Frame-Options, CSP)?
- What happens when a user submits the form multiple times quickly?
- How does the system handle very long project descriptions?
- What happens if the URL provided for import is invalid or unreachable?
- How does the widget behave when embedded in a page with strict Content Security Policy?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide an embeddable widget that can be integrated via iframe on external websites
- **FR-002**: Widget MUST include all existing onboarding form fields: project start type (from scratch or import from URL), project description, optional URL field (when importing)
- **FR-003**: Widget MUST include an email field for account creation
- **FR-004**: System MUST validate email format before processing the form submission
- **FR-005**: System MUST automatically generate a secure password when a new account is created through the widget
- **FR-006**: System MUST send the generated password to the user's email address immediately after account creation
- **FR-007**: System MUST automatically trigger project generation flow after account creation, using the provided onboarding data
- **FR-008**: System MUST check if email already exists in the system before creating a new account
- **FR-009**: System MUST check subscription limits for existing users before creating a project
- **FR-010**: System MUST create a project for existing users if their subscription allows (based on current project count and plan limits)
- **FR-011**: System MUST display an appropriate error message when an existing user's subscription limit prevents project creation
- **FR-012**: System MUST NOT send password email to existing users (only to newly created accounts)
- **FR-013**: Widget MUST display a confirmation message to users after successful form submission
- **FR-014**: Widget MUST handle and display error messages for failed submissions, including subscription limit messages
- **FR-015**: Widget MUST be responsive and maintain functionality across different screen sizes
- **FR-016**: Widget MUST be isolated from host page styling to prevent CSS conflicts
- **FR-017**: System MUST track the source/origin of accounts created through the embedded widget
- **FR-018**: Email sent to new users MUST include the generated password and instructions for logging in
- **FR-019**: System MUST validate project description meets minimum length requirements (same as current onboarding)
- **FR-020**: System MUST validate URL format when "Import from website" option is selected
- **FR-021**: Widget MUST support embedding on any external domain (with appropriate security measures)

### Key Entities *(include if feature involves data)*

- **Embedded Onboarding Submission**: Represents a form submission from the embedded widget, containing project description, start type, optional URL, email address, and metadata about the embedding source
- **Auto-Generated Account**: Represents a user account created automatically through the widget, linked to the email provided, with a system-generated password that is sent via email
- **Widget Embed Configuration**: Represents the configuration needed to embed the widget (embed code, iframe URL, security settings)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete the embedded onboarding form and receive account creation confirmation in under 30 seconds
- **SC-002**: 95% of valid form submissions result in successful account creation and password email delivery
- **SC-003**: Password emails are delivered to users within 2 minutes of form submission
- **SC-004**: Widget loads and displays correctly on 99% of test embedding scenarios (different browsers, devices, host page configurations)
- **SC-005**: 90% of users who receive password emails successfully log in on their first attempt
- **SC-006**: Project generation is triggered automatically for 100% of successfully created accounts and for existing users when subscription limits allow
- **SC-007**: Widget maintains responsive design and functionality across desktop, tablet, and mobile viewports
- **SC-008**: System handles duplicate email submissions gracefully without creating multiple accounts or showing confusing errors
- **SC-009**: Existing users with available subscription limits receive project creation confirmation within 30 seconds
- **SC-010**: Existing users who have reached subscription limits receive clear, actionable error messages explaining the limit

## Assumptions

- The existing project generation flow can be triggered programmatically (not requiring user authentication at the time of trigger)
- The email service (Mailtrap) is available and configured for sending password emails
- The widget will be embedded on external domains, requiring appropriate CORS and iframe security configurations
- Users understand they will receive a password via email and need to use it to log in
- The existing onboarding form validation rules (minimum description length, URL format) apply to the embedded widget
- The widget should use the same project generation flow as the main application
- Accounts created through the widget follow the same free trial and subscription rules as manually created accounts
- Existing users' subscription limits are checked using the same logic as the main application (FREE: 1 project, STARTER: 1 project, PRO: 50 projects)
- When an existing user submits the widget form, the system checks their current project count against their subscription plan limits before creating a new project

## Dependencies

- Existing project generation service and flow
- Email service (Mailtrap) for password delivery
- User registration/authentication system
- Subscription service for checking project creation limits
- Onboarding form validation logic
- Iframe embedding infrastructure and security configurations
