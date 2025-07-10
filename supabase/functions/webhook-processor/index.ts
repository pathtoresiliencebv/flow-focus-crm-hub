import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHash, createHmac } from "https://deno.land/std@0.190.0/node/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookEvent {
  type: string;
  data: any;
  timestamp: string;
  source: string;
}

interface WebhookEndpoint {
  id: string;
  user_id: string;
  name: string;
  url: string;
  secret_key?: string;
  event_types: string[];
  is_active: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { type, webhook_id, event, event_type, event_data, user_id } = await req.json();

    console.log('Webhook processor request:', { type, webhook_id, event_type });

    switch (type) {
      case 'send_webhook':
        return await handleSendWebhook(supabase, webhook_id, event);
      
      case 'broadcast_event':
        return await handleBroadcastEvent(supabase, event_type, event_data, user_id);
        
      default:
        return new Response(
          JSON.stringify({ error: 'Unknown webhook action type' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
    }
  } catch (error) {
    console.error('Error in webhook processor:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function handleSendWebhook(
  supabase: any,
  webhookId: string,
  event: WebhookEvent
) {
  try {
    // Get webhook endpoint details
    const { data: webhook, error } = await supabase
      .from('webhook_endpoints')
      .select('*')
      .eq('id', webhookId)
      .eq('is_active', true)
      .single();

    if (error || !webhook) {
      console.error('Webhook not found or inactive:', webhookId);
      return new Response(
        JSON.stringify({ error: 'Webhook not found or inactive' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Prepare webhook payload
    const payload = {
      id: crypto.randomUUID(),
      event_type: event.type,
      data: event.data,
      timestamp: event.timestamp,
      source: event.source,
      webhook_id: webhookId
    };

    // Create signature if secret key is provided
    let signature = '';
    if (webhook.secret_key) {
      const payloadString = JSON.stringify(payload);
      signature = createHmac('sha256', webhook.secret_key)
        .update(payloadString)
        .digest('hex');
    }

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'FlowFocus-CRM-Webhook/1.0',
      'X-FlowFocus-Event': event.type,
      'X-FlowFocus-Delivery': crypto.randomUUID(),
      'X-FlowFocus-Timestamp': event.timestamp
    };

    if (signature) {
      headers['X-FlowFocus-Signature'] = `sha256=${signature}`;
    }

    // Send webhook
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    const success = response.ok;
    const responseText = await response.text();

    // Log webhook delivery
    await supabase
      .from('notification_delivery_logs')
      .insert({
        user_id: webhook.user_id,
        delivery_method: 'webhook',
        status: success ? 'delivered' : 'failed',
        endpoint: webhook.url,
        error_message: success ? null : `HTTP ${response.status}: ${responseText}`,
        delivered_at: success ? new Date().toISOString() : null,
        metadata: {
          webhook_id: webhookId,
          event_type: event.type,
          response_status: response.status,
          response_headers: Object.fromEntries(response.headers.entries())
        }
      });

    // Update webhook last_triggered_at
    if (success) {
      await supabase
        .from('webhook_endpoints')
        .update({ last_triggered_at: new Date().toISOString() })
        .eq('id', webhookId);
    }

    console.log(`Webhook delivery ${success ? 'successful' : 'failed'}:`, {
      webhookId,
      url: webhook.url,
      status: response.status,
      eventType: event.type
    });

    return new Response(
      JSON.stringify({ 
        success,
        webhook_id: webhookId,
        status: response.status,
        response_preview: responseText.slice(0, 200)
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error sending webhook:', error);
    
    // Log failed delivery
    try {
      await supabase
        .from('notification_delivery_logs')
        .insert({
          user_id: 'system',
          delivery_method: 'webhook',
          status: 'failed',
          endpoint: 'unknown',
          error_message: error.message,
          metadata: {
            webhook_id: webhookId,
            event_type: event.type,
            error_type: 'delivery_error'
          }
        });
    } catch (logError) {
      console.error('Error logging webhook failure:', logError);
    }

    throw error;
  }
}

async function handleBroadcastEvent(
  supabase: any,
  eventType: string,
  eventData: any,
  userId?: string
) {
  try {
    // Get all active webhooks that listen to this event type
    let query = supabase
      .from('webhook_endpoints')
      .select('*')
      .eq('is_active', true)
      .contains('event_types', [eventType]);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: webhooks, error } = await query;

    if (error) {
      console.error('Error fetching webhooks:', error);
      throw error;
    }

    if (!webhooks || webhooks.length === 0) {
      console.log('No active webhooks found for event type:', eventType);
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'No webhooks found' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const event: WebhookEvent = {
      type: eventType,
      data: eventData,
      timestamp: new Date().toISOString(),
      source: 'flowfocus-crm'
    };

    // Send to all matching webhooks
    const results = await Promise.allSettled(
      webhooks.map(webhook => 
        handleSendWebhook(supabase, webhook.id, event)
      )
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`Event broadcast completed: ${successful} successful, ${failed} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successful, 
        failed: failed,
        total: webhooks.length,
        event_type: eventType
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error broadcasting event:', error);
    throw error;
  }
}