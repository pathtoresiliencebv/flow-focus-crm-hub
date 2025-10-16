import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Paperclip, 
  X, 
  Plus, 
  Mail, 
  User,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { useNylasMessages } from '@/hooks/useNylasMessages';
import { useNylasContacts } from '@/hooks/useNylasContacts';
import { toast } from 'sonner';

interface NylasMessageComposerProps {
  onSend?: () => void;
  onCancel?: () => void;
  replyTo?: {
    messageId: string;
    subject: string;
    from: string;
  };
  className?: string;
}

interface Contact {
  id: string;
  email: string;
  name?: string;
}

interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
}

export function NylasMessageComposer({ 
  onSend, 
  onCancel, 
  replyTo,
  className = '' 
}: NylasMessageComposerProps) {
  const [to, setTo] = useState<string>('');
  const [cc, setCc] = useState<string>('');
  const [bcc, setBcc] = useState<string>('');
  const [subject, setSubject] = useState<string>(replyTo?.subject?.startsWith('Re:') ? replyTo.subject : `Re: ${replyTo?.subject || ''}`);
  const [body, setBody] = useState<string>('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showCc, setShowCc] = useState<boolean>(false);
  const [showBcc, setShowBcc] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [contactSuggestions, setContactSuggestions] = useState<Contact[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [suggestionIndex, setSuggestionIndex] = useState<number>(-1);

  const { sendMessage } = useNylasMessages();
  const { contacts, fetchContacts } = useNylasContacts();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);

  // Initialize reply content
  useEffect(() => {
    if (replyTo) {
      setTo(replyTo.from);
      setBody(`\n\n--- Original Message ---\nFrom: ${replyTo.from}\nSubject: ${replyTo.subject}\n\n`);
    }
  }, [replyTo]);

  // Load contacts for autocomplete
  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Handle contact suggestions
  const handleToChange = (value: string) => {
    setTo(value);
    
    if (value.length > 1) {
      const filtered = contacts.filter(contact => 
        contact.email.toLowerCase().includes(value.toLowerCase()) ||
        (contact.name && contact.name.toLowerCase().includes(value.toLowerCase()))
      );
      setContactSuggestions(filtered.slice(0, 5));
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
    setSuggestionIndex(-1);
  };

  // Handle keyboard navigation for suggestions
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSuggestionIndex(prev => 
          prev < contactSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : contactSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (suggestionIndex >= 0 && contactSuggestions[suggestionIndex]) {
          const selected = contactSuggestions[suggestionIndex];
          setTo(selected.email);
          setShowSuggestions(false);
          setSuggestionIndex(-1);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSuggestionIndex(-1);
        break;
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (contact: Contact) => {
    setTo(contact.email);
    setShowSuggestions(false);
    setSuggestionIndex(-1);
  };

  // Handle file attachment
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    files.forEach(file => {
      const attachment: Attachment = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        file
      };
      setAttachments(prev => [...prev, attachment]);
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove attachment
  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Validate email addresses
  const validateEmails = (emailString: string): boolean => {
    if (!emailString.trim()) return true;
    
    const emails = emailString.split(',').map(email => email.trim());
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    return emails.every(email => emailRegex.test(email));
  };

  // Send message
  const handleSend = async () => {
    // Validation
    if (!to.trim()) {
      toast.error('Ontvanger is verplicht');
      return;
    }

    if (!validateEmails(to)) {
      toast.error('Ongeldig email adres in ontvanger veld');
      return;
    }

    if (cc && !validateEmails(cc)) {
      toast.error('Ongeldig email adres in CC veld');
      return;
    }

    if (bcc && !validateEmails(bcc)) {
      toast.error('Ongeldig email adres in BCC veld');
      return;
    }

    if (!subject.trim()) {
      toast.error('Onderwerp is verplicht');
      return;
    }

    if (!body.trim()) {
      toast.error('Bericht inhoud is verplicht');
      return;
    }

    setIsSending(true);

    try {
      const messageData = {
        to: to.split(',').map(email => email.trim()),
        cc: cc ? cc.split(',').map(email => email.trim()) : [],
        bcc: bcc ? bcc.split(',').map(email => email.trim()) : [],
        subject: subject.trim(),
        body: body.trim(),
        attachments: attachments.map(att => ({
          name: att.name,
          size: att.size,
          type: att.type,
          file: att.file
        })),
        replyTo: replyTo?.messageId
      };

      await sendMessage(messageData);
      
      toast.success('Email succesvol verzonden');
      
      // Reset form
      setTo('');
      setCc('');
      setBcc('');
      setSubject('');
      setBody('');
      setAttachments([]);
      setShowCc(false);
      setShowBcc(false);
      
      onSend?.();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Fout bij verzenden van email');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {replyTo ? 'Antwoord' : 'Nieuw Bericht'}
          </CardTitle>
          <div className="flex items-center gap-2">
            {onCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                disabled={isSending}
              >
                <X className="h-4 w-4 mr-1" />
                Annuleren
              </Button>
            )}
            <Button
              onClick={handleSend}
              disabled={isSending || !to.trim() || !subject.trim() || !body.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-1" />
              )}
              {isSending ? 'Verzenden...' : 'Verzenden'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* To Field */}
        <div className="relative">
          <label className="block text-sm font-medium mb-1">Aan</label>
          <Input
            ref={toInputRef}
            value={to}
            onChange={(e) => handleToChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            onFocus={() => to.length > 1 && setShowSuggestions(true)}
            placeholder="email@example.com"
            className="w-full"
            required
          />
          
          {/* Contact Suggestions */}
          {showSuggestions && contactSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
              {contactSuggestions.map((contact, index) => (
                <div
                  key={contact.id}
                  className={`px-3 py-2 cursor-pointer hover:bg-gray-50 flex items-center gap-2 ${
                    index === suggestionIndex ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleSuggestionClick(contact)}
                >
                  <User className="h-4 w-4 text-gray-500" />
                  <div className="flex-1">
                    <div className="font-medium">{contact.name || contact.email}</div>
                    {contact.name && (
                      <div className="text-sm text-gray-500">{contact.email}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CC Field */}
        {showCc && (
          <div>
            <label className="block text-sm font-medium mb-1">CC</label>
            <Input
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              placeholder="email@example.com"
              className="w-full"
            />
          </div>
        )}

        {/* BCC Field */}
        {showBcc && (
          <div>
            <label className="block text-sm font-medium mb-1">BCC</label>
            <Input
              value={bcc}
              onChange={(e) => setBcc(e.target.value)}
              placeholder="email@example.com"
              className="w-full"
            />
          </div>
        )}

        {/* CC/BCC Toggle Buttons */}
        <div className="flex gap-2">
          {!showCc && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCc(true)}
              className="text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              CC
            </Button>
          )}
          {!showBcc && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBcc(true)}
              className="text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              BCC
            </Button>
          )}
        </div>

        {/* Subject Field */}
        <div>
          <label className="block text-sm font-medium mb-1">Onderwerp</label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Onderwerp van je bericht"
            className="w-full"
            required
          />
        </div>

        {/* Attachments */}
        {attachments.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-2">Bijlagen</label>
            <div className="space-y-2">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                >
                  <div className="flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="text-sm font-medium">{attachment.name}</div>
                      <div className="text-xs text-gray-500">
                        {formatFileSize(attachment.size)}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAttachment(attachment.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* File Upload Button */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept="*/*"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="w-full"
          >
            <Paperclip className="h-4 w-4 mr-2" />
            Bijlage toevoegen
          </Button>
        </div>

        {/* Message Body */}
        <div>
          <label className="block text-sm font-medium mb-1">Bericht</label>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Typ je bericht hier..."
            className="w-full min-h-[200px] resize-none"
            required
          />
        </div>

        {/* Validation Messages */}
        {to && !validateEmails(to) && (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle className="h-4 w-4" />
            Ongeldig email adres in ontvanger veld
          </div>
        )}

        {cc && !validateEmails(cc) && (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle className="h-4 w-4" />
            Ongeldig email adres in CC veld
          </div>
        )}

        {bcc && !validateEmails(bcc) && (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle className="h-4 w-4" />
            Ongeldig email adres in BCC veld
          </div>
        )}
      </CardContent>
    </Card>
  );
}

