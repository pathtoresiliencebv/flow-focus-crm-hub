import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface CalendarSettings {
  id: string;
  user_id: string;
  user_role: string;
  calendar_id: string;
  calendar_name: string;
  sync_enabled: boolean;
  sync_status: string;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

interface GoogleCalendar {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  accessRole: string;
}

export const useGoogleCalendar = () => {
  const { user } = useAuth();
  const [calendarSettings, setCalendarSettings] = useState<CalendarSettings | null>(null);
  const [availableCalendars, setAvailableCalendars] = useState<GoogleCalendar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCalendarSettings();
    }
  }, [user]);

  const fetchCalendarSettings = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('google_calendar_settings')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      
      setCalendarSettings(data);
      setIsConnected(!!data);

      if (data) {
        await fetchAvailableCalendars();
      }
    } catch (error) {
      console.error('Error fetching calendar settings:', error);
      toast.error('Fout bij ophalen calendar instellingen');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableCalendars = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: { action: 'get_calendars' }
      });

      if (error) throw error;
      
      setAvailableCalendars(data.calendars || []);
    } catch (error) {
      console.error('Error fetching calendars:', error);
    }
  };

  const startOAuthFlow = async (redirectUri?: string) => {
    try {
      const uri = redirectUri || `${window.location.origin}/settings/calendar`;
      
      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: {
          action: 'oauth_start',
          redirectUri: uri
        }
      });

      if (error) throw error;
      
      return data.authUrl;
    } catch (error) {
      console.error('Error starting OAuth:', error);
      throw error;
    }
  };

  const handleOAuthCallback = async (code: string, redirectUri?: string) => {
    try {
      const uri = redirectUri || `${window.location.origin}/settings/calendar`;
      
      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: {
          action: 'oauth_callback',
          code,
          redirectUri: uri
        }
      });

      if (error) throw error;
      
      await fetchCalendarSettings();
      toast.success('Google Calendar succesvol verbonden!');
      
      return data;
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      toast.error('Fout bij verbinden met Google Calendar');
      throw error;
    }
  };

  const syncPlanningToGoogle = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: { action: 'sync_planning' }
      });

      if (error) throw error;
      
      await fetchCalendarSettings();
      toast.success(`${data.syncedItems} planning items gesynchroniseerd`);
      
      return data;
    } catch (error) {
      console.error('Error syncing planning:', error);
      toast.error('Fout bij synchroniseren naar Google Calendar');
      throw error;
    }
  };

  const syncFromGoogle = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: { action: 'sync_from_google' }
      });

      if (error) throw error;
      
      toast.success(`${data.importedEvents} events geïmporteerd uit Google Calendar`);
      
      return data;
    } catch (error) {
      console.error('Error syncing from Google:', error);
      toast.error('Fout bij ophalen van Google Calendar events');
      throw error;
    }
  };

  const toggleSync = async (enabled: boolean) => {
    try {
      if (!calendarSettings) return;

      const { error } = await supabase
        .from('google_calendar_settings')
        .update({ sync_enabled: enabled })
        .eq('id', calendarSettings.id);

      if (error) throw error;
      
      await fetchCalendarSettings();
      toast.success(`Synchronisatie ${enabled ? 'ingeschakeld' : 'uitgeschakeld'}`);
    } catch (error) {
      console.error('Error toggling sync:', error);
      toast.error('Fout bij wijzigen synchronisatie instelling');
      throw error;
    }
  };

  const disconnectCalendar = async () => {
    try {
      if (!calendarSettings) return;

      const { error } = await supabase
        .from('google_calendar_settings')
        .delete()
        .eq('id', calendarSettings.id);

      if (error) throw error;
      
      setCalendarSettings(null);
      setIsConnected(false);
      setAvailableCalendars([]);
      
      toast.success('Google Calendar verbinding verbroken');
    } catch (error) {
      console.error('Error disconnecting calendar:', error);
      toast.error('Fout bij verbreken verbinding');
      throw error;
    }
  };

  return {
    calendarSettings,
    availableCalendars,
    isLoading,
    isConnected,
    startOAuthFlow,
    handleOAuthCallback,
    syncPlanningToGoogle,
    syncFromGoogle,
    toggleSync,
    disconnectCalendar,
    refreshSettings: fetchCalendarSettings
  };
};