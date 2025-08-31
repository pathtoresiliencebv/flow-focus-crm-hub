import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useEmailRealtime = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;

    // Listen to email table changes
    const emailsChannel = supabase
      .channel('emails-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'emails',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Email change detected:', payload);
          // Invalidate emails query to refetch
          queryClient.invalidateQueries({ queryKey: ['emails'] });
        }
      )
      .subscribe();

    // Listen to email settings changes
    const settingsChannel = supabase
      .channel('email-settings-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_email_settings',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Email settings change detected:', payload);
          // Invalidate email accounts query to refetch
          queryClient.invalidateQueries({ queryKey: ['email-accounts'] });
        }
      )
      .subscribe();

    // Listen to email sync logs for real-time sync progress
    const syncLogsChannel = supabase
      .channel('email-sync-logs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'email_sync_logs'
        },
        (payload) => {
          console.log('Email sync log change detected:', payload);
          // Invalidate both emails and accounts to reflect sync status
          queryClient.invalidateQueries({ queryKey: ['emails'] });
          queryClient.invalidateQueries({ queryKey: ['email-accounts'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(emailsChannel);
      supabase.removeChannel(settingsChannel);
      supabase.removeChannel(syncLogsChannel);
    };
  }, [user?.id, queryClient]);
};