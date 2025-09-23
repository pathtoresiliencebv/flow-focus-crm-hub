import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CompanySettings {
  id?: string;
  company_name?: string;
  address?: string;
  postal_code?: string;
  city?: string;
  country?: string;
  kvk_number?: string;
  btw_number?: string;
  general_terms?: string;
  default_attachments?: any;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export const useCompanySettings = () => {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setSettings(data as CompanySettings);
    } catch (error) {
      console.error('Error fetching company settings:', error);
      toast({
        title: "Fout",
        description: "Kon bedrijfsinstellingen niet laden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: Partial<CompanySettings>) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase
        .from('company_settings')
        .upsert({
          user_id: user.id,
          ...newSettings,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      setSettings(data as CompanySettings);
      
      toast({
        title: "Opgeslagen",
        description: "Bedrijfsinstellingen zijn succesvol opgeslagen.",
      });
      
      return data;
    } catch (error) {
      console.error('Error saving company settings:', error);
      toast({
        title: "Fout",
        description: "Kon bedrijfsinstellingen niet opslaan.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    saveSettings,
    refetch: fetchSettings,
  };
};