import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { EmailAccount } from '@/hooks/useEmailAccounts';

interface EmailComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: EmailAccount;
  replyTo?: {
    to: string;
    subject: string;
  };
}

export const EmailComposer: React.FC<EmailComposerProps> = ({
  open,
  onOpenChange,
  account,
  replyTo
}) => {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);

  const [to, setTo] = useState(replyTo?.to || '');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState(replyTo?.subject || '');
  const [body, setBody] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);

  // Update fields when replyTo changes
  useEffect(() => {
    if (replyTo) {
      setTo(replyTo.to);
      setSubject(replyTo.subject);
    } else {
      setTo('');
      setSubject('');
      setBody('');
      setCc('');
      setBcc('');
    }
  }, [replyTo]);

  const handleSend = async () => {
    if (!to || !subject || !body) {
      toast({
        title: "Verplichte velden ontbreken",
        description: "Vul minimaal aan, onderwerp en bericht in",
        variant: "destructive"
      });
      return;
    }

    try {
      setSending(true);

      // Use OX Mail API for sending
      const functionName = 'ox-mail-send';

      console.log('Sending email via:', functionName, {
        accountId: account.id,
        to,
        subject
      });

      const response = await supabase.functions.invoke(functionName, {
        body: {
          accountId: account.id,
          to: to.split(',').map(e => e.trim()), // Array of recipients
          cc: cc ? cc.split(',').map(e => e.trim()) : [],
          bcc: bcc ? bcc.split(',').map(e => e.trim()) : [],
          subject,
          bodyText: body, // Plain text version
          bodyHtml: body.replace(/\n/g, '<br>'), // HTML version
        }
      });

      console.log('Send result:', response);

      // If there's an error, try to get more details
      if (response.error) {
        let errorDetails = response.error.message;
        
        // Try to read error from response data
        if (response.data) {
          try {
            console.log('Response data:', response.data);
            if (typeof response.data === 'object' && response.data.error) {
              errorDetails = response.data.error;
            }
          } catch (e) {
            console.error('Could not parse response data:', e);
          }
        }
        
        throw new Error(errorDetails);
      }

      // Email saved to database by OX Mail send function
      console.log('✅ Email sent and saved via OX Mail API');

      toast({
        title: "Email verzonden! ✓",
        description: `Bericht verzonden naar ${to}`,
      });

      // Reset form
      setTo('');
      setCc('');
      setBcc('');
      setSubject('');
      setBody('');
      onOpenChange(false);

    } catch (error: any) {
      console.error('Error sending email:', error);
      
      // Try to get more error details from the response
      let errorMessage = error.message || "Er is een fout opgetreden bij het versturen";
      
      // If it's a FunctionsHttpError, try to get the response body
      if (error.context?.body) {
        try {
          const errorBody = error.context.body;
          errorMessage = errorBody.error || errorMessage;
          console.error('Edge function error details:', errorBody);
        } catch (e) {
          console.error('Could not parse error body:', e);
        }
      }
      
      toast({
        title: "Verzenden mislukt",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Nieuwe Email</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-6">
          {/* From */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium">Van:</span>
            <span>{account.display_name || account.email_address} &lt;{account.email_address}&gt;</span>
          </div>

          {/* To */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="to" className="w-16">Aan</Label>
              <Input
                id="to"
                type="email"
                placeholder="ontvanger@email.nl"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="flex-1"
              />
              <div className="flex gap-1">
                {!showCc && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCc(true)}
                  >
                    Cc
                  </Button>
                )}
                {!showBcc && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowBcc(true)}
                  >
                    Bcc
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* CC */}
          {showCc && (
            <div className="flex items-center gap-2">
              <Label htmlFor="cc" className="w-16">Cc</Label>
              <Input
                id="cc"
                type="text"
                placeholder="email1@email.nl, email2@email.nl"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCc(false);
                  setCc('');
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* BCC */}
          {showBcc && (
            <div className="flex items-center gap-2">
              <Label htmlFor="bcc" className="w-16">Bcc</Label>
              <Input
                id="bcc"
                type="text"
                placeholder="email1@email.nl, email2@email.nl"
                value={bcc}
                onChange={(e) => setBcc(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowBcc(false);
                  setBcc('');
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Subject */}
          <div className="flex items-center gap-2">
            <Label htmlFor="subject" className="w-16">Onderwerp</Label>
            <Input
              id="subject"
              type="text"
              placeholder="Email onderwerp"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="flex-1"
            />
          </div>

          {/* Body */}
          <div className="space-y-2">
            <Label htmlFor="body">Bericht</Label>
            <Textarea
              id="body"
              placeholder="Typ hier je bericht..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-[300px]"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-xs text-muted-foreground">
              Van: {account.email_address}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={sending}
              >
                Annuleren
              </Button>
              <Button
                onClick={handleSend}
                disabled={sending || !to || !subject || !body}
              >
                {sending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verzenden...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Verzenden
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

