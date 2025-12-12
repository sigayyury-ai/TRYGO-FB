# Quickstart: Embeddable Onboarding Widget

**Feature**: Embeddable Onboarding Widget  
**Date**: 2025-01-27

## Overview

The Embeddable Onboarding Widget allows external websites to embed a lead capture form that automatically creates user accounts, generates projects, and sends passwords via email. The widget can be embedded on any website via iframe.

## Architecture

```
External Website
  ↓ (iframe)
Widget Page (/embed/widget)
  ↓ (GraphQL mutation)
Backend API
  ↓
- Check/Create User Account
- Generate Secure Password
- Send Email
- Create Project
- Trigger Generation
```

## Key Components

### Frontend

1. **Widget Component** (`TRYGO-Front/src/components/embedded-onboarding/EmbeddedOnboardingWidget.tsx`)
   - Standalone React component
   - Form with: email, start type, description, optional URL
   - Handles submission and error display

2. **Widget Page** (`TRYGO-Front/src/pages/embed/widget.tsx`)
   - Standalone page for iframe embedding
   - Renders widget component
   - Isolated CSS/styling

### Backend

1. **GraphQL Mutation** (`submitEmbeddedOnboarding`)
   - Accepts embedded onboarding input
   - Returns response with success/error status

2. **Service** (`TRYGO-Backend/src/services/EmbeddedOnboardingService.ts`)
   - Business logic for processing submissions
   - Handles account creation, password generation, project creation

3. **Password Utility** (`TRYGO-Backend/src/utils/password/generateSecurePassword.ts`)
   - Generates cryptographically secure passwords

## Setup Steps

### 1. Backend Setup

#### Create Password Generation Utility

```typescript
// TRYGO-Backend/src/utils/password/generateSecurePassword.ts
import crypto from 'crypto';

export function generateSecurePassword(length: number = 16): string {
  // Implementation: Generate secure random password
  // Include: uppercase, lowercase, numbers, optionally special chars
}
```

#### Create Embedded Onboarding Service

```typescript
// TRYGO-Backend/src/services/EmbeddedOnboardingService.ts
class EmbeddedOnboardingService {
  async submitOnboarding(input: EmbeddedOnboardingInput): Promise<EmbeddedOnboardingResponse> {
    // 1. Validate input
    // 2. Check if email exists
    // 3. If new: Create account, generate password, send email
    // 4. Check subscription limits
    // 5. Create project
    // 6. Trigger generation
    // 7. Return response
  }
}
```

#### Add GraphQL Schema

```graphql
# TRYGO-Backend/src/typeDefs/embeddedOnboardingTypeDefs.graphql
# (See contracts/embeddedOnboarding.graphql)
```

#### Create GraphQL Resolver

```typescript
// TRYGO-Backend/src/resolvers/embeddedOnboarding/embeddedOnboardingResolver.ts
export const embeddedOnboardingResolvers = {
  Mutation: {
    submitEmbeddedOnboarding: async (_, { input }, context) => {
      return await embeddedOnboardingService.submitOnboarding(input);
    }
  }
};
```

#### Update CORS Configuration

```typescript
// TRYGO-Backend/src/server.ts
// Ensure CORS allows requests from any origin for widget endpoint
// Widget will use same GraphQL endpoint, so CORS should already handle it
```

### 2. Frontend Setup

#### Create Widget Component

```typescript
// TRYGO-Front/src/components/embedded-onboarding/EmbeddedOnboardingWidget.tsx
export const EmbeddedOnboardingWidget: FC = () => {
  // Form with: email, startType, info, url (conditional)
  // Submit handler calls GraphQL mutation
  // Display success/error messages
};
```

#### Create Widget Page

```typescript
// TRYGO-Front/src/pages/embed/widget.tsx
export const EmbedWidgetPage: FC = () => {
  return (
    <div className="embed-widget-container">
      <EmbeddedOnboardingWidget />
    </div>
  );
};
```

#### Add Route

```typescript
// TRYGO-Front/src/App.tsx or router config
<Route path="/embed/widget" element={<EmbedWidgetPage />} />
```

#### Create API Client

```typescript
// TRYGO-Front/src/api/embeddedOnboarding.ts
export const submitEmbeddedOnboardingMutation = (variables) => {
  // GraphQL mutation for submitEmbeddedOnboarding
};
```

### 3. Email Template Setup

1. Create Mailtrap template: "Embedded Onboarding Password"
2. Template variables: `password`, `email`, `loginUrl`
3. Update `mailTrapTemplates` constant to include new template

### 4. Testing

#### Test New User Flow
1. Embed widget on test page
2. Submit form with new email
3. Verify: Account created, password email sent, project created, generation triggered

#### Test Existing User Flow (Limit Available)
1. Submit form with existing email (with available project slots)
2. Verify: No new account, project created, no password email

#### Test Existing User Flow (Limit Reached)
1. Submit form with existing email (at project limit)
2. Verify: Error message displayed, no project created

## Embedding the Widget

### Embed Code

```html
<iframe 
  src="https://your-domain.com/embed/widget" 
  width="100%" 
  height="600" 
  frameborder="0"
  style="border: none;">
</iframe>
```

### Customization (Future)

- Width/height parameters via URL query
- Theme customization via URL parameters
- Custom success/error messages

## Security Considerations

1. **Password Generation**: Uses cryptographically secure random number generator
2. **CORS**: Widget endpoint allows all origins (consider restricting in production)
3. **Input Validation**: All inputs validated (email format, URL format, description length)
4. **Rate Limiting**: Consider adding rate limiting to prevent abuse
5. **Email Validation**: Uses existing email validation (Bouncer API if configured)

## Monitoring & Analytics

- Track widget submissions (success/failure rates)
- Track account creation source (`source: "embedded_widget"`)
- Monitor email delivery success
- Track project generation success rates

## Future Enhancements

1. **API Keys**: Optional API key authentication for widget endpoints
2. **Customization**: Theme and styling customization via URL parameters
3. **Analytics**: Track embed source and conversion rates
4. **A/B Testing**: Support multiple widget variants
5. **Webhook Integration**: Notify external systems on successful submissions
