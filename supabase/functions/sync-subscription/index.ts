import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (!user) return json({ error: 'Unauthorized', detail: authError?.message }, 401)

    // Look up stripe_customer_id
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (settingsError || !settings?.stripe_customer_id) {
      return json({ error: 'No Stripe customer linked to this account' }, 404)
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' })

    // Get the customer's active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: settings.stripe_customer_id,
      status: 'all',
      limit: 1,
    })

    let tier = 'free'
    let status = 'none'

    if (subscriptions.data.length > 0) {
      const sub = subscriptions.data[0]
      status = sub.status

      if (sub.status === 'active' || sub.status === 'trialing') {
        tier = 'pro'
      } else if (sub.status === 'past_due') {
        tier = 'pro' // grace period
      } else {
        tier = 'free'
        status = 'canceled'
      }
    }

    const { error: updateError } = await supabase.from('user_settings').update({
      subscription_tier: tier,
      subscription_status: status,
    }).eq('user_id', user.id)

    if (updateError) {
      console.error('Failed to sync subscription:', updateError)
      return json({ error: 'Failed to update subscription status' }, 500)
    }

    return json({ synced: true, tier, status })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    console.error('[sync-subscription] Error:', message)
    return json({ error: 'Sync failed', detail: message }, 500)
  }
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}
