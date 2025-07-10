import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TranslationRequest {
  text: string;
  fromLanguage: string;
  toLanguage: string;
  context?: 'technical' | 'casual' | 'formal';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, fromLanguage, toLanguage, context = 'casual' }: TranslationRequest = await req.json();

    if (!text || !fromLanguage || !toLanguage) {
      throw new Error('Missing required parameters: text, fromLanguage, toLanguage');
    }

    // Skip translation if same language
    if (fromLanguage === toLanguage) {
      return new Response(JSON.stringify({
        translatedText: text,
        confidence: 1.0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Language mapping for better OpenAI understanding
    const languageNames: Record<string, string> = {
      'nl': 'Dutch',
      'pl': 'Polish', 
      'cs': 'Czech',
      'de': 'German',
      'en': 'English'
    };

    const fromLangName = languageNames[fromLanguage] || fromLanguage;
    const toLangName = languageNames[toLanguage] || toLanguage;

    // Context-specific system prompts
    const systemPrompts = {
      technical: `You are a professional translator specializing in technical and construction terminology. Translate accurately while preserving technical terms and maintaining professional tone.`,
      formal: `You are a professional translator for business communications. Maintain formal tone and business etiquette in translations.`,
      casual: `You are a helpful translator for everyday conversations. Keep the tone natural and conversational.`
    };

    const systemPrompt = systemPrompts[context] || systemPrompts.casual;

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
            content: `${systemPrompt} Translate from ${fromLangName} to ${toLangName}. Only return the translation, no explanations.`
          },
          { 
            role: 'user', 
            content: text 
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent translations
        max_tokens: 1000
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    const translatedText = data.choices[0]?.message?.content?.trim();

    if (!translatedText) {
      throw new Error('No translation received from OpenAI');
    }

    // Calculate confidence based on text length and complexity
    const confidence = Math.min(0.9, 0.7 + (text.length > 50 ? 0.2 : 0.1));

    console.log(`Translation: ${fromLangName} -> ${toLangName}: "${text}" -> "${translatedText}"`);

    return new Response(JSON.stringify({
      translatedText,
      confidence,
      fromLanguage,
      toLanguage,
      context
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Enhanced translation error:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      translatedText: `[Translation Error] ${error.message}`,
      confidence: 0
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});