import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEmailSync } from './useEmailSync';

interface AutoSyncOptions {
  enabled?: boolean;
  intervalMinutes?: number;
  syncOnMount?: boolean;
}

export function useAutoEmailSync(options: AutoSyncOptions = {}) {
  const {
    enabled = true,
    intervalMinutes = 15, // Default: sync every 15 minutes
    syncOnMount = true
  } = options;

  const { user } = useAuth();
  const { syncEmails, isSyncing } = useEmailSync();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasSyncedOnMount = useRef(false);

  // Fetch active email accounts
  const { data: emailAccounts = [] } = useQuery({
    queryKey: ['email-accounts-auto-sync', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_email_settings')
        .select('id, email_address, is_active, last_sync_at')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching email accounts for auto-sync:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!user?.id && enabled,
  });

  const performAutoSync = () => {
    if (!enabled || isSyncing || emailAccounts.length === 0) {
      return;
    }

    console.log('Performing auto email sync for', emailAccounts.length, 'accounts');
    
    // Sync each active account
    emailAccounts.forEach((account) => {
      // Check if account needs sync (hasn't been synced in the last interval)
      const lastSync = account.last_sync_at ? new Date(account.last_sync_at) : null;
      const now = new Date();
      const timeSinceLastSync = lastSync ? (now.getTime() - lastSync.getTime()) / (1000 * 60) : Infinity;
      
      if (timeSinceLastSync >= intervalMinutes) {
        console.log(`Auto-syncing account: ${account.email_address}`);
        syncEmails({ emailSettingsId: account.id });
      } else {
        console.log(`Skipping account ${account.email_address} - synced ${Math.round(timeSinceLastSync)} minutes ago`);
      }
    });
  };

  // Set up interval for automatic syncing
  useEffect(() => {
    if (!enabled || emailAccounts.length === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Sync on mount if enabled and not already synced
    if (syncOnMount && !hasSyncedOnMount.current) {
      hasSyncedOnMount.current = true;
      // Delay initial sync to allow UI to settle
      setTimeout(() => {
        performAutoSync();
      }, 2000);
    }

    // Set up recurring sync
    intervalRef.current = setInterval(() => {
      performAutoSync();
    }, intervalMinutes * 60 * 1000); // Convert minutes to milliseconds

    console.log(`Auto email sync enabled - will sync every ${intervalMinutes} minutes`);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, intervalMinutes, emailAccounts.length, syncOnMount]);

  // Manual trigger for immediate sync
  const triggerSync = () => {
    performAutoSync();
  };

  return {
    isAutoSyncEnabled: enabled && emailAccounts.length > 0,
    triggerSync,
    emailAccountsCount: emailAccounts.length
  };
}