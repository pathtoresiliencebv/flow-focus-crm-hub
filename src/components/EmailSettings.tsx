
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Settings, Plus, Trash2, Edit, Mail } from "lucide-react";

interface EmailSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmailSettings({ open, onOpenChange }: EmailSettingsProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editingAccount, setEditingAccount] = useState(null);

  // Fetch email accounts
  const { data: emailAccounts = [], isLoading } = useQuery({
    queryKey: ['email-accounts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_email_accounts')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && open
  });

  // Create/Update email account
  const saveAccountMutation = useMutation({
    mutationFn: async (accountData: any) => {
      if (accountData.id) {
        // Update existing account
        const { error } = await supabase
          .from('user_email_accounts')
          .update(accountData)
          .eq('id', accountData.id)
          .eq('user_id', user?.id);
        
        if (error) throw error;
      } else {
        // Create new account
        const { error } = await supabase
          .from('user_email_accounts')
          .insert({
            ...accountData,
            user_id: user?.id
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-accounts'] });
      setEditingAccount(null);
      toast({
        title: "E-mail account opgeslagen",
        description: "Uw e-mail instellingen zijn bijgewerkt."
      });
    },
    onError: (error) => {
      toast({
        title: "Fout bij opslaan",
        description: "Er is een fout opgetreden bij het opslaan van uw e-mail account.",
        variant: "destructive"
      });
    }
  });

  // Delete email account
  const deleteAccountMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const { error } = await supabase
        .from('user_email_accounts')
        .delete()
        .eq('id', accountId)
        .eq('user_id', user?.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-accounts'] });
      toast({
        title: "E-mail account verwijderd",
        description: "Het e-mail account is succesvol verwijderd."
      });
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const accountData = {
      id: editingAccount?.id,
      email_address: formData.get('email_address') as string,
      display_name: formData.get('display_name') as string,
      smtp_host: formData.get('smtp_host') as string,
      smtp_port: parseInt(formData.get('smtp_port') as string) || null,
      smtp_username: formData.get('smtp_username') as string,
      smtp_password: formData.get('smtp_password') as string,
      imap_host: formData.get('imap_host') as string,
      imap_port: parseInt(formData.get('imap_port') as string) || null,
      imap_username: formData.get('imap_username') as string,
      imap_password: formData.get('imap_password') as string,
      is_active: true
    };

    saveAccountMutation.mutate(accountData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            E-mail Instellingen
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="accounts" className="space-y-6">
          <TabsList>
            <TabsTrigger value="accounts">E-mail Accounts</TabsTrigger>
            <TabsTrigger value="general">Algemene Instellingen</TabsTrigger>
          </TabsList>

          <TabsContent value="accounts" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">E-mail Accounts</h3>
                <p className="text-sm text-gray-600">Beheer uw e-mail accounts en instellingen.</p>
              </div>
              <Button
                onClick={() => setEditingAccount({})}
                className="bg-smans-primary hover:bg-smans-primary/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Account Toevoegen
              </Button>
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Laden...</p>
              </div>
            ) : emailAccounts.length === 0 && !editingAccount ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Mail className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 mb-4">Geen e-mail accounts ingesteld</p>
                  <Button
                    onClick={() => setEditingAccount({})}
                    className="bg-smans-primary hover:bg-smans-primary/90"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Eerste Account Toevoegen
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {emailAccounts.map((account) => (
                  <Card key={account.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">{account.display_name}</CardTitle>
                          <p className="text-sm text-gray-600">{account.email_address}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={account.is_active}
                            onCheckedChange={(checked) => {
                              saveAccountMutation.mutate({
                                ...account,
                                is_active: checked
                              });
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingAccount(account)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteAccountMutation.mutate(account.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}

            {editingAccount && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {editingAccount.id ? 'Account Bewerken' : 'Nieuw Account Toevoegen'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="display_name">Weergavenaam</Label>
                        <Input
                          id="display_name"
                          name="display_name"
                          defaultValue={editingAccount.display_name}
                          placeholder="Bijv. Werk E-mail"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="email_address">E-mail Adres</Label>
                        <Input
                          id="email_address"
                          name="email_address"
                          type="email"
                          defaultValue={editingAccount.email_address}
                          placeholder="naam@bedrijf.nl"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">SMTP Instellingen (Verzenden)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                          <Label htmlFor="smtp_host">SMTP Server</Label>
                          <Input
                            id="smtp_host"
                            name="smtp_host"
                            defaultValue={editingAccount.smtp_host}
                            placeholder="smtp.gmail.com"
                          />
                        </div>
                        <div>
                          <Label htmlFor="smtp_port">Poort</Label>
                          <Input
                            id="smtp_port"
                            name="smtp_port"
                            type="number"
                            defaultValue={editingAccount.smtp_port}
                            placeholder="587"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="smtp_username">Gebruikersnaam</Label>
                          <Input
                            id="smtp_username"
                            name="smtp_username"
                            defaultValue={editingAccount.smtp_username}
                            placeholder="naam@bedrijf.nl"
                          />
                        </div>
                        <div>
                          <Label htmlFor="smtp_password">Wachtwoord</Label>
                          <Input
                            id="smtp_password"
                            name="smtp_password"
                            type="password"
                            defaultValue={editingAccount.smtp_password}
                            placeholder="••••••••"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">IMAP Instellingen (Ontvangen)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                          <Label htmlFor="imap_host">IMAP Server</Label>
                          <Input
                            id="imap_host"
                            name="imap_host"
                            defaultValue={editingAccount.imap_host}
                            placeholder="imap.gmail.com"
                          />
                        </div>
                        <div>
                          <Label htmlFor="imap_port">Poort</Label>
                          <Input
                            id="imap_port"
                            name="imap_port"
                            type="number"
                            defaultValue={editingAccount.imap_port}
                            placeholder="993"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="imap_username">Gebruikersnaam</Label>
                          <Input
                            id="imap_username"
                            name="imap_username"
                            defaultValue={editingAccount.imap_username}
                            placeholder="naam@bedrijf.nl"
                          />
                        </div>
                        <div>
                          <Label htmlFor="imap_password">Wachtwoord</Label>
                          <Input
                            id="imap_password"
                            name="imap_password"
                            type="password"
                            defaultValue={editingAccount.imap_password}
                            placeholder="••••••••"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-4">
                      <Button
                        type="submit"
                        disabled={saveAccountMutation.isPending}
                        className="bg-smans-primary hover:bg-smans-primary/90"
                      >
                        {saveAccountMutation.isPending ? 'Opslaan...' : 'Opslaan'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditingAccount(null)}
                      >
                        Annuleren
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Algemene E-mail Instellingen</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Algemene instellingen komen hier...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
