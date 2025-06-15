
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2, Edit } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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

  const { data: accounts = [], refetch } = useQuery<EmailAccount[]>({
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
    mutationFn: async (accountData: z.infer<typeof accountSchema> & { id?: string }) => {
      const { id, ...updateData } = accountData;
      const payload = { ...updateData, user_id: user!.id };

      if (id) {
        // Update
        const { error } = await supabase.from('user_email_settings').update(payload).eq('id', id);
        if (error) throw error;
      } else {
        // Create
        // We spread the payload into a new object to help TypeScript with type inference,
        // as it incorrectly widens the type when the same payload is also used for updates.
        const { error } = await supabase.from('user_email_settings').insert({ ...payload });
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

  const form = useForm<z.infer<typeof accountSchema>>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
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
    },
  });

  const onSubmit = (values: z.infer<typeof accountSchema>) => {
    mutation.mutate({ ...values, id: editingAccount?.id });
  };

  const handleEdit = (account: EmailAccount) => {
    setEditingAccount(account);
    form.reset(account);
    setFormOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  return (
    <div>
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">E-mail Accounts</h2>
        <div className="flex items-center space-x-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button onClick={() => { setFormOpen(true); setEditingAccount(null); form.reset(); }}>
                <Plus className="mr-2 h-4 w-4" />
                Account toevoegen
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingAccount ? 'Account bewerken' : 'Account toevoegen'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
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
                  {form.formState.errors.imap_host && (
                    <p className="text-red-500 text-sm">{form.formState.errors.imap_host.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="imap_port">IMAP Poort</Label>
                  <Input id="imap_port" type="number" {...form.register('imap_port', { valueAsNumber: true })} />
                  {form.formState.errors.imap_port && (
                    <p className="text-red-500 text-sm">{form.formState.errors.imap_port.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="imap_username">IMAP Gebruikersnaam</Label>
                  <Input id="imap_username" {...form.register('imap_username')} />
                  {form.formState.errors.imap_username && (
                    <p className="text-red-500 text-sm">{form.formState.errors.imap_username.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="imap_password">IMAP Wachtwoord</Label>
                  <Input id="imap_password" type="password" {...form.register('imap_password')} />
                  {form.formState.errors.imap_password && (
                    <p className="text-red-500 text-sm">{form.formState.errors.imap_password.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="smtp_host">SMTP Host</Label>
                  <Input id="smtp_host" {...form.register('smtp_host')} />
                  {form.formState.errors.smtp_host && (
                    <p className="text-red-500 text-sm">{form.formState.errors.smtp_host.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="smtp_port">SMTP Poort</Label>
                  <Input id="smtp_port" type="number" {...form.register('smtp_port', { valueAsNumber: true })} />
                  {form.formState.errors.smtp_port && (
                    <p className="text-red-500 text-sm">{form.formState.errors.smtp_port.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="smtp_username">SMTP Gebruikersnaam</Label>
                  <Input id="smtp_username" {...form.register('smtp_username')} />
                  {form.formState.errors.smtp_username && (
                    <p className="text-red-500 text-sm">{form.formState.errors.smtp_username.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="smtp_password">SMTP Wachtwoord</Label>
                  <Input id="smtp_password" type="password" {...form.register('smtp_password')} />
                  {form.formState.errors.smtp_password && (
                    <p className="text-red-500 text-sm">{form.formState.errors.smtp_password.message}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="is_active">Actief</Label>
                  <Switch id="is_active" checked={form.watch('is_active')} {...form.register('is_active')} />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? 'Opslaan...' : 'Opslaan'}
                  </Button>
                  <DialogClose asChild>
                    <Button type="button" variant="secondary">
                      Annuleren
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="py-4">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Weergavenaam</TableHead>
                <TableHead>E-mailadres</TableHead>
                <TableHead className="text-right">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">{account.display_name}</TableCell>
                  <TableCell>{account.email_address}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="icon" onClick={() => handleEdit(account)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDelete(account.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {accounts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    Geen accounts gevonden.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

