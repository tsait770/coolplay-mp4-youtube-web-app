import { protectedProcedure } from '../../../create-context';
import { z } from 'zod';

const PAYPAL_API_BASE = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

const PAYPAL_CLIENT_ID = process.env.EXPO_PUBLIC_PAYPAL_CLIENT_ID || '';
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';

async function getPayPalAccessToken(): Promise<string> {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  
  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error('Failed to get PayPal access token');
  }

  const data = await response.json();
  return data.access_token;
}

export const createSubscriptionProcedure = protectedProcedure
  .input(
    z.object({
      planId: z.string(), // PayPal plan ID
      returnUrl: z.string().optional(),
      cancelUrl: z.string().optional(),
    })
  )
  .output(
    z.object({
      success: z.boolean(),
      subscriptionId: z.string().optional(),
      approvalUrl: z.string().optional(),
      message: z.string(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const userId = ctx.user?.id;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    try {
      const accessToken = await getPayPalAccessToken();

      const subscriptionData = {
        plan_id: input.planId,
        application_context: {
          brand_name: 'InstaPlay',
          locale: 'en-US',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'SUBSCRIBE_NOW',
          return_url: input.returnUrl || `${process.env.EXPO_PUBLIC_APP_URL}/subscription/success`,
          cancel_url: input.cancelUrl || `${process.env.EXPO_PUBLIC_APP_URL}/subscription/cancel`,
        },
      };

      console.log('[createSubscription] Creating PayPal subscription:', subscriptionData);

      const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscriptionData),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to create subscription';
        try {
          const errorData = await response.json();
          console.error('[createSubscription] PayPal API error:', errorData);
          errorMessage = errorData.message || errorMessage;
        } catch {
          const errorText = await response.text();
          console.error('[createSubscription] PayPal API error (non-JSON):', errorText);
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const subscription = await response.json();
      const approvalUrl = subscription.links?.find((link: any) => link.rel === 'approve')?.href;

      console.log('[createSubscription] Subscription created:', {
        id: subscription.id,
        status: subscription.status,
      });

      const { error: dbError } = await ctx.supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          paypal_subscription_id: subscription.id,
          paypal_plan_id: input.planId,
          plan_name: input.planId.includes('basic') ? 'basic' : 'premium',
          billing_cycle: input.planId.includes('monthly') ? 'monthly' : 'yearly',
          amount: input.planId.includes('basic') ? 9.99 : 19.99,
          currency: 'USD',
          status: 'pending',
        });

      if (dbError) {
        console.error('[createSubscription] Database error:', dbError);
      }

      return {
        success: true,
        subscriptionId: subscription.id,
        approvalUrl,
        message: 'Subscription created successfully. Please complete payment.',
      };
    } catch (error: any) {
      console.error('[createSubscription] Error:', error);
      return {
        success: false,
        message: error.message || 'Failed to create subscription',
      };
    }
  });
