# Environment Variables

Add these to your `.env.local` file:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# MongoDB
MONGODB_URI=mongodb+srv://...

# OpenAI
OPENAI_API_KEY=sk-...

# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Getting Clerk Keys

1. Go to [clerk.com](https://clerk.com) and create an account
2. Create a new application
3. Copy the API keys from the dashboard
4. Add them to your `.env.local` file
