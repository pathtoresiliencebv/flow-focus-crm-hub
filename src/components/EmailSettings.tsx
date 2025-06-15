
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';
import { AccountFormData, EmailAccountForm } from './EmailAccountForm';
import { EmailAccountsTable } from './EmailAccountsTable';

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

export function EmailSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<EmailAccount | null>(null);

  const { data: accounts = [] } = useQuery<EmailAccount[]>({
    queryKey: ['email-accounts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_email_settings')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        toast({ title: "Fout bij ophalen accounts", description: error.message, variant: "destructive" });
        return [];
      }
      return data || [];
    },
    enabled: !!user?.id,
  });

  const mutation = useMutation({
    mutationFn: async (accountData: AccountFormData & { id?: string }) => {
      const { id, ...updateData } = accountData;
      const payload = { ...updateData, user_id: user!.id };

      if (id) {
        const { error } = await supabase.from('user_email_settings').update(payload).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('user_email_settings').insert({
            user_id: user!.id,
            display_name: accountData.display_name,
            email_address: accountData.email_address,
            imap_host: accountData.imap_host,
            imap_port: accountData.imap_port,
            imap_username: accountData.imap_username,
            imap_password: accountData.imap_password,
            smtp_host: accountData.smtp_host,
            smtp_port: accountData.smtp_port,
            smtp_username: accountData.smtp_username,
            smtp_password: accountData.smtp_password,
            is_active: accountData.is_active,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-accounts', user?.id] });
      setFormOpen(false);
      setEditingAccount(null);
      toast({ title: "Account opgeslagen", description: "E-mail account succesvol opgeslagen." });
    },
    onError: (error: any) => {
      toast({ title: "Fout bij opslaan", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('user_email_settings').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-accounts', user?.id] });
      toast({ title: "Account verwijderd", description: "E-mail account succesvol verwijderd." });
    },
    onError: (error: any) => {
      toast({ title: "Fout bij verwijderen", description: error.message, variant: "destructive" });
    },
  });

  const handleEdit = (account: EmailAccount) => {
    setEditingAccount(account);
    setFormOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleAddNew = () => {
    setEditingAccount(null);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingAccount(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">E-mail Accounts</h2>
        <div className="flex items-center space-x-2">
          <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddNew}>
                <Plus className="mr-2 h-4 w-4" />
                Account toevoegen
              </Button>
            </DialogTrigger>
            {isFormOpen && (
              <EmailAccountForm 
                mutation={mutation}
                editingAccount={editingAccount}
                onClose={handleCloseForm}
              />
            )}
          </Dialog>
        </div>
      </div>
      <div className="py-4">
        <EmailAccountsTable
          accounts={accounts}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
