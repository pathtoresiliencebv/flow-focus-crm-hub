import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const GmailCallbackHandler: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing Gmail connection...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get authorization code from URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');

        if (error) {
          throw new Error(`OAuth error: ${error}`);
        }

        if (!code) {
          throw new Error('No authorization code received');
        }

        // Get user ID from localStorage
        const userId = localStorage.getItem('gmail_oauth_user_id');
        if (!userId) {
          throw new Error('User session not found');
        }

        setMessage('Exchanging tokens...');

        // Call callback edge function
        const { data, error: callbackError } = await supabase.functions.invoke('gmail-oauth-callback', {
          body: { code, userId }
        });

        if (callbackError) throw callbackError;

        setMessage('Account connected successfully!');
        setStatus('success');

        // Clean up
        localStorage.removeItem('gmail_oauth_user_id');

        // Show success toast
        toast({
          title: "Gmail Connected",
          description: `Successfully connected ${data.email}`,
        });

        // Redirect to email page after a short delay
        setTimeout(() => {
          navigate('/?tab=email');
        }, 1500);

      } catch (error: any) {
        console.error('Gmail callback error:', error);
        setStatus('error');
        setMessage(error.message || 'Failed to connect Gmail account');

        toast({
          title: "Connection Failed",
          description: error.message || "Failed to connect Gmail account",
          variant: "destructive"
        });

        // Redirect back to email page after a delay
        setTimeout(() => {
          navigate('/?tab=email');
        }, 3000);
      }
    };

    handleCallback();
  }, [navigate, toast]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center space-y-4">
        {status === 'processing' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <h2 className="text-xl font-semibold">{message}</h2>
            <p className="text-muted-foreground">Please wait...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <h2 className="text-xl font-semibold text-green-600">{message}</h2>
            <p className="text-muted-foreground">Redirecting...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-xl font-semibold text-destructive">{message}</h2>
            <p className="text-muted-foreground">Redirecting back...</p>
          </>
        )}
      </div>
    </div>
  );
};

