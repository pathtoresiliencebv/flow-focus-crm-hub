import React, { useState, useEffect } from 'react';
import { EmailList } from './EmailList';
import { EmailCompose } from './EmailCompose';
import { EmailSidebar } from './EmailSidebar';
import { EmailToolbar } from './EmailToolbar';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Plus, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Email {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  date: string;
  isRead: boolean;
  isStarred: boolean;
  folder: string;
  attachments?: string[];
}

export function Email() {
  const { toast } = useToast();
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [currentFolder, setCurrentFolder] = useState('inbox');
  const [showCompose, setShowCompose] = useState(false);
  const [replyTo, setReplyTo] = useState<Email | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Mock data loading (replace with actual API call)
    const mockEmails: Email[] = [
      {
        id: '1',
        from: 'klant@example.com',
        to: 'jij@smans.nl',
        subject: 'Offerte aanvraag',
        body: 'Beste,\n\nWij zouden graag een offerte ontvangen voor...',
        date: new Date().toISOString(),
        isRead: false,
        isStarred: true,
        folder: 'inbox',
        attachments: ['offerte_aanvraag.pdf']
      },
      {
        id: '2',
        from: 'support@github.com',
        to: 'jij@smans.nl',
        subject: 'Nieuwe repository gemaakt',
        body: 'Je hebt een nieuwe repository aangemaakt...',
        date: new Date(Date.now() - 86400000).toISOString(),
        isRead: true,
        isStarred: false,
        folder: 'inbox'
      },
      {
        id: '3',
        from: 'noreply@linkedin.com',
        to: 'jij@smans.nl',
        subject: 'Iemand heeft je profiel bekeken',
        body: 'Bekijk wie je profiel heeft bekeken...',
        date: new Date(Date.now() - 172800000).toISOString(),
        isRead: true,
        isStarred: false,
        folder: 'inbox'
      },
      {
        id: '4',
        from: 'jij@smans.nl',
        to: 'klant@example.com',
        subject: 'Offerte verzonden',
        body: 'Beste,\n\nZoals afgesproken stuur ik u hierbij de offerte...',
        date: new Date(Date.now() - 259200000).toISOString(),
        isRead: true,
        isStarred: false,
        folder: 'sent'
      },
      {
        id: '5',
        from: 'jij@smans.nl',
        to: 'manager@example.com',
        subject: 'Concept factuur',
        body: 'Hierbij een concept factuur die nog nagekeken moet worden...',
        date: new Date(Date.now() - 345600000).toISOString(),
        isRead: true,
        isStarred: false,
        folder: 'drafts'
      }
    ];
    setEmails(mockEmails);
  }, []);

  const handleSelectEmail = (id: string) => {
    setSelectedEmails(prev => {
      if (prev.includes(id)) {
        return prev.filter(emailId => emailId !== id);
      } else {
        return [...prev, id];
      }
    });

    // Mark as read when selected
    setEmails(prev => prev.map(email =>
      email.id === id ? { ...email, isRead: true } : email
    ));
  };

  const handleSelectAll = () => {
    if (areAllSelected) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails(filteredEmails.map(email => email.id));
    }
  };

  const handleToggleStar = (id: string, isStarred: boolean) => {
    setEmails(prev => prev.map(email =>
      email.id === id ? { ...email, isStarred } : email
    ));
  };

  const handleArchive = (id: string) => {
    setEmails(prev => prev.map(email =>
      email.id === id ? { ...email, folder: 'archive' } : email
    ));
    setSelectedEmails(prev => prev.filter(emailId => emailId !== id));
  };

  const handleDelete = (id: string) => {
    setEmails(prev => prev.filter(email => email.id !== id));
    setSelectedEmails(prev => prev.filter(emailId => emailId !== id));
  };

  const handleBulkAction = (action: 'archive' | 'delete' | 'markAsRead' | 'markAsUnread') => {
    if (selectedEmails.length === 0) {
      toast({
        title: "Geen e-mails geselecteerd",
        description: "Selecteer eerst e-mails om deze actie uit te voeren.",
        variant: "destructive",
      });
      return;
    }

    if (action === 'archive') {
      setEmails(prev => prev.map(email =>
        selectedEmails.includes(email.id) ? { ...email, folder: 'archive' } : email
      ));
    } else if (action === 'delete') {
      setEmails(prev => prev.filter(email => !selectedEmails.includes(email.id)));
    } else if (action === 'markAsRead') {
      setEmails(prev => prev.map(email =>
        selectedEmails.includes(email.id) ? { ...email, isRead: true } : email
      ));
    } else if (action === 'markAsUnread') {
      setEmails(prev => prev.map(email =>
        selectedEmails.includes(email.id) ? { ...email, isRead: false } : email
      ));
    }

    setSelectedEmails([]);
  };

  const handleReply = (email: Email) => {
    setReplyTo(email);
    setShowCompose(true);
  };

  const handleCompose = (emailData: { to: string; subject: string; body: string; inReplyTo?: string }) => {
    const newEmail: Email = {
      id: Date.now().toString(),
      from: 'jij@smans.nl',
      to: emailData.to,
      subject: emailData.subject,
      body: emailData.body,
      date: new Date().toISOString(),
      isRead: true,
      isStarred: false,
      folder: 'sent'
    };

    setEmails(prev => [newEmail, ...prev]);
    setShowCompose(false);
    setReplyTo(null);
  };

  const filteredEmails = emails.filter(email => {
    const searchTermLower = searchTerm.toLowerCase();
    const matchesSearch =
      email.from.toLowerCase().includes(searchTermLower) ||
      email.to.toLowerCase().includes(searchTermLower) ||
      email.subject.toLowerCase().includes(searchTermLower) ||
      email.body.toLowerCase().includes(searchTermLower);

    const matchesFolder = currentFolder === 'starred' ? email.isStarred : email.folder === currentFolder;

    return matchesSearch && matchesFolder;
  });

  const areAllSelected = filteredEmails.length > 0 && filteredEmails.every(email => selectedEmails.includes(email.id));

  if (showCompose) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {replyTo ? `Beantwoorden: ${replyTo.subject}` : 'Nieuwe e-mail'}
          </h2>
          <Button variant="outline" onClick={() => { setShowCompose(false); setReplyTo(null); }}>
            Terug naar inbox
          </Button>
        </div>
        <div className="flex-1 p-4">
          <EmailCompose
            onSend={handleCompose}
            onCancel={() => { setShowCompose(false); setReplyTo(null); }}
            replyTo={replyTo ? {
              to: replyTo.from,
              subject: replyTo.subject.startsWith('Re: ') ? replyTo.subject : `Re: ${replyTo.subject}`,
              inReplyTo: replyTo.id
            } : undefined}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      <EmailSidebar
        currentFolder={currentFolder}
        onFolderChange={setCurrentFolder}
        onCompose={() => setShowCompose(true)}
      />
      
      <div className="flex-1 flex flex-col">
        <EmailToolbar
          selectedCount={selectedEmails.length}
          onArchive={() => handleBulkAction('archive')}
          onDelete={() => handleBulkAction('delete')}
          onMarkAsRead={() => handleBulkAction('markAsRead')}
          onMarkAsUnread={() => handleBulkAction('markAsUnread')}
        />

        <div className="p-4 border-b">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Zoek in e-mails..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => setShowCompose(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nieuwe e-mail
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <EmailList
            folder={currentFolder}
            filteredEmails={filteredEmails}
            selectedEmails={selectedEmails}
            onSelectEmail={handleSelectEmail}
            areAllSelected={areAllSelected}
            onSelectAll={handleSelectAll}
            onReply={handleReply}
            onToggleStar={handleToggleStar}
            onArchive={handleArchive}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </div>
  );
}
