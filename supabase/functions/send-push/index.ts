import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limit: max 10 notifications per minute per sender
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_SENDS = 10;

// Max text lengths for sanitization
const MAX_TITLE_LENGTH = 100;
const MAX_BODY_LENGTH = 200;

const sanitizeText = (text: string, maxLength: number): string => {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>]/g, '')    // Remove remaining < >
    .substring(0, maxLength)
    .trim();
};

// Convert VAPID keys to proper format for web-push
const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

// Generate VAPID JWT token
// Simple base64url encode
const base64UrlEncode = (str: string): string => {
  return btoa(str).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
};

// Send web push notification using simple POST (payload not encrypted for now)
// Note: For production, implement proper payload encryption with ece
const sendWebPush = async (
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string,
  vapidPublicKey: string,
  _vapidPrivateKey: string, // Not used in simplified version
  vapidSubject: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // For web push without encryption, we send the payload as-is
    // The browser will handle displaying the notification
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'TTL': '86400',
        'Urgency': 'high',
        'Authorization': `WebPush ${vapidPublicKey}`
      },
      body: JSON.stringify({ message: payload })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[send-push] Push service error:', response.status, errorText);
      
      // 410 Gone means subscription is no longer valid
      if (response.status === 410) {
        return { success: false, error: 'Subscription expired' };
      }
      
      return { success: false, error: `Push service error: ${response.status}` };
    }

    return { success: true };
  } catch (error: unknown) {
    console.error('[send-push] Error sending push:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    const vapidSubject = Deno.env.get('VAPID_SUBJECT');

    if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
      console.error('[send-push] VAPID keys not configured');
      return new Response(
        JSON.stringify({ error: 'Push notifications not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { 
      idCliente, // recipient
      senderIdCliente, // sender (optional, for audit)
      nrAtendimento,
      title,
      body,
      tag,
      data // additional data for the notification
    } = await req.json();

    // Validate required fields
    if (!idCliente || typeof idCliente !== 'string') {
      console.error('[send-push] Missing or invalid idCliente');
      return new Response(
        JSON.stringify({ error: 'idCliente is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit for sender (if provided)
    if (senderIdCliente) {
      const oneMinuteAgo = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
      const { count: rateLimitCount } = await supabase
        .from('push_rate_limits')
        .select('*', { count: 'exact', head: true })
        .eq('id_cliente', senderIdCliente)
        .eq('action_type', 'send')
        .gte('created_at', oneMinuteAgo);

      if (rateLimitCount && rateLimitCount >= RATE_LIMIT_MAX_SENDS) {
        console.warn('[send-push] Rate limit exceeded for sender:', senderIdCliente);
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Record rate limit entry
      await supabase.from('push_rate_limits').insert({
        id_cliente: senderIdCliente,
        action_type: 'send'
      });
    }

    // Get all subscriptions for the recipient
    const { data: subscriptions, error: fetchError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('id_cliente', idCliente);

    if (fetchError) {
      console.error('[send-push] Error fetching subscriptions:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch subscriptions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('[send-push] No subscriptions found for client:', idCliente);
      
      // Log audit entry
      await supabase.from('push_audit_logs').insert({
        sender_id_cliente: senderIdCliente || null,
        recipient_id_cliente: idCliente,
        nr_atendimento: nrAtendimento || null,
        title: sanitizeText(title, MAX_TITLE_LENGTH),
        success: false,
        error_message: 'No subscriptions found'
      });

      return new Response(
        JSON.stringify({ success: false, message: 'No subscriptions found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize notification content
    const sanitizedTitle = sanitizeText(title || 'Samel', MAX_TITLE_LENGTH);
    const sanitizedBody = sanitizeText(body || '', MAX_BODY_LENGTH);

    // Prepare notification payload
    const notificationPayload = JSON.stringify({
      title: sanitizedTitle,
      body: sanitizedBody,
      tag: tag || `notification-${Date.now()}`,
      data: {
        nrAtendimento,
        timestamp: Date.now(),
        ...data
      }
    });

    // Send to all subscriptions
    let successCount = 0;
    let failCount = 0;
    const expiredSubscriptions: string[] = [];

    for (const sub of subscriptions) {
      const result = await sendWebPush(
        { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
        notificationPayload,
        vapidPublicKey,
        vapidPrivateKey,
        vapidSubject
      );

      if (result.success) {
        successCount++;
        // Update last_used_at
        await supabase
          .from('push_subscriptions')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', sub.id);
      } else {
        failCount++;
        if (result.error === 'Subscription expired') {
          expiredSubscriptions.push(sub.id);
        }
      }
    }

    // Clean up expired subscriptions
    if (expiredSubscriptions.length > 0) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('id', expiredSubscriptions);
      console.log('[send-push] Cleaned up expired subscriptions:', expiredSubscriptions.length);
    }

    // Log audit entry
    await supabase.from('push_audit_logs').insert({
      sender_id_cliente: senderIdCliente || null,
      recipient_id_cliente: idCliente,
      nr_atendimento: nrAtendimento || null,
      title: sanitizedTitle,
      success: successCount > 0,
      error_message: successCount === 0 ? `All ${failCount} deliveries failed` : null
    });

    console.log(`[send-push] Sent to ${successCount}/${subscriptions.length} subscriptions for client:`, idCliente);

    return new Response(
      JSON.stringify({ 
        success: successCount > 0,
        sent: successCount,
        failed: failCount
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[send-push] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
