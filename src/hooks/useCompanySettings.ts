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
  organization_id?: string;
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

      // First, get user's organization_id from profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      console.log('👤 User profile organization_id:', profile?.organization_id);

      // Fetch company settings for the organization
      // Fall back to user_id for backwards compatibility
      let query = supabase
        .from('company_settings')
        .select('*');

      if (profile?.organization_id) {
        // Prefer organization-based lookup
        query = query.eq('organization_id', profile.organization_id);
      } else {
        // Fallback to user-based lookup
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query.maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      console.log('🏢 Company settings loaded:', data ? 'found' : 'not found');
      setSettings(data as CompanySettings);
    } catch (error) {
      console.error('❌ Error fetching company settings:', error);
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

      // Get user's organization_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      console.log('💾 Saving settings for organization:', profile?.organization_id);

      const settingsToSave: any = {
        user_id: user.id,
        ...newSettings,
      };

      // Include organization_id if available
      if (profile?.organization_id) {
        settingsToSave.organization_id = profile.organization_id;
      }

      const { data, error } = await supabase
        .from('company_settings')
        .upsert(settingsToSave)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setSettings(data as CompanySettings);
      
      console.log('✅ Company settings saved successfully');
      toast({
        title: "Opgeslagen",
        description: "Bedrijfsinstellingen zijn succesvol opgeslagen.",
      });
      
      return data;
    } catch (error) {
      console.error('❌ Error saving company settings:', error);
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