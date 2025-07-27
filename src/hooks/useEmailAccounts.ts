
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
  signature_html?: string;
  signature_text?: string;
  auto_add_signature?: boolean;
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

  const getDefaultSignature = () => {
    const htmlSignature = `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>E-mail Handtekening Smans Onderhoud en Service</title>
<style>
    /* Gebruik inline stijlen voor maximale compatibiliteit met e-mailclients */
</style>
</head>
<body>
<br>
Met vriendelijke groet,
<br>
-----
  <table style="width: 100%; max-width: 500px; border-spacing: 0; font-family: Arial, sans-serif; color: #333333;">
    <tr>
      <td style="width: 30%; padding-right: 20px; vertical-align: top;">
        <a href="https://smansonderhoud.nl" target="_blank">
          <img src="https://smanscrm.nl/lovable-uploads/ad3fa40e-af0e-42d9-910f-59eab7f8e4ed.png" alt="Smans Logo" style="width: 100%; max-width: 120px; height: auto;">
        </a>
      </td>
      <td style="width: 70%; vertical-align: top; border-left: 2px solid #b91c1c; padding-left: 20px;">
        <h3 style="margin: 0 0 5px 0; font-size: 18px; font-weight: bold; color: #333333;">
          Team Smans Onderhoud en Service
        </h3>
        <p style="margin: 0 0 10px 0; font-size: 14px;">
          <a href="https://smansonderhoud.nl" style="color: #b91c1c; text-decoration: none;">
            smansonderhoud.nl
          </a>
        </p>
        <p style="margin: 0; font-size: 12px;">
          <a href="#" style="color: #b91c1c; text-decoration: none; margin-right: 10px;">Facebook</a>
          <a href="#" style="color: #b91c1c; text-decoration: none; margin-right: 10px;">LinkedIn</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const textSignature = `
Met vriendelijke groet,

-----
Team Smans Onderhoud en Service
smansonderhoud.nl
`;

    return { htmlSignature, textSignature };
  };

  const addAccountMutation = useMutation({
    mutationFn: async (accountData: Omit<EmailAccount, 'id' | 'user_id'>) => {
      if (!user?.id) throw new Error('Geen gebruiker ingelogd');

      // Add default signature if not provided
      const { htmlSignature, textSignature } = getDefaultSignature();
      const accountWithDefaults = {
        ...accountData,
        signature_html: accountData.signature_html || htmlSignature,
        signature_text: accountData.signature_text || textSignature,
        auto_add_signature: accountData.auto_add_signature ?? true,
      };

      const { error } = await supabase
        .from('user_email_settings')
        .insert({
          user_id: user.id,
          ...accountWithDefaults,
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
