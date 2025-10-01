import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

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
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle>Connect Your Email</CardTitle>
          <CardDescription>
            Connect your Gmail account to start managing emails directly in your CRM
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleConnectGmail}
            disabled={connecting}
            className="w-full"
            size="lg"
          >
            {connecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Connect Gmail
              </>
            )}
          </Button>

          <div className="text-sm text-muted-foreground text-center">
            <p>More providers coming soon:</p>
            <div className="flex gap-2 justify-center mt-2">
              <span className="px-3 py-1 bg-muted rounded-full text-xs">Outlook</span>
              <span className="px-3 py-1 bg-muted rounded-full text-xs">IMAP</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

