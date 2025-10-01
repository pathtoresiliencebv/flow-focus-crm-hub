import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OfflineMessage {
  temp_id: string;
  channel_id: string;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'voice';
  file_url?: string;
  file_name?: string;
  created_at: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get user from auth header
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    const { messages }: { messages: OfflineMessage[] } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Invalid messages format');
    }

    console.log(`Syncing ${messages.length} offline messages for user ${user.id}`);

    const syncResults = [];

    for (const msg of messages) {
      try {
        // Check if message already exists in offline queue
        const { data: existingQueue } = await supabase
          .from('offline_message_queue')
          .select('id')
          .eq('temp_id', msg.temp_id)
          .eq('user_id', user.id)
          .single();

        // Insert into actual chat_messages table
        const { data: newMessage, error: insertError } = await supabase
          .from('chat_messages')
          .insert({
            channel_id: msg.channel_id,
            sender_id: user.id,
            content: msg.content,
            message_type: msg.message_type,
            file_url: msg.file_url,
            file_name: msg.file_name,
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error inserting message:', insertError);
          syncResults.push({
            temp_id: msg.temp_id,
            success: false,
            error: insertError.message
          });
          continue;
        }

        // Update offline queue as synced or insert if doesn't exist
        if (existingQueue) {
          await supabase
            .from('offline_message_queue')
            .update({ 
              is_synced: true, 
              synced_at: new Date().toISOString() 
            })
            .eq('id', existingQueue.id);
        } else {
          await supabase
            .from('offline_message_queue')
            .insert({
              user_id: user.id,
              channel_id: msg.channel_id,
              content: msg.content,
              message_type: msg.message_type,
              file_url: msg.file_url,
              file_name: msg.file_name,
              temp_id: msg.temp_id,
              is_synced: true,
              synced_at: new Date().toISOString()
            });
        }

        // Update channel timestamp
        await supabase
          .from('chat_channels')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', msg.channel_id);

        syncResults.push({
          temp_id: msg.temp_id,
          message_id: newMessage.id,
          success: true
        });

        console.log(`Successfully synced message ${msg.temp_id}`);
      } catch (error) {
        console.error(`Error syncing message ${msg.temp_id}:`, error);
        syncResults.push({
          temp_id: msg.temp_id,
          success: false,
          error: error.message
        });
      }
    }

    // Clean up old synced messages from queue (older than 7 days)
    await supabase
      .from('offline_message_queue')
      .delete()
      .eq('user_id', user.id)
      .eq('is_synced', true)
      .lt('synced_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    return new Response(
      JSON.stringify({ 
        success: true,
        synced_count: syncResults.filter(r => r.success).length,
        failed_count: syncResults.filter(r => !r.success).length,
        results: syncResults
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in message-sync function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});