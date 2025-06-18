
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface EmailAccount {
  id: string;
  user_id: string;
  email_address: string;
  display_name: string;
  smtp_host?: string;
  smtp_port?: number;
  smtp_username?: string;
  smtp_password?: string;
  imap_host?: string;
  imap_port?: number;
  imap_username?: string;
  imap_password?: string;
  is_active?: boolean;
}

export const useEmailAccounts = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: accounts = [], isLoading, refetch } = useQuery<EmailAccount[]>({
    queryKey: ['email-accounts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_email_settings')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        toast({ 
          title: "Fout bij ophalen accounts", 
          description: error.message, 
          variant: "destructive" 
        });
        return [];
      }
      return data || [];
    },
    enabled: !!user?.id,
  });

  const addAccountMutation = useMutation({
    mutationFn: async (accountData: Omit<EmailAccount, 'id' | 'user_id'>) => {
      if (!user?.id) throw new Error('Geen gebruiker ingelogd');

      const { error } = await supabase
        .from('user_email_settings')
        .insert({
          user_id: user.id,
          ...accountData,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-accounts', user?.id] });
      toast({ 
        title: "Account toegevoegd", 
        description: "E-mail account succesvol toegevoegd." 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Fout bij toevoegen", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const updateAccountMutation = useMutation({
    mutationFn: async ({ id, ...accountData }: Partial<EmailAccount> & { id: string }) => {
      const { error } = await supabase
        .from('user_email_settings')
        .update(accountData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-accounts', user?.id] });
      toast({ 
        title: "Account bijgewerkt", 
        description: "E-mail account succesvol bijgewerkt." 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Fout bij bijwerken", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('user_email_settings')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-accounts', user?.id] });
      toast({ 
        title: "Account verwijderd", 
        description: "E-mail account succesvol verwijderd." 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Fout bij verwijderen", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  return {
    accounts,
    isLoading,
    refetch,
    addAccount: addAccountMutation.mutate,
    updateAccount: updateAccountMutation.mutate,
    deleteAccount: deleteAccountMutation.mutate,
    hasAccounts: accounts.length > 0,
  };
};
