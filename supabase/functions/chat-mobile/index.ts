import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('Authentication error:', authError?.message)
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const url = new URL(req.url)
    const path = url.pathname.split('/').pop()

    // GET /conversations - Get available chat users
    if (req.method === 'GET' && path === 'conversations') {
      console.log(`Fetching conversations for user: ${user.id}`)
      
      const { data: conversations, error } = await supabase
        .rpc('get_available_chat_users', { current_user_id: user.id })

      if (error) {
        console.error('Error fetching conversations:', error.message)
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to fetch conversations',
          code: 'FETCH_ERROR'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({
        success: true,
        data: conversations || []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // GET /messages?otherUserId=xxx - Get messages for conversation
    if (req.method === 'GET' && path === 'messages') {
      const otherUserId = url.searchParams.get('otherUserId')
      
      if (!otherUserId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'otherUserId parameter is required',
          code: 'MISSING_PARAMETER'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      console.log(`Fetching messages between ${user.id} and ${otherUserId}`)

      const { data: messages, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`and(from_user_id.eq.${user.id},to_user_id.eq.${otherUserId}),and(from_user_id.eq.${otherUserId},to_user_id.eq.${user.id})`)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching messages:', error.message)
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to fetch messages',
          code: 'FETCH_ERROR'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({
        success: true,
        data: messages || []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // POST /message - Send new message
    if (req.method === 'POST' && path === 'message') {
      const { to_user_id, content, message_type = 'text' } = await req.json()

      if (!to_user_id || !content) {
        return new Response(JSON.stringify({
          success: false,
          error: 'to_user_id and content are required',
          code: 'MISSING_PARAMETERS'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      console.log(`Sending message from ${user.id} to ${to_user_id}`)

      const { data: message, error } = await supabase
        .from('direct_messages')
        .insert({
          from_user_id: user.id,
          to_user_id,
          content,
          message_type
        })
        .select()
        .single()

      if (error) {
        console.error('Error sending message:', error.message)
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to send message',
          code: 'SEND_ERROR'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({
        success: true,
        data: message,
        message: 'Message sent successfully'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Invalid endpoint
    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid endpoint',
      code: 'INVALID_ENDPOINT'
    }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    console.error('Catch-all error:', error.message || error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Unknown error',
      code: 'INTERNAL_ERROR'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})