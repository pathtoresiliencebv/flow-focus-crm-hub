// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TranslateRequest {
  texts: string[];
  targetLanguage: string;
  sourceLanguage?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { texts, targetLanguage, sourceLanguage = 'nl' }: TranslateRequest = await req.json();

    if (!texts || texts.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No texts provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const DEEPL_API_KEY = Deno.env.get('DEEPL_API_KEY');
    if (!DEEPL_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'DeepL API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // DeepL expects uppercase language codes
    const sourceLang = sourceLanguage.toUpperCase();
    const targetLang = targetLanguage.toUpperCase();

    console.log(`📝 Translating ${texts.length} texts from ${sourceLang} to ${targetLang}`);

    // Translate texts in batches (DeepL limit is 50 texts per request)
    const batchSize = 50;
    const translations: string[] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      
      // Build form data for DeepL
      const formData = new URLSearchParams();
      batch.forEach(text => formData.append('text', text));
      formData.append('source_lang', sourceLang);
      formData.append('target_lang', targetLang);
      formData.append('preserve_formatting', '1');
      formData.append('tag_handling', 'html');

      const response = await fetch('https://api-free.deepl.com/v2/translate', {
        method: 'POST',
        headers: {
          'Authorization': `DeepL-Auth-Key ${DEEPL_API_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString()
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('❌ DeepL API error:', error);
        
        // Fallback: return original texts
        translations.push(...batch);
        continue;
      }

      const data = await response.json();
      
      if (data.translations && Array.isArray(data.translations)) {
        translations.push(...data.translations.map((t: any) => t.text));
        console.log(`✅ Translated batch of ${batch.length} texts`);
      } else {
        // Fallback: return original texts
        translations.push(...batch);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        translations,
        count: translations.length
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('❌ Error in translate-ui-texts:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};

serve(handler);

