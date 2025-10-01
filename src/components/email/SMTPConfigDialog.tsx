import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Server, Loader2, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SMTPConfigDialogProps {
  onAccountConnected?: () => void;
}

export const SMTPConfigDialog: React.FC<SMTPConfigDialogProps> = ({ onAccountConnected }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  // SMTP Settings
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUsername, setSmtpUsername] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [smtpSecure, setSmtpSecure] = useState<'TLS' | 'SSL'>('TLS');

  // IMAP Settings
  const [imapHost, setImapHost] = useState('');
  const [imapPort, setImapPort] = useState('993');
  const [imapUsername, setImapUsername] = useState('');
  const [imapPassword, setImapPassword] = useState('');

  // Display settings
  const [displayName, setDisplayName] = useState('');
  const [emailAddress, setEmailAddress] = useState('');

  const handleTestConnection = async () => {
    if (!user) return;

    try {
      setTesting(true);

      const { data, error } = await supabase.functions.invoke('test-smtp-connection', {
        body: {
          smtpHost,
          smtpPort: parseInt(smtpPort),
          smtpUsername,
          smtpPassword,
          smtpSecure,
          imapHost,
          imapPort: parseInt(imapPort),
          imapUsername,
          imapPassword,
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Verbinding geslaagd! ✓",
          description: "SMTP en IMAP verbindingen zijn succesvol getest",
        });
      } else {
        throw new Error(data.error || 'Verbinding mislukt');
      }

    } catch (error: any) {
      toast({
        title: "Verbinding mislukt",
        description: error.message || "Controleer je instellingen en probeer opnieuw",
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setSaving(true);

      // Insert email account
      const { data: account, error: accountError } = await (supabase
        .from('email_accounts') as any)
        .insert({
          user_id: user.id,
          email_address: emailAddress,
          provider: 'smtp',
          display_name: displayName,
          is_primary: true,
          smtp_host: smtpHost,
          smtp_port: parseInt(smtpPort),
          smtp_username: smtpUsername,
          smtp_password: smtpPassword,
          smtp_secure: smtpSecure === 'TLS',
          imap_host: imapHost,
          imap_port: parseInt(imapPort),
          imap_username: imapUsername,
          imap_password: imapPassword,
        })
        .select()
        .single();

      if (accountError) throw accountError;

      toast({
        title: "Account gekoppeld! ✓",
        description: `${emailAddress} is succesvol toegevoegd`,
      });

      setOpen(false);
      onAccountConnected?.();

    } catch (error: any) {
      toast({
        title: "Opslaan mislukt",
        description: error.message || "Er is een fout opgetreden",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const presets = {
    gmail: {
      smtpHost: 'smtp.gmail.com',
      smtpPort: '587',
      imapHost: 'imap.gmail.com',
      imapPort: '993',
    },
    outlook: {
      smtpHost: 'smtp-mail.outlook.com',
      smtpPort: '587',
      imapHost: 'outlook.office365.com',
      imapPort: '993',
    },
    yahoo: {
      smtpHost: 'smtp.mail.yahoo.com',
      smtpPort: '587',
      imapHost: 'imap.mail.yahoo.com',
      imapPort: '993',
    },
  };

  const loadPreset = (preset: keyof typeof presets) => {
    const config = presets[preset];
    setSmtpHost(config.smtpHost);
    setSmtpPort(config.smtpPort);
    setImapHost(config.imapHost);
    setImapPort(config.imapPort);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full" size="lg">
          <Server className="mr-2 h-5 w-5" />
          SMTP/IMAP Koppelen
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Email Account Koppelen (SMTP/IMAP)</DialogTitle>
          <DialogDescription>
            Configureer je eigen email server met SMTP voor verzenden en IMAP voor ontvangen
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Quick Presets */}
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm font-medium mb-3">Snelle instellingen:</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => loadPreset('gmail')}>
                Gmail
              </Button>
              <Button variant="outline" size="sm" onClick={() => loadPreset('outlook')}>
                Outlook
              </Button>
              <Button variant="outline" size="sm" onClick={() => loadPreset('yahoo')}>
                Yahoo
              </Button>
            </div>
          </div>

          <Tabs defaultValue="account" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="account">Account Info</TabsTrigger>
              <TabsTrigger value="smtp">SMTP (Verzenden)</TabsTrigger>
              <TabsTrigger value="imap">IMAP (Ontvangen)</TabsTrigger>
            </TabsList>

            <TabsContent value="account" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Adres *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jouw@email.nl"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">Weergavenaam</Label>
                <Input
                  id="displayName"
                  placeholder="Jouw Naam"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
            </TabsContent>

            <TabsContent value="smtp" className="space-y-4 mt-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="smtpHost">SMTP Server *</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>bijv. smtp.gmail.com, smtp-mail.outlook.com</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="smtpHost"
                  placeholder="smtp.provider.com"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">Poort *</Label>
                  <Input
                    id="smtpPort"
                    placeholder="587"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtpSecure">Beveiliging</Label>
                  <select
                    id="smtpSecure"
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                    value={smtpSecure}
                    onChange={(e) => setSmtpSecure(e.target.value as 'TLS' | 'SSL')}
                  >
                    <option value="TLS">TLS (587)</option>
                    <option value="SSL">SSL (465)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtpUsername">Gebruikersnaam *</Label>
                <Input
                  id="smtpUsername"
                  placeholder="meestal je email adres"
                  value={smtpUsername}
                  onChange={(e) => setSmtpUsername(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtpPassword">Wachtwoord *</Label>
                <Input
                  id="smtpPassword"
                  type="password"
                  placeholder="••••••••"
                  value={smtpPassword}
                  onChange={(e) => setSmtpPassword(e.target.value)}
                />
              </div>
            </TabsContent>

            <TabsContent value="imap" className="space-y-4 mt-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="imapHost">IMAP Server *</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>bijv. imap.gmail.com, outlook.office365.com</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="imapHost"
                  placeholder="imap.provider.com"
                  value={imapHost}
                  onChange={(e) => setImapHost(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="imapPort">Poort *</Label>
                <Input
                  id="imapPort"
                  placeholder="993"
                  value={imapPort}
                  onChange={(e) => setImapPort(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="imapUsername">Gebruikersnaam *</Label>
                <Input
                  id="imapUsername"
                  placeholder="meestal je email adres"
                  value={imapUsername}
                  onChange={(e) => setImapUsername(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="imapPassword">Wachtwoord *</Label>
                <Input
                  id="imapPassword"
                  type="password"
                  placeholder="••••••••"
                  value={imapPassword}
                  onChange={(e) => setImapPassword(e.target.value)}
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={testing || !smtpHost || !imapHost}
              className="flex-1"
            >
              {testing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testen...
                </>
              ) : (
                'Test Verbinding'
              )}
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !emailAddress || !smtpHost || !imapHost}
              className="flex-1"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Opslaan...
                </>
              ) : (
                'Opslaan & Verbinden'
              )}
            </Button>
          </div>

          {/* Security Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
            <p className="font-medium mb-1">🔒 Beveiliging</p>
            <p>Je credentials worden veilig opgeslagen en geëncrypt in de database. We raden aan om app-specifieke wachtwoorden te gebruiken waar mogelijk.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

