import { z } from 'zod';
import { publicProcedure } from '@/backend/trpc/create-context';
import { supabaseServer as supabase } from '@/lib/supabaseServer';

const webhookSchema = z.object({
  type: z.string(),
  data: z.object({
    object: z.any(),
  }),
});

export const stripeWebhookProcedure = publicProcedure
  .input(webhookSchema)
  .mutation(async ({ input }) => {
    const { type, data } = input;

    try {
      console.log('[Stripe Webhook] Received event:', type);

      switch (type) {
        case 'checkout.session.completed': {
          const session = data.object;
          const userId = session.client_reference_id || session.metadata?.userId;
          const subscriptionId = session.subscription;

          if (!userId) {
            console.error('[Stripe Webhook] No userId found in session');
            break;
          }

          const subscription = await fetch(
            `https://api.stripe.com/v1/subscriptions/${subscriptionId}`,
            {
              headers: {
                'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
              },
            }
          ).then(res => res.json());

          const priceId = subscription.items.data[0].price.id;
          let membershipTier: 'premium' | 'pro' = 'premium';
          
          if (priceId.includes('pro')) {
            membershipTier = 'pro';
          }

          const expiresAt = new Date(subscription.current_period_end * 1000).toISOString();

          await supabase
            .from('profiles')
            .update({
              membership_tier: membershipTier,
              membership_expires_at: expiresAt,
            })
            .eq('id', userId);

          console.log(`[Stripe Webhook] Updated user ${userId} to ${membershipTier}`);
          break;
        }

        case 'customer.subscription.updated': {
          const subscription = data.object;
          const userId = subscription.metadata?.userId;

          if (!userId) {
            console.error('[Stripe Webhook] No userId found in subscription');
            break;
          }

          const expiresAt = new Date(subscription.current_period_end * 1000).toISOString();

          await supabase
            .from('profiles')
            .update({
              membership_expires_at: expiresAt,
            })
            .eq('id', userId);

          console.log(`[Stripe Webhook] Updated subscription for user ${userId}`);
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = data.object;
          const userId = subscription.metadata?.userId;

          if (!userId) {
            console.error('[Stripe Webhook] No userId found in subscription');
            break;
          }

          await supabase
            .from('profiles')
            .update({
              membership_tier: 'free',
              membership_expires_at: null,
            })
            .eq('id', userId);

          console.log(`[Stripe Webhook] Canceled subscription for user ${userId}`);
          break;
        }

        default:
          console.log(`[Stripe Webhook] Unhandled event type: ${type}`);
      }

      return { received: true };
    } catch (error) {
      console.error('[Stripe Webhook] Error processing webhook:', error);
      throw new Error('Webhook processing failed');
    }
  });

export default stripeWebhookProcedure;
