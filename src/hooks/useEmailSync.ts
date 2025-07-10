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
      const { data, error } = await supabase.functions.invoke('email-sync', {
        body: {
          action: 'sync',
          emailSettingsId
        }
      });

      if (error) {
        throw new Error(error.message || 'Sync failed');
      }

      return data;
    },
    onSuccess: (result: SyncResult) => {
      queryClient.invalidateQueries({ queryKey: ['email-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      
      if (result.requiresUserAction && result.oauthUrl) {
        toast({
          title: "OAuth autorisatie vereist",
          description: "Je wordt doorgestuurd naar de provider voor autorisatie.",
        });
        // In production, open OAuth URL
        console.log('OAuth URL:', result.oauthUrl);
      } else if (result.success) {
        toast({
          title: "Synchronisatie voltooid",
          description: `${result.emailsAdded || 0} nieuwe e-mails toegevoegd van ${result.emailsProcessed || 0} verwerkt.`,
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Synchronisatie mislukt",
        description: error.message,
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