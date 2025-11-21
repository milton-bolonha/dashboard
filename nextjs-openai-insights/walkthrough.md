# Verification Walkthrough - SaaS Limits & Stripe

## Overview
We have implemented the SaaS plans (Free, Pro, Pro Plus) and integrated Stripe for subscription management. We also enforced limits on companies, contacts, and tiles based on the user's plan.

## Changes Implemented
- **Dependencies**: Installed `stripe`.
- **Database**: Updated `User` model with plan, subscription, and usage fields.
- **SaaS Logic**: Created `src/lib/saas/plans.ts` and `src/lib/saas/usage-service.ts`.
- **Stripe Webhook**: Implemented subscription updates in `/api/webhooks/stripe`.
- **Limit Enforcement**:
    - **Companies**: Checked in `/api/generate` (POST).
    - **Contacts**: Checked in `/api/workspace/contacts` (POST).
    - **Tiles/Tokens**: Checked in `/api/workspace/tiles` (POST) and usage middleware.
    - **Guest Limits**: Restored in-memory tracking in `usage-middleware.ts` to enforce strict limits for non-logged-in users.

## Verification Steps

### 1. Build Verification
Run the build to ensure no TypeScript errors.
```bash
npm run build
```

### 2. Manual Limit Testing (Simulation)
**Scenario: Guest Limit Reached**
1. User is a Guest (no `userId`).
2. User generates tiles rapidly.
3. `checkUsageMiddleware` uses in-memory store.
4. API returns 429 "Guest usage limit exceeded" if > 20 req/min or > 1000 tiles/day.

**Scenario: Free User Limit Reached**
1. User is on "FREE" plan (default).
2. User tries to create a 4th company.
3. `checkLimit` returns `false`.
4. API returns 429 "Company limit exceeded".

**Scenario: Guest Payment Flow**
1. Guest clicks "Upgrade".
2. Stripe Checkout is opened with `?client_reference_id={sessionId}`.
3. Webhook receives `checkout.session.completed`.
4. If `userId` is missing, it uses `client_reference_id` as `sessionId`.
5. Creates a placeholder user (or finds by email) and migrates guest data.

**Scenario: Pro User Upgrade**
1. Stripe webhook receives `checkout.session.completed` or `customer.subscription.updated`.
2. `User` document is updated with `plan: "PRO"`.
3. Limits are increased (e.g., 25 companies).

### 3. Code Review Checklist
- [x] `User` model has `plan` and `usage`.
- [x] `plans.ts` defines correct limits.
- [x] `usage-service.ts` implements logic correctly.
- [x] API routes call `checkLimit` and `incrementUsage`.
- [x] Stripe webhook handles `checkout.session.completed` and `customer.subscription.updated`.

## Next Steps
- Configure real Stripe webhook URL in Stripe Dashboard.
- Set up environment variables for Stripe keys (if not already).
- Test with real Stripe test card.
