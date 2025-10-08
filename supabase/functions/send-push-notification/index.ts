import { serve } from 'https://deno.land/std@0.190.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PushNotificationRequest {
  userIds?: string[]  // Send to specific users
  userId?: string     // Send to single user
  type: 'project_assigned' | 'chat_message' | 'receipt_status' | 'planning_change' | 'werkbon_ready'
  title: string
  body: string
  data?: {
    projectId?: string
    chatId?: string
    receiptId?: string
    planningId?: string
    completionId?: string
    [key: string]: any
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { userIds, userId, type, title, body, data }: PushNotificationRequest = await req.json()

    if (!title || !body) {
      throw new Error('title and body are required')
    }

    if (!userIds && !userId) {
      throw new Error('userIds or userId is required')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('📤 Sending push notification:', { type, title, userIds: userIds || [userId] })

    // Get target user IDs
    const targetUserIds = userIds || (userId ? [userId] : [])

    // Fetch device tokens for target users
    const { data: tokens, error: tokensError } = await supabase
      .from('device_tokens')
      .select('*')
      .in('user_id', targetUserIds)
      .eq('is_active', true)

    if (tokensError) {
      console.error('Error fetching device tokens:', tokensError)
      throw tokensError
    }

    if (!tokens || tokens.length === 0) {
      console.log('⚠️ No device tokens found for users:', targetUserIds)
      return new Response(JSON.stringify({
        success: true,
        message: 'No devices to send to',
        sent: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    console.log(`📱 Found ${tokens.length} device tokens`)

    // Send via FCM
    const fcmServerKey = Deno.env.get('FCM_SERVER_KEY')
    
    if (!fcmServerKey) {
      console.error('❌ FCM_SERVER_KEY not configured')
      throw new Error('FCM not configured. Set FCM_SERVER_KEY in Supabase secrets.')
    }

    let sentCount = 0
    const errors: any[] = []

    // Send to each device
    for (const token of tokens) {
      try {
        const fcmPayload = {
          to: token.token,
          notification: {
            title: title,
            body: body,
            sound: 'default',
            badge: '1'
          },
          data: {
            type: type,
            ...data
          },
          priority: 'high'
        }

        const response = await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `key=${fcmServerKey}`
          },
          body: JSON.stringify(fcmPayload)
        })

        const result = await response.json()

        if (response.ok && result.success === 1) {
          sentCount++
          console.log(`✅ Push sent to ${token.platform} device:`, token.id)
          
          // Update last_used_at
          await supabase
            .from('device_tokens')
            .update({ last_used_at: new Date().toISOString() })
            .eq('id', token.id)
        } else {
          console.error(`❌ FCM error for token ${token.id}:`, result)
          
          // If token is invalid, mark as inactive
          if (result.results?.[0]?.error === 'InvalidRegistration' || 
              result.results?.[0]?.error === 'NotRegistered') {
            await supabase
              .from('device_tokens')
              .update({ is_active: false })
              .eq('id', token.id)
            
            console.log(`🔴 Marked token ${token.id} as inactive`)
          }
          
          errors.push({ tokenId: token.id, error: result })
        }

      } catch (error: any) {
        console.error(`❌ Error sending to token ${token.id}:`, error)
        errors.push({ tokenId: token.id, error: error.message })
      }
    }

    console.log(`📊 Push notification results: ${sentCount}/${tokens.length} sent`)

    return new Response(JSON.stringify({
      success: true,
      sent: sentCount,
      total: tokens.length,
      errors: errors.length > 0 ? errors : undefined
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error('❌ Error sending push notification:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to send push notification'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

/**
 * SETUP INSTRUCTIONS:
 * 
 * 1. Get FCM Server Key from Firebase Console:
 *    - Go to Firebase Console → Project Settings → Cloud Messaging
 *    - Copy "Server key"
 * 
 * 2. Set in Supabase:
 *    supabase secrets set FCM_SERVER_KEY="your-server-key"
 * 
 * 3. Deploy function:
 *    supabase functions deploy send-push-notification
 * 
 * 4. Test:
 *    curl -X POST https://your-project.supabase.co/functions/v1/send-push-notification \
 *      -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
 *      -H "Content-Type: application/json" \
 *      -d '{
 *        "userId": "user-uuid",
 *        "type": "project_assigned",
 *        "title": "Nieuw Project",
 *        "body": "Je hebt een nieuw project toegewezen gekregen",
 *        "data": {"projectId": "project-uuid"}
 *      }'
 * 
 * USAGE EXAMPLES:
 * 
 * // Send to single user
 * supabase.functions.invoke('send-push-notification', {
 *   body: {
 *     userId: 'abc-123',
 *     type: 'project_assigned',
 *     title: 'Nieuw Project',
 *     body: 'Kozijn installatie Kerkstraat 123',
 *     data: { projectId: 'project-123' }
 *   }
 * })
 * 
 * // Send to multiple users
 * supabase.functions.invoke('send-push-notification', {
 *   body: {
 *     userIds: ['user-1', 'user-2', 'user-3'],
 *     type: 'planning_change',
 *     title: 'Planning Gewijzigd',
 *     body: 'Afspraak verzet naar morgen 10:00',
 *     data: { planningId: 'planning-123' }
 *   }
 * })
 */

