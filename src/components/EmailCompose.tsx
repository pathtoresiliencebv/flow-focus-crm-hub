
import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Send, Sparkles, FileText, X } from "lucide-react";

interface EmailComposeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  replyTo?: any;
}

export function EmailCompose({ open, onOpenChange, replyTo }: EmailComposeProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [ccRecipients, setCcRecipients] = useState("");
  const [bccRecipients, setBccRecipients] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);

  // Fetch email accounts
  const { data: emailAccounts = [] } = useQuery({
    queryKey: ['email-accounts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_email_accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && open
  });

  // Fetch email templates
  const { data: templates = [] } = useQuery({
    queryKey: ['email-templates', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && open
  });

  // Send email mutation
  const sendEmailMutation = useMutation({
    mutationFn: async (emailData: any) => {
      const { error } = await supabase
        .from('emails')
        .insert({
          user_id: user?.id,
          email_account_id: emailData.from_account,
          subject: emailData.subject,
          from_address: emailData.from_address,
          from_name: emailData.from_name,
          to_addresses: emailData.to_addresses.split(',').map((email: string) => email.trim()),
          cc_addresses: emailData.cc_addresses ? emailData.cc_addresses.split(',').map((email: string) => email.trim()) : null,
          bcc_addresses: emailData.bcc_addresses ? emailData.bcc_addresses.split(',').map((email: string) => email.trim()) : null,
          body_html: emailData.body,
          body_text: emailData.body.replace(/<[^>]*>/g, ''),
          folder: 'sent',
          is_sent: true,
          sent_at: new Date().toISOString()
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      onOpenChange(false);
      toast({
        title: "E-mail verzonden",
        description: "Uw e-mail is succesvol verzonden."
      });
    },
    onError: () => {
      toast({
        title: "Fout bij verzenden",
        description: "Er is een fout opgetreden bij het verzenden van de e-mail.",
        variant: "destructive"
      });
    }
  });

  // Generate AI response
  const generateAIResponse = async (context: string) => {
    setIsGeneratingAI(true);
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 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',
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-chat-v3-0324:free',
          messages: [
            {
              role: 'system',
              content: 'Je bent een professionele e-mail assistent. Schrijf professionele, beleefde en zakelijke e-mails in het Nederlands.'
            },
            {
              role: 'user',
              content: context
            }
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      });

      if (!response.ok) throw new Error('AI response failed');

      const data = await response.json();
      const aiContent = data.choices?.[0]?.message?.content;
      
      if (aiContent) {
        const bodyField = document.querySelector('textarea[name="body"]') as HTMLTextAreaElement;
        if (bodyField) {
          bodyField.value = aiContent;
        }
      }
      
      return aiContent;
    } catch (error) {
      toast({
        title: "AI Fout",
        description: "Er is een fout opgetreden bij het genereren van de AI response.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const selectedAccount = emailAccounts.find(acc => acc.id === formData.get('from_account'));
    if (!selectedAccount) {
      toast({
        title: "Account vereist",
        description: "Selecteer een e-mail account om te verzenden.",
        variant: "destructive"
      });
      return;
    }

    const emailData = {
      from_account: formData.get('from_account') as string,
      from_address: selectedAccount.email_address,
      from_name: selectedAccount.display_name,
      to_addresses: formData.get('to_addresses') as string,
      cc_addresses: ccRecipients,
      bcc_addresses: bccRecipients,
      subject: formData.get('subject') as string,
      body: formData.get('body') as string
    };

    sendEmailMutation.mutate(emailData);
  };

  const applyTemplate = (template: any) => {
    const subjectField = document.querySelector('input[name="subject"]') as HTMLInputElement;
    const bodyField = document.querySelector('textarea[name="body"]') as HTMLTextAreaElement;
    
    if (subjectField) subjectField.value = template.subject;
    if (bodyField) bodyField.value = template.body_html;
    
    setShowTemplates(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            {replyTo ? 'Beantwoorden' : 'Nieuwe E-mail'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="from_account">Van Account</Label>
            <Select name="from_account" required>
              <SelectTrigger>
                <SelectValue placeholder="Selecteer e-mail account" />
              </SelectTrigger>
              <SelectContent>
                {emailAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.display_name} ({account.email_address})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="to_addresses">Aan</Label>
            <Input
              id="to_addresses"
              name="to_addresses"
              type="email"
              defaultValue={replyTo?.from_address}
              placeholder="ontvanger@example.com"
              required
            />
          </div>

          {showCc && (
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="cc_recipients">CC</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCc(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Input
                id="cc_recipients"
                value={ccRecipients}
                onChange={(e) => setCcRecipients(e.target.value)}
                placeholder="cc@example.com"
              />
            </div>
          )}

          {showBcc && (
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="bcc_recipients">BCC</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBcc(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Input
                id="bcc_recipients"
                value={bccRecipients}
                onChange={(e) => setBccRecipients(e.target.value)}
                placeholder="bcc@example.com"
              />
            </div>
          )}

          {(!showCc || !showBcc) && (
            <div className="flex gap-2">
              {!showCc && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCc(true)}
                >
                  CC toevoegen
                </Button>
              )}
              {!showBcc && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBcc(true)}
                >
                  BCC toevoegen
                </Button>
              )}
            </div>
          )}

          <div>
            <Label htmlFor="subject">Onderwerp</Label>
            <Input
              id="subject"
              name="subject"
              defaultValue={replyTo ? `Re: ${replyTo.subject}` : ''}
              placeholder="E-mail onderwerp"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="body">Bericht</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTemplates(!showTemplates)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Templates
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => generateAIResponse("Schrijf een professionele e-mail")}
                  disabled={isGeneratingAI}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {isGeneratingAI ? 'AI genereert...' : 'AI Hulp'}
                </Button>
              </div>
            </div>
            
            {showTemplates && (
              <div className="mb-4 p-4 border rounded-lg bg-gray-50">
                <h4 className="font-medium mb-2">Templates</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {templates.map((template) => (
                    <Button
                      key={template.id}
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => applyTemplate(template)}
                      className="justify-start"
                    >
                      {template.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            <Textarea
              id="body"
              name="body"
              rows={12}
              placeholder="Typ uw bericht hier..."
              className="resize-none"
              required
            />
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={sendEmailMutation.isPending}
                className="bg-smans-primary hover:bg-smans-primary/90"
              >
                <Send className="h-4 w-4 mr-2" />
                {sendEmailMutation.isPending ? 'Verzenden...' : 'Verzenden'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Annuleren
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
