import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TranslationRequest {
  text: string;
  fromLanguage?: string;
  toLanguage: string;
  messageId?: string;
}

interface TranslationResponse {
  translatedText: string;
  originalText: string;
  fromLanguage: string;
  toLanguage: string;
  confidence: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, fromLanguage, toLanguage, messageId }: TranslationRequest = await req.json();

    if (!text || !toLanguage) {
      throw new Error("Text and target language are required");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check if translation already exists
    if (messageId) {
      const { data: existingTranslation } = await supabase
        .from('message_translations')
        .select('*')
        .eq('message_id', messageId)
        .eq('target_language', toLanguage)
        .single();

      if (existingTranslation) {
        return new Response(JSON.stringify({
          translatedText: existingTranslation.translated_text,
          originalText: text,
          fromLanguage: existingTranslation.source_language,
          toLanguage: toLanguage,
          confidence: existingTranslation.confidence,
          cached: true
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    // Perform translation using Google Translate API
    const googleApiKey = Deno.env.get("GOOGLE_TRANSLATE_API_KEY");
    if (!googleApiKey) {
      throw new Error("Google Translate API key not configured");
    }

    // Detect source language if not provided
    let detectedLanguage = fromLanguage;
    if (!fromLanguage) {
      const detectResponse = await fetch(
        `https://translation.googleapis.com/language/translate/v2/detect?key=${googleApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: text,
          }),
        }
      );

      if (!detectResponse.ok) {
        throw new Error('Language detection failed');
      }

      const detectResult = await detectResponse.json();
      detectedLanguage = detectResult.data.detections[0][0].language;
    }

    // Skip translation if source and target languages are the same
    if (detectedLanguage === toLanguage) {
      return new Response(JSON.stringify({
        translatedText: text,
        originalText: text,
        fromLanguage: detectedLanguage,
        toLanguage: toLanguage,
        confidence: 1.0,
        skipped: true
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Translate text
    const translateResponse = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${googleApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: detectedLanguage,
          target: toLanguage,
          format: 'text',
        }),
      }
    );

    if (!translateResponse.ok) {
      throw new Error('Translation failed');
    }

    const translateResult = await translateResponse.json();
    const translatedText = translateResult.data.translations[0].translatedText;
    const confidence = translateResult.data.translations[0].confidence || 0.9;

    // Store translation for caching (if messageId provided)
    if (messageId) {
      await supabase
        .from('message_translations')
        .insert({
          message_id: messageId,
          original_text: text,
          translated_text: translatedText,
          source_language: detectedLanguage,
          target_language: toLanguage,
          confidence: confidence,
          translation_provider: 'google',
          created_at: new Date().toISOString()
        });
    }

    const response: TranslationResponse = {
      translatedText,
      originalText: text,
      fromLanguage: detectedLanguage,
      toLanguage: toLanguage,
      confidence
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Translation error:", error);
    
    // Fallback: return original text if translation fails
    const fallbackResponse = {
      translatedText: (await req.json()).text || '',
      originalText: (await req.json()).text || '',
      fromLanguage: 'unknown',
      toLanguage: (await req.json()).toLanguage || 'en',
      confidence: 0,
      error: error.message
    };

    return new Response(JSON.stringify(fallbackResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200, // Don't fail the request, just return original text
    });
  }
});