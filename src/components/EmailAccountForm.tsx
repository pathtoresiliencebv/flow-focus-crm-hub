import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { EmailProviderSelector } from './EmailProviderSelector';

const accountSchema = z.object({
  display_name: z.string().min(1, 'Weergavenaam is verplicht'),
  email_address: z.string().email('Ongeldig e-mailadres'),
  provider_type: z.string().default('imap'),
  imap_host: z.string().optional(),
  imap_port: z.coerce.number().optional(),
  imap_username: z.string().optional(),
  imap_password: z.string().optional(),
  smtp_host: z.string().optional(),
  smtp_port: z.coerce.number().optional(),
  smtp_username: z.string().optional(),
  smtp_password: z.string().optional(),
  is_active: z.boolean().default(true),
});

export type AccountFormData = z.infer<typeof accountSchema>;

interface EmailAccount {
  id: string;
  display_name: string;
  email_address: string;
  provider_type?: string;
  imap_host?: string;
  imap_port?: number;
  imap_username?: string;
  imap_password?: string;
  smtp_host?: string;
  smtp_port?: number;
  smtp_username?: string;
  smtp_password?: string;
  is_active?: boolean;
}

interface EmailAccountFormProps {
  onSubmit: (data: AccountFormData & { id?: string }) => void;
  editingAccount: EmailAccount | null;
  onClose: () => void;
}

export function EmailAccountForm({ onSubmit, editingAccount, onClose }: EmailAccountFormProps) {
  const [selectedProvider, setSelectedProvider] = useState(editingAccount?.provider_type || '');
  const [showProviderSelector, setShowProviderSelector] = useState(!editingAccount);
  
  const form = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
  });

  React.useEffect(() => {
    form.reset(editingAccount || {
      display_name: '',
      email_address: '',
      provider_type: 'imap',
      imap_host: '',
      imap_port: 993,
      imap_username: '',
      imap_password: '',
      smtp_host: '',
      smtp_port: 587,
      smtp_username: '',
      smtp_password: '',
      is_active: true,
    });
  }, [editingAccount, form]);

  const handleProviderSelect = (provider: any) => {
    setSelectedProvider(provider.id);
    form.setValue('provider_type', provider.id);
    
    // Auto-configure settings for known providers
    if (provider.id === 'gmail') {
      form.setValue('imap_host', 'imap.gmail.com');
      form.setValue('imap_port', 993);
      form.setValue('smtp_host', 'smtp.gmail.com');
      form.setValue('smtp_port', 587);
    } else if (provider.id === 'outlook') {
      form.setValue('imap_host', 'outlook.office365.com');
      form.setValue('imap_port', 993);
      form.setValue('smtp_host', 'smtp-mail.outlook.com');
      form.setValue('smtp_port', 587);
    } else if (provider.id === 'yahoo') {
      form.setValue('imap_host', 'imap.mail.yahoo.com');
      form.setValue('imap_port', 993);
      form.setValue('smtp_host', 'smtp.mail.yahoo.com');
      form.setValue('smtp_port', 587);
    }
    
    setShowProviderSelector(false);
  };

  const handleSubmit = (values: AccountFormData) => {
    onSubmit({ ...values, id: editingAccount?.id });
  };

  if (showProviderSelector) {
    return (
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Kies je e-mail provider</DialogTitle>
        </DialogHeader>
        <div className="py-6">
          <EmailProviderSelector
            onProviderSelect={handleProviderSelect}
            selectedProvider={selectedProvider}
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary" onClick={onClose}>
              Annuleren
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    );
  }

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>
          {editingAccount ? 'Account bewerken' : 'Account configureren'}
          {selectedProvider && (
            <div className="text-sm text-muted-foreground mt-1">
              Provider: {selectedProvider}
            </div>
          )}
        </DialogTitle>
      </DialogHeader>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-4 py-4 max-h-[80vh] overflow-y-auto px-6">
        <div>
          <Label htmlFor="display_name">Weergavenaam</Label>
          <Input id="display_name" {...form.register('display_name')} />
          {form.formState.errors.display_name && (
            <p className="text-red-500 text-sm">{form.formState.errors.display_name.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="email_address">E-mailadres</Label>
          <Input id="email_address" {...form.register('email_address')} />
          {form.formState.errors.email_address && (
            <p className="text-red-500 text-sm">{form.formState.errors.email_address.message}</p>
          )}
        </div>
        
        {!editingAccount && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Provider: {selectedProvider}</span>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={() => setShowProviderSelector(true)}
            >
              Wijzigen
            </Button>
          </div>
        )}

        {(selectedProvider === 'gmail' || selectedProvider === 'outlook') && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              Voor {selectedProvider} accounts wordt OAuth gebruikt voor veilige toegang. 
              Na het opslaan word je doorgeleid voor autorisatie.
            </p>
          </div>
        )}

        {(selectedProvider === 'imap' || selectedProvider === 'yahoo') && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="imap_host">IMAP Host</Label>
              <Input id="imap_host" {...form.register('imap_host')} />
            </div>
            <div>
              <Label htmlFor="imap_port">IMAP Poort</Label>
              <Input id="imap_port" type="number" {...form.register('imap_port', { valueAsNumber: true })} />
            </div>
            <div>
              <Label htmlFor="imap_username">IMAP Gebruikersnaam</Label>
              <Input id="imap_username" {...form.register('imap_username')} />
            </div>
            <div>
              <Label htmlFor="imap_password">IMAP Wachtwoord</Label>
              <Input id="imap_password" type="password" {...form.register('imap_password')} />
            </div>
            <div>
              <Label htmlFor="smtp_host">SMTP Host</Label>
              <Input id="smtp_host" {...form.register('smtp_host')} />
            </div>
            <div>
              <Label htmlFor="smtp_port">SMTP Poort</Label>
              <Input id="smtp_port" type="number" {...form.register('smtp_port', { valueAsNumber: true })} />
            </div>
            <div>
              <Label htmlFor="smtp_username">SMTP Gebruikersnaam</Label>
              <Input id="smtp_username" {...form.register('smtp_username')} />
            </div>
            <div>
              <Label htmlFor="smtp_password">SMTP Wachtwoord</Label>
              <Input id="smtp_password" type="password" {...form.register('smtp_password')} />
            </div>
          </div>
        )}
        <div className="flex items-center space-x-2">
            <Switch id="is_active" checked={form.watch('is_active')} onCheckedChange={(checked) => form.setValue('is_active', checked, { shouldDirty: true })} />
            <Label htmlFor="is_active">Actief</Label>
        </div>
        <DialogFooter>
          <Button type="submit">
            Opslaan
          </Button>
          <DialogClose asChild>
            <Button type="button" variant="secondary" onClick={onClose}>
              Annuleren
            </Button>
          </DialogClose>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
