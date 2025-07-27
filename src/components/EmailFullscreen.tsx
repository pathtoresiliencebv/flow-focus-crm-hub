import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { EmailList } from './EmailList';
import { EmailCompose } from './EmailCompose';
import { EmailSidebar } from './EmailSidebar';
import { EmailToolbar } from './EmailToolbar';
import { EmailSettings } from './EmailSettings';
import { EmailDetailView } from './EmailDetailView';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ArrowLeft, Plus, Search, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEmailSync } from '@/hooks/useEmailSync';
import { useEmailRealtime } from '@/hooks/useEmailRealtime';
import { ScrollArea } from '@/components/ui/scroll-area';

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

interface EmailAccount {
  id: string;
  display_name: string;
  email_address: string;
  is_active: boolean;
}

interface EmailFullscreenProps {
  onBackToDashboard: () => void;
}

export function EmailFullscreen({ onBackToDashboard }: EmailFullscreenProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { syncEmails, isSyncing } = useEmailSync();
  
  // Enable real-time email updates
  useEmailRealtime();
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [currentFolder, setCurrentFolder] = useState('inbox');
  const [showCompose, setShowCompose] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedEmailForView, setSelectedEmailForView] = useState<Email | null>(null);
  const [replyTo, setReplyTo] = useState<Email | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<string | 'all'>('all');

  // Fetch email accounts
  const { data: emailAccounts = [], refetch: refetchAccounts } = useQuery<EmailAccount[]>({
    queryKey: ['email-accounts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_email_settings')
        .select('id, display_name, email_address, is_active')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching email accounts:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!user?.id,
  });

  const hasEmailAccounts = emailAccounts.length > 0;

  // Fetch emails from database
  const { data: fetchedEmails = [], refetch: refetchEmails } = useQuery<Email[]>({
    queryKey: ['emails', user?.id, selectedAccountId],
    queryFn: async () => {
      if (!user?.id) return [];
      
      let query = supabase
        .from('emails')
        .select(`
          id,
          subject,
          from_address,
          from_name,
          to_addresses,
          cc_addresses,
          bcc_addresses,
          body_text,
          body_html,
          folder,
          is_read,
          is_starred,
          is_draft,
          is_sent,
          created_at,
          sent_at,
          received_at,
          attachments
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (selectedAccountId !== 'all') {
        query = query.eq('email_settings_id', selectedAccountId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching emails:', error);
        return [];
      }

      // Transform database emails to component Email interface
      return (data || []).map((email): Email => ({
        id: email.id,
        from: email.from_name ? `${email.from_name} <${email.from_address}>` : email.from_address,
        to: Array.isArray(email.to_addresses) ? email.to_addresses.join(', ') : email.to_addresses?.[0] || '',
        subject: email.subject,
        body: email.body_html || email.body_text || '',
        date: email.sent_at || email.received_at || email.created_at,
        isRead: email.is_read || false,
        isStarred: email.is_starred || false,
        folder: email.folder || 'inbox',
        attachments: Array.isArray(email.attachments) ? email.attachments.map((att: any) => att.filename || att.name) : undefined
      }));
    },
    enabled: !!user?.id,
  });

  // Update local emails state when data changes
  useEffect(() => {
    if (fetchedEmails.length > 0) {
      setEmails(fetchedEmails);
    }
  }, [fetchedEmails]);

  const handleSelectEmail = async (id: string) => {
    setSelectedEmails(prev => {
      if (prev.includes(id)) {
        return prev.filter(emailId => emailId !== id);
      } else {
        return [...prev, id];
      }
    });

    // Mark as read when selected
    const emailToUpdate = emails.find(email => email.id === id);
    if (emailToUpdate && !emailToUpdate.isRead) {
      try {
        await supabase
          .from('emails')
          .update({ is_read: true })
          .eq('id', id)
          .eq('user_id', user?.id);
        
        setEmails(prev => prev.map(email =>
          email.id === id ? { ...email, isRead: true } : email
        ));
      } catch (error) {
        console.error('Error marking email as read:', error);
      }
    }
  };

  const handleViewEmail = async (email: Email) => {
    setSelectedEmailForView(email);
    
    // Mark as read when viewed
    if (!email.isRead) {
      try {
        await supabase
          .from('emails')
          .update({ is_read: true })
          .eq('id', email.id)
          .eq('user_id', user?.id);
        
        setEmails(prev => prev.map(e =>
          e.id === email.id ? { ...e, isRead: true } : e
        ));
      } catch (error) {
        console.error('Error marking email as read:', error);
      }
    }
  };

  const handleSelectAll = () => {
    if (areAllSelected) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails(filteredEmails.map(email => email.id));
    }
  };

  const handleToggleStar = async (id: string, isStarred: boolean) => {
    try {
      await supabase
        .from('emails')
        .update({ is_starred: isStarred })
        .eq('id', id)
        .eq('user_id', user?.id);
      
      setEmails(prev => prev.map(email =>
        email.id === id ? { ...email, isStarred } : email
      ));
    } catch (error) {
      console.error('Error updating email star status:', error);
    }
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
    setSelectedEmailForView(null);
    setShowCompose(true);
  };

  const handleRefresh = () => {
    refetchAccounts();
    refetchEmails();
  };

  const handleSyncAll = () => {
    emailAccounts.forEach(account => {
      if (account.is_active) {
        syncEmails({ emailSettingsId: account.id });
      }
    });
  };

  const handleNavigateToSettings = () => {
    setShowSettings(true);
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

  if (showSettings) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">E-mail Instellingen</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Terug naar inbox
            </Button>
            <Button variant="outline" onClick={onBackToDashboard}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </div>
        </div>
        <div className="flex-1 p-4">
          <EmailSettings />
        </div>
      </div>
    );
  }

  if (showCompose) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {replyTo ? `Beantwoorden: ${replyTo.subject}` : 'Nieuwe e-mail'}
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setShowCompose(false); setReplyTo(null); }}>
              Terug naar inbox
            </Button>
            <Button variant="outline" onClick={onBackToDashboard}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </div>
        </div>
        <div className="flex-1 p-4">
          <EmailCompose
            onClose={() => { setShowCompose(false); setReplyTo(null); }}
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
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header with back to dashboard button */}
      <div className="p-4 border-b flex items-center justify-between bg-background/95 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">E-mail</h1>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Zoek in e-mails..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button 
              onClick={handleSyncAll} 
              variant="outline" 
              disabled={isSyncing || !hasEmailAccounts}
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              Sync
            </Button>
            <Button onClick={() => setShowCompose(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nieuw
            </Button>
          </div>
        </div>
        <Button variant="outline" onClick={onBackToDashboard}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Dashboard
        </Button>
      </div>

      {/* Responsive layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop: Three-column layout */}
        <div className="hidden xl:flex w-full">
          {/* Sidebar - 20% */}
          <div className="w-1/5 border-r bg-muted/30">
            <EmailSidebar
              activeFolder={currentFolder}
              setActiveFolder={setCurrentFolder}
              onComposeClick={() => setShowCompose(true)}
              hasEmailAccounts={hasEmailAccounts}
              onNavigateToSettings={handleNavigateToSettings}
            />
          </div>

          {/* Email List - 40% */}
          <div className="w-2/5 border-r flex flex-col">
            <div className="border-b p-2">
              <EmailToolbar
                searchTerm={searchTerm}
                onSearchTermChange={setSearchTerm}
                selectedAccountId={selectedAccountId}
                onSelectedAccountIdChange={setSelectedAccountId}
                hasEmailAccounts={hasEmailAccounts}
                emailAccounts={emailAccounts}
                onRefresh={handleRefresh}
                selectedEmailsCount={selectedEmails.length}
                onMarkAsRead={() => handleBulkAction('markAsRead')}
                onMarkAsUnread={() => handleBulkAction('markAsUnread')}
                onStar={() => {}}
                onUnstar={() => {}}
                onDelete={() => handleBulkAction('delete')}
                onArchive={() => handleBulkAction('archive')}
              />
            </div>
            <ScrollArea className="flex-1">
              <EmailList
                folder={currentFolder}
                filteredEmails={filteredEmails}
                selectedEmails={selectedEmails}
                onSelectEmail={handleSelectEmail}
                onViewEmail={handleViewEmail}
                areAllSelected={areAllSelected}
                onSelectAll={handleSelectAll}
                onReply={handleReply}
                onToggleStar={handleToggleStar}
                onArchive={handleArchive}
                onDelete={handleDelete}
              />
            </ScrollArea>
          </div>

          {/* Email Detail View - 40% */}
          <div className="w-2/5 flex flex-col">
            {selectedEmailForView ? (
              <ScrollArea className="flex-1">
                <EmailDetailView
                  email={selectedEmailForView}
                  onBack={() => setSelectedEmailForView(null)}
                  onReply={handleReply}
                  onToggleStar={handleToggleStar}
                  onArchive={handleArchive}
                  onDelete={handleDelete}
                  hideBackButton={true}
                />
              </ScrollArea>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <div className="text-4xl mb-4">📧</div>
                  <h3 className="text-lg font-medium mb-2">Selecteer een e-mail</h3>
                  <p>Klik op een e-mail in de lijst om deze hier te bekijken</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tablet: Two-column layout */}
        <div className="hidden md:flex xl:hidden w-full">
          {/* Sidebar */}
          <div className="w-1/4 border-r bg-muted/30">
            <EmailSidebar
              activeFolder={currentFolder}
              setActiveFolder={setCurrentFolder}
              onComposeClick={() => setShowCompose(true)}
              hasEmailAccounts={hasEmailAccounts}
              onNavigateToSettings={handleNavigateToSettings}
            />
          </div>

          {!selectedEmailForView ? (
            /* Email List - 75% */
            <div className="w-3/4 flex flex-col">
              <div className="border-b p-2">
                <EmailToolbar
                  searchTerm={searchTerm}
                  onSearchTermChange={setSearchTerm}
                  selectedAccountId={selectedAccountId}
                  onSelectedAccountIdChange={setSelectedAccountId}
                  hasEmailAccounts={hasEmailAccounts}
                  emailAccounts={emailAccounts}
                  onRefresh={handleRefresh}
                  selectedEmailsCount={selectedEmails.length}
                  onMarkAsRead={() => handleBulkAction('markAsRead')}
                  onMarkAsUnread={() => handleBulkAction('markAsUnread')}
                  onStar={() => {}}
                  onUnstar={() => {}}
                  onDelete={() => handleBulkAction('delete')}
                  onArchive={() => handleBulkAction('archive')}
                />
              </div>
              <ScrollArea className="flex-1">
                <EmailList
                  folder={currentFolder}
                  filteredEmails={filteredEmails}
                  selectedEmails={selectedEmails}
                  onSelectEmail={handleSelectEmail}
                  onViewEmail={handleViewEmail}
                  areAllSelected={areAllSelected}
                  onSelectAll={handleSelectAll}
                  onReply={handleReply}
                  onToggleStar={handleToggleStar}
                  onArchive={handleArchive}
                  onDelete={handleDelete}
                />
              </ScrollArea>
            </div>
          ) : (
            /* Email Detail View - 75% */
            <div className="w-3/4 flex flex-col">
              <ScrollArea className="flex-1">
                <EmailDetailView
                  email={selectedEmailForView}
                  onBack={() => setSelectedEmailForView(null)}
                  onReply={handleReply}
                  onToggleStar={handleToggleStar}
                  onArchive={handleArchive}
                  onDelete={handleDelete}
                />
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Mobile: Single column layout */}
        <div className="flex md:hidden w-full">
          {!selectedEmailForView ? (
            <div className="w-full flex flex-col">
              <div className="border-b p-2">
                <EmailToolbar
                  searchTerm={searchTerm}
                  onSearchTermChange={setSearchTerm}
                  selectedAccountId={selectedAccountId}
                  onSelectedAccountIdChange={setSelectedAccountId}
                  hasEmailAccounts={hasEmailAccounts}
                  emailAccounts={emailAccounts}
                  onRefresh={handleRefresh}
                  selectedEmailsCount={selectedEmails.length}
                  onMarkAsRead={() => handleBulkAction('markAsRead')}
                  onMarkAsUnread={() => handleBulkAction('markAsUnread')}
                  onStar={() => {}}
                  onUnstar={() => {}}
                  onDelete={() => handleBulkAction('delete')}
                  onArchive={() => handleBulkAction('archive')}
                />
              </div>
              <ScrollArea className="flex-1">
                <EmailList
                  folder={currentFolder}
                  filteredEmails={filteredEmails}
                  selectedEmails={selectedEmails}
                  onSelectEmail={handleSelectEmail}
                  onViewEmail={handleViewEmail}
                  areAllSelected={areAllSelected}
                  onSelectAll={handleSelectAll}
                  onReply={handleReply}
                  onToggleStar={handleToggleStar}
                  onArchive={handleArchive}
                  onDelete={handleDelete}
                />
              </ScrollArea>
            </div>
          ) : (
            <div className="w-full flex flex-col">
              <EmailDetailView
                email={selectedEmailForView}
                onBack={() => setSelectedEmailForView(null)}
                onReply={handleReply}
                onToggleStar={handleToggleStar}
                onArchive={handleArchive}
                onDelete={handleDelete}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}