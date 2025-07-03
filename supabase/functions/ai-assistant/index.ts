import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AIRequest {
  prompt: string;
  context?: string;
  type?: 'chat' | 'email' | 'project' | 'quote' | 'invoice' | 'general';
  stream?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify the JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { prompt, context, type = 'general', stream = false }: AIRequest = await req.json();

    // Get user profile for context
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .single();

    // Build system message based on type and user context
    let systemMessage = `Je bent een professionele AI-assistent voor een CRM systeem. De gebruiker is ${profile?.full_name || 'onbekend'} met rol ${profile?.role || 'Bekijker'}.`;
    
    switch (type) {
      case 'chat':
        systemMessage += ' Help met algemene vragen over projecten, klanten en bedrijfsprocessen. Geef praktische en directe antwoorden in het Nederlands.';
        break;
      case 'email':
        systemMessage += ' Help met het schrijven van professionele e-mails. Maak ze helder, beleefd en zakelijk. Antwoord alleen met de e-mail content, geen extra uitleg.';
        break;
      case 'project':
        systemMessage += ' Help met project beschrijvingen, planning en technische details. Geef praktische suggesties voor uitvoering en materialen.';
        break;
      case 'quote':
        systemMessage += ' Help met offerte beschrijvingen en item details. Maak ze professioneel en specifiek voor de klant.';
        break;
      case 'invoice':
        systemMessage += ' Help met factuur beschrijvingen en service details. Houd het zakelijk en specifiek.';
        break;
      default:
        systemMessage += ' Help met algemene bedrijfsvragen en CRM gerelateerde taken.';
    }

    const messages = [
      { role: 'system', content: systemMessage },
      ...(context ? [{ role: 'user', content: `Context: ${context}` }] : []),
      { role: 'user', content: prompt }
    ];

    if (stream) {
      // Streaming response
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          stream: true,
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      // Return streaming response
      return new Response(response.body, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/stream',
        },
      });
    } else {
      // Regular response
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;

      // Log AI usage for analytics
      await supabase
        .from('user_notifications')
        .insert({
          user_id: user.id,
          title: 'AI Assistant Gebruikt',
          message: `AI ${type} assistant gebruikt`,
          type: 'info'
        });

      return new Response(JSON.stringify({ 
        response: aiResponse,
        type,
        usage: data.usage 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error: any) {
    console.error('Error in ai-assistant function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});