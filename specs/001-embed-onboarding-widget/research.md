# Research: Embeddable Onboarding Widget

**Feature**: Embeddable Onboarding Widget  
**Date**: 2025-01-27  
**Phase**: 0 - Research & Discovery

## Research Questions

### 1. Secure Password Generation

**Question**: How to generate cryptographically secure passwords for auto-created accounts?

**Decision**: Use Node.js `crypto.randomBytes()` to generate secure random passwords

**Rationale**:
- Node.js `crypto` module provides cryptographically secure random number generation
- Standard approach for password generation in Node.js applications
- Can generate passwords of configurable length (recommended: 12-16 characters)
- Should include mix of uppercase, lowercase, numbers, and optionally special characters
- Must be stored hashed using existing bcrypt utility (same as manual registration)

**Implementation Approach**:
```typescript
import crypto from 'crypto';

function generateSecurePassword(length: number = 16): string {
  // Generate random bytes and convert to base64-like string
  // Include character set: A-Z, a-z, 0-9, optionally special chars
  // Ensure at least one of each type for security
}
```

**Alternatives Considered**:
- `Math.random()` - Rejected: Not cryptographically secure
- Third-party libraries (e.g., `generate-password`) - Considered but unnecessary complexity
- Predefined password patterns - Rejected: Security risk if predictable

**References**:
- Node.js crypto documentation: https://nodejs.org/api/crypto.html
- OWASP Password Storage Cheat Sheet

---

### 2. Iframe Embedding Best Practices

**Question**: How to create a secure, isolated iframe widget that works across domains?

**Decision**: Use standalone React page with iframe-friendly configuration and proper security headers

**Rationale**:
- Iframe embedding is standard for third-party widgets
- Requires proper CORS configuration on backend
- Widget page must be accessible from external domains
- Need to prevent CSS/JS conflicts with host page

**Implementation Approach**:
1. **Widget Page**: Create standalone React page (`/embed/widget`) that renders only the widget component
2. **CORS Configuration**: 
   - Backend must allow requests from any origin (for widget embedding)
   - Use existing CORS middleware, extend to support widget endpoint
   - Consider allowing specific origins in production for security
3. **Iframe Security**:
   - Use `sandbox` attribute for additional security (optional)
   - Set appropriate `X-Frame-Options` header (ALLOWALL for widget page only)
   - Use `Content-Security-Policy` to prevent XSS
4. **CSS Isolation**:
   - Use CSS-in-JS or scoped CSS (Tailwind with prefix)
   - Reset styles at widget root level
   - Use shadow DOM if needed (more complex, may not be necessary)

**Alternatives Considered**:
- Script-based embedding (like Google Analytics) - Rejected: More complex, requires host page modification
- Web Components - Considered but adds complexity, iframe is simpler
- Popup/modal approach - Rejected: Doesn't meet "embedded" requirement

**References**:
- MDN: Iframe security best practices
- OWASP: Content Security Policy
- React: Embedding React apps

---

### 3. CORS and Security Headers for Widget

**Question**: What CORS and security headers are needed for iframe widget embedding?

**Decision**: Configure CORS to allow widget endpoint, set appropriate security headers per endpoint

**Rationale**:
- Widget endpoint must be accessible from any origin (for embedding)
- Main API endpoints should maintain existing CORS restrictions
- Security headers must balance accessibility with security

**Implementation Approach**:
1. **CORS for Widget Endpoint**:
   - Allow all origins for `/embed/widget` page (GET request)
   - Allow all origins for embedded onboarding GraphQL mutation (POST request)
   - Maintain existing CORS for other endpoints
2. **Security Headers**:
   - `X-Frame-Options: ALLOWALL` for widget page only
   - `Content-Security-Policy` for widget page (allow self, prevent inline scripts)
   - `X-Content-Type-Options: nosniff`
   - Keep existing security headers for main application
3. **GraphQL Endpoint**:
   - Widget will use same GraphQL endpoint as main app
   - CORS middleware should allow widget requests
   - Authentication not required for embedded onboarding (creates account)

**Alternatives Considered**:
- Separate API endpoint for widget - Considered but adds complexity
- API keys for widget - Considered for future, not needed for MVP
- Whitelist specific domains - Considered for production, allow all for MVP

**References**:
- Express CORS middleware documentation
- OWASP: HTTP Security Headers
- Current CORS configuration in `TRYGO-Backend/src/server.ts`

---

### 4. Widget CSS Isolation

**Question**: How to prevent CSS conflicts between widget and host page?

**Decision**: Use CSS reset at widget root, scoped Tailwind classes, and iframe isolation

**Rationale**:
- Iframe provides natural CSS isolation (separate document)
- Additional scoping ensures no conflicts
- Tailwind CSS can be configured with prefix for widget
- CSS reset ensures consistent appearance

**Implementation Approach**:
1. **Iframe Isolation**: Primary isolation mechanism (separate document context)
2. **CSS Reset**: Apply reset styles to widget root element
3. **Tailwind Prefix**: Configure Tailwind with prefix (e.g., `tw-`) for widget components
4. **Scoped Styles**: Use CSS modules or styled-components if needed
5. **Viewport Meta**: Ensure responsive meta tag in widget page

**Alternatives Considered**:
- Shadow DOM - Considered but adds complexity, iframe provides sufficient isolation
- Inline styles only - Rejected: Not maintainable
- Completely separate CSS file - Considered but Tailwind with prefix is simpler

**References**:
- Tailwind CSS: Configuration with prefix
- CSS Reset libraries (normalize.css, modern-css-reset)
- Iframe isolation documentation

---

### 5. Existing User Handling and Subscription Limits

**Question**: How to check subscription limits and handle existing users in widget flow?

**Decision**: Reuse existing `checkIfProjectGenerationAllowed()` utility and extend UserService

**Rationale**:
- Existing subscription checking logic is already implemented
- Should reuse to maintain consistency
- Need to handle case where user exists but limit is reached
- Should not create duplicate accounts

**Implementation Approach**:
1. **Check Email Existence**: Use existing `getUserByEmailDefault()` from UserService
2. **Subscription Check**: Use existing `checkIfProjectGenerationAllowed(userId)` utility
3. **Flow Logic**:
   - If email exists → Check subscription limits → Create project if allowed OR return error
   - If email doesn't exist → Create account → Generate password → Send email → Create project
4. **Error Messages**: Return user-friendly error messages for limit reached scenarios

**Alternatives Considered**:
- Separate subscription check endpoint - Rejected: Unnecessary, reuse existing
- Skip limit check for widget - Rejected: Violates business rules
- Create account anyway and handle limit later - Rejected: Poor UX

**References**:
- Existing code: `TRYGO-Backend/src/utils/subscription/checkIfProjectGenerationAllowed.ts`
- Existing code: `TRYGO-Backend/src/services/UserService.ts`

---

### 6. Email Template for Password Delivery

**Question**: What email template and content should be used for password delivery?

**Decision**: Create new Mailtrap template for embedded onboarding password delivery

**Rationale**:
- Existing password reset template exists but context is different
- Need template specific to embedded onboarding flow
- Should include: generated password, login instructions, welcome message

**Implementation Approach**:
1. **Create Mailtrap Template**: New template for "Embedded Onboarding Password"
2. **Template Variables**:
   - `password`: Generated secure password
   - `email`: User's email address
   - `loginUrl`: Link to login page
3. **Content**: 
   - Welcome message explaining account was created via widget
   - Generated password (clearly displayed)
   - Instructions to log in
   - Security note about changing password (optional)
4. **Reuse Email Service**: Use existing `sendEmailWithTemplateNoSubject()` utility

**Alternatives Considered**:
- Reuse password reset template - Considered but context mismatch
- Plain text email - Rejected: Poor UX, existing system uses templates
- Separate email service - Rejected: Unnecessary, Mailtrap works

**References**:
- Existing code: `TRYGO-Backend/src/utils/email/mailTrapUtils.ts`
- Mailtrap template documentation

---

### 7. Project Generation Trigger for Embedded Onboarding

**Question**: How to trigger project generation for embedded onboarding without user authentication?

**Decision**: Extend existing project generation flow to support programmatic triggering with userId

**Rationale**:
- Existing `generateProject` function requires socket connection (user-initiated)
- Need programmatic trigger after account creation
- Can reuse project creation logic but trigger generation differently

**Implementation Approach**:
1. **Option A**: Create project via `projectService.createProject()` then trigger generation via existing flow
2. **Option B**: Create new service method that combines account creation + project creation + generation trigger
3. **Recommended**: Option B - Create `EmbeddedOnboardingService.submitOnboarding()` that:
   - Checks/creates user account
   - Checks subscription limits
   - Creates project
   - Triggers generation (reuse existing generation logic, adapt for non-socket context)
   - Sends password email (if new user)

**Alternatives Considered**:
- Require user to log in first - Rejected: Defeats purpose of embedded widget
- Defer generation until login - Considered but poor UX
- Use existing socket flow with temporary token - Considered but complex

**References**:
- Existing code: `TRYGO-Backend/src/utils/socketIO/generateProject.ts`
- Existing code: `TRYGO-Backend/src/services/ProjectService.ts`

---

## Summary of Decisions

1. **Password Generation**: Node.js `crypto.randomBytes()` with character set mixing
2. **Iframe Embedding**: Standalone React page with proper CORS and security headers
3. **CORS Configuration**: Allow all origins for widget endpoints, maintain restrictions for main app
4. **CSS Isolation**: Iframe + CSS reset + Tailwind prefix
5. **Existing Users**: Reuse subscription checking, handle gracefully with clear errors
6. **Email Template**: New Mailtrap template for embedded onboarding password
7. **Project Generation**: New service method that programmatically triggers generation

## Open Questions Resolved

- ✅ Password generation method: `crypto.randomBytes()`
- ✅ Iframe embedding approach: Standalone React page
- ✅ CORS configuration: Allow all for widget, restrict for main app
- ✅ CSS isolation: Iframe + reset + Tailwind prefix
- ✅ Existing user handling: Reuse subscription checks
- ✅ Email delivery: New Mailtrap template
- ✅ Project generation trigger: New service method

## Next Steps

Proceed to Phase 1: Design & Contracts
- Create data model for embedded onboarding submission
- Design GraphQL mutation for widget submission
- Define API contracts
- Create quickstart guide
