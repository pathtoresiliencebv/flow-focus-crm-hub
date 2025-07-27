
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { X, Send, Paperclip } from 'lucide-react';
import { EmailTemplateSelector } from './EmailTemplateSelector';
import { FileUpload, AttachmentList, FileUploadResult } from '@/components/ui/file-upload';
import { EmailAutocomplete } from '@/components/ui/email-autocomplete';

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
  const [attachments, setAttachments] = useState<FileUploadResult[]>([]);

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

      // Send email via edge function
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: formData.to.split(',').map(email => email.trim()),
          cc: formData.cc ? formData.cc.split(',').map(email => email.trim()) : undefined,
          bcc: formData.bcc ? formData.bcc.split(',').map(email => email.trim()) : undefined,
          subject: formData.subject,
          body_text: formData.body,
          body_html: formData.body.replace(/\n/g, '<br>'),
          email_settings_id: emailSettings.id,
          in_reply_to: replyTo?.inReplyTo || undefined,
          attachments: attachments.length > 0 ? attachments.map(att => ({
            filename: att.name,
            content: att.content,
            contentType: att.contentType
          })) : undefined,
        }
      });

      if (error) {
        throw error;
      }

      if (!data?.success) {
        throw new Error('E-mail verzending gefaald');
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

  const handleAttachmentsSelected = (files: FileUploadResult[]) => {
    setAttachments(prev => [...prev, ...files]);
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
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
              <EmailAutocomplete
                value={formData.to}
                onChange={(value) => setFormData({ ...formData, to: value })}
                placeholder="ontvanger@voorbeeld.nl"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">CC</label>
                <EmailAutocomplete
                  value={formData.cc}
                  onChange={(value) => setFormData({ ...formData, cc: value })}
                  placeholder="cc@voorbeeld.nl"
                />
              </div>
              <div>
                <label className="text-sm font-medium">BCC</label>
                <EmailAutocomplete
                  value={formData.bcc}
                  onChange={(value) => setFormData({ ...formData, bcc: value })}
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
                rows={6}
                required
              />
            </div>
          </div>

          {/* Email Template Selector */}
          <EmailTemplateSelector
            onTemplateSelect={(template) => {
              setFormData({
                ...formData,
                subject: template.subject,
                body: template.body
              });
            }}
            disabled={isSending}
          />

          {/* File Upload for Attachments */}
          <div className="space-y-4">
            <FileUpload
              onFilesSelected={handleAttachmentsSelected}
              accept="image/*,.pdf,.doc,.docx,.txt"
              multiple={true}
            >
              <Button type="button" variant="outline" className="w-full">
                <Paperclip className="h-4 w-4 mr-2" />
                Bijlage toevoegen
              </Button>
            </FileUpload>
            
            <AttachmentList 
              attachments={attachments}
              onRemove={handleRemoveAttachment}
            />
          </div>

          <div className="flex justify-between items-center pt-4">
            
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
