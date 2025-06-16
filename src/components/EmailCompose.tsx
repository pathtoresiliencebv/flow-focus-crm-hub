
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { X, Send, Paperclip } from 'lucide-react';

interface EmailComposeProps {
  onClose: () => void;
  replyTo?: {
    to: string;
    subject: string;
    inReplyTo?: string;
  };
}

export const EmailCompose: React.FC<EmailComposeProps> = ({ onClose, replyTo }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    to: replyTo?.to || '',
    cc: '',
    bcc: '',
    subject: replyTo?.subject ? `Re: ${replyTo.subject}` : '',
    body: ''
  });
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Fout",
        description: "U moet ingelogd zijn om e-mails te versturen.",
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);

    try {
      // Get user's primary email settings
      const { data: emailSettings } = await supabase
        .from('user_email_settings')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1)
        .single();

      if (!emailSettings) {
        toast({
          title: "Geen e-mailaccount",
          description: "Configureer eerst een e-mailaccount in de instellingen.",
          variant: "destructive"
        });
        setIsSending(false);
        return;
      }

      // Save email to database with correct user_id
      const emailData = {
        user_id: user.id, // Ensure this is set to current user
        email_settings_id: emailSettings.id,
        subject: formData.subject,
        from_address: emailSettings.email_address,
        from_name: emailSettings.display_name,
        to_addresses: formData.to.split(',').map(email => email.trim()),
        cc_addresses: formData.cc ? formData.cc.split(',').map(email => email.trim()) : null,
        bcc_addresses: formData.bcc ? formData.bcc.split(',').map(email => email.trim()) : null,
        body_text: formData.body,
        body_html: formData.body.replace(/\n/g, '<br>'),
        folder: 'sent',
        is_sent: true,
        sent_at: new Date().toISOString(),
        in_reply_to: replyTo?.inReplyTo || null
      };

      const { error } = await supabase
        .from('emails')
        .insert(emailData);

      if (error) {
        console.error('Error saving email:', error);
        throw error;
      }

      toast({
        title: "E-mail verzonden",
        description: "Uw e-mail is succesvol verzonden.",
      });

      onClose();
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Fout bij verzenden",
        description: "Er ging iets mis bij het verzenden van de e-mail.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle>Nieuwe E-mail</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-sm font-medium">Aan</label>
              <Input
                type="email"
                value={formData.to}
                onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                placeholder="ontvanger@voorbeeld.nl"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">CC</label>
                <Input
                  type="email"
                  value={formData.cc}
                  onChange={(e) => setFormData({ ...formData, cc: e.target.value })}
                  placeholder="cc@voorbeeld.nl"
                />
              </div>
              <div>
                <label className="text-sm font-medium">BCC</label>
                <Input
                  type="email"
                  value={formData.bcc}
                  onChange={(e) => setFormData({ ...formData, bcc: e.target.value })}
                  placeholder="bcc@voorbeeld.nl"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Onderwerp</label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Onderwerp van de e-mail"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Bericht</label>
              <Textarea
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                placeholder="Typ hier uw bericht..."
                rows={12}
                required
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-4">
            <Button type="button" variant="outline">
              <Paperclip className="h-4 w-4 mr-2" />
              Bijlage toevoegen
            </Button>
            
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Annuleren
              </Button>
              <Button type="submit" disabled={isSending}>
                <Send className="h-4 w-4 mr-2" />
                {isSending ? 'Verzenden...' : 'Verzenden'}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
