import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AIContextData } from './useAIContext';
import { MessageClassificationService } from '@/services/messageClassificationService';

export interface SmartReplyContext {
  projectId?: string;
  customerId?: string;
  conversationHistory: any[];
  userRole: 'Administrator' | 'Administratie' | 'Installateur';
  currentMessage: string;
  aiContext?: AIContextData;
}

export interface SmartReply {
  id: string;
  text: string;
  confidence: number;
  type: 'quick_response' | 'action' | 'template' | 'ai_generated';
  action?: {
    type: 'update_project_status' | 'schedule_meeting' | 'request_materials' | 'mark_task_complete';
    data: Record<string, any>;
  };
  metadata?: {
    reasoning?: string;
    context_used?: string[];
  };
}

export interface UseSmartRepliesReturn {
  suggestions: SmartReply[];
  isLoading: boolean;
  generateSuggestions: (context: SmartReplyContext) => Promise<void>;
  selectSuggestion: (suggestion: SmartReply) => void;
  customizeSuggestion: (id: string, newText: string) => void;
  markUseful: (id: string, useful: boolean) => void;
}

export const useSmartReplies = (): UseSmartRepliesReturn => {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<SmartReply[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const classificationService = new MessageClassificationService();

  const generateSuggestions = useCallback(async (context: SmartReplyContext) => {
    if (!user || !context.currentMessage.trim()) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      // First classify the incoming message
      const classification = await classificationService.classifyMessage(
        context.currentMessage, 
        context.aiContext
      );

      // Generate different types of suggestions
      const quickResponses = await generateQuickResponses(classification, context);
      const actionSuggestions = await generateActionSuggestions(classification, context);
      const templateSuggestions = await generateTemplateSuggestions(classification, context);
      const aiSuggestions = await generateAISuggestions(classification, context);

      const allSuggestions = [
        ...quickResponses,
        ...actionSuggestions,
        ...templateSuggestions,
        ...aiSuggestions
      ];

      // Sort by confidence and limit to top 5
      allSuggestions.sort((a, b) => b.confidence - a.confidence);
      setSuggestions(allSuggestions.slice(0, 5));

    } catch (error) {
      console.error('Error generating smart replies:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, classificationService]);

  const selectSuggestion = useCallback(async (suggestion: SmartReply) => {
    if (!user) return;

    try {
      // Log the usage for learning
      await supabase.from('smart_reply_feedback').insert({
        suggestion_id: suggestion.id,
        suggestion_text: suggestion.text,
        user_id: user.id,
        was_used: true,
        was_helpful: true
      });

      // Execute action if present
      if (suggestion.action) {
        await executeAction(suggestion.action);
      }
    } catch (error) {
      console.error('Error selecting suggestion:', error);
    }
  }, [user]);

  const customizeSuggestion = useCallback((id: string, newText: string) => {
    setSuggestions(prev => 
      prev.map(suggestion => 
        suggestion.id === id 
          ? { ...suggestion, text: newText }
          : suggestion
      )
    );
  }, []);

  const markUseful = useCallback(async (id: string, useful: boolean) => {
    if (!user) return;

    try {
      const suggestion = suggestions.find(s => s.id === id);
      if (suggestion) {
        await supabase.from('smart_reply_feedback').insert({
          suggestion_id: id,
          suggestion_text: suggestion.text,
          user_id: user.id,
          was_used: false,
          was_helpful: useful
        });
      }
    } catch (error) {
      console.error('Error marking suggestion useful:', error);
    }
  }, [user, suggestions]);

  return {
    suggestions,
    isLoading,
    generateSuggestions,
    selectSuggestion,
    customizeSuggestion,
    markUseful
  };
};

// Helper functions for generating different types of suggestions

async function generateQuickResponses(classification: any, context: SmartReplyContext): Promise<SmartReply[]> {
  const replies: SmartReply[] = [];

  switch (classification.intent) {
    case 'question':
      replies.push({
        id: 'quick_understanding',
        text: 'Ik begrijp je vraag. Laat me dit voor je uitzoeken.',
        confidence: 0.8,
        type: 'quick_response'
      });
      if (context.aiContext?.currentProject) {
        replies.push({
          id: 'quick_project_info',
          text: `Dit betreft project "${context.aiContext.currentProject.title}". Ik check de details voor je.`,
          confidence: 0.9,
          type: 'quick_response'
        });
      }
      break;

    case 'complaint':
      replies.push({
        id: 'quick_apology',
        text: 'Het spijt me dat je problemen ondervindt. Ik ga dit direct oplossen.',
        confidence: 0.9,
        type: 'quick_response'
      });
      break;

    case 'acknowledgment':
      replies.push({
        id: 'quick_thanks',
        text: 'Bedankt voor je bevestiging!',
        confidence: 0.9,
        type: 'quick_response'
      });
      break;

    case 'update':
      replies.push({
        id: 'quick_noted',
        text: 'Genoteerd! Bedankt voor de update.',
        confidence: 0.8,
        type: 'quick_response'
      });
      break;
  }

  return replies;
}

async function generateActionSuggestions(classification: any, context: SmartReplyContext): Promise<SmartReply[]> {
  const actions: SmartReply[] = [];

  if (context.aiContext?.currentProject) {
    const project = context.aiContext.currentProject;
    
    // Suggest status updates
    if (classification.intent === 'update' && project.status !== 'afgerond') {
      actions.push({
        id: 'action_status_update',
        text: 'Project status bijwerken naar "in uitvoering"',
        confidence: 0.7,
        type: 'action',
        action: {
          type: 'update_project_status',
          data: { projectId: project.id, status: 'in-uitvoering' }
        }
      });
    }

    // Suggest task completion
    const incompleteTasks = project.tasks.filter(t => !t.completed);
    if (incompleteTasks.length > 0 && classification.topics.includes('voltooid')) {
      actions.push({
        id: 'action_complete_task',
        text: `Taak "${incompleteTasks[0].description}" markeren als voltooid`,
        confidence: 0.8,
        type: 'action',
        action: {
          type: 'mark_task_complete',
          data: { taskId: incompleteTasks[0].id }
        }
      });
    }
  }

  // Suggest scheduling if date mentioned
  if (classification.entities.dates && classification.entities.dates.length > 0) {
    actions.push({
      id: 'action_schedule',
      text: 'Afspraak inplannen voor genoemde datum',
      confidence: 0.6,
      type: 'action',
      action: {
        type: 'schedule_meeting',
        data: { date: classification.entities.dates[0] }
      }
    });
  }

  return actions;
}

async function generateTemplateSuggestions(classification: any, context: SmartReplyContext): Promise<SmartReply[]> {
  // Load relevant templates from database
  const { data: templates } = await supabase
    .from('message_templates')
    .select('*')
    .eq('is_active', true)
    .eq('category', mapIntentToCategory(classification.intent))
    .limit(2);

  if (!templates) return [];

  return templates.map(template => ({
    id: `template_${template.id}`,
    text: processTemplate(template.content, context),
    confidence: 0.7,
    type: 'template' as const,
    metadata: {
      reasoning: `Template gebruikt: ${template.name}`,
      context_used: ['template']
    }
  }));
}

async function generateAISuggestions(classification: any, context: SmartReplyContext): Promise<SmartReply[]> {
  try {
    // Call AI assistant edge function
    const { data, error } = await supabase.functions.invoke('chat-ai-assistant', {
      body: {
        message: context.currentMessage,
        classification,
        context: context.aiContext,
        userRole: context.userRole,
        language: 'nl'
      }
    });

    if (error) throw error;

    return data.suggestions || [];
  } catch (error) {
    console.error('Error getting AI suggestions:', error);
    return [];
  }
}

async function executeAction(action: SmartReply['action']) {
  if (!action) return;

  try {
    switch (action.type) {
      case 'update_project_status':
        await supabase
          .from('projects')
          .update({ status: action.data.status })
          .eq('id', action.data.projectId);
        break;

      case 'mark_task_complete':
        await supabase
          .from('project_tasks')
          .update({ is_completed: true })
          .eq('id', action.data.taskId);
        break;

      // Add more action types as needed
      default:
        console.warn('Unknown action type:', action.type);
    }
  } catch (error) {
    console.error('Error executing action:', error);
  }
}

function mapIntentToCategory(intent: string): string {
  const mapping: Record<string, string> = {
    'question': 'question',
    'request': 'question',
    'update': 'status_update',
    'complaint': 'problem_solving',
    'acknowledgment': 'greeting'
  };
  
  return mapping[intent] || 'greeting';
}

function processTemplate(content: string, context: SmartReplyContext): string {
  let processed = content;
  
  // Replace variables
  if (context.aiContext?.currentProject) {
    processed = processed.replace(/\{project_title\}/g, context.aiContext.currentProject.title);
    processed = processed.replace(/\{project_status\}/g, context.aiContext.currentProject.status);
  }
  
  if (context.aiContext?.customer) {
    processed = processed.replace(/\{customer_name\}/g, context.aiContext.customer.name);
  }
  
  processed = processed.replace(/\{date\}/g, new Date().toLocaleDateString('nl-NL'));
  
  return processed;
}