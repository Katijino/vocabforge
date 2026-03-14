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
    // Debug: check secrets are present
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    const priceId = Deno.env.get('STRIPE_PRO_PRICE_ID')
    console.log('[create-checkout] STRIPE_SECRET_KEY present:', !!stripeKey)
    console.log('[create-checkout] STRIPE_PRO_PRICE_ID present:', !!priceId)

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    console.log('[create-checkout] Auth result:', user ? `user=${user.id}` : 'no user', authError ? `error=${authError.message}` : '')
    if (!user) return json({ error: 'Unauthorized', detail: authError?.message }, 401)

    const stripe = new Stripe(stripeKey!, { apiVersion: '2023-10-16' })

    // Get or create Stripe customer
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    console.log('[create-checkout] Settings:', JSON.stringify(settings), settingsError ? `error=${settingsError.message}` : '')

    let customerId = settings?.stripe_customer_id

    if (!customerId) {
      console.log('[create-checkout] Creating Stripe customer for', user.email)
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id
      console.log('[create-checkout] Created customer:', customerId)
      await supabase.from('user_settings').update({ stripe_customer_id: customerId }).eq('user_id', user.id)
    }

    // Create checkout session
    const origin = req.headers.get('origin') ?? 'https://vocabforge.app'
    console.log('[create-checkout] Creating session with price:', priceId, 'customer:', customerId, 'origin:', origin)
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{
        price: priceId!,
        quantity: 1,
      }],
      mode: 'subscription',
      subscription_data: { trial_period_days: 7 },
      success_url: `${origin}/billing?success=1`,
      cancel_url: `${origin}/billing`,
      metadata: { user_id: user.id },
    })

    console.log('[create-checkout] Session created:', session.id)
    return json({ url: session.url })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    const stack = e instanceof Error ? e.stack : undefined
    console.error('[create-checkout] Error:', message, stack)
    return json({ error: 'Checkout failed', detail: message }, 500)
  }
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}
