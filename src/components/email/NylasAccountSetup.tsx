import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNylasAuth } from '@/hooks/useNylasAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  Mail, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  X,
  Plus,
  Settings,
  Server,
  Key,
  User,
  Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NylasAccountSetupProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const NylasAccountSetup: React.FC<NylasAccountSetupProps> = ({ 
  onSuccess, 
  onCancel 
}) => {
  // Use real Nylas auth hook
  const { 
    accounts, 
    accountsLoading: loading, 
    authError: error, 
    initiateNylasOAuth,
    disconnectAccount,
    fetchAccounts
  } = useNylasAuth();

  const [connecting, setConnecting] = useState<string | null>(null);
  const [smtpConfig, setSmtpConfig] = useState({
    email: '',
    password: '',
    smtpHost: '',
    smtpPort: '587',
    imapHost: '',
    imapPort: '993',
    useSSL: true
  });
  const { toast } = useToast();

  const handleConnect = async (provider: string) => {
    try {
      setConnecting(provider);
      await initiateNylasOAuth(provider);
    } catch (err: any) {
      console.error('OAuth initiation failed:', err);
      toast({
        title: "Verbinding mislukt",
        description: err.message || "Er is een fout opgetreden tijdens het verbinden",
        variant: "destructive",
      });
    } finally {
      setConnecting(null);
    }
  };

  const handleSMTPConnect = async () => {
    try {
      setConnecting('smtp');
      
      // Validate required fields
      if (!smtpConfig.email || !smtpConfig.password || !smtpConfig.smtpHost) {
        toast({
          title: "Configuratie onvolledig",
          description: "Vul alle verplichte velden in",
          variant: "destructive",
        });
        return;
      }

      // Call Nylas API to create IMAP/SMTP connection
      const response = await fetch('/api/supabase/functions/v1/nylas-smtp-connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'smtp',
          email: smtpConfig.email,
          password: smtpConfig.password,
          smtp_host: smtpConfig.smtpHost,
          smtp_port: parseInt(smtpConfig.smtpPort),
          imap_host: smtpConfig.imapHost,
          imap_port: parseInt(smtpConfig.imapPort),
          ssl: smtpConfig.useSSL
        })
      });

      if (!response.ok) {
        throw new Error('SMTP verbinding mislukt');
      }

      const result = await response.json();
      
      toast({
        title: "SMTP Account Verbonden! ✅",
        description: `Email account ${smtpConfig.email} is succesvol verbonden`,
      });
      
      onSuccess?.();
      
    } catch (err: any) {
      console.error('SMTP connection failed:', err);
      toast({
        title: "SMTP Verbinding mislukt",
        description: err.message || "Er is een fout opgetreden tijdens het verbinden",
        variant: "destructive",
      });
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (accountId: string) => {
    try {
      await disconnectAccount(accountId);
      toast({
        title: "Account verbroken",
        description: "Je email account is succesvol ontkoppeld",
      });
      await fetchAccounts(); // Refresh accounts list
    } catch (err: any) {
      toast({
        title: "Verbinding mislukt",
        description: err.message || "Er is een fout opgetreden",
        variant: "destructive",
      });
    }
  };

  const providers = [
    {
      id: 'gmail',
      name: 'Gmail',
      description: 'Google Gmail account',
      icon: Mail,
      color: 'bg-red-500',
      popular: true,
    },
    {
      id: 'outlook',
      name: 'Outlook',
      description: 'Microsoft Outlook/Hotmail',
      icon: Mail,
      color: 'bg-blue-500',
      popular: true,
    },
    {
      id: 'yahoo',
      name: 'Yahoo Mail',
      description: 'Yahoo email account',
      icon: Mail,
      color: 'bg-purple-500',
      popular: false,
    },
    {
      id: 'icloud',
      name: 'iCloud Mail',
      description: 'Apple iCloud email',
      icon: Mail,
      color: 'bg-gray-500',
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Verbind je Email Account
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Koppel je email account via Nylas om emails te versturen en ontvangen. 
            Veilig en snel met OAuth authenticatie.
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Fout bij laden accounts</span>
            </div>
            <p className="text-red-600 mt-1">{error}</p>
          </div>
        )}

        {/* Connected Accounts */}
        {accounts.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Verbonden Accounts ({accounts.length})
              </CardTitle>
              <CardDescription>
                Je hebt al {accounts.length} email account(s) verbonden
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {accounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-medium",
                        account.provider === 'gmail' ? 'bg-red-500' :
                        account.provider === 'outlook' ? 'bg-blue-500' :
                        account.provider === 'yahoo' ? 'bg-purple-500' :
                        'bg-gray-500'
                      )}>
                        {account.provider === 'gmail' ? 'G' :
                         account.provider === 'outlook' ? 'O' :
                         account.provider === 'yahoo' ? 'Y' : 'M'}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {account.email_address}
                        </div>
                        <div className="text-sm text-gray-500 capitalize">
                          {account.provider} • {account.sync_state}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={account.sync_state === 'synced' ? 'default' : 
                                account.sync_state === 'error' ? 'destructive' : 'secondary'}
                      >
                        {account.sync_state}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDisconnect(account.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Provider Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Voeg Email Account Toe
            </CardTitle>
            <CardDescription>
              Selecteer je email provider om te beginnen met het verbinden
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="oauth" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="oauth">OAuth (Aanbevolen)</TabsTrigger>
                <TabsTrigger value="smtp">SMTP/IMAP</TabsTrigger>
              </TabsList>

              {/* OAuth Tab */}
              <TabsContent value="oauth" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {providers.map((provider) => {
                    const Icon = provider.icon;
                    const isConnecting = connecting === provider.id;
                    
                    return (
                      <div
                        key={provider.id}
                        className={cn(
                          "relative p-4 border-2 rounded-lg transition-all duration-200 cursor-pointer",
                          "hover:border-blue-300 hover:shadow-md",
                          isConnecting ? "border-blue-400 bg-blue-50" : "border-gray-200"
                        )}
                        onClick={() => !isConnecting && handleConnect(provider.id)}
                      >
                        {provider.popular && (
                          <Badge className="absolute -top-2 -right-2 bg-green-500">
                            Populair
                          </Badge>
                        )}
                        
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-10 w-10 rounded-full flex items-center justify-center text-white",
                            provider.color
                          )}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">
                              {provider.name}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {provider.description}
                            </p>
                          </div>
                          {isConnecting ? (
                            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                          ) : (
                            <Settings className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Info Section */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="h-5 w-5 text-blue-500 mt-0.5">
                      <svg viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-900 mb-1">
                        Veilige OAuth Verbinding
                      </h4>
                      <p className="text-sm text-blue-700">
                        Je wordt doorgestuurd naar de officiële login pagina van je email provider. 
                        Je wachtwoord wordt nooit opgeslagen in onze systemen.
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* SMTP Tab */}
              <TabsContent value="smtp" className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">SMTP/IMAP Configuratie</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="email">Email Adres *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={smtpConfig.email}
                          onChange={(e) => setSmtpConfig(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="jouw@email.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="password">Wachtwoord *</Label>
                        <Input
                          id="password"
                          type="password"
                          value={smtpConfig.password}
                          onChange={(e) => setSmtpConfig(prev => ({ ...prev, password: e.target.value }))}
                          placeholder="Je email wachtwoord"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="smtpHost">SMTP Server *</Label>
                        <Input
                          id="smtpHost"
                          value={smtpConfig.smtpHost}
                          onChange={(e) => setSmtpConfig(prev => ({ ...prev, smtpHost: e.target.value }))}
                          placeholder="smtp.gmail.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="smtpPort">SMTP Poort</Label>
                        <Input
                          id="smtpPort"
                          type="number"
                          value={smtpConfig.smtpPort}
                          onChange={(e) => setSmtpConfig(prev => ({ ...prev, smtpPort: e.target.value }))}
                          placeholder="587"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="imapHost">IMAP Server</Label>
                        <Input
                          id="imapHost"
                          value={smtpConfig.imapHost}
                          onChange={(e) => setSmtpConfig(prev => ({ ...prev, imapHost: e.target.value }))}
                          placeholder="imap.gmail.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="imapPort">IMAP Poort</Label>
                        <Input
                          id="imapPort"
                          type="number"
                          value={smtpConfig.imapPort}
                          onChange={(e) => setSmtpConfig(prev => ({ ...prev, imapPort: e.target.value }))}
                          placeholder="993"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="useSSL"
                        checked={smtpConfig.useSSL}
                        onChange={(e) => setSmtpConfig(prev => ({ ...prev, useSSL: e.target.checked }))}
                        className="rounded"
                      />
                      <Label htmlFor="useSSL">SSL/TLS gebruiken</Label>
                    </div>

                    <Button
                      onClick={handleSMTPConnect}
                      disabled={connecting !== null}
                      className="w-full"
                    >
                      {connecting === 'smtp' ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Verbinden...
                        </>
                      ) : (
                        <>
                          <Server className="h-4 w-4 mr-2" />
                          SMTP Account Verbinden
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-8">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Annuleren
            </Button>
          )}
          {onSuccess && accounts.length > 0 && (
            <Button onClick={onSuccess} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              Doorgaan
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};