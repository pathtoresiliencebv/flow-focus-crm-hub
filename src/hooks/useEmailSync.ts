import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface SyncEmailsParams {
  emailSettingsId: string;
}

interface SyncResult {
  success: boolean;
  emailsAdded?: number;
  emailsProcessed?: number;
  oauthUrl?: string;
  requiresUserAction?: boolean;
}

export const useEmailSync = () => {
  const queryClient = useQueryClient();

  const syncEmailsMutation = useMutation({
    mutationFn: async ({ emailSettingsId }: SyncEmailsParams): Promise<SyncResult> => {
      console.log(`Starting email sync for account: ${emailSettingsId}`);
      
      const { data, error } = await supabase.functions.invoke('email-sync', {
        body: {
          action: 'sync',
          emailSettingsId
        }
      });

      if (error) {
        console.error('Email sync error:', error);
        throw new Error(error.message || 'Sync failed');
      }

      console.log('Email sync result:', data);
      return data;
    },
    onSuccess: (result: SyncResult) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['email-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      
      if (result.requiresUserAction && result.oauthUrl) {
        toast({
          title: "OAuth autorisatie vereist",
          description: "Je wordt doorgestuurd naar de provider voor autorisatie.",
        });
        // In production, open OAuth URL
        console.log('OAuth URL:', result.oauthUrl);
        window.open(result.oauthUrl, '_blank');
      } else if (result.success) {
        const emailsAdded = result.emailsAdded || 0;
        const emailsProcessed = result.emailsProcessed || 0;
        
        toast({
          title: "E-mail synchronisatie voltooid",
          description: emailsAdded > 0 
            ? `${emailsAdded} nieuwe e-mails toegevoegd van ${emailsProcessed} verwerkt.`
            : `Synchronisatie voltooid - geen nieuwe e-mails gevonden.`,
        });
        
        console.log(`Email sync completed: ${emailsAdded} added, ${emailsProcessed} processed`);
      }
    },
    onError: (error: Error) => {
      console.error('Email sync failed:', error);
      toast({
        title: "E-mail synchronisatie mislukt",
        description: error.message || "Er is een fout opgetreden tijdens de synchronisatie.",
        variant: "destructive",
      });
    },
  });

  const handleOAuthCallback = useMutation({
    mutationFn: async ({ emailSettingsId, code }: { emailSettingsId: string; code: string }) => {
      const { data, error } = await supabase.functions.invoke('email-sync', {
        body: {
          action: 'oauth-callback',
          emailSettingsId,
          code
        }
      });

      if (error) {
        throw new Error(error.message || 'OAuth callback failed');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      toast({
        title: "Autorisatie succesvol",
        description: "E-mail account is gekoppeld en wordt gesynchroniseerd.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Autorisatie mislukt",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    syncEmails: syncEmailsMutation.mutate,
    isSyncing: syncEmailsMutation.isPending,
    handleOAuthCallback: handleOAuthCallback.mutate,
    isHandlingOAuth: handleOAuthCallback.isPending,
  };
};