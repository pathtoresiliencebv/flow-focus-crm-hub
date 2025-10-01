import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface CalendarSettings {
  id: string;
  user_id: string;
  default_view: 'month' | 'week' | 'day';
  default_reminder_minutes: number;
  work_hours_start: string;
  work_hours_end: string;
  work_days: number[];
  timezone: string;
  show_weekends: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdateCalendarSettingsData {
  default_view?: CalendarSettings['default_view'];
  default_reminder_minutes?: number;
  work_hours_start?: string;
  work_hours_end?: string;
  work_days?: number[];
  timezone?: string;
  show_weekends?: boolean;
}

export const useCalendarSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<CalendarSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('Fetching calendar settings for user:', user.id);

      const { data, error } = await supabase
        .from('user_calendar_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching calendar settings:', error);
        throw error;
      }

      if (data) {
        setSettings(data as CalendarSettings);
      } else {
        // Create default settings if none exist
        await createDefaultSettings();
      }
    } catch (error) {
      console.error('Error in fetchSettings:', error);
      toast({
        title: "Fout bij ophalen instellingen",
        description: "Er ging iets mis bij het ophalen van de kalender instellingen.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createDefaultSettings = async () => {
    if (!user) return;

    try {
      const defaultSettings = {
        user_id: user.id,
        default_view: 'week' as const,
        default_reminder_minutes: 15,
        work_hours_start: '09:00:00',
        work_hours_end: '17:00:00',
        work_days: [1, 2, 3, 4, 5], // Monday to Friday
        timezone: 'Europe/Amsterdam',
        show_weekends: true
      };

      const { data, error } = await supabase
        .from('user_calendar_settings')
        .insert(defaultSettings)
        .select()
        .single();

      if (error) {
        console.error('Error creating default calendar settings:', error);
        throw error;
      }

      setSettings(data as CalendarSettings);
    } catch (error) {
      console.error('Error creating default settings:', error);
    }
  };

  const updateSettings = async (updates: UpdateCalendarSettingsData) => {
    if (!user || !settings) return null;

    try {
      const { data, error } = await supabase
        .from('user_calendar_settings')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating calendar settings:', error);
        throw error;
      }

      setSettings(data as CalendarSettings);

      toast({
        title: "Instellingen bijgewerkt",
        description: "De kalender instellingen zijn succesvol bijgewerkt.",
      });

      return data;
    } catch (error) {
      console.error('Error updating calendar settings:', error);
      toast({
        title: "Fout bij bijwerken",
        description: "Er ging iets mis bij het bijwerken van de instellingen.",
        variant: "destructive"
      });
      return null;
    }
  };

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  return {
    settings,
    loading,
    updateSettings,
    refetch: fetchSettings
  };
};