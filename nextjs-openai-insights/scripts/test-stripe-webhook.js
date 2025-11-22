#!/usr/bin/env node

/**
 * Test Stripe Webhook Script
 *
 * Simula chamadas de webhook do Stripe para desenvolvimento
 * Útil quando não é possível configurar webhooks reais no Stripe Dashboard
 *
 * Usage:
 * node scripts/test-stripe-webhook.js
 */

const fetch = require('node-fetch');

async function testStripeWebhook() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  console.log('🚀 Testing Stripe Webhook Integration');
  console.log('=====================================');

  // Test 1: Checkout Session Completed
  console.log('\n📋 Test 1: Checkout Session Completed');
  console.log('------------------------------------');

  try {
    const checkoutResponse = await fetch(`${baseUrl}/api/webhooks/stripe/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventType: 'checkout.session.completed',
        customerEmail: 'test@example.com',
        userId: `test_user_${Date.now()}`,
        sessionId: 'session_test',
        metadata: {
          userId: `test_user_${Date.now()}`,
          sessionId: 'session_test'
        }
      })
    });

    const checkoutResult = await checkoutResponse.json();

    if (checkoutResponse.ok) {
      console.log('✅ Checkout webhook test successful');
      console.log('   User ID:', checkoutResult.userId);
      console.log('   Migration:', checkoutResult.migration);
    } else {
      console.log('❌ Checkout webhook test failed:', checkoutResult.error);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }

  // Test 2: Subscription Updated
  console.log('\n📋 Test 2: Subscription Updated');
  console.log('------------------------------');

  try {
    const subscriptionResponse = await fetch(`${baseUrl}/api/webhooks/stripe/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventType: 'customer.subscription.updated',
        userId: `test_user_${Date.now()}`,
        priceId: 'price_1SVLzlFTSyvO26ktr6SPtI90', // PRO plan
        status: 'active',
        customerId: `cus_test_${Date.now()}`
      })
    });

    const subscriptionResult = await subscriptionResponse.json();

    if (subscriptionResponse.ok) {
      console.log('✅ Subscription webhook test successful');
      console.log('   New Plan:', subscriptionResult.newPlan);
    } else {
      console.log('❌ Subscription webhook test failed:', subscriptionResult.error);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }

  // Test 3: Verificar se funcionou (ler usuário do banco)
  console.log('\n📋 Test 3: Verify Database Changes');
  console.log('----------------------------------');

  try {
    // Este endpoint não existe ainda, mas seria útil criar
    console.log('ℹ️  To verify database changes, check MongoDB directly:');
    console.log('   - Collection: users');
    console.log('   - Look for clerkUserId starting with "test_user_"');
    console.log('   - Check plan field and usage object');
  } catch (error) {
    console.log('❌ Database check failed:', error.message);
  }

  console.log('\n🎉 Stripe Webhook Testing Complete!');
  console.log('==================================');
  console.log('\n📝 Next Steps:');
  console.log('1. Configure real webhooks in Stripe Dashboard');
  console.log('2. Add STRIPE_WEBHOOK_SECRET to environment');
  console.log('3. Test with real Stripe checkout flow');
  console.log('4. Remove development bypass in production');
}

// Run if called directly
if (require.main === module) {
  testStripeWebhook().catch(console.error);
}

module.exports = { testStripeWebhook };
