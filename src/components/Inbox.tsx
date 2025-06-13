
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Mail,
  Send,
  Reply,
  ReplyAll,
  Forward,
  Star,
  Trash2,
  Search,
  Settings,
  Plus,
  Bot,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Email {
  id: string;
  subject: string;
  from_address: string;
  from_name?: string;
  to_addresses: string[];
  body_html?: string;
  body_text?: string;
  is_read: boolean;
  is_starred: boolean;
  received_at?: string;
  sent_at?: string;
  folder: string;
}

interface EmailSettings {
  id: string;
  email_address: string;
  display_name: string;
  is_active: boolean;
}

export function Inbox() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [emailSettings, setEmailSettings] = useState<EmailSettings[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [replyText, setReplyText] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Mock emails for demonstration
  const mockEmails: Email[] = [
    {
      id: '1',
      subject: 'Offerte aanvraag - Badkamer renovatie',
      from_address: 'klant@example.com',
      from_name: 'Jan Janssen',
      to_addresses: ['info@smans.nl'],
      body_html: '<p>Beste SMANS team,<br><br>Ik zou graag een offerte willen ontvangen voor de renovatie van mijn badkamer. De badkamer is ongeveer 6m². Kunnen jullie contact met mij opnemen?<br><br>Met vriendelijke groet,<br>Jan Janssen</p>',
      is_read: false,
      is_starred: false,
      received_at: '2024-01-15T10:30:00Z',
      folder: 'inbox'
    },
    {
      id: '2',
      subject: 'Re: Project Keukenmontage - Status update',
      from_address: 'projectmanager@example.com',
      from_name: 'Marie Verkerk',
      to_addresses: ['info@smans.nl'],
      body_html: '<p>Hallo,<br><br>Het project loopt volgens planning. We verwachten volgende week donderdag klaar te zijn.<br><br>Groet,<br>Marie</p>',
      is_read: true,
      is_starred: true,
      received_at: '2024-01-15T09:15:00Z',
      folder: 'inbox'
    },
    {
      id: '3',
      subject: 'Factuur betaling - Bevestiging',
      from_address: 'boekhouding@klant.nl',
      from_name: 'Administratie',
      to_addresses: ['info@smans.nl'],
      body_html: '<p>Beste SMANS,<br><br>Hierbij bevestigen wij de betaling van factuur F2024-001 voor €2.750,-.<br><br>Met vriendelijke groet,<br>Administratie</p>',
      is_read: true,
      is_starred: false,
      received_at: '2024-01-14T16:45:00Z',
      folder: 'inbox'
    }
  ];

  useEffect(() => {
    setEmails(mockEmails);
  }, []);

  const handleAIReply = async () => {
    if (!selectedEmail) return;
    
    setIsGeneratingAI(true);
    
    try {
      const response = await fetch('/api/generate-email-reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalEmail: {
            subject: selectedEmail.subject,
            from: selectedEmail.from_address,
            body: selectedEmail.body_html || selectedEmail.body_text,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('AI reply generation failed');
      }

      const data = await response.json();
      setReplyText(data.reply);
      
      toast({
        title: "AI antwoord gegenereerd",
        description: "Het AI-antwoord is klaar om te verzenden of aan te passen.",
      });
    } catch (error) {
      console.error('Error generating AI reply:', error);
      toast({
        title: "Fout bij AI generatie",
        description: "Er ging iets mis bij het genereren van het AI-antwoord.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const filteredEmails = emails.filter(email =>
    email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.from_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (email.from_name && email.from_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="h-6 w-6" />
            Inbox/Mail
          </h1>
          <Badge variant="secondary">
            {filteredEmails.filter(e => !e.is_read).length} ongelezen
          </Badge>
        </div>
        <div className="flex gap-2">
          <Dialog open={showCompose} onOpenChange={setShowCompose}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nieuwe mail
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nieuwe email</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Naar</label>
                  <Input placeholder="email@example.com" />
                </div>
                <div>
                  <label className="text-sm font-medium">Onderwerp</label>
                  <Input placeholder="Onderwerp van de email" />
                </div>
                <div>
                  <label className="text-sm font-medium">Bericht</label>
                  <Textarea className="min-h-[200px]" placeholder="Type je bericht hier..." />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCompose(false)}>
                    Annuleren
                  </Button>
                  <Button>
                    <Send className="h-4 w-4 mr-2" />
                    Verzenden
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={showSettings} onOpenChange={setShowSettings}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Instellingen
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Email Instellingen</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Email adres</label>
                  <Input placeholder="jouw@email.com" />
                </div>
                <div>
                  <label className="text-sm font-medium">Weergavenaam</label>
                  <Input placeholder="Jouw Naam" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">SMTP Server</label>
                    <Input placeholder="smtp.gmail.com" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">SMTP Poort</label>
                    <Input placeholder="587" type="number" />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowSettings(false)}>
                    Annuleren
                  </Button>
                  <Button>Opslaan</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Email List */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                <Input
                  placeholder="Zoek emails..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                {filteredEmails.map((email, index) => (
                  <div key={email.id}>
                    <div
                      className={`p-4 cursor-pointer hover:bg-gray-50 ${
                        selectedEmail?.id === email.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                      } ${!email.is_read ? 'bg-blue-50/30' : ''}`}
                      onClick={() => setSelectedEmail(email)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm truncate ${!email.is_read ? 'font-semibold' : ''}`}>
                              {email.from_name || email.from_address}
                            </p>
                            {email.is_starred && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                            {!email.is_read && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                          </div>
                          <p className={`text-sm truncate mt-1 ${!email.is_read ? 'font-medium' : 'text-gray-600'}`}>
                            {email.subject}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(email.received_at || email.sent_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                    {index < filteredEmails.length - 1 && <Separator />}
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Email Content */}
        <div className="lg:col-span-2">
          {selectedEmail ? (
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{selectedEmail.subject}</CardTitle>
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                      <span>Van: {selectedEmail.from_name || selectedEmail.from_address}</span>
                      <span>•</span>
                      <span>Naar: {selectedEmail.to_addresses.join(', ')}</span>
                      <span>•</span>
                      <span>{formatDate(selectedEmail.received_at || selectedEmail.sent_at)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Star className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div 
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ 
                      __html: selectedEmail.body_html || selectedEmail.body_text?.replace(/\n/g, '<br>') || '' 
                    }}
                  />
                  
                  <Separator />
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Reply className="h-4 w-4 mr-2" />
                      Beantwoorden
                    </Button>
                    <Button variant="outline" size="sm">
                      <ReplyAll className="h-4 w-4 mr-2" />
                      Allen beantwoorden
                    </Button>
                    <Button variant="outline" size="sm">
                      <Forward className="h-4 w-4 mr-2" />
                      Doorsturen
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleAIReply}
                      disabled={isGeneratingAI}
                    >
                      {isGeneratingAI ? (
                        <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Bot className="h-4 w-4 mr-2" />
                      )}
                      AI Antwoord
                    </Button>
                  </div>

                  {replyText && (
                    <div className="space-y-3 border-t pt-4">
                      <h4 className="font-medium">AI Gegenereerd Antwoord:</h4>
                      <Textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="min-h-[150px]"
                      />
                      <div className="flex gap-2">
                        <Button>
                          <Send className="h-4 w-4 mr-2" />
                          Verzenden
                        </Button>
                        <Button variant="outline" onClick={() => setReplyText('')}>
                          Wissen
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Selecteer een email om te lezen</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
