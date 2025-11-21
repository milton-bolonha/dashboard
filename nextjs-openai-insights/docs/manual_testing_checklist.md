# Manual Testing Checklist - MVP

Use this checklist before each deploy to production.

## 🧪 Guest Flow

### Basic Generation
- [ ] Visit `/` without signing in
- [ ] Fill form and generate tiles
- [ ] Verify tiles appear in `/admin`
- [ ] Verify data saved to localStorage

### Rate Limiting
- [ ] Generate tiles rapidly (>20 requests in 1 minute)
- [ ] Verify 429 error: "Guest usage limit exceeded"
- [ ] Wait 1 minute, verify can generate again

## 👤 Member Flow (Free Plan)

### Sign Up & Authentication
- [ ] Click "Sign Up" → complete Clerk registration
- [ ] Verify redirect to `/admin`
- [ ] Verify user created in MongoDB with `plan: "FREE"`

### Company Limits (Free: max 3)
- [ ] Create 1st company → success
- [ ] Create 2nd company → success
- [ ] Create 3rd company → success
- [ ] Try to create 4th company → expect 429 "Company limit exceeded"

### Contact Limits (Free: max 5 per company)
- [ ] Add 1-5 contacts to a company → success
- [ ] Try to add 6th contact → expect 429 "Contact limit exceeded"

### Tile Limits (Free: 3000 tokens ≈ 30 tiles)
- [ ] Generate tiles until hitting token limit
- [ ] Verify 429 "Usage limit exceeded"
- [ ] Check MongoDB: `usage.tokensUsed` should be ~3000

## 💳 Stripe Payment Flow

### Webhook Testing (Use Stripe CLI)
```bash
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
stripe trigger checkout.session.completed
```

- [ ] Run Stripe CLI commands above
- [ ] Verify console log: "User criado/atualizado no MongoDB"
- [ ] Check MongoDB: user exists with correct email
- [ ] Verify `plan` field updated (if subscription event sent)
- [ ] Verify guest data migrated (if `sessionId` in metadata)

### Manual Checkout (Test Card)
- [ ] As guest, click "Upgrade" button
- [ ] Complete checkout with test card: `4242 4242 4242 4242`
- [ ] Verify redirect to success page
- [ ] Check MongoDB: user created with `stripeCustomerId`
- [ ] Verify guest workspace migrated to user's account

## 🎨 Admin Panel

### UI Functionality
- [ ] Tiles render correctly with content
- [ ] Drag & drop tiles → order persists
- [ ] Pin/unpin tiles → state persists
- [ ] Edit tile → changes save
- [ ] Delete tile → removed from list

### Contact Insights
- [ ] Add contact with email
- [ ] Verify "Contact Insights" tile generates
- [ ] Verify outreach suggestions appear

### Notes
- [ ] Create note → appears in sidebar
- [ ] Edit note → changes save
- [ ] Delete note → removed

## 🔒 Security

### Route Protection
- [ ] Visit `/admin` without login → redirect to `/sign-in`
- [ ] Sign in → redirect back to `/admin`

### Webhook Security
- [ ] Send invalid webhook (wrong signature) → expect 400 "Invalid signature"
- [ ] Send valid webhook → expect 200

## 📊 MongoDB Verification

After testing, verify in MongoDB:
- [ ] `users` collection has test user
- [ ] `workspaces` collection has test workspaces
- [ ] `usage` fields are updating correctly
- [ ] `plan` field matches Stripe subscription

## 🚨 Error Handling

- [ ] Invalid form input → shows validation errors
- [ ] Network error during generation → shows error toast
- [ ] MongoDB connection error → graceful fallback (guest mode)
- [ ] OpenAI API error → shows error message

---

## E2E Tests (Playwright)

**Note**: E2E tests may timeout due to Clerk initialization. To run:

```bash
# Increase timeout in playwright.config.ts
npm run test:e2e
```

**Known Issue**: First compile with Clerk can take >60s, causing timeout. Run manually:
1. `npm run dev` in one terminal
2. Wait for server to be ready
3. `npx playwright test` in another terminal

---

## Test Accounts

**Clerk Test User:**
- Email: test@example.com
- Password: TestPassword123!

**Stripe Test Cards:**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

## Notes
- Run `npm run dev` before testing
- Use incognito window for guest testing
- Clear localStorage between guest tests
- Check browser console for errors
