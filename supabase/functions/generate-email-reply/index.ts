
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailReplyRequest {
  originalEmail: {
    subject: string;
    from: string;
    body: string;
  };
  context?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { originalEmail, context = "" }: EmailReplyRequest = await req.json();

    const prompt = `Je bent een professionele assistent die e-mails beantwoordt namens SMANS BV, een bouw- en renovatiebedrijf. 

Originele email:
Van: ${originalEmail.from}
Onderwerp: ${originalEmail.subject}
Bericht: ${originalEmail.body}

${context ? `Extra context: ${context}` : ''}

Genereer een professioneel, vriendelijk en behulpzaam antwoord in het Nederlands. Houd het kort maar compleet. Begin met een gepaste begroeting en eindig met een professionele afsluiting namens SMANS BV.`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer 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`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat-v3-0324:free",
        messages: [
          {
            role: "system",
            content: "Je bent een professionele e-mail assistent voor SMANS BV. Genereer altijd professionele, vriendelijke en behulpzame antwoorden in het Nederlands."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices[0]?.message?.content || "Er ging iets mis bij het genereren van het antwoord.";

    return new Response(
      JSON.stringify({ reply }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error generating email reply:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
