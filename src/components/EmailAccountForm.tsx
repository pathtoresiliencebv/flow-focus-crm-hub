import React from 'react';
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

const accountSchema = z.object({
  display_name: z.string().min(1, 'Weergavenaam is verplicht'),
  email_address: z.string().email('Ongeldig e-mailadres'),
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
  const form = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
  });

  React.useEffect(() => {
    form.reset(editingAccount || {
      display_name: '',
      email_address: '',
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

  const handleSubmit = (values: AccountFormData) => {
    onSubmit({ ...values, id: editingAccount?.id });
  };

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>{editingAccount ? 'Account bewerken' : 'Account toevoegen'}</DialogTitle>
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
