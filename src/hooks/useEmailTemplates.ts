import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body_html: string;
  body_text: string;
  category: string;
  template_type: 'system' | 'custom' | 'ai_generated';
  is_system_template: boolean;
  is_active: boolean;
  usage_count: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export const useEmailTemplates = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all active templates (system + user's custom)
  const { data: templates = [], isLoading } = useQuery<EmailTemplate[]>({
    queryKey: ['email_templates', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('is_active', true)
        .or(`is_system_template.eq.true,user_id.eq.${user?.id}`)
        .order('template_type', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      return data as EmailTemplate[];
    },
    enabled: !!user?.id,
  });

  // Create new template
  const createTemplateMutation = useMutation({
    mutationFn: async (templateData: {
      name: string;
      subject: string;
      body_html: string;
      body_text: string;
      category: string;
      template_type?: 'custom' | 'ai_generated';
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('email_templates')
        .insert({
          ...templateData,
          user_id: user.id,
          template_type: templateData.template_type || 'custom',
          is_system_template: false,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email_templates'] });
      toast({
        title: "Template aangemaakt",
        description: "Email template is succesvol aangemaakt.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fout bij aanmaken template",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update template usage
  const updateUsageMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase
        .from('email_templates')
        .update({
          usage_count: 1, // Will be incremented via RPC
          last_used_at: new Date().toISOString(),
        })
        .eq('id', templateId);

      if (error) throw error;
    },
  });

  // Delete template (only custom ones)
  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', templateId)
        .eq('is_system_template', false); // Only allow deleting custom templates

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email_templates'] });
      toast({
        title: "Template verwijderd",
        description: "Email template is succesvol verwijderd.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fout bij verwijderen template",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Generate template with AI
  const generateWithAIMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const { data, error } = await supabase.functions.invoke('generate-email-template', {
        body: { prompt }
      });

      if (error) throw error;
      return data;
    },
    onError: (error) => {
      toast({
        title: "Fout bij AI generatie",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getTemplatesByCategory = (category?: string) => {
    if (!category) return templates;
    return templates.filter(t => t.category === category);
  };

  const useTemplate = async (template: EmailTemplate) => {
    await updateUsageMutation.mutateAsync(template.id);
    return {
      subject: template.subject,
      body: template.body_text,
    };
  };

  return {
    templates,
    isLoading,
    createTemplate: createTemplateMutation.mutateAsync,
    deleteTemplate: deleteTemplateMutation.mutateAsync,
    generateWithAI: generateWithAIMutation.mutateAsync,
    useTemplate,
    getTemplatesByCategory,
    isCreating: createTemplateMutation.isPending,
    isGenerating: generateWithAIMutation.isPending,
  };
};