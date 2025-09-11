import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface QuoteTemplate {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  is_active: boolean;
  template_data: any;
  category: string;
  created_at: string;
  updated_at: string;
}

export const useQuoteTemplates = () => {
  const [templates, setTemplates] = useState<QuoteTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('quote_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Fout",
        description: "Kon templates niet laden",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveTemplate = async (templateData: {
    name: string;
    description?: string;
    template_data: any;
    category?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('quote_templates')
        .insert([{
          ...templateData,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Succes",
        description: "Template opgeslagen",
      });

      await fetchTemplates();
      return data;
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Fout",
        description: "Kon template niet opslaan",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('quote_templates')
        .update({ is_active: false })
        .eq('id', templateId);

      if (error) throw error;

      toast({
        title: "Succes",
        description: "Template verwijderd",
      });

      await fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Fout",
        description: "Kon template niet verwijderen",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  return {
    templates,
    loading,
    fetchTemplates,
    saveTemplate,
    deleteTemplate,
  };
};