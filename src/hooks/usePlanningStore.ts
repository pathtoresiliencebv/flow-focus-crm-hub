
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export interface PlanningItem {
  id: string;
  user_id: string;
  assigned_user_id: string;
  project_id?: string;
  title: string;
  description?: string;
  start_date: string; // DATE format (YYYY-MM-DD)
  start_time: string; // TIME format (HH:MM:SS)
  end_time: string; // TIME format (HH:MM:SS)
  location?: string;
  status?: string;
  created_at: string;
  updated_at: string;
  google_calendar_event_id?: string;
  last_synced_at?: string;
}

export const usePlanningStore = () => {
  const { user, hasPermission } = useAuth();
  const { toast } = useToast();
  const [planningItems, setPlanningItems] = useState<PlanningItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlanningItems = async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('Fetching planning for user:', user.id);

      let query = supabase
        .from('planning_items')
        .select('*')
        .order('start_date', { ascending: true });

      // Role-based filtering
      const isAdmin = hasPermission('users_view'); // Administrators can see all planning
      
      if (!isAdmin) {
        // Non-admin users can only see their own planning (assigned to them)
        query = query.or(`user_id.eq.${user.id},assigned_user_id.eq.${user.id}`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching planning:', error);
        throw error;
      }

      console.log('Fetched planning items:', data?.length || 0);
      setPlanningItems(data || []);
    } catch (error) {
      console.error('Error in fetchPlanningItems:', error);
      toast({
        title: "Fout bij ophalen planning",
        description: "Er ging iets mis bij het ophalen van de planning.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addPlanningItem = async (newItem: Omit<PlanningItem, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    try {
      const planningData = {
        ...newItem,
        user_id: user.id, // Set the creator
      };

      const { data, error } = await supabase
        .from('planning_items')
        .insert(planningData)
        .select()
        .single();

      if (error) {
        console.error('Error creating planning:', error);
        throw error;
      }

      setPlanningItems(prev => [...prev, data]);
      
      toast({
        title: "Planning aangemaakt",
        description: "De planning is succesvol aangemaakt.",
      });

      return data;
    } catch (error) {
      console.error('Error adding planning item:', error);
      toast({
        title: "Fout bij aanmaken",
        description: "Er ging iets mis bij het aanmaken van de planning.",
        variant: "destructive"
      });
      return null;
    }
  };

  const updatePlanningItem = async (id: string, updates: Partial<PlanningItem>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('planning_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating planning:', error);
        throw error;
      }

      setPlanningItems(prev => 
        prev.map(item => item.id === id ? { ...item, ...data } : item)
      );

      toast({
        title: "Planning bijgewerkt",
        description: "De planning is succesvol bijgewerkt.",
      });

      return data;
    } catch (error) {
      console.error('Error updating planning item:', error);
      toast({
        title: "Fout bij bijwerken",
        description: "Er ging iets mis bij het bijwerken van de planning.",
        variant: "destructive"
      });
      return null;
    }
  };

  const deletePlanningItem = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('planning_items')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting planning:', error);
        throw error;
      }

      setPlanningItems(prev => prev.filter(item => item.id !== id));
      
      toast({
        title: "Planning verwijderd",
        description: "De planning is succesvol verwijderd.",
      });
    } catch (error) {
      console.error('Error deleting planning item:', error);
      toast({
        title: "Fout bij verwijderen",
        description: "Er ging iets mis bij het verwijderen van de planning.",
        variant: "destructive"
      });
    }
  };

  // Convert planning items to calendar events format
  const getCalendarEvents = () => {
    return planningItems.map(item => ({
      id: item.id,
      title: item.title,
      startTime: item.start_time,
      endTime: item.end_time,
      date: item.start_date,
      type: 'appointment' as const,
      description: item.description || '',
      status: item.status,
      location: item.location
    }));
  };

  useEffect(() => {
    fetchPlanningItems();
  }, [user]);

  return {
    planningItems,
    loading,
    fetchPlanningItems,
    addPlanningItem,
    updatePlanningItem,
    deletePlanningItem,
    getCalendarEvents
  };
};
