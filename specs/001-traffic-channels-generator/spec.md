# Feature Specification: Traffic Channels Generator - Beginner Mode

**Feature Branch**: `001-traffic-channels-generator`  
**Created**: 2025-01-11  
**Last Updated**: 2025-12-11 (updated with conversion funnel data)  
**Status**: Draft  
**Input**: User description: "Traffic Channels Generator - Beginner Mode: One-button feature for generating personalized traffic channels with ready-to-use launch plans. Mode switcher in header (before project creation) as global interface mode variable. Hidden for new users until first hypothesis and channel with content are generated."

**Context from Data Analysis**:
- Current GTM conversion rate: 4.0% (45 out of 1,112 hypotheses with Lean Canvas)
- Current user conversion rate: 11.8% (20 out of 169 users with projects)
- Hotjar shows: 21% of sessions visit GTM page, but only 11.8% create strategies
- **Problem**: Users visit GTM page but don't create strategies (gap between interest and action)
- **Target**: Increase conversion from 4.0% to 15-25% (3.75-6.25x improvement)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Generate Traffic Channels with One Click (Priority: P1)

As a new startup founder with limited marketing experience, I want to click a single button to get personalized traffic channels for my project, so I can start marketing immediately without deep knowledge of marketing channels.

**Why this priority**: This is the core value proposition - making traffic channel discovery accessible to beginners. Without this, the feature doesn't deliver its primary purpose.

**Independent Test**: Can be fully tested by creating a new project, navigating to Traffic Channels Generator, clicking "Generate Traffic Channels", and receiving a list of prioritized channels with basic information. This delivers immediate value by providing actionable marketing channels.

**Acceptance Scenarios**:

1. **Given** a user has created a project with at least one hypothesis and generated Lean Canvas, **When** they navigate to Traffic Channels Generator in Beginner Mode, **Then** they see a prominent "Generate Traffic Channels" button and brief description of what will be generated
2. **Given** a user clicks "Generate Traffic Channels", **When** the system analyzes their project data, **Then** they see progress indicators showing what is being analyzed (project, Lean Canvas, ICP profiles, research, resources)
3. **Given** the generation process completes successfully, **When** the system presents results, **Then** the user sees a list of 5-10 traffic channels, each with priority badge, Channel-Market Fit score, budget/time/team requirements, and difficulty level
4. **Given** a user views a generated channel, **When** they click "Show Plan", **Then** they see a detailed plan including strategy, step-by-step actions, tools, resources, content ideas, and metrics
5. **Given** a user has generated channels, **When** they select channels and click "Create GTM Strategy", **Then** a GTM strategy is automatically created with selected channels distributed across Validate/Build Audience/Scale stages, and detailed plans are generated for top 3 channels
6. **Given** a user views the GTM page without a strategy, **When** they see the Traffic Channels Generator, **Then** they see a clear call-to-action "Generate Your First Traffic Channels" with explanation of what will be created and how it helps
7. **Given** a user has generated channels but hasn't created GTM strategy, **When** they return to GTM page, **Then** they see a reminder with their generated channels and a prominent "Create GTM Strategy" button
8. **Given** a user completes channel generation, **When** the results are displayed, **Then** they see a clear next step: "Ready to create your GTM strategy? Select channels below and click 'Create GTM Strategy'" with visual guidance

---

### User Story 2 - Mode Switcher Visibility and Access (Priority: P1)

As a new user, I want the interface to automatically start in Beginner Mode, and as I gain experience, I want to access Pro Mode when I'm ready for advanced features.

**Why this priority**: The mode switcher controls the entire interface experience and must be properly gated to prevent overwhelming new users while allowing progression for experienced users.

**Independent Test**: Can be fully tested by checking that new users see Beginner Mode by default, the switcher is hidden until they generate their first hypothesis and channel with content, and once visible, switching modes changes the interface behavior appropriately.

**Acceptance Scenarios**:

1. **Given** a new user (no projects or no generated hypotheses), **When** they view the header before project creation, **Then** the mode switcher is not visible
2. **Given** a user has generated at least one hypothesis and one channel with content, **When** they view the header, **Then** the mode switcher becomes visible with Beginner Mode selected by default
3. **Given** the mode switcher is visible, **When** a user switches from Beginner to Pro Mode, **Then** the entire interface adapts to show Pro Mode features (advanced settings, manual configurations, detailed controls)
4. **Given** a user switches modes, **When** they navigate to different sections, **Then** the selected mode persists across the entire application interface
5. **Given** a user is in Beginner Mode, **When** they view Traffic Channels Generator, **Then** they see simplified interface with one-button generation
6. **Given** a user is in Pro Mode, **When** they view Traffic Channels Generator, **Then** they see advanced interface with manual channel configuration options

---

### User Story 3 - View and Understand Channel Recommendations (Priority: P2)

As a founder, I want to understand why specific channels were recommended for my project, so I can make informed decisions about which channels to pursue first.

**Why this priority**: Transparency in recommendations builds trust and helps users understand the value. However, this is secondary to actually generating the channels.

**Independent Test**: Can be fully tested by generating channels and verifying that each channel displays Channel-Market Fit score, priority ranking, resource requirements, and detailed explanations when viewing the plan.

**Acceptance Scenarios**:

1. **Given** channels have been generated, **When** a user views the channel list, **Then** each channel displays a Channel-Market Fit score (percentage) with visual progress bar
2. **Given** channels are displayed, **When** a user views channel details, **Then** they see explanation of why this channel fits their project based on ICP, Lean Canvas problems/solutions, and available resources
3. **Given** channels are prioritized, **When** a user views the list, **Then** channels are sorted by priority (P1, P2, P3) with P1 channels appearing first
4. **Given** a user views channel resource requirements, **When** they see budget/time/team indicators, **Then** these match their actual project constraints (solo founder sees "Solo" team requirement, low budget projects see "$0" or "$0-100" options)

---

### User Story 4 - Free GTM Strategy Preview in Beginner Mode (Priority: P1)

As a new user in Beginner Mode, I want to see a free preview of GTM strategy plan for the first channel (top priority), so I can understand the value before committing to a paid subscription.

**Why this priority**: Critical for conversion - users need to see value before paying. Currently, GTM plans are locked behind a paywall, which prevents users from understanding what they're getting. This is a major barrier to conversion identified in the first campaign analysis. Showing 1 free channel provides enough value to demonstrate quality while encouraging upgrade for more.

**Independent Test**: Can be fully tested by creating a project in Beginner Mode, generating channels, and verifying that detailed plan for the first channel (P1 priority) is accessible without subscription, while plans for all additional channels show upgrade prompts.

**Acceptance Scenarios**:

1. **Given** a user is in Beginner Mode and has generated channels, **When** they view the GTM strategy page, **Then** they can see full detailed plan for the first channel (top P1 priority) without any subscription requirement
2. **Given** a user views the free GTM plan for the first channel, **When** they see the detailed plan, **Then** it includes: strategy description, step-by-step actions, tools, resources, content ideas, and metrics - all fully accessible
3. **Given** a user has viewed the free plan for the first channel, **When** they try to view plans for any additional channels (2nd, 3rd, etc.), **Then** they see a clear upgrade prompt explaining that additional plans require a subscription, with a prominent "Upgrade to Pro" button
4. **Given** a user is in Beginner Mode, **When** they navigate to GTM strategy page, **Then** they see a clear indicator showing "Free Preview: First Channel" and explanation that this plan is available to demonstrate value
5. **Given** a user views the free GTM plan, **When** they see the plan content, **Then** there are no watermarks, blur effects, or other restrictions - the content is fully readable and actionable
6. **Given** a user has generated a GTM strategy with multiple channels, **When** they view the strategy overview, **Then** the first channel is marked as "Free Preview" and all additional channels are marked as "Pro Feature" with upgrade prompts
7. **Given** a user is not in Beginner Mode (Pro Mode or without mode), **When** they view GTM plans, **Then** standard subscription restrictions apply (no free preview)
8. **Given** a user views the free first channel plan, **When** they see the value and want more, **Then** they see a clear call-to-action "Unlock All Channels" with explanation of what they'll get with subscription

---

### User Story 5 - Export and Share Channel Recommendations (Priority: P3)

As a founder working with a team, I want to export the generated channel list and plans, so I can share recommendations with team members or use them in external planning tools.

**Why this priority**: Useful for collaboration but not essential for the core value proposition. Can be added after initial release.

**Independent Test**: Can be fully tested by generating channels and verifying that export functionality produces a readable document (PDF/CSV) containing all channel information, priorities, and basic plans.

**Acceptance Scenarios**:

1. **Given** channels have been generated, **When** a user clicks "Export List", **Then** they can choose export format (PDF or CSV)
2. **Given** a user exports to PDF, **When** the document is generated, **Then** it contains channel names, priorities, fit scores, resource requirements, and brief descriptions
3. **Given** a user exports to CSV, **When** the file is generated, **Then** it contains structured data with all channel fields in columns

---

### Edge Cases

- What happens when a user has no project data (no Lean Canvas, no ICP profiles)? System should show a warning indicating missing data and guide user to complete required steps first
- What happens when generation fails due to insufficient project information? System should display clear error message explaining what data is missing and how to fix it
- What happens when a user has very limited resources (no budget, solo founder, minimal time)? System should prioritize channels matching these constraints (organic, low-effort channels)
- What happens when a user generates channels multiple times? System should allow regeneration, potentially showing "Last generated: [timestamp]" and option to regenerate
- What happens when a user switches modes mid-generation? System should cancel current generation or complete it in current mode, then apply mode switch
- What happens when a user has generated channels but hasn't created content for any channel yet? Mode switcher should remain hidden until at least one channel has associated content
- What happens when a user deletes all their hypotheses after generating channels? Mode switcher visibility should be re-evaluated based on current state

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a "Traffic Channels Generator" interface accessible from the main navigation when in Beginner Mode
- **FR-002**: System MUST display a single prominent "Generate Traffic Channels" button as the primary action in Beginner Mode
- **FR-003**: System MUST analyze the following data sources when generating channels: project information, Lean Canvas (problems, solutions, customer segments), ICP profiles (pains, goals, triggers, demographics), market research data, and available resources (budget, team size, time constraints)
- **FR-004**: System MUST display progress indicators during channel generation showing: project analysis, Lean Canvas loading, ICP profiles loading, research analysis, and channel generation status
- **FR-005**: System MUST generate 5-10 traffic channels per generation request
- **FR-006**: System MUST assign priority levels (P1, P2, P3) to each generated channel based on Channel-Market Fit analysis
- **FR-007**: System MUST calculate and display a Channel-Market Fit score (percentage) for each channel based on alignment with ICP, Lean Canvas problems/solutions, and resource constraints
- **FR-008**: System MUST display for each channel: name, priority badge, fit score with visual indicator, budget requirement, time requirement, team size requirement, and difficulty level
- **FR-009**: System MUST provide a "Show Plan" action for each channel that displays: channel strategy description, step-by-step action plan with checkboxes, required tools list, resource requirements (human and financial), content ideas, and success metrics
- **FR-010**: System MUST provide a "Use This Channel" action that allows users to select channels for GTM strategy creation
- **FR-011**: System MUST provide a "Create GTM Strategy" action that automatically creates a GTM strategy with selected channels distributed across Validate, Build Audience, and Scale stages
- **FR-012**: System MUST automatically generate detailed channel plans (GTM Detailed Channel) for the top 3 selected channels when creating GTM strategy
- **FR-025**: System MUST display a prominent call-to-action on GTM page when user has no GTM strategy, directing them to Traffic Channels Generator with clear explanation of benefits
- **FR-026**: System MUST show a progress indicator on GTM page showing: "Step 1: Generate Channels → Step 2: Select Channels → Step 3: Create Strategy" with current step highlighted
- **FR-027**: System MUST provide contextual help tooltips on GTM page explaining what GTM strategy is, why it's important, and how Traffic Channels Generator helps create it
- **FR-028**: System MUST show a success message after GTM strategy creation with next steps (e.g., "Your GTM strategy is ready! View detailed channel plans or start implementing")
- **FR-029**: System MUST pre-select top 3 channels (P1 priority) by default when user clicks "Create GTM Strategy" to reduce decision fatigue
- **FR-030**: System MUST show estimated time to complete GTM strategy creation (e.g., "This will take ~30 seconds") to set expectations
- **FR-031**: System MUST provide a "Quick Start" option that automatically creates GTM strategy with top 3 channels without requiring manual selection
- **FR-032**: System MUST display on GTM page: number of generated channels available, number of channels already in GTM strategy, and clear action to add more channels
- **FR-013**: System MUST provide a mode switcher in the application header (visible before project creation, positioned globally)
- **FR-014**: System MUST store the selected mode (Beginner/Pro) as a global user preference that persists across all application sections
- **FR-015**: System MUST set Beginner Mode as the default mode for all new users
- **FR-016**: System MUST hide the mode switcher from view until a user has generated at least one hypothesis AND at least one channel with associated content
- **FR-017**: System MUST apply the selected mode globally across the entire interface, affecting feature visibility, complexity, and available actions
- **FR-018**: System MUST show simplified Beginner Mode interface in Traffic Channels Generator: single button, minimal configuration, clear progress indicators, and simplified results view
- **FR-019**: System MUST show advanced Pro Mode interface in Traffic Channels Generator: manual channel configuration, advanced filters, detailed analytics, and granular control options
- **FR-020**: System MUST validate that required data exists (project, at least one hypothesis with Lean Canvas, at least one ICP profile) before allowing channel generation
- **FR-021**: System MUST display appropriate error messages when required data is missing, guiding users to complete necessary steps
- **FR-022**: System MUST allow users to regenerate channels if initial results are unsatisfactory
- **FR-023**: System MUST provide export functionality (PDF/CSV) for generated channel lists and plans
- **FR-024**: System MUST prioritize channel recommendations based on user's actual resource constraints (solo founder → solo-friendly channels, zero budget → organic channels, limited time → low-effort channels)
- **FR-033**: System MUST allow users in Beginner Mode to view full detailed GTM plan for the first channel (top P1 priority) without any subscription or payment requirement
- **FR-034**: System MUST display GTM detailed channel plan for the first channel in Beginner Mode with no restrictions, watermarks, blur effects, or content limitations - all content must be fully readable and actionable
- **FR-035**: System MUST show a clear "Free Preview" indicator on the first channel plan in Beginner Mode, explaining that this plan is available to demonstrate value
- **FR-036**: System MUST show upgrade prompts for all channels beyond the first one in Beginner Mode, clearly indicating that additional plans require a subscription with a prominent "Upgrade to Pro" or "Unlock All Channels" button
- **FR-037**: System MUST automatically generate detailed GTM plan for the first channel (top P1 priority) when a GTM strategy is created in Beginner Mode, making it immediately accessible without subscription
- **FR-038**: System MUST apply subscription restrictions to all channels beyond the first one in Beginner Mode, while the first channel remains fully accessible regardless of subscription status
- **FR-039**: System MUST show a clear call-to-action after user views the free first channel plan, encouraging upgrade with explanation of additional value (e.g., "Unlock all channels to see complete GTM strategy")
- **FR-040**: System MUST integrate with existing subscription system (`useSubscriptionStore` on frontend, `SubscriptionService` on backend) to check user's current plan (FREE, STARTER, PRO)
- **FR-041**: System MUST check `hasGtmChannelAccess` flag from subscription limits for standard channel access validation (FREE=false, STARTER/PRO=true)
- **FR-042**: System MUST override subscription check for first channel (index 0) when user is in Beginner Mode, allowing free access regardless of subscription plan
- **FR-043**: System MUST validate Beginner Mode status on backend before allowing free access to first channel (security requirement)
- **FR-044**: System MUST store Beginner Mode preference in user preferences/settings to enable backend validation
- **FR-045**: System MUST show upgrade prompts when FREE user in Beginner Mode tries to view channels beyond the first one (2nd, 3rd, etc.)
- **FR-046**: System MUST show upgrade prompts when FREE user tries to create GTM strategy with multiple channels
- **FR-047**: System MUST show upgrade prompts when FREE/STARTER user tries to use Pro Mode features
- **FR-048**: System MUST provide "Upgrade to STARTER" CTA for FREE users with explanation of benefits (access to all GTM channels)
- **FR-049**: System MUST provide "Upgrade to PRO" CTA for STARTER users with explanation of additional benefits (validation analysis, research access)
- **FR-050**: System MUST support promo code activation for free trial periods without requiring Stripe card input
- **FR-051**: System MUST refresh subscription data after successful payment or promo code activation to immediately unlock features
- **FR-052**: System MUST handle subscription expiration gracefully: show warnings 7 days before expiration, block access after expiration, offer renewal
- **FR-053**: System MUST check subscription status (ACTIVE or TRIALING) to grant access, blocking all other statuses (CANCELED, UNPAID, etc.)
- **FR-054**: System MUST display current subscription status and plan type in UI when showing upgrade prompts
- **FR-055**: System MUST validate subscription on backend for all GTM channel access requests, not relying solely on frontend checks

### Key Entities *(include if feature involves data)*

- **Traffic Channel**: Represents a marketing channel recommendation with name, type, priority, fit score, resource requirements, and detailed plan. Generated based on project context and user constraints.
- **Channel-Market Fit Score**: A calculated percentage (0-100%) representing how well a channel aligns with the user's ICP, Lean Canvas problems/solutions, and available resources. Used for prioritization and ranking.
- **Mode Preference**: Global user setting (Beginner/Pro) that controls interface complexity and feature visibility across the entire application. Stored per user and persists across sessions.
- **Channel Generation Context**: Aggregated data used for generation including: project details, Lean Canvas data, ICP profiles, market research, and resource constraints (budget, team, time).
- **Subscription Status**: User's current subscription plan (FREE, STARTER, PRO) and status (ACTIVE, TRIALING, CANCELED, etc.) used to determine feature access.
- **Channel Access Permission**: Calculated permission for viewing a specific channel, considering: subscription plan, Beginner Mode status, channel index (first channel exception), and `hasGtmChannelAccess` flag.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can generate a list of personalized traffic channels in under 60 seconds from clicking the button to viewing results
- **SC-002**: 90% of generated channels have a Channel-Market Fit score above 70%, indicating strong alignment with user's project context
- **SC-003**: 80% of new users successfully generate channels on their first attempt without requiring additional guidance or support
- **SC-004**: Users can understand why a channel was recommended (via fit score and explanations) without external documentation or training
- **SC-005**: The mode switcher remains hidden for 100% of new users until they generate their first hypothesis and channel with content, preventing interface confusion
- **SC-006**: Mode selection persists correctly across 100% of interface sections, ensuring consistent experience regardless of navigation path
- **SC-007**: At least 70% of generated channels match user's resource constraints (solo founders receive solo-friendly channels, zero-budget users receive organic channels)
- **SC-008**: Users can create a GTM strategy from selected channels in under 2 minutes, including automatic distribution across stages and detailed plan generation
- **SC-009**: Generated channel plans contain actionable steps that users can execute without additional research or external tools (all required information provided in the plan)
- **SC-010**: GTM strategy creation conversion rate increases from current 4.0% to at least 15% within 3 months of feature launch (3.75x improvement)
- **SC-011**: User GTM strategy creation rate increases from current 11.8% to at least 25% within 3 months of feature launch (2.1x improvement)
- **SC-012**: At least 60% of users who visit GTM page after generating channels proceed to create GTM strategy (reducing gap between interest and action)
- **SC-013**: Time from channel generation to GTM strategy creation is reduced by 50% compared to current manual process
- **SC-014**: At least 80% of users who use "Quick Start" option successfully create their first GTM strategy without additional guidance
- **SC-015**: At least 60% of users in Beginner Mode who view free GTM plan for the first channel proceed to create a GTM strategy or upgrade to Pro (demonstrating value realization)
- **SC-016**: Free preview of first channel plan increases conversion from channel generation to GTM strategy creation by at least 2x compared to fully locked plans
- **SC-017**: At least 70% of users who view free GTM plan in Beginner Mode engage with the content (view full plan, interact with plan details) indicating value recognition
- **SC-018**: At least 30% of users who view free first channel plan upgrade to Pro to unlock additional channels within 7 days
- **SC-019**: 100% of channel access requests are validated on backend, preventing unauthorized access regardless of frontend manipulation
- **SC-020**: Subscription data is refreshed within 5 seconds after successful payment or promo code activation, immediately unlocking features
- **SC-021**: At least 80% of FREE users who see upgrade prompts understand what they'll get with upgrade (clear messaging and benefits)
- **SC-022**: Upgrade prompts appear at appropriate moments (when trying to access locked content) with 0% false positives (showing when access is actually available)
- **SC-023**: Subscription expiration warnings are shown to 100% of users 7 days before expiration, with clear renewal CTA

## Assumptions

- Users have completed basic project setup (created project, generated at least one hypothesis with Lean Canvas and ICP profiles) before accessing Traffic Channels Generator
- Market research data is available or can be generated on-demand for channel analysis
- The system has access to user's resource constraints (budget, team size, time availability) either from user input or inferred from project/hypothesis data
- Channel recommendations are based on industry best practices and common startup marketing patterns
- The mode switcher visibility logic checks for existence of at least one hypothesis AND at least one channel with associated content (not just channel generation, but actual content creation)
- Beginner Mode is the default for all users, but the switcher only becomes visible after the user demonstrates readiness (by generating hypothesis and content)
- Pro Mode provides access to existing advanced features (manual GTM configuration, detailed channel editing, advanced analytics) that are already implemented in the platform
- Subscription system uses `PLAN_LIMITS` constant to define feature access: `hasGtmChannelAccess` is false for FREE, true for STARTER/PRO
- Beginner Mode is a UI preference stored separately from subscription plan - a user can be in Beginner Mode with any plan (FREE, STARTER, PRO)
- First channel free preview in Beginner Mode overrides subscription check - this is a conversion optimization, not a subscription feature
- All subscription checks must be validated on backend for security - frontend checks are for UX only
- Promo codes can activate subscriptions without Stripe (no card required), useful for free trials and campaigns
- Subscription statuses ACTIVE and TRIALING grant access, all other statuses (CANCELED, UNPAID, etc.) block access

## Conversion Improvement Strategy

Based on analysis of current conversion rates (4.0% hypotheses, 11.8% users), the following improvements are critical:

### Key Problems Identified:
1. **Gap between interest and action**: 21% visit GTM page, but only 11.8% create strategies
2. **Low conversion rate**: Only 4.0% of hypotheses with Lean Canvas have GTM strategies
3. **Complex interface**: Users don't know where to start or what to do next
4. **Payment barrier**: Users cannot see GTM plan value before paying, creating a major conversion barrier (identified in first campaign analysis)

### Solutions Implemented in This Spec:
1. **Direct integration on GTM page** (FR-025): Show Traffic Channels Generator directly on GTM page for users without strategy
2. **Progress indicator** (FR-026): Visual progress showing current step and next steps
3. **Contextual help** (FR-027): Tooltips and explanations on GTM page
4. **Quick Start option** (FR-031): Automatic GTM strategy creation with top 3 channels
5. **Pre-selection** (FR-029): Top 3 channels pre-selected by default to reduce decision fatigue
6. **Success messaging** (FR-028): Clear next steps after GTM strategy creation
7. **Free preview in Beginner Mode** (FR-033-FR-039): Full access to first channel plan (top priority) without subscription, allowing users to see value before paying, with upgrade prompts for additional channels

### Expected Impact:
- **Hypothesis conversion**: From 4.0% to 15-25% (3.75-6.25x improvement)
- **User conversion**: From 11.8% to 25%+ (2.1x+ improvement)
- **Interest-to-action gap**: From 11.8% to 60%+ of visitors creating strategies

See `competitor analysis/GTM_CONVERSION_IMPROVEMENTS.md` for detailed improvement strategy.

---

## Subscription & Limits System Integration

**Research Document**: See `SUBSCRIPTION_LIMITS_RESEARCH.md` for complete analysis of TRYGO's subscription system.

### Current Subscription System

TRYGO uses a three-tier subscription model:
- **FREE**: Default plan for new users
- **STARTER**: Entry-level paid plan
- **PRO**: Professional plan

### GTM Channel Access Limits

**Current Implementation**:
- FREE: ❌ No access to GTM channels (`hasGtmChannelAccess: false`)
- STARTER: ✅ Full access to GTM channels (`hasGtmChannelAccess: true`)
- PRO: ✅ Full access to GTM channels (`hasGtmChannelAccess: true`)

**Problem**: All GTM plans are locked for FREE users, creating a conversion barrier.

### Beginner Mode Free Preview Logic

**New Requirement**: In Beginner Mode, the first channel (top priority) should be accessible without subscription.

**Implementation Logic**:
```typescript
// Frontend check
const isBeginnerMode = mode === 'beginner';
const channelIndex = channels.indexOf(channel);
const currentPlan = getCurrentPlan();

const canViewChannel = 
  (isBeginnerMode && channelIndex === 0) || // First channel in Beginner Mode
  (currentPlan !== PlanType.FREE); // Or paid subscription
```

**Backend Check**:
- Must validate Beginner Mode status
- First channel (index 0) in Beginner Mode → always accessible
- Additional channels → require `hasGtmChannelAccess: true`

### Integration Points

1. **Frontend**: `useSubscriptionStore` from `TRYGO-Front/src/store/subscriptionStore.ts`
   - Use `hasFeatureAccess('gtm-channel')` for standard checks
   - Add Beginner Mode check for first channel exception

2. **Backend**: `SubscriptionService` from `TRYGO-Backend/src/services/subscription/SubscriptionService.ts`
   - Check subscription status and type
   - Validate Beginner Mode (stored in user preferences)

3. **GraphQL**: Extend queries to include Beginner Mode status
   - Add `isBeginnerMode` field to user context
   - Pass to GTM channel access checks

### Upgrade Flow

**When to show upgrade prompts**:
1. User tries to view channel beyond first one in Beginner Mode (FREE)
2. User tries to create GTM strategy with multiple channels (FREE)
3. User tries to use Pro Mode features (FREE/STARTER)

**Upgrade Actions**:
- `createCheckout('STARTER' | 'PRO')` → Redirect to Stripe
- `activatePromoCode(code)` → Activate without Stripe (no card required)

### Promo Code System

**Key Feature**: Promo codes can activate subscriptions without Stripe (no card required).

**Use Cases**:
- Free trial periods
- Campaign promotions
- Early adopter benefits

**Implementation**: `PromoCodeService.activatePromoCode()` creates subscription with `price: 0` and `status: ACTIVE`.

---

## Technical Implementation Notes

### Subscription Status Check

**Active Statuses** (grant access):
- `ACTIVE` - Full access
- `TRIALING` - Access during trial period

**Inactive Statuses** (restrict access):
- All other statuses → No access

### Plan Limits Reference

See `SUBSCRIPTION_LIMITS_RESEARCH.md` for complete limits table:
- Projects: FREE=1, STARTER=1, PRO=50
- Hypotheses: FREE=3, STARTER=5, PRO=50
- Messages: FREE=10, STARTER=50, PRO=300

### Security Considerations

1. **Frontend checks are for UX only** - Always validate on backend
2. **Cache subscription data** - Update after payment/promo code activation
3. **Handle subscription expiration** - Show warnings and block access appropriately
4. **Beginner Mode validation** - Must be checked on backend to prevent manipulation

### Implementation Code Examples

**Frontend Channel Access Check**:
```typescript
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useModeStore } from '@/store/modeStore';

const { hasFeatureAccess, getCurrentPlan } = useSubscriptionStore();
const { mode } = useModeStore();
const isBeginnerMode = mode === 'beginner';
const currentPlan = getCurrentPlan();

const canViewChannel = (channelIndex: number) => {
  // First channel in Beginner Mode - always accessible
  if (isBeginnerMode && channelIndex === 0) {
    return true;
  }
  
  // Check subscription access
  return hasFeatureAccess('gtm-channel') || currentPlan !== PlanType.FREE;
};
```

**Backend Channel Access Validation**:
```typescript
async canViewGtmChannel(
  userId: string,
  channelIndex: number,
  isBeginnerMode: boolean
): Promise<boolean> {
  const subscription = await subscriptionService.getSubscription(userId);
  
  // Check subscription status
  if (!subscription || 
      ![SubscriptionStatus.Active, SubscriptionStatus.Trialing].includes(subscription.status)) {
    return false;
  }
  
  // First channel in Beginner Mode - always accessible
  if (isBeginnerMode && channelIndex === 0) {
    return true;
  }
  
  // Check plan limits
  const planLimits = PLAN_LIMITS[getCurrentPlan(subscription)];
  return planLimits.hasGtmChannelAccess;
}
```

**Upgrade Prompt Display Logic**:
```typescript
const showUpgradePrompt = (channelIndex: number) => {
  const isBeginnerMode = mode === 'beginner';
  const currentPlan = getCurrentPlan();
  
  // Show for FREE users trying to access channels beyond first
  if (isBeginnerMode && channelIndex > 0 && currentPlan === PlanType.FREE) {
    return { show: true, targetPlan: 'STARTER', message: 'Unlock all channels' };
  }
  
  // Show for FREE users trying to create multi-channel strategy
  if (currentPlan === PlanType.FREE && selectedChannels.length > 1) {
    return { show: true, targetPlan: 'STARTER', message: 'Upgrade to create GTM strategy' };
  }
  
  return { show: false };
};
```

### Integration Points

1. **Frontend Store**: `TRYGO-Front/src/store/subscriptionStore.ts`
   - Use `hasFeatureAccess('gtm-channel')` for standard checks
   - Use `getCurrentPlan()` to determine plan type
   - Use `isSubscriptionActive()` to check status

2. **Backend Service**: `TRYGO-Backend/src/services/subscription/SubscriptionService.ts`
   - Use `getSubscription(userId)` to fetch subscription
   - Use `checkIfSubscriptionIsActive(userId)` to validate status

3. **GraphQL Schema**: Extend user context query to include:
   - `isBeginnerMode: Boolean`
   - `subscription: Subscription`
   - `planLimits: PlanLimits`

4. **Promo Code Integration**: `TRYGO-Backend/src/services/promoCode/PromoCodeService.ts`
   - Use `activatePromoCode(code, userId)` for free trial activation
   - No Stripe required - creates subscription with `price: 0`
