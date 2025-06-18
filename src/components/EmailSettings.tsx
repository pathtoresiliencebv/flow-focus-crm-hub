
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { AccountFormData, EmailAccountForm } from './EmailAccountForm';
import { EmailAccountsTable } from './EmailAccountsTable';
import { useEmailAccounts } from '@/hooks/useEmailAccounts';

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
  const { accounts, addAccount, updateAccount, deleteAccount } = useEmailAccounts();
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<EmailAccount | null>(null);

  const handleSubmit = (accountData: AccountFormData & { id?: string }) => {
    const { id, ...updateData } = accountData;
    
    if (id) {
      updateAccount({ id, ...updateData });
    } else {
      // Ensure required fields are present for new accounts
      if (updateData.display_name && updateData.email_address) {
        addAccount({
          display_name: updateData.display_name,
          email_address: updateData.email_address,
          smtp_host: updateData.smtp_host,
          smtp_port: updateData.smtp_port,
          smtp_username: updateData.smtp_username,
          smtp_password: updateData.smtp_password,
          imap_host: updateData.imap_host,
          imap_port: updateData.imap_port,
          imap_username: updateData.imap_username,
          imap_password: updateData.imap_password,
          is_active: updateData.is_active ?? true,
        });
      }
    }
    
    setFormOpen(false);
    setEditingAccount(null);
  };

  const handleEdit = (account: EmailAccount) => {
    setEditingAccount(account);
    setFormOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteAccount(id);
  };

  const handleAddNew = () => {
    setEditingAccount(null);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingAccount(null);
  };

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
                onSubmit={handleSubmit}
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
