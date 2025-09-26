import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface NotificationPayload {
  type: 'chat_message' | 'project_update' | 'general';
  title: string;
  body: string;
  data?: any;
  sender_name?: string;
  channel_id?: string;
  message_id?: string;
  project_id?: string;
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

    const { type, payload, subscription, user_id } = await req.json();

    console.log('Notification processor request:', { type, user_id });

    switch (type) {
      case 'register_push_subscription':
        return await handlePushSubscriptionRegistration(supabase, subscription, user_id);
      
      case 'push_notification':
        return await handlePushNotification(supabase, payload, user_id);
      
      case 'chat_message_notification':
        return await handleChatMessageNotification(supabase, payload);
        
      default:
        return new Response(
          JSON.stringify({ error: 'Unknown notification type' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
    }
  } catch (error) {
    console.error('Error in notification processor:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function handlePushSubscriptionRegistration(
  supabase: any,
  subscription: PushSubscription,
  userId: string
) {
  try {
    // Store push subscription in database
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: userId,
        subscription_data: subscription,
        endpoint: subscription.endpoint,
        is_active: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,endpoint'
      });

    if (error) {
      console.error('Error storing push subscription:', error);
      throw error;
    }

    console.log('Push subscription registered successfully for user:', userId);

    return new Response(
      JSON.stringify({ success: true, message: 'Push subscription registered' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error registering push subscription:', error);
    throw error;
  }
}

async function handlePushNotification(
  supabase: any,
  payload: NotificationPayload,
  userId?: string
) {
  try {
    // Get active push subscriptions for target users
    let query = supabase
      .from('push_subscriptions')
      .select('*')
      .eq('is_active', true);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: subscriptions, error } = await query;

    if (error) {
      console.error('Error fetching push subscriptions:', error);
      throw error;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No active push subscriptions found');
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'No subscriptions found' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Send push notifications
    const results = await Promise.allSettled(
      subscriptions.map(sub => sendPushNotification(sub.subscription_data, payload))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`Push notifications sent: ${successful} successful, ${failed} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successful, 
        failed: failed,
        total: subscriptions.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error handling push notification:', error);
    throw error;
  }
}

async function handleChatMessageNotification(
  supabase: any,
  { channel_id, message_id, sender_name, content }: any
) {
  try {
    // Get channel participants
    const { data: participants, error } = await supabase
      .from('chat_participants')
      .select('user_id')
      .eq('channel_id', channel_id);

    if (error || !participants) {
      console.error('Error fetching channel participants:', error);
      throw error;
    }

    // Get push subscriptions for participants
    const userIds = participants.map(p => p.user_id);
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', userIds)
      .eq('is_active', true);

    if (subError) {
      console.error('Error fetching push subscriptions:', subError);
      throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const notificationPayload: NotificationPayload = {
      type: 'chat_message',
      title: `Nieuw bericht van ${sender_name}`,
      body: content || 'Nieuw bericht ontvangen',
      sender_name,
      channel_id,
      message_id,
      data: {
        url: `/chat?channel=${channel_id}`,
        type: 'chat_message',
        channel_id,
        message_id
      }
    };

    // Send notifications
    const results = await Promise.allSettled(
      subscriptions.map(sub => sendPushNotification(sub.subscription_data, notificationPayload))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successful,
        total: subscriptions.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error handling chat message notification:', error);
    throw error;
  }
}

async function sendPushNotification(subscription: PushSubscription, payload: NotificationPayload) {
  try {
    // Note: In production, you would use a proper Web Push library with VAPID keys
    // For now, this is a placeholder that logs the notification
    console.log('Sending push notification:', {
      endpoint: subscription.endpoint,
      payload: payload.title
    });

    // In a real implementation, you would use webpush library:
    // const webpush = require('web-push');
    // webpush.setVapidDetails('mailto:your-email@example.com', publicKey, privateKey);
    // return await webpush.sendNotification(subscription, JSON.stringify(payload));

    return Promise.resolve({ success: true });
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
}