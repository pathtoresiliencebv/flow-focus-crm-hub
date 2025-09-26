import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();

    if (!prompt) {
      throw new Error('Prompt is required');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: `Je bent een expert in het schrijven van professionele zakelijke email templates. 
            
            Maak een email template aan gebaseerd op de gebruiker's prompt. Retourneer je antwoord als een JSON object met de volgende structuur:
            
            {
              "template": {
                "name": "Korte beschrijvende naam voor de template",
                "subject": "Professional email subject line",
                "body_text": "Complete email body in tekst formaat. Gebruik [Variabelen] voor dynamische content zoals [Naam], [Bedrijf], [Datum], [Project], etc."
              }
            }
            
            Richtlijnen:
            - Schrijf in het Nederlands
            - Gebruik een professionele maar vriendelijke toon
            - Voeg variabelen toe voor personalisatie zoals [Naam], [Bedrijf], [Datum]
            - Houd emails beknopt maar compleet
            - Zorg voor een duidelijke call-to-action waar relevant
            - Gebruik standaard Nederlandse zakelijke email structuur
            ` 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    // Try to parse as JSON
    let template;
    try {
      const parsed = JSON.parse(generatedContent);
      template = parsed.template;
    } catch (parseError) {
      // If JSON parsing fails, create a basic template structure
      template = {
        name: `AI Template - ${new Date().toLocaleDateString('nl-NL')}`,
        subject: "Gegenereerd onderwerp",
        body_text: generatedContent
      };
    }

    return new Response(JSON.stringify({ template }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-email-template function:', error);
    return new Response(JSON.stringify({ 
      error: 'Fout bij genereren email template', 
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});