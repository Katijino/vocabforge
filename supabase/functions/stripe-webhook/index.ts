import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req: Request) => {
  const signature = req.headers.get('stripe-signature')
  if (!signature) return new Response('Missing signature', { status: 400 })

  const body = await req.text()
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' })

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, Deno.env.get('STRIPE_WEBHOOK_SECRET')!)
  } catch (e) {
    console.error('Webhook signature error:', e)
    return new Response('Invalid signature', { status: 400 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.user_id
        if (userId) {
          const { error } = await supabase.from('user_settings').update({
            subscription_tier: 'pro',
            subscription_status: 'active',
          }).eq('user_id', userId)
          if (error) console.error('Failed to update user_settings for checkout:', error)
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
        const status = sub.status // 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | ...

        let tier: string
        let subStatus: string
        if (status === 'active' || status === 'trialing') {
          tier = 'pro'
          subStatus = status
        } else if (status === 'canceled' || status === 'unpaid') {
          tier = 'free'
          subStatus = 'canceled'
        } else {
          // past_due, incomplete, incomplete_expired, paused
          tier = 'pro' // keep pro access during past_due grace period
          subStatus = status
        }

        const { error } = await supabase.from('user_settings').update({
          subscription_tier: tier,
          subscription_status: subStatus,
        }).eq('stripe_customer_id', customerId)
        if (error) console.error(`Failed to update user_settings for ${event.type}:`, error)
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
        const { error } = await supabase.from('user_settings').update({
          subscription_tier: 'free',
          subscription_status: 'canceled',
        }).eq('stripe_customer_id', customerId)
        if (error) console.error('Failed to update user_settings for subscription deleted:', error)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
        if (customerId) {
          const { error } = await supabase.from('user_settings').update({
            subscription_status: 'past_due',
          }).eq('stripe_customer_id', customerId)
          if (error) console.error('Failed to update user_settings for payment failed:', error)
        }
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
        if (customerId) {
          const { error } = await supabase.from('user_settings').update({
            subscription_tier: 'pro',
            subscription_status: 'active',
          }).eq('stripe_customer_id', customerId)
          if (error) console.error('Failed to update user_settings for invoice paid:', error)
        }
        break
      }

      default:
        console.log(`Unhandled event: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('Webhook handler error:', e)
    return new Response('Handler error', { status: 500 })
  }
})
