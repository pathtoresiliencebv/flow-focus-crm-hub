import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface QuoteSettings {
  id?: string;
  company_name?: string;
  company_address?: string;
  company_postal_code?: string;
  company_city?: string;
  company_country?: string;
  company_kvk_number?: string;
  company_vat_number?: string;
  terms_and_conditions?: string;
  default_attachments?: any;
  created_at?: string;
  updated_at?: string;
}

export const useQuoteSettings = () => {
  const [settings, setSettings] = useState<QuoteSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchSettings = async () => {
    try {
      setLoading(true);
      console.log('🔍 useQuoteSettings: Fetching quote settings...');

      const { data, error } = await supabase
        .from('quote_settings')
        .select('*')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ useQuoteSettings: Error fetching settings:', error);
        throw error;
      }

      console.log('✅ useQuoteSettings: Settings fetched:', data);
      console.log('📎 useQuoteSettings: Default attachments:', data?.default_attachments);
      
      setSettings(data as QuoteSettings);
    } catch (error) {
      console.error('❌ useQuoteSettings: Error fetching quote settings:', error);
      toast({
        title: "Fout",
        description: "Kon offerte instellingen niet laden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: Partial<QuoteSettings>) => {
    try {
      setLoading(true);
      console.log('💾 useQuoteSettings: Saving settings:', newSettings);

      const { data, error } = await supabase
        .from('quote_settings')
        .upsert(newSettings)
        .select()
        .single();

      if (error) {
        console.error('❌ useQuoteSettings: Error saving settings:', error);
        throw error;
      }

      console.log('✅ useQuoteSettings: Settings saved:', data);
      setSettings(data as QuoteSettings);
      
      toast({
        title: "Opgeslagen",
        description: "Offerte instellingen zijn succesvol opgeslagen.",
      });
      
      return data;
    } catch (error) {
      console.error('❌ useQuoteSettings: Error saving quote settings:', error);
      toast({
        title: "Fout",
        description: "Kon offerte instellingen niet opslaan.",
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

