import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  start_datetime: string;
  end_datetime: string;
  is_all_day: boolean;
  location?: string;
  category: 'werk' | 'persoonlijk' | 'vakantie' | 'meeting' | 'project' | 'reminder' | 'deadline';
  privacy_level: 'private' | 'shared' | 'public';
  color_code: string;
  is_recurring: boolean;
  recurrence_pattern?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurrence_interval?: number;
  recurrence_end_date?: string;
  parent_event_id?: string;
  project_id?: string;
  customer_id?: string;
  reminder_minutes_before?: number[];
  created_at: string;
  updated_at: string;
}

export interface CreateCalendarEventData {
  title: string;
  description?: string;
  start_datetime: string;
  end_datetime: string;
  is_all_day?: boolean;
  location?: string;
  category?: CalendarEvent['category'];
  privacy_level?: CalendarEvent['privacy_level'];
  color_code?: string;
  is_recurring?: boolean;
  recurrence_pattern?: CalendarEvent['recurrence_pattern'];
  recurrence_interval?: number;
  recurrence_end_date?: string;
  project_id?: string;
  customer_id?: string;
  reminder_minutes_before?: number[];
}

export const useCalendarEvents = () => {
  const { user, hasPermission } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async (startDate?: Date, endDate?: Date) => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('Fetching calendar events for user:', user.id);

      let query = supabase
        .from('calendar_events')
        .select('*')
        .order('start_datetime', { ascending: true });

      // Date range filtering
      if (startDate && endDate) {
        query = query
          .gte('start_datetime', startDate.toISOString())
          .lte('end_datetime', endDate.toISOString());
      }

      // Role-based filtering
      const isAdmin = hasPermission('users_view');
      
      if (!isAdmin) {
        // Non-admin users see their own events + shared events
        query = query.or(`user_id.eq.${user.id},privacy_level.in.(shared,public)`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching calendar events:', error);
        throw error;
      }

      console.log('Fetched calendar events:', data?.length || 0);
      setEvents(data || []);
    } catch (error) {
      console.error('Error in fetchEvents:', error);
      toast({
        title: "Fout bij ophalen agenda",
        description: "Er ging iets mis bij het ophalen van de agenda items.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async (eventData: CreateCalendarEventData) => {
    if (!user) return null;

    try {
      const newEvent = {
        ...eventData,
        user_id: user.id,
        category: eventData.category || 'persoonlijk',
        privacy_level: eventData.privacy_level || 'private',
        color_code: eventData.color_code || '#3b82f6',
        is_all_day: eventData.is_all_day || false,
        is_recurring: eventData.is_recurring || false,
        reminder_minutes_before: eventData.reminder_minutes_before || [15]
      };

      const { data, error } = await supabase
        .from('calendar_events')
        .insert(newEvent)
        .select()
        .single();

      if (error) {
        console.error('Error creating calendar event:', error);
        throw error;
      }

      setEvents(prev => [...prev, data]);
      
      toast({
        title: "Agenda item aangemaakt",
        description: "Het agenda item is succesvol aangemaakt.",
      });

      return data;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      toast({
        title: "Fout bij aanmaken",
        description: "Er ging iets mis bij het aanmaken van het agenda item.",
        variant: "destructive"
      });
      return null;
    }
  };

  const updateEvent = async (id: string, updates: Partial<CalendarEvent>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating calendar event:', error);
        throw error;
      }

      setEvents(prev => 
        prev.map(event => event.id === id ? { ...event, ...data } : event)
      );

      toast({
        title: "Agenda item bijgewerkt",
        description: "Het agenda item is succesvol bijgewerkt.",
      });

      return data;
    } catch (error) {
      console.error('Error updating calendar event:', error);
      toast({
        title: "Fout bij bijwerken",
        description: "Er ging iets mis bij het bijwerken van het agenda item.",
        variant: "destructive"
      });
      return null;
    }
  };

  const deleteEvent = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting calendar event:', error);
        throw error;
      }

      setEvents(prev => prev.filter(event => event.id !== id));
      
      toast({
        title: "Agenda item verwijderd",
        description: "Het agenda item is succesvol verwijderd.",
      });
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      toast({
        title: "Fout bij verwijderen",
        description: "Er ging iets mis bij het verwijderen van het agenda item.",
        variant: "destructive"
      });
    }
  };

  // Fetch events for current month/week view
  const fetchEventsForPeriod = async (date: Date, view: 'month' | 'week' | 'day') => {
    let startDate: Date;
    let endDate: Date;

    switch (view) {
      case 'month':
        startDate = startOfWeek(startOfMonth(date));
        endDate = endOfWeek(endOfMonth(date));
        break;
      case 'week':
        startDate = startOfWeek(date);
        endDate = endOfWeek(date);
        break;
      case 'day':
        startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        startDate = startOfWeek(startOfMonth(date));
        endDate = endOfWeek(endOfMonth(date));
    }

    await fetchEvents(startDate, endDate);
  };

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return events.filter(event => {
      const eventDate = format(new Date(event.start_datetime), 'yyyy-MM-dd');
      return eventDate === dateStr;
    });
  };

  useEffect(() => {
    if (user) {
      fetchEventsForPeriod(new Date(), 'month');
    }
  }, [user]);

  return {
    events,
    loading,
    fetchEvents,
    fetchEventsForPeriod,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventsForDate
  };
};