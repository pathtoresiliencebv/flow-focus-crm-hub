import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TranslateRequest {
  text: string;
  targetLang: string;
  sourceLang?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, targetLang, sourceLang = 'nl' }: TranslateRequest = await req.json();

    if (!text || !targetLang) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: text and targetLang' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get DeepL API key from environment
    const deeplApiKey = Deno.env.get('DEEPL_API_KEY');
    if (!deeplApiKey) {
      console.error('DEEPL_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Translation service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Map language codes to DeepL format
    const langMap: Record<string, string> = {
      'en': 'EN',
      'nl': 'NL',
      'pl': 'PL',
      'ro': 'RO',
      'tr': 'TR',
    };

    const deeplTarget = langMap[targetLang.toLowerCase()] || targetLang.toUpperCase();
    const deeplSource = sourceLang ? (langMap[sourceLang.toLowerCase()] || sourceLang.toUpperCase()) : undefined;

    console.log(`Translating from ${deeplSource || 'auto'} to ${deeplTarget}: "${text.substring(0, 50)}..."`);

    // Call DeepL API
    const deeplUrl = 'https://api-free.deepl.com/v2/translate';
    const formData = new URLSearchParams({
      auth_key: deeplApiKey,
      text: text,
      target_lang: deeplTarget,
    });

    if (deeplSource) {
      formData.append('source_lang', deeplSource);
    }

    const deeplResponse = await fetch(deeplUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (!deeplResponse.ok) {
      const errorText = await deeplResponse.text();
      console.error('DeepL API error:', deeplResponse.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: 'Translation failed', 
          details: errorText,
          status: deeplResponse.status
        }),
        { status: deeplResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const deeplData = await deeplResponse.json();
    const translatedText = deeplData.translations?.[0]?.text;

    if (!translatedText) {
      console.error('No translation in DeepL response:', deeplData);
      return new Response(
        JSON.stringify({ error: 'No translation returned' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Translation successful: "${translatedText.substring(0, 50)}..."`);

    // Cache the translation in Supabase
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Generate a simple translation key (hash would be better in production)
      const translationKey = text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .substring(0, 50);

      await supabase.from('ui_translations').upsert({
        translation_key: translationKey,
        language_code: targetLang.toLowerCase(),
        translated_text: translatedText,
        context: 'auto_translated'
      }, {
        onConflict: 'translation_key,language_code'
      });

      console.log(`💾 Cached translation: ${translationKey} (${targetLang})`);
    } catch (cacheError) {
      // Non-fatal: translation still works even if caching fails
      console.warn('Failed to cache translation:', cacheError);
    }

    return new Response(
      JSON.stringify({
        translatedText,
        sourceLang: deeplData.translations?.[0]?.detected_source_language || sourceLang,
        targetLang,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Translation error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

