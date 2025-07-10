import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface AIProjectData {
  id: string;
  title: string;
  status: string;
  assignedUsers: string[];
  tasks: Array<{
    id: string;
    description: string;
    completed: boolean;
  }>;
  materials: Array<{
    name: string;
    quantity: number;
    status: string;
  }>;
}

export interface AICustomerData {
  id: string;
  name: string;
  email: string;
  recentProjects: string[];
}

export interface ConversationSummary {
  totalMessages: number;
  commonTopics: string[];
  recentActions: string[];
  unresolved_issues: string[];
}

export interface AIContextData {
  currentProject?: AIProjectData;
  customer?: AICustomerData;
  conversationSummary: ConversationSummary;
}

export interface UseAIContextReturn {
  contextData: AIContextData | null;
  isLoading: boolean;
  refreshContext: (projectId?: string, customerId?: string) => Promise<void>;
  getRelevantInfo: (query: string) => Promise<string[]>;
}

export const useAIContext = (): UseAIContextReturn => {
  const { user } = useAuth();
  const [contextData, setContextData] = useState<AIContextData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshContext = useCallback(async (projectId?: string, customerId?: string) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const context: AIContextData = {
        conversationSummary: {
          totalMessages: 0,
          commonTopics: [],
          recentActions: [],
          unresolved_issues: []
        }
      };

      // Fetch project data if projectId provided
      if (projectId) {
        const { data: project } = await supabase
          .from('projects')
          .select('id, title, status')
          .eq('id', projectId)
          .single();

        if (project) {
          // Fetch project tasks separately
          const { data: tasks } = await supabase
            .from('project_tasks')
            .select('id, task_description, is_completed')
            .eq('project_id', projectId);

          // Fetch project materials separately
          const { data: materials } = await supabase
            .from('project_materials')
            .select('material_name, quantity, supplier')
            .eq('project_id', projectId);

          context.currentProject = {
            id: project.id,
            title: project.title,
            status: project.status,
            assignedUsers: [], // TODO: Get from project assignments
            tasks: (tasks || []).map((task: any) => ({
              id: task.id,
              description: task.task_description,
              completed: task.is_completed || false
            })),
            materials: (materials || []).map((material: any) => ({
              name: material.material_name,
              quantity: material.quantity || 0,
              status: 'ordered' // TODO: Add status field to materials
            }))
          };
        }
      }

      // Fetch customer data if customerId provided
      if (customerId) {
        const { data: customer } = await supabase
          .from('customers')
          .select(`
            id,
            name,
            email
          `)
          .eq('id', customerId)
          .single();

        if (customer) {
          // Get recent projects for this customer
          const { data: recentProjects } = await supabase
            .from('projects')
            .select('id')
            .eq('customer_id', customerId)
            .order('created_at', { ascending: false })
            .limit(5);

          context.customer = {
            id: customer.id,
            name: customer.name,
            email: customer.email,
            recentProjects: (recentProjects || []).map(p => p.id)
          };
        }
      }

      // Fetch conversation summary
      const { data: messages } = await supabase
        .from('direct_messages')
        .select('id, content, message_type, created_at')
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (messages) {
        context.conversationSummary = {
          totalMessages: messages.length,
          commonTopics: extractTopics(messages.map(m => m.content)),
          recentActions: extractActions(messages),
          unresolved_issues: extractUnresolvedIssues(messages)
        };
      }

      setContextData(context);
    } catch (error) {
      console.error('Error refreshing AI context:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const getRelevantInfo = useCallback(async (query: string): Promise<string[]> => {
    const info: string[] = [];
    
    if (!contextData) return info;

    // Add project info if relevant
    if (contextData.currentProject) {
      const project = contextData.currentProject;
      
      if (query.toLowerCase().includes('project') || query.toLowerCase().includes('taak')) {
        info.push(`Huidig project: ${project.title} (Status: ${project.status})`);
        
        const incompleteTasks = project.tasks.filter(t => !t.completed);
        if (incompleteTasks.length > 0) {
          info.push(`Openstaande taken: ${incompleteTasks.map(t => t.description).join(', ')}`);
        }
      }

      if (query.toLowerCase().includes('materiaal') || query.toLowerCase().includes('onderdelen')) {
        if (project.materials.length > 0) {
          info.push(`Benodigde materialen: ${project.materials.map(m => `${m.name} (${m.quantity}x)`).join(', ')}`);
        }
      }
    }

    // Add customer info if relevant
    if (contextData.customer && (query.toLowerCase().includes('klant') || query.toLowerCase().includes('contact'))) {
      info.push(`Klant: ${contextData.customer.name}`);
      if (contextData.customer.email) {
        info.push(`Email: ${contextData.customer.email}`);
      }
    }

    return info;
  }, [contextData]);

  return {
    contextData,
    isLoading,
    refreshContext,
    getRelevantInfo
  };
};

// Helper functions for text analysis
function extractTopics(messages: string[]): string[] {
  const topics: string[] = [];
  const keywords = ['project', 'materiaal', 'planning', 'installatie', 'probleem', 'vraag', 'status'];
  
  keywords.forEach(keyword => {
    const count = messages.filter(msg => 
      msg.toLowerCase().includes(keyword)
    ).length;
    
    if (count > 2) {
      topics.push(keyword);
    }
  });
  
  return topics;
}

function extractActions(messages: any[]): string[] {
  const actions: string[] = [];
  const actionKeywords = ['voltooid', 'gestart', 'besteld', 'gepland', 'aangepast'];
  
  messages.slice(0, 10).forEach(msg => {
    actionKeywords.forEach(action => {
      if (msg.content.toLowerCase().includes(action)) {
        actions.push(`${action} - ${new Date(msg.created_at).toLocaleDateString()}`);
      }
    });
  });
  
  return actions.slice(0, 5);
}

function extractUnresolvedIssues(messages: any[]): string[] {
  const issues: string[] = [];
  const issueKeywords = ['probleem', 'storing', 'defect', 'niet werkend', 'fout'];
  
  messages.slice(0, 20).forEach(msg => {
    issueKeywords.forEach(issue => {
      if (msg.content.toLowerCase().includes(issue) && !msg.content.toLowerCase().includes('opgelost')) {
        issues.push(msg.content.substring(0, 100) + '...');
      }
    });
  });
  
  return issues.slice(0, 3);
}