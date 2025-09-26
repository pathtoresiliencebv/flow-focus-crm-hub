import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationPayload {
  title: string;
  body: string;
  type?: string;
  data?: Record<string, any>;
  priority?: 'high' | 'normal' | 'low';
  actionUrl?: string;
}

interface FCMMessage {
  to?: string;
  registration_ids?: string[];
  notification: {
    title: string;
    body: string;
    icon?: string;
    sound?: string;
    badge?: string;
  };
  data?: Record<string, any>;
  priority?: string;
  android?: {
    priority?: string;
    notification?: {
      icon?: string;
      color?: string;
      sound?: string;
      click_action?: string;
    };
  };
  apns?: {
    payload?: {
      aps?: {
        alert?: {
          title?: string;
          body?: string;
        };
        badge?: number;
        sound?: string;
        'content-available'?: number;
      };
    };
    headers?: {
      'apns-priority'?: string;
      'apns-push-type'?: string;
    };
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userIds, notification, sendToAll = false } = await req.json();

    if (!notification || !notification.title || !notification.body) {
      throw new Error("Notification title and body are required");
    }

    if (!sendToAll && (!userIds || !Array.isArray(userIds) || userIds.length === 0)) {
      throw new Error("User IDs are required when not sending to all users");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const fcmServerKey = Deno.env.get("FCM_SERVER_KEY");
    if (!fcmServerKey) {
      throw new Error("FCM Server Key not configured");
    }

    let targetUsers: string[] = [];
    
    if (sendToAll) {
      // Get all active users
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id')
        .eq('status', 'Actief');

      if (usersError) throw usersError;
      targetUsers = users.map(u => u.id);
    } else {
      targetUsers = userIds;
    }

    console.log(`Sending notifications to ${targetUsers.length} users`);

    const results = [];

    for (const userId of targetUsers) {
      try {
        // Check if user should receive this notification
        const { data: shouldSend, error: checkError } = await supabase
          .rpc('should_send_notification', {
            target_user_id: userId,
            notification_type: notification.type || 'general'
          });

        if (checkError) {
          console.error(`Error checking notification settings for user ${userId}:`, checkError);
          continue;
        }

        if (!shouldSend) {
          console.log(`Skipping notification for user ${userId} due to settings`);
          continue;
        }

        // Get active push tokens for user
        const { data: tokens, error: tokensError } = await supabase
          .rpc('get_user_push_tokens', { target_user_id: userId });

        if (tokensError) {
          console.error(`Error getting tokens for user ${userId}:`, tokensError);
          continue;
        }

        if (!tokens || tokens.length === 0) {
          console.log(`No active push tokens for user ${userId}`);
          continue;
        }

        const tokenList = tokens.map(t => t.token);

        // Create FCM message
        const fcmMessage: FCMMessage = {
          registration_ids: tokenList,
          notification: {
            title: notification.title,
            body: notification.body,
            icon: 'ic_notification',
            sound: 'default',
          },
          data: {
            type: notification.type || 'general',
            actionUrl: notification.actionUrl || '',
            timestamp: new Date().toISOString(),
            ...notification.data
          },
          priority: notification.priority === 'high' ? 'high' : 'normal',
          android: {
            priority: notification.priority === 'high' ? 'high' : 'normal',
            notification: {
              icon: 'ic_notification',
              color: '#3b82f6',
              sound: 'default',
              click_action: notification.actionUrl || 'FLUTTER_NOTIFICATION_CLICK',
            },
          },
          apns: {
            payload: {
              aps: {
                alert: {
                  title: notification.title,
                  body: notification.body,
                },
                badge: 1,
                sound: 'default',
                'content-available': 1,
              },
            },
            headers: {
              'apns-priority': notification.priority === 'high' ? '10' : '5',
              'apns-push-type': 'alert',
            },
          },
        };

        // Send to FCM
        const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            'Authorization': `key=${fcmServerKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(fcmMessage),
        });

        const fcmResult = await fcmResponse.json();

        // Log notification to history
        await supabase
          .from('notification_history')
          .insert({
            user_id: userId,
            title: notification.title,
            body: notification.body,
            type: notification.type || 'general',
            data: notification.data || {},
            delivery_status: fcmResponse.ok ? 'sent' : 'failed',
            platform: 'fcm',
            error_message: fcmResponse.ok ? null : JSON.stringify(fcmResult),
          });

        results.push({
          userId,
          success: fcmResponse.ok,
          tokensCount: tokenList.length,
          fcmResult: fcmResult,
        });

        console.log(`Notification sent to user ${userId}:`, fcmResult);

      } catch (userError) {
        console.error(`Error sending notification to user ${userId}:`, userError);
        results.push({
          userId,
          success: false,
          error: userError.message,
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;

    return new Response(JSON.stringify({
      success: true,
      message: `Notifications processed: ${successCount} sent, ${failCount} failed`,
      totalUsers: targetUsers.length,
      results: results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Push notification error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});