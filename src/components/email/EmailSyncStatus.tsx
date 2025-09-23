import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useEmailSync } from '@/hooks/useEmailSync';

interface EmailSyncStatusProps {
  accountId?: string;
  compact?: boolean;
}

export function EmailSyncStatus({ accountId, compact = false }: EmailSyncStatusProps) {
  const { user } = useAuth();
  const { syncEmails, isSyncing } = useEmailSync();

  // Fetch sync status for accounts
  const { data: syncStatus = [], refetch } = useQuery({
    queryKey: ['email-sync-status', user?.id, accountId],
    queryFn: async () => {
      if (!user?.id) return [];
      
      let query = supabase
        .from('user_email_settings')
        .select(`
          id,
          display_name,
          email_address,
          is_syncing,
          sync_status,
          sync_error_message,
          last_sync_at
        `)
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (accountId) {
        query = query.eq('id', accountId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching sync status:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!user?.id,
    refetchInterval: 5000, // Refresh every 5 seconds during sync
  });

  const getSyncStatusIcon = (status: string, isSyncing: boolean) => {
    if (isSyncing) {
      return <RefreshCw className="h-4 w-4 animate-spin" />;
    }
    
    switch (status) {
      case 'completed':
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getSyncStatusText = (status: string, isSyncing: boolean) => {
    if (isSyncing) return 'Synchroniseren...';
    
    switch (status) {
      case 'completed':
      case 'success':
        return 'Sync voltooid';
      case 'error':
      case 'failed':
        return 'Sync mislukt';
      case 'running':
        return 'Bezig...';
      default:
        return 'Niet gesynchroniseerd';
    }
  };

  const formatLastSync = (lastSyncAt: string | null) => {
    if (!lastSyncAt) return 'Nooit';
    
    const date = new Date(lastSyncAt);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Zojuist';
    if (diffMinutes < 60) return `${diffMinutes} min geleden`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} uur geleden`;
    return date.toLocaleDateString('nl-NL');
  };

  const handleSync = (accountId: string) => {
    syncEmails({ emailSettingsId: accountId });
  };

  if (compact && syncStatus.length === 1) {
    const account = syncStatus[0];
    return (
      <div className="flex items-center gap-2">
        {getSyncStatusIcon(account.sync_status || '', account.is_syncing || false)}
        <span className="text-sm text-muted-foreground">
          {formatLastSync(account.last_sync_at)}
        </span>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleSync(account.id)}
          disabled={account.is_syncing || isSyncing}
        >
          <RefreshCw className={`h-3 w-3 ${(account.is_syncing || isSyncing) ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {syncStatus.map((account) => (
        <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            {getSyncStatusIcon(account.sync_status || '', account.is_syncing || false)}
            <div>
              <p className="font-medium">{account.display_name}</p>
              <p className="text-sm text-muted-foreground">{account.email_address}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <Badge 
                variant={
                  account.sync_status === 'error' ? 'destructive' :
                  account.sync_status === 'completed' ? 'default' : 'secondary'
                }
              >
                {getSyncStatusText(account.sync_status || '', account.is_syncing || false)}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">
                {formatLastSync(account.last_sync_at)}
              </p>
              {account.sync_error_message && (
                <p className="text-xs text-red-500 mt-1 max-w-48 truncate" title={account.sync_error_message}>
                  {account.sync_error_message}
                </p>
              )}
            </div>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSync(account.id)}
              disabled={account.is_syncing || isSyncing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${(account.is_syncing || isSyncing) ? 'animate-spin' : ''}`} />
              Sync
            </Button>
          </div>
        </div>
      ))}
      
      {syncStatus.length === 0 && (
        <div className="text-center py-4 text-muted-foreground">
          <p>Geen actieve e-mail accounts gevonden</p>
        </div>
      )}
    </div>
  );
}