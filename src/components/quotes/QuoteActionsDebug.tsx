import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Quote } from '@/types/quote';

interface QuoteActionsDebugProps {
  quote: Quote;
}

export const QuoteActionsDebug: React.FC<QuoteActionsDebugProps> = ({ quote }) => {
  const { toast } = useToast();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  const testPDFGeneration = async () => {
    setIsLoading(true);
    try {
      console.log('🧪 Testing PDF generation for quote:', quote.id);
      
      const { data, error } = await supabase.functions.invoke('generate-quote-pdf', {
        body: { quoteId: quote.id }
      });

      console.log('📄 PDF Response:', { data, error });

      setDebugInfo(prev => ({
        ...prev,
        pdfTest: {
          success: !error,
          error: error?.message,
          data: data,
          hasUrl: !!data?.pdfUrl,
          timestamp: new Date().toISOString()
        }
      }));

      if (error) {
        toast({
          title: "PDF Test Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "PDF Test Successful",
          description: "PDF generated successfully",
        });
      }
    } catch (error: any) {
      console.error('PDF test error:', error);
      toast({
        title: "PDF Test Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testPublicToken = async () => {
    setIsLoading(true);
    try {
      console.log('🧪 Testing public token generation...');
      
      // First check if quote has public token
      const { data: currentQuote, error: quoteError } = await supabase
        .from('quotes')
        .select('public_token')
        .eq('id', quote.id)
        .single();

      if (quoteError) throw quoteError;

      let publicToken = currentQuote.public_token;
      
      // Generate new token if needed
      if (!publicToken) {
        console.log('Generating new public token...');
        const { data: tokenResult, error: tokenError } = await supabase.rpc('generate_quote_public_token');
        
        if (tokenError) throw tokenError;
        
        publicToken = tokenResult;
        
        // Update quote with token
        const { error: updateError } = await supabase
          .from('quotes')
          .update({ public_token: publicToken })
          .eq('id', quote.id);
          
        if (updateError) throw updateError;
      }

      const baseUrl = window.location.origin;
      const publicUrl = `${baseUrl}/quote/${publicToken}`;

      setDebugInfo(prev => ({
        ...prev,
        tokenTest: {
          success: true,
          publicToken,
          publicUrl,
          timestamp: new Date().toISOString()
        }
      }));

      toast({
        title: "Token Test Successful",
        description: `Public URL: ${publicUrl}`,
      });

    } catch (error: any) {
      console.error('Token test error:', error);
      setDebugInfo(prev => ({
        ...prev,
        tokenTest: {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        }
      }));
      
      toast({
        title: "Token Test Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testEmailSend = async () => {
    if (!quote.customer_email) {
      toast({
        title: "No Customer Email",
        description: "Quote has no customer email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('🧪 Testing email send for quote:', quote.id);
      
      const { data, error } = await supabase.functions.invoke('send-quote-email', {
        body: {
          quoteId: quote.id,
          recipientEmail: quote.customer_email,
          recipientName: quote.customer_name || 'Test Customer',
          subject: `TEST: Offerte ${quote.quote_number} - SMANS BV`,
          message: 'Dit is een test email van de quote debug functionaliteit.'
        }
      });

      console.log('📧 Email Response:', { data, error });

      setDebugInfo(prev => ({
        ...prev,
        emailTest: {
          success: !error,
          error: error?.message,
          data: data,
          timestamp: new Date().toISOString()
        }
      }));

      if (error) {
        toast({
          title: "Email Test Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Email Test Successful",
          description: `Email sent to ${quote.customer_email}`,
        });
      }
    } catch (error: any) {
      console.error('Email test error:', error);
      toast({
        title: "Email Test Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openPublicUrl = () => {
    if (quote.public_token) {
      const baseUrl = window.location.origin;
      const url = `${baseUrl}/quote/${quote.public_token}`;
      console.log('🔗 Opening public quote URL:', url);
      window.open(url, '_blank');
    } else {
      toast({
        title: "No Public Token",
        description: "Quote has no public token. Try generating one first.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🧪 Quote Actions Debug</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Quote Info:</h4>
            <div className="text-sm space-y-1">
              <div><strong>ID:</strong> {quote.id}</div>
              <div><strong>Number:</strong> {quote.quote_number}</div>
              <div><strong>Status:</strong> <Badge>{quote.status}</Badge></div>
              <div><strong>Public Token:</strong> {quote.public_token || 'None'}</div>
              <div><strong>Customer Email:</strong> {quote.customer_email || 'None'}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button 
              onClick={testPDFGeneration} 
              disabled={isLoading}
              size="sm"
            >
              🔄 Test PDF Generation
            </Button>
            
            <Button 
              onClick={testPublicToken} 
              disabled={isLoading}
              size="sm"
            >
              🔄 Test Public Token
            </Button>
            
            <Button 
              onClick={testEmailSend} 
              disabled={isLoading || !quote.customer_email}
              size="sm"
            >
              🔄 Test Email Send
            </Button>
            
            <Button 
              onClick={openPublicUrl} 
              disabled={!quote.public_token}
              size="sm"
              variant="outline"
            >
              🔗 Open Public URL
            </Button>
          </div>

          {debugInfo.pdfTest && (
            <div className="border rounded p-3">
              <h5 className="font-medium text-sm mb-2">📄 PDF Test Results:</h5>
              <div className="text-xs space-y-1">
                <div><strong>Success:</strong> <Badge variant={debugInfo.pdfTest.success ? 'default' : 'destructive'}>{debugInfo.pdfTest.success ? 'Yes' : 'No'}</Badge></div>
                {debugInfo.pdfTest.error && <div><strong>Error:</strong> {debugInfo.pdfTest.error}</div>}
                <div><strong>Has URL:</strong> {debugInfo.pdfTest.hasUrl ? 'Yes' : 'No'}</div>
                <div><strong>Timestamp:</strong> {debugInfo.pdfTest.timestamp}</div>
              </div>
            </div>
          )}

          {debugInfo.tokenTest && (
            <div className="border rounded p-3">
              <h5 className="font-medium text-sm mb-2">🔗 Token Test Results:</h5>
              <div className="text-xs space-y-1">
                <div><strong>Success:</strong> <Badge variant={debugInfo.tokenTest.success ? 'default' : 'destructive'}>{debugInfo.tokenTest.success ? 'Yes' : 'No'}</Badge></div>
                {debugInfo.tokenTest.publicToken && <div><strong>Token:</strong> {debugInfo.tokenTest.publicToken}</div>}
                {debugInfo.tokenTest.publicUrl && <div><strong>URL:</strong> <a href={debugInfo.tokenTest.publicUrl} target="_blank" className="text-blue-600 hover:underline">{debugInfo.tokenTest.publicUrl}</a></div>}
                {debugInfo.tokenTest.error && <div><strong>Error:</strong> {debugInfo.tokenTest.error}</div>}
                <div><strong>Timestamp:</strong> {debugInfo.tokenTest.timestamp}</div>
              </div>
            </div>
          )}

          {debugInfo.emailTest && (
            <div className="border rounded p-3">
              <h5 className="font-medium text-sm mb-2">📧 Email Test Results:</h5>
              <div className="text-xs space-y-1">
                <div><strong>Success:</strong> <Badge variant={debugInfo.emailTest.success ? 'default' : 'destructive'}>{debugInfo.emailTest.success ? 'Yes' : 'No'}</Badge></div>
                {debugInfo.emailTest.error && <div><strong>Error:</strong> {debugInfo.emailTest.error}</div>}
                {debugInfo.emailTest.data?.publicUrl && <div><strong>Public URL:</strong> <a href={debugInfo.emailTest.data.publicUrl} target="_blank" className="text-blue-600 hover:underline">{debugInfo.emailTest.data.publicUrl}</a></div>}
                <div><strong>Timestamp:</strong> {debugInfo.emailTest.timestamp}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
