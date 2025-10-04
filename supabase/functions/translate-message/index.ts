import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text, from_lang, to_lang } = await req.json();

    console.log('🌍 Translating:', { text, from_lang, to_lang });

    // DeepL API translation
    const deeplApiKey = Deno.env.get('DEEPL_API_KEY');
    
    if (!deeplApiKey) {
      console.error('❌ DEEPL_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Translation service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // DeepL API call
    const deeplResponse = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${deeplApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: [text],
        source_lang: from_lang.toUpperCase(),
        target_lang: to_lang.toUpperCase()
      })
    });

    if (!deeplResponse.ok) {
      const error = await deeplResponse.text();
      console.error('❌ DeepL API error:', error);
      
      // Fallback: return original text if translation fails
      return new Response(
        JSON.stringify({ 
          translated_text: text,
          fallback: true,
          error: 'Translation service unavailable'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const deeplData = await deeplResponse.json();
    const translatedText = deeplData.translations[0].text;

    console.log('✅ Translation successful:', translatedText);

    return new Response(
      JSON.stringify({ 
        translated_text: translatedText,
        original_text: text,
        from_lang,
        to_lang
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Translation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

