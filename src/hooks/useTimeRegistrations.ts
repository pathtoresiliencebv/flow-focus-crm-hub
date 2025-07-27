import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export interface TimeRegistration {
  id: string;
  project_id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  hours_type: string;
  description?: string;
  is_approved: boolean;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  // Joined data
  project_title?: string;
  user_name?: string;
}

export interface TimeRegistrationInput {
  project_id: string;
  start_time: string;
  end_time: string;
  hours_type: string;
  description?: string;
}

export const useTimeRegistrations = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch time registrations with project and user data
  const { data: timeRegistrations = [], isLoading, error } = useQuery({
    queryKey: ['time-registrations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_registrations')
        .select(`
          *,
          projects(title),
          profiles(full_name)
        `)
        .order('start_time', { ascending: false });

      if (error) throw error;

      return data.map((reg: any) => ({
        id: reg.id,
        project_id: reg.project_id,
        user_id: reg.user_id,
        start_time: reg.start_time,
        end_time: reg.end_time,
        hours_type: reg.hours_type,
        description: reg.description,
        is_approved: reg.is_approved,
        approved_by: reg.approved_by,
        approved_at: reg.approved_at,
        created_at: reg.created_at,
        project_title: reg.projects?.title,
        user_name: reg.profiles?.full_name,
      }));
    },
  });

  // Fetch projects for dropdown
  const { data: projects = [] } = useQuery({
    queryKey: ['projects-for-time'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, title')
        .order('title');

      if (error) throw error;
      return data;
    },
  });

  // Create time registration
  const createTimeRegistration = useMutation({
    mutationFn: async (input: TimeRegistrationInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('project_registrations')
        .insert({
          project_id: input.project_id,
          user_id: user.id,
          registration_type: 'time',
          start_time: input.start_time,
          end_time: input.end_time,
          hours_type: input.hours_type,
          description: input.description,
          is_approved: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-registrations'] });
      toast({
        title: "Tijdsregistratie aangemaakt",
        description: "De tijdsregistratie is succesvol opgeslagen.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fout bij opslaan",
        description: "Er ging iets mis bij het opslaan van de tijdsregistratie.",
        variant: "destructive",
      });
      console.error('Error creating time registration:', error);
    },
  });

  // Update time registration approval
  const updateTimeRegistrationApproval = useMutation({
    mutationFn: async ({ id, isApproved }: { id: string; isApproved: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('project_registrations')
        .update({ 
          is_approved: isApproved,
          approved_by: isApproved ? user.id : null,
          approved_at: isApproved ? new Date().toISOString() : null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-registrations'] });
      toast({
        title: "Status bijgewerkt",
        description: "De tijdsregistratie is bijgewerkt.",
      });
    },
  });

  // Calculate statistics
  const getStatistics = () => {
    if (!timeRegistrations.length) {
      return {
        totalHoursThisWeek: 0,
        averageHoursPerDay: 0,
        billableHours: 0,
      };
    }

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
    endOfWeek.setHours(23, 59, 59, 999);

    const thisWeekRegistrations = timeRegistrations.filter(reg => {
      const regDate = new Date(reg.start_time);
      return regDate >= startOfWeek && regDate <= endOfWeek;
    });

    const totalHours = thisWeekRegistrations.reduce((total, reg) => {
      const start = new Date(reg.start_time);
      const end = new Date(reg.end_time);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return total + hours;
    }, 0);

    const billableHours = thisWeekRegistrations
      .filter(reg => reg.hours_type === 'billable' && reg.is_approved)
      .reduce((total, reg) => {
        const start = new Date(reg.start_time);
        const end = new Date(reg.end_time);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        return total + hours;
      }, 0);

    return {
      totalHoursThisWeek: Math.round(totalHours * 10) / 10,
      averageHoursPerDay: Math.round((totalHours / 7) * 10) / 10,
      billableHours: Math.round(billableHours * 10) / 10,
    };
  };

  // Format time registrations for display
  const getFormattedTimeRegistrations = () => {
    return timeRegistrations.map(reg => {
      const start = new Date(reg.start_time);
      const end = new Date(reg.end_time);
      const hours = Math.round(((end.getTime() - start.getTime()) / (1000 * 60 * 60)) * 10) / 10;

      return {
        id: reg.id,
        date: format(start, 'dd-MM-yyyy'),
        project: reg.project_title || 'Onbekend project',
        activity: reg.hours_type === 'billable' ? 'Factureerbaar' : 'Intern',
        hours,
        status: reg.is_approved ? 'Goedgekeurd' : 'In behandeling',
        description: reg.description,
      };
    });
  };

  return {
    timeRegistrations,
    projects,
    isLoading,
    error,
    createTimeRegistration: createTimeRegistration.mutate,
    isCreating: createTimeRegistration.isPending,
    updateApproval: updateTimeRegistrationApproval.mutate,
    getStatistics,
    getFormattedTimeRegistrations,
  };
};