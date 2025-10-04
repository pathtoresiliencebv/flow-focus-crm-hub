import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { SMTPConfigDialog } from './SMTPConfigDialog';

interface ConnectEmailAccountProps {
  onAccountConnected?: () => void;
}

export const ConnectEmailAccount: React.FC<ConnectEmailAccountProps> = ({
  onAccountConnected
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [connecting, setConnecting] = useState(false);

  const handleConnectGmail = async () => {
    if (!user) {
      toast({
        title: "Niet ingelogd",
        description: "Je moet ingelogd zijn om een email account te verbinden",
        variant: "destructive"
      });
      return;
    }

    try {
      setConnecting(true);

      // Get OAuth URL from edge function
      const { data, error } = await supabase.functions.invoke('gmail-oauth-init');

      if (error) throw error;

      const { authUrl } = data;

      // Store user ID in localStorage for callback
      localStorage.setItem('gmail_oauth_user_id', user.id);

      // Redirect to Google OAuth
      window.location.href = authUrl;

    } catch (error: any) {
      console.error('Error initiating Gmail OAuth:', error);
      toast({
        title: "Verbinding mislukt",
        description: error.message || "Er is een fout opgetreden bij het verbinden met Gmail",
        variant: "destructive"
      });
      setConnecting(false);
    }
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="text-center pb-6">
        <div className="flex justify-center mb-6">
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
            <Mail className="h-10 w-10 text-white" />
          </div>
        </div>
        <CardTitle className="text-2xl mb-2">Verbind je E-mail</CardTitle>
        <CardDescription className="text-base">
          Koppel je Gmail account om direct je emails te beheren vanuit het CRM systeem
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pb-8">
        <div className="space-y-3">
          <div className="text-sm font-medium text-center text-muted-foreground">
            Kies je verbindingsmethode:
          </div>
          
          <Button
            onClick={handleConnectGmail}
            disabled={connecting}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            size="lg"
          >
            {connecting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Verbinden...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-5 w-5" />
                Gmail via OAuth
              </>
            )}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Of</span>
            </div>
          </div>

          <SMTPConfigDialog onAccountConnected={onAccountConnected} />
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm font-medium text-center mb-3">SMTP/IMAP ondersteunt:</p>
          <div className="flex gap-2 justify-center flex-wrap">
            <span className="px-3 py-1 bg-background border border-border rounded-lg text-xs font-medium">Gmail</span>
            <span className="px-3 py-1 bg-background border border-border rounded-lg text-xs font-medium">Outlook</span>
            <span className="px-3 py-1 bg-background border border-border rounded-lg text-xs font-medium">Yahoo</span>
            <span className="px-3 py-1 bg-background border border-border rounded-lg text-xs font-medium">Custom</span>
          </div>
        </div>

        <div className="text-xs text-muted-foreground text-center space-y-1">
          <p>✓ Veilige OAuth2 authenticatie</p>
          <p>✓ Je wachtwoord wordt nooit opgeslagen</p>
          <p>✓ Je kunt de koppeling altijd verwijderen</p>
        </div>
      </CardContent>
    </Card>
  );
};

