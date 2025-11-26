# Stripe Setup Guide for CoolPlay

This guide will walk you through setting up Stripe for your CoolPlay membership system.

## Prerequisites

- Stripe account (sign up at https://stripe.com)
- Access to your project's `.env` file
- Basic understanding of Stripe products and pricing

## Step 1: Create Stripe Account

1. Go to https://stripe.com
2. Click "Sign up" and create your account
3. Complete the verification process
4. Switch to **Test Mode** (toggle in the top right corner)

## Step 2: Get API Keys

1. Go to **Developers** → **API keys**
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Copy your **Secret key** (starts with `sk_test_`)
4. Add them to your `.env` file:

```env
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Step 3: Create Products

### Basic Monthly Plan

1. Go to **Products** → **Add product**
2. Fill in the details:
   - **Name**: Basic Monthly
   - **Description**: 1500 uses per month + 40 daily bonus
   - **Pricing model**: Standard pricing
   - **Price**: $19.90 USD
   - **Billing period**: Monthly
3. Click **Save product**
4. Copy the **Price ID** (starts with `price_`)
5. Add to `.env`:

```env
EXPO_PUBLIC_STRIPE_BASIC_MONTHLY_PRICE_ID=price_1234567890abcdef
```

### Basic Yearly Plan

1. Go to **Products** → **Add product**
2. Fill in the details:
   - **Name**: Basic Yearly
   - **Description**: 1500 uses per month + 40 daily bonus (Save 25%)
   - **Pricing model**: Standard pricing
   - **Price**: $199.00 USD
   - **Billing period**: Yearly
3. Click **Save product**
4. Copy the **Price ID**
5. Add to `.env`:

```env
EXPO_PUBLIC_STRIPE_BASIC_YEARLY_PRICE_ID=price_0987654321fedcba
```

### Plus Monthly Plan

1. Go to **Products** → **Add product**
2. Fill in the details:
   - **Name**: Plus Monthly
   - **Description**: Unlimited uses + Priority support
   - **Pricing model**: Standard pricing
   - **Price**: $39.90 USD
   - **Billing period**: Monthly
3. Click **Save product**
4. Copy the **Price ID**
5. Add to `.env`:

```env
EXPO_PUBLIC_STRIPE_PLUS_MONTHLY_PRICE_ID=price_abcdef1234567890
```

### Plus Yearly Plan

1. Go to **Products** → **Add product**
2. Fill in the details:
   - **Name**: Plus Yearly
   - **Description**: Unlimited uses + Priority support (Save 25%)
   - **Pricing model**: Standard pricing
   - **Price**: $399.00 USD
   - **Billing period**: Yearly
3. Click **Save product**
4. Copy the **Price ID**
5. Add to `.env`:

```env
EXPO_PUBLIC_STRIPE_PLUS_YEARLY_PRICE_ID=price_fedcba0987654321
```

## Step 4: Configure Webhooks

Webhooks allow Stripe to notify your app when payments succeed or fail.

1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter your webhook URL:
   - For local testing: Use ngrok or similar tunnel
   - For production: `https://your-domain.com/api/trpc/stripe.webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_`)
7. Add to `.env`:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Step 5: Test the Integration

### Test Cards

Use these test card numbers in Test Mode:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

For all test cards:
- **Expiry**: Any future date (e.g., 12/34)
- **CVC**: Any 3 digits (e.g., 123)
- **ZIP**: Any 5 digits (e.g., 12345)

### Testing Flow

1. Start your app
2. Navigate to subscription page
3. Select a plan (Monthly or Yearly)
4. Click "Subscribe"
5. Enter test card details
6. Complete payment
7. Verify webhook received in Stripe Dashboard
8. Check user profile updated in your database

## Step 6: Supabase Integration

### Create Subscription Table

Run this SQL in your Supabase SQL Editor:

```sql
-- Add subscription fields to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS subscription_plan TEXT,
ADD COLUMN IF NOT EXISTS subscription_interval TEXT;

-- Create subscriptions table for detailed tracking
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT NOT NULL,
  stripe_price_id TEXT NOT NULL,
  status TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  interval TEXT NOT NULL,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions"
  ON subscriptions FOR ALL
  USING (auth.role() = 'service_role');
```

## Step 7: Environment Variables Summary

Your final `.env` file should look like this:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://tdamcrigenexyhbsopay.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe Configuration
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Stripe Price IDs
EXPO_PUBLIC_STRIPE_BASIC_MONTHLY_PRICE_ID=price_1234567890abcdef
EXPO_PUBLIC_STRIPE_BASIC_YEARLY_PRICE_ID=price_0987654321fedcba
EXPO_PUBLIC_STRIPE_PLUS_MONTHLY_PRICE_ID=price_abcdef1234567890
EXPO_PUBLIC_STRIPE_PLUS_YEARLY_PRICE_ID=price_fedcba0987654321

# API Configuration
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_APP_URL=http://localhost:8081
EXPO_PUBLIC_RORK_API_BASE_URL=http://localhost:3000
```

## Step 8: Go Live

When you're ready to go live:

1. **Switch to Live Mode** in Stripe Dashboard
2. **Create live products** (same as test products)
3. **Update API keys** in `.env` with live keys (start with `pk_live_` and `sk_live_`)
4. **Update webhook endpoint** with production URL
5. **Test with real card** (use small amount first)
6. **Monitor** Stripe Dashboard for payments

## Troubleshooting

### Checkout Session Not Creating

- Check `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` is correct
- Verify `STRIPE_SECRET_KEY` is correct
- Check console for error messages
- Ensure price IDs match your Stripe products

### Webhook Not Receiving Events

- Verify webhook URL is accessible
- Check webhook signing secret is correct
- Test webhook with Stripe CLI: `stripe listen --forward-to localhost:3000/api/trpc/stripe.webhook`
- Check webhook logs in Stripe Dashboard

### Payment Success But Profile Not Updated

- Check webhook is receiving events
- Verify Supabase connection
- Check webhook handler logic in `backend/trpc/routes/stripe/webhook/route.ts`
- Look for errors in server logs

### Subscription Not Showing in App

- Verify user profile has correct `membership_tier`
- Check `membership_expires_at` is set correctly
- Ensure `getActivePlan()` logic is correct
- Check React Query cache is updating

## Support

- **Stripe Documentation**: https://stripe.com/docs
- **Stripe Support**: https://support.stripe.com
- **Supabase Documentation**: https://supabase.com/docs
- **Project Issues**: Create an issue in your repository

## Security Best Practices

1. **Never commit** `.env` file to version control
2. **Use environment variables** for all sensitive data
3. **Validate webhook signatures** to prevent fraud
4. **Use HTTPS** in production
5. **Implement rate limiting** on payment endpoints
6. **Log all payment events** for audit trail
7. **Test thoroughly** before going live
8. **Monitor** Stripe Dashboard regularly
9. **Set up alerts** for failed payments
10. **Keep Stripe libraries updated**
