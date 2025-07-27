
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { AccountFormData, EmailAccountForm } from './EmailAccountForm';
import { EmailAccountsTable } from './EmailAccountsTable';
import { EmailWebhookSetup } from './EmailWebhookSetup';
import { useEmailAccounts } from '@/hooks/useEmailAccounts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
          signature_html: updateData.signature_html,
          signature_text: updateData.signature_text,
          auto_add_signature: updateData.auto_add_signature ?? true,
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
        <h2 className="text-2xl font-bold tracking-tight">E-mail Beheer</h2>
      </div>
      
      <Tabs defaultValue="accounts" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="accounts">Email Accounts</TabsTrigger>
          <TabsTrigger value="webhook">Bonnetjes Setup</TabsTrigger>
        </TabsList>
        
        <TabsContent value="accounts" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">E-mail Accounts</h3>
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
          <EmailAccountsTable
            accounts={accounts}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </TabsContent>
        
        <TabsContent value="webhook" className="space-y-4">
          <EmailWebhookSetup />
        </TabsContent>
      </Tabs>
    </div>
  );
}
