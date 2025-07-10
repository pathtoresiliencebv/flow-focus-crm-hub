import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatAssistantRequest {
  message: string;
  classification: {
    intent: string;
    urgency: string;
    topics: string[];
    entities: Record<string, any>;
    sentiment: string;
    confidence: number;
  };
  context: {
    currentProject?: {
      id: string;
      title: string;
      status: string;
      tasks: Array<{ id: string; description: string; completed: boolean }>;
      materials: Array<{ name: string; quantity: number; status: string }>;
    };
    customer?: {
      id: string;
      name: string;
      email: string;
    };
    conversationSummary: {
      totalMessages: number;
      commonTopics: string[];
      recentActions: string[];
      unresolved_issues: string[];
    };
  };
  userRole: string;
  language: string;
}

interface SmartReply {
  id: string;
  text: string;
  confidence: number;
  type: 'ai_generated';
  metadata?: {
    reasoning?: string;
    context_used?: string[];
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const requestData: ChatAssistantRequest = await req.json();

    console.log('AI Assistant request:', {
      intent: requestData.classification.intent,
      urgency: requestData.classification.urgency,
      hasProject: !!requestData.context.currentProject,
      hasCustomer: !!requestData.context.customer
    });

    // Generate AI-powered suggestions
    const suggestions = await generateAISuggestions(requestData, openaiApiKey);

    // Store classification in database for learning
    if (requestData.context.currentProject) {
      await storeMessageClassification(supabase, requestData);
    }

    return new Response(
      JSON.stringify({
        suggestions,
        classification: requestData.classification,
        contextualInfo: generateContextualInfo(requestData.context),
        recommendedActions: generateRecommendedActions(requestData)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in chat AI assistant:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function generateAISuggestions(request: ChatAssistantRequest, openaiApiKey: string): Promise<SmartReply[]> {
  const { message, classification, context, userRole } = request;
  
  // Build context prompt
  let contextPrompt = `Je bent een AI assistent voor een CRM systeem voor installateurs. 
  
Gebruikersrol: ${userRole}
Bericht intent: ${classification.intent}
Urgentie: ${classification.urgency}
Sentiment: ${classification.sentiment}
Onderwerpen: ${classification.topics.join(', ')}

Inkomend bericht: "${message}"

`;

  if (context.currentProject) {
    contextPrompt += `
Huidig project: ${context.currentProject.title}
Project status: ${context.currentProject.status}
Openstaande taken: ${context.currentProject.tasks.filter(t => !t.completed).map(t => t.description).join(', ')}
Benodigde materialen: ${context.currentProject.materials.map(m => `${m.name} (${m.quantity}x)`).join(', ')}
`;
  }

  if (context.customer) {
    contextPrompt += `
Klant: ${context.customer.name}
`;
  }

  contextPrompt += `
Recente gespreksonderwerpen: ${context.conversationSummary.commonTopics.join(', ')}

Genereer 2-3 relevante, korte en professionele antwoordsuggesties in het Nederlands. 
Iedere suggestie moet praktisch en actionable zijn.
Houd rekening met de context van het project en de gebruikersrol.

Formaat je antwoord als JSON array met objecten met deze structuur:
{
  "text": "De antwoordtekst",
  "reasoning": "Waarom dit een goed antwoord is"
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Je bent een behulpzame AI assistent voor een Nederlands CRM systeem. Antwoord altijd in het Nederlands en wees kort en bondig.'
          },
          {
            role: 'user',
            content: contextPrompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    if (!aiResponse) {
      return [];
    }

    // Parse AI response
    try {
      const parsedSuggestions = JSON.parse(aiResponse);
      
      return parsedSuggestions.map((suggestion: any, index: number) => ({
        id: `ai_${Date.now()}_${index}`,
        text: suggestion.text,
        confidence: calculateConfidence(suggestion, classification),
        type: 'ai_generated' as const,
        metadata: {
          reasoning: suggestion.reasoning,
          context_used: getContextUsed(context)
        }
      }));
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      
      // Fallback: treat as single text response
      return [{
        id: `ai_${Date.now()}`,
        text: aiResponse.substring(0, 200),
        confidence: 0.6,
        type: 'ai_generated' as const,
        metadata: {
          reasoning: 'AI generated response',
          context_used: getContextUsed(context)
        }
      }];
    }

  } catch (error) {
    console.error('Error calling OpenAI:', error);
    return [];
  }
}

function calculateConfidence(suggestion: any, classification: any): number {
  let confidence = 0.7; // Base confidence for AI suggestions
  
  // Increase confidence for high urgency
  if (classification.urgency === 'high' || classification.urgency === 'critical') {
    confidence += 0.1;
  }
  
  // Increase confidence for clear intent
  if (classification.confidence > 0.8) {
    confidence += 0.1;
  }
  
  // Adjust based on suggestion quality indicators
  if (suggestion.reasoning && suggestion.reasoning.length > 20) {
    confidence += 0.05;
  }
  
  return Math.min(confidence, 0.95);
}

function getContextUsed(context: any): string[] {
  const used = [];
  
  if (context.currentProject) used.push('project_data');
  if (context.customer) used.push('customer_data');
  if (context.conversationSummary.commonTopics.length > 0) used.push('conversation_history');
  
  return used;
}

function generateContextualInfo(context: any): string[] {
  const info = [];
  
  if (context.currentProject) {
    const project = context.currentProject;
    info.push(`Project: ${project.title} (${project.status})`);
    
    const incompleteTasks = project.tasks.filter((t: any) => !t.completed);
    if (incompleteTasks.length > 0) {
      info.push(`${incompleteTasks.length} openstaande taken`);
    }
  }
  
  if (context.conversationSummary.unresolved_issues.length > 0) {
    info.push(`${context.conversationSummary.unresolved_issues.length} onopgeloste problemen`);
  }
  
  return info;
}

function generateRecommendedActions(request: ChatAssistantRequest): Array<any> {
  const actions = [];
  
  if (request.classification.urgency === 'critical') {
    actions.push({
      type: 'escalate',
      description: 'Escaleren naar manager vanwege kritieke urgentie',
      data: { urgency: 'critical' }
    });
  }
  
  if (request.classification.intent === 'complaint') {
    actions.push({
      type: 'follow_up',
      description: 'Vervolgactie plannen binnen 24 uur',
      data: { intent: 'complaint' }
    });
  }
  
  return actions;
}

async function storeMessageClassification(supabase: any, request: ChatAssistantRequest) {
  try {
    await supabase
      .from('conversation_insights')
      .insert({
        user_id: request.context.currentProject?.id || 'system',
        project_id: request.context.currentProject?.id,
        insight_type: 'classification',
        title: `Bericht geclassificeerd als ${request.classification.intent}`,
        description: `Urgentie: ${request.classification.urgency}, Sentiment: ${request.classification.sentiment}`,
        data: {
          classification: request.classification,
          topics: request.classification.topics,
          entities: request.classification.entities
        },
        severity: request.classification.urgency === 'critical' ? 'error' : 
                 request.classification.urgency === 'high' ? 'warning' : 'info'
      });
  } catch (error) {
    console.error('Error storing classification:', error);
  }
}