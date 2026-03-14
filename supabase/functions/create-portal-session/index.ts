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

    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (!user) return json({ error: 'Unauthorized' }, 401)

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' })

    const { data: settings } = await supabase
      .from('user_settings')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (!settings?.stripe_customer_id) {
      return json({ error: 'No active subscription found' }, 400)
    }

    const origin = req.headers.get('origin') ?? 'https://vocabforge.app'
    const session = await stripe.billingPortal.sessions.create({
      customer: settings.stripe_customer_id,
      return_url: `${origin}/billing`,
    })

    return json({ url: session.url })
  } catch (e) {
    console.error('create-portal-session error:', e)
    return json({ error: 'Failed to create portal session' }, 500)
  }
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}
