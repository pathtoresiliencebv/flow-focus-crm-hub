import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, context } = await req.json();

    if (!text || !openAIApiKey) {
      return new Response(
        JSON.stringify({ error: 'Text and API key required' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = context === 'product' 
      ? 'Je bent een professionele schrijver voor bouwprojecten. Verbeter de gegeven tekst voor een productbeschrijving in een offerte. Maak het duidelijk, professioneel en technisch correct. Behoud de kern van de boodschap maar verbeter de formulering.'
      : 'Je bent een professionele schrijver voor bouwprojecten. Verbeter de gegeven tekst voor een tekstblok in een offerte. Maak het duidelijk, professioneel en goed leesbaar. Behoud de kern van de boodschap maar verbeter de formulering.';

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Verbeter deze tekst: "${text}"` }
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const enhancedText = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ enhancedText }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in ai-text-enhancement function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});