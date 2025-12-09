# Feature Specification: External Integrations & Onboarding

**Feature Branch**: `009-external-onboarding`
**Status**: Idea / backlog
**Input**: Plan for exposing SEO Agent generators as standalone services consumable from external sites (e.g., Wordpress lead magnets, embedded widgets).

## Vision
- External visitor enters URL + email on marketing microsite.
- System scrapes site → boots minimal TRYGO context (project + hypothesis + Lean Canvas stub).
- Visitor receives auto-generated commercial page (or other artifact) + email invite to TRYGO workspace.
- Email contains secure link to finalize account (set password) and view generated assets.
- Same flow should be reusable for other generators (semantics, CTA, etc.).

## Flow (future)
1. **Scrape & Bootstrap**
   - Input: `siteUrl`, optional company name.
   - Scraper extracts hero copy, value proposition, ICP hints.
   - Create TRYGO user if not exists (check existing `users` collection). Store auth token in same manner as core app.
   - Create project + hypothesis + Lean Canvas entries with scraped data.
2. **Account Creation**
   - Generate temporary auth token (or password reset link) emailed to visitor.
   - Link opens TRYGO onboarding → user sets password, accepts terms.
   - Investigate current auth flow (see `TRYGO-Backend/src/services/AuthService.ts`, session/JWT handling) to reuse.
3. **Content Generation Service**
   - Call external Website Page Generator service (rest/graph). Pass project/hypothesis/cluster IDs.
   - Store output as WebsitePageIdea; mark origin (lead magnet) + send summary email.
4. **Embedding / API**
   - Provide REST endpoint + API keys for partners.
   - Create iframe widget hitting our API (WordPress plugin scenario).

## Next Steps
- Document current auth/session mechanisms (JWT, cookies, storage).
- Prototype scraper + onboarding microservice once main generator is extracted.
- Define token-based invite link flow for new users.

*(This spec is a placeholder to capture the plan; implementation deferred until main generator service is live.)*
