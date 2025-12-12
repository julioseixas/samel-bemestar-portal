import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Whitelist of valid push service domains
const VALID_PUSH_SERVICES = [
  'fcm.googleapis.com',
  'updates.push.services.mozilla.com',
  'notify.windows.com',
  'push.apple.com',
  'web.push.apple.com',
  'wns.windows.com',
  'android.googleapis.com'
];

// Rate limit: max 5 registrations per hour per client
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX_REGISTRATIONS = 5;

const isValidEndpoint = (endpoint: string): boolean => {
  try {
    const url = new URL(endpoint);
    return VALID_PUSH_SERVICES.some(service => url.hostname.includes(service));
  } catch {
    return false;
  }
};

const isValidSubscription = (subscription: any): boolean => {
  if (!subscription || typeof subscription !== 'object') return false;
  if (!subscription.endpoint || typeof subscription.endpoint !== 'string') return false;
  if (!subscription.keys || typeof subscription.keys !== 'object') return false;
  if (!subscription.keys.p256dh || typeof subscription.keys.p256dh !== 'string') return false;
  if (!subscription.keys.auth || typeof subscription.keys.auth !== 'string') return false;
  
  // Validate key lengths (base64url encoded)
  if (subscription.keys.p256dh.length < 40 || subscription.keys.p256dh.length > 200) return false;
  if (subscription.keys.auth.length < 10 || subscription.keys.auth.length > 50) return false;
  
  return true;
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { idCliente, subscription, userAgent } = await req.json();

    // Validate required fields
    if (!idCliente || typeof idCliente !== 'string') {
      console.error('[register-push] Missing or invalid idCliente');
      return new Response(
        JSON.stringify({ error: 'idCliente is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate subscription object
    if (!isValidSubscription(subscription)) {
      console.error('[register-push] Invalid subscription format');
      return new Response(
        JSON.stringify({ error: 'Invalid subscription format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate endpoint is from a legitimate push service
    if (!isValidEndpoint(subscription.endpoint)) {
      console.error('[register-push] Invalid push service endpoint:', subscription.endpoint);
      return new Response(
        JSON.stringify({ error: 'Invalid push service endpoint' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit
    const oneHourAgo = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
    const { count: rateLimitCount, error: rateLimitError } = await supabase
      .from('push_rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('id_cliente', idCliente)
      .eq('action_type', 'register')
      .gte('created_at', oneHourAgo);

    if (rateLimitError) {
      console.error('[register-push] Rate limit check error:', rateLimitError);
    }

    if (rateLimitCount && rateLimitCount >= RATE_LIMIT_MAX_REGISTRATIONS) {
      console.warn('[register-push] Rate limit exceeded for client:', idCliente);
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Record rate limit entry
    await supabase.from('push_rate_limits').insert({
      id_cliente: idCliente,
      action_type: 'register'
    });

    // Upsert the subscription (update if endpoint exists, insert if not)
    const { error: upsertError } = await supabase
      .from('push_subscriptions')
      .upsert({
        id_cliente: idCliente,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        user_agent: userAgent?.substring(0, 500) || null,
        last_used_at: new Date().toISOString()
      }, {
        onConflict: 'id_cliente,endpoint'
      });

    if (upsertError) {
      console.error('[register-push] Upsert error:', upsertError);
      return new Response(
        JSON.stringify({ error: 'Failed to save subscription' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[register-push] Subscription registered for client:', idCliente);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[register-push] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
