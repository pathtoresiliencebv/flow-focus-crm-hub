import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// import { useNylasAuth } from '@/hooks/useNylasAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  Mail, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  X,
  Plus,
  Settings
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
  // Temporary fallback for development
  const [accounts] = useState([]);
  const [loading] = useState(false);
  const [error] = useState(null);
  const [connecting, setConnecting] = useState<string | null>(null);
  
  const { toast } = useToast();
  
  const initiateOAuth = async (provider: string) => {
    console.log('OAuth initiated for:', provider);
  };
  
  const disconnectAccount = async (accountId: string) => {
    console.log('Disconnect account:', accountId);
  };
  
  const fetchAccounts = async () => {
    console.log('Fetch accounts');
  };

  const handleConnect = async (provider: string) => {
    try {
      setConnecting(provider);
      
      // For now, show a message that OAuth is not yet configured
      toast({
        title: "OAuth nog niet geconfigureerd",
        description: "De Nylas OAuth flow moet nog worden geconfigureerd. Edge Functions moeten worden gedeployed.",
        variant: "destructive",
      });
      
      // TODO: Uncomment when Edge Functions are deployed
      // await initiateOAuth(provider);
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