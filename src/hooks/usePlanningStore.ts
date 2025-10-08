
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
  
  // New fields for enhanced workflow
  planning_type?: 'monteur' | 'klant_afspraak' | 'intern' | 'team';
  customer_id?: string;
  expected_duration_minutes?: number;
  team_size?: number;
  special_instructions?: string;
  notify_customer?: boolean;
  notify_sms?: boolean;
  confirmed_by_customer?: boolean;
  confirmed_at?: string;
  cancellation_reason?: string;
  cancelled_at?: string;
  rescheduled_from?: string;
  color_code?: string;
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
    if (!user) {
      console.error('No user found for adding planning item');
      return;
    }

    try {
      console.log('Adding planning item:', newItem);
      console.log('User ID:', user.id);

      // Check for existing planning for this project + monteur to prevent duplicates
      if (newItem.project_id && newItem.assigned_user_id) {
        const { data: existing } = await supabase
          .from('planning_items')
          .select('id')
          .eq('project_id', newItem.project_id)
          .eq('assigned_user_id', newItem.assigned_user_id)
          .maybeSingle();
        
        if (existing) {
          console.log('Found existing planning, updating instead of creating new:', existing.id);
          
          // UPDATE existing planning instead of creating new
          const { data, error } = await supabase
            .from('planning_items')
            .update({
              ...newItem,
              user_id: user.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id)
            .select()
            .single();
          
          if (error) throw error;
          
          setPlanningItems(prev => prev.map(item => 
            item.id === existing.id ? data : item
          ));
          
          toast({
            title: "Planning bijgewerkt",
            description: "Bestaande planning is aangepast.",
          });
          
          // Still update project status and send email
          if (newItem.project_id) {
            await supabase
              .from('projects')
              .update({ status: 'gepland' })
              .eq('id', newItem.project_id)
              .eq('status', 'te-plannen');
          }
          
          if (newItem.notify_customer && newItem.customer_id) {
            await sendPlanningEmail(data);
          }
          
          return data;
        }
      }

      // No existing planning - create new
      const planningData = {
        ...newItem,
        user_id: user.id, // Set the creator
      };

      console.log('Planning data to insert:', planningData);

      const { data, error } = await supabase
        .from('planning_items')
        .insert(planningData)
        .select()
        .single();

      if (error) {
        console.error('Error creating planning:', error);
        throw error;
      }

      console.log('Planning item created successfully:', data);
      setPlanningItems(prev => [...prev, data]);
      
      // Update project status to 'gepland' if project is linked
      if (newItem.project_id) {
        const { error: projectError } = await supabase
          .from('projects')
          .update({ status: 'gepland' })
          .eq('id', newItem.project_id)
          .eq('status', 'te-plannen'); // Only update if currently te-plannen
        
        if (projectError) {
          console.error('Error updating project status:', projectError);
        } else {
          console.log('✅ Project status updated to "gepland"');
        }
      }
      
      // Send email notification if notify_customer is true
      if (newItem.notify_customer && newItem.customer_id) {
        await sendPlanningEmail(data);
      }
      
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

  const addPlanningWithParticipants = async (
    planningData: Omit<PlanningItem, 'id' | 'created_at' | 'updated_at'>,
    participantUserIds: string[]
  ) => {
    if (!user) {
      console.error('No user found for adding planning with participants');
      return null;
    }

    try {
      // First, create the planning item
      const planning = await addPlanningItem(planningData);
      
      if (!planning) {
        throw new Error('Failed to create planning item');
      }

      // Then, add participants
      if (participantUserIds.length > 0) {
        const participants = participantUserIds.map(userId => ({
          planning_id: planning.id,
          user_id: userId,
          participant_type: 'monteur',
          role: userId === planningData.assigned_user_id ? 'hoofdmonteur' : 'assistent',
          notified: false,
        }));

        const { error: participantsError } = await supabase
          .from('planning_participants')
          .insert(participants);

        if (participantsError) {
          console.error('Error adding participants:', participantsError);
          // Don't fail the whole operation, just log the error
          toast({
            title: "Waarschuwing",
            description: "Planning aangemaakt, maar fout bij toevoegen van deelnemers.",
            variant: "destructive"
          });
        }
      }

      // If customer notification is requested, create notification record
      if (planningData.notify_customer && planningData.customer_id) {
        await createCustomerNotification(planning.id, planningData.customer_id, {
          email: planningData.notify_customer,
          sms: planningData.notify_sms || false,
        });
      }

      return planning;
    } catch (error) {
      console.error('Error in addPlanningWithParticipants:', error);
      return null;
    }
  };

  const sendPlanningEmail = async (planning: PlanningItem) => {
    try {
      console.log('📧 Sending planning email for planning:', planning.id);
      
      // Fetch planning details
      const { data: project } = await supabase
        .from('projects')
        .select('*, customer:customers(*)')
        .eq('id', planning.project_id)
        .single();
      
      const { data: monteur } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', planning.assigned_user_id)
        .single();
      
      if (!project?.customer?.email) {
        console.log('⚠️ No customer email, skipping notification');
        return;
      }
      
      console.log('Invoking send-project-planned-email Edge Function...');
      
      // Call Edge Function
      const { error } = await supabase.functions.invoke('send-project-planned-email', {
        body: {
          customerEmail: project.customer.email,
          customerName: project.customer.name,
          projectTitle: project.title,
          projectLocation: project.location || project.customer.address,
          planningDate: planning.start_date,
          planningTime: planning.start_time,
          monteurName: monteur?.full_name || 'SMANS Monteur'
        }
      });
      
      if (error) {
        console.error('Error sending planning email:', error);
      } else {
        console.log('✅ Planning email sent successfully');
      }
    } catch (error) {
      console.error('Error in sendPlanningEmail:', error);
    }
  };

  const createCustomerNotification = async (
    planningId: string,
    customerId: string,
    methods: { email: boolean; sms: boolean }
  ) => {
    try {
      const notifications = [];

      if (methods.email) {
        notifications.push({
          planning_id: planningId,
          customer_id: customerId,
          notification_type: 'planning_confirmation',
          channel: 'email',
          status: 'pending',
          scheduled_for: new Date().toISOString(),
        });
      }

      if (methods.sms) {
        notifications.push({
          planning_id: planningId,
          customer_id: customerId,
          notification_type: 'planning_confirmation',
          channel: 'sms',
          status: 'pending',
          scheduled_for: new Date().toISOString(),
        });
      }

      if (notifications.length > 0) {
        const { error } = await supabase
          .from('customer_notifications')
          .insert(notifications);

        if (error) {
          console.error('Error creating customer notifications:', error);
        } else {
          console.log('Customer notifications created successfully');
        }
      }
    } catch (error) {
      console.error('Error in createCustomerNotification:', error);
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
    if (user) {
      fetchPlanningItems();
    }
  }, [user?.id]);

  return {
    planningItems,
    loading,
    fetchPlanningItems,
    addPlanningItem,
    addPlanningWithParticipants,
    updatePlanningItem,
    deletePlanningItem,
    getCalendarEvents,
    createCustomerNotification
  };
};
