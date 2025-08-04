import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location?: string;
}

interface CalendarCredentials {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export const useGoogleCalendar = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [credentials, setCredentials] = useState<CalendarCredentials | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('user_calendar_settings')
        .select('*')
        .eq('provider', 'google')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking calendar connection:', error);
        return;
      }

      if (data && data.access_token) {
        setCredentials({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_at: new Date(data.expires_at).getTime()
        });
        setIsConnected(true);
      }
    } catch (error) {
      console.error('Error checking connection status:', error);
    }
  };

  const connectGoogleCalendar = async () => {
    setIsConnecting(true);
    
    try {
      // Start OAuth flow
      const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
        body: { action: 'start_oauth' }
      });

      if (error) throw error;

      // Redirect to Google OAuth
      window.location.href = data.authUrl;
    } catch (error: any) {
      console.error('Error connecting Google Calendar:', error);
      toast({
        title: "Fout bij verbinden met Google Calendar",
        description: error.message || "Er is een onbekende fout opgetreden.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectGoogleCalendar = async () => {
    try {
      const { error } = await supabase
        .from('user_calendar_settings')
        .delete()
        .eq('provider', 'google');

      if (error) throw error;

      setIsConnected(false);
      setCredentials(null);
      
      toast({
        title: "Google Calendar losgekoppeld",
        description: "Je Google Calendar is succesvol losgekoppeld.",
      });
    } catch (error: any) {
      console.error('Error disconnecting Google Calendar:', error);
      toast({
        title: "Fout bij loskoppelen",
        description: error.message || "Er is een onbekende fout opgetreden.",
        variant: "destructive",
      });
    }
  };

  const refreshAccessToken = async () => {
    if (!credentials?.refresh_token) return null;

    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
        body: { 
          action: 'refresh_token',
          refresh_token: credentials.refresh_token
        }
      });

      if (error) throw error;

      const newCredentials = {
        access_token: data.access_token,
        refresh_token: credentials.refresh_token,
        expires_at: Date.now() + (data.expires_in * 1000)
      };

      setCredentials(newCredentials);
      return newCredentials.access_token;
    } catch (error) {
      console.error('Error refreshing access token:', error);
      return null;
    }
  };

  const getValidAccessToken = async () => {
    if (!credentials) return null;

    // Check if token is expired (with 5 minute buffer)
    if (credentials.expires_at < Date.now() + 300000) {
      return await refreshAccessToken();
    }

    return credentials.access_token;
  };

  const createCalendarEvent = async (event: {
    title: string;
    description?: string;
    startDateTime: string;
    endDateTime: string;
    location?: string;
  }) => {
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      throw new Error('No valid access token');
    }

    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: {
          action: 'create_event',
          access_token: accessToken,
          event: {
            summary: event.title,
            description: event.description,
            start: {
              dateTime: event.startDateTime,
              timeZone: 'Europe/Amsterdam'
            },
            end: {
              dateTime: event.endDateTime,
              timeZone: 'Europe/Amsterdam'
            },
            location: event.location
          }
        }
      });

      if (error) throw error;
      return data.event;
    } catch (error: any) {
      console.error('Error creating calendar event:', error);
      throw error;
    }
  };

  const updateCalendarEvent = async (eventId: string, event: {
    title?: string;
    description?: string;
    startDateTime?: string;
    endDateTime?: string;
    location?: string;
  }) => {
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      throw new Error('No valid access token');
    }

    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: {
          action: 'update_event',
          access_token: accessToken,
          event_id: eventId,
          updates: {
            ...(event.title && { summary: event.title }),
            ...(event.description && { description: event.description }),
            ...(event.startDateTime && {
              start: {
                dateTime: event.startDateTime,
                timeZone: 'Europe/Amsterdam'
              }
            }),
            ...(event.endDateTime && {
              end: {
                dateTime: event.endDateTime,
                timeZone: 'Europe/Amsterdam'
              }
            }),
            ...(event.location && { location: event.location })
          }
        }
      });

      if (error) throw error;
      return data.event;
    } catch (error: any) {
      console.error('Error updating calendar event:', error);
      throw error;
    }
  };

  const deleteCalendarEvent = async (eventId: string) => {
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      throw new Error('No valid access token');
    }

    try {
      const { error } = await supabase.functions.invoke('google-calendar-sync', {
        body: {
          action: 'delete_event',
          access_token: accessToken,
          event_id: eventId
        }
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Error deleting calendar event:', error);
      throw error;
    }
  };

  const syncPlanningItemToCalendar = async (planningItem: {
    id: string;
    title: string;
    description?: string;
    start_date: string;
    start_time: string;
    end_time: string;
    location?: string;
  }) => {
    if (!isConnected) return null;

    const startDateTime = `${planningItem.start_date}T${planningItem.start_time}:00`;
    const endDateTime = `${planningItem.start_date}T${planningItem.end_time}:00`;

    try {
      const calendarEvent = await createCalendarEvent({
        title: planningItem.title,
        description: planningItem.description,
        startDateTime,
        endDateTime,
        location: planningItem.location
      });

      // Save calendar event ID to planning item
      await supabase
        .from('planning_items')
        .update({ 
          google_calendar_event_id: calendarEvent.id,
          synced_at: new Date().toISOString()
        })
        .eq('id', planningItem.id);

      return calendarEvent;
    } catch (error) {
      console.error('Error syncing to calendar:', error);
      throw error;
    }
  };

  return {
    isConnected,
    isConnecting,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
    createCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    syncPlanningItemToCalendar,
    checkConnectionStatus
  };
};