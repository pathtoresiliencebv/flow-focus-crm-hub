
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { EmailCompose } from './EmailCompose';
import { toast } from '@/hooks/use-toast';
import { EmailSidebar } from './EmailSidebar';
import { EmailToolbar } from './EmailToolbar';
import { EmailList } from './EmailList';

interface Email {
  id: string;
  subject: string;
  from_name: string;
  from_address: string;
  to_addresses: string[];
  received_at: string;
  is_read: boolean;
  is_starred: boolean;
  body_text: string;
  folder: string;
}

interface EmailAccount {
  id: string;
  display_name: string;
}

export function Email() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeFolder, setActiveFolder] = useState('inbox');
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isComposeOpen, setComposeOpen] = useState(false);
  const [replyToEmail, setReplyToEmail] = useState<Email | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | 'all'>('all');

  // Fetch emails
  const { data: emails = [], isLoading: isLoadingEmails, refetch } = useQuery<Email[]>({
    queryKey: ['emails', user?.id, activeFolder, selectedAccountId],
    queryFn: async () => {
      if (!user?.id) return [];
      let query = supabase
        .from('emails')
        .select('*')
        .eq('user_id', user.id)
        .eq('folder', activeFolder);

      if (selectedAccountId !== 'all') {
        query = query.eq('email_settings_id', selectedAccountId);
      }
      
      const { data, error } = await query.order('received_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  // Fetch accounts to check if any exist
  const { data: emailAccounts = [] } = useQuery<EmailAccount[]>({
    queryKey: ['email-accounts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('user_email_settings')
        .select('id, display_name')
        .eq('user_id', user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  const emailMutation = useMutation({
    mutationFn: async ({ action, ids }: { action: 'archive' | 'delete' | 'read' | 'unread' | 'star' | 'unstar', ids: string[] }) => {
      if (action === 'delete') {
        const { error } = await supabase.from('emails').delete().in('id', ids);
        if (error) throw error;
        return;
      }

      let updatePayload: any = {};
      if (action === 'archive') updatePayload.folder = 'archive';
      if (action === 'read') updatePayload.is_read = true;
      if (action === 'unread') updatePayload.is_read = false;
      if (action === 'star') updatePayload.is_starred = true;
      if (action === 'unstar') updatePayload.is_starred = false;
      
      const { error } = await supabase.from('emails').update(updatePayload).in('id', ids).eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      setSelectedEmails([]);
    },
    onError: (error: any) => {
      toast({ title: 'Fout', description: error.message, variant: 'destructive' });
    }
  });

  const handleSelectEmail = (id: string) => {
    setSelectedEmails(prev => {
      if (prev.includes(id)) {
        return prev.filter(emailId => emailId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const filteredEmails = useMemo(() => {
    return emails.filter(email =>
      email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (email.body_text && email.body_text.toLowerCase().includes(searchTerm.toLowerCase())) ||
      email.from_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [emails, searchTerm]);

  const areAllSelected = filteredEmails.length > 0 && selectedEmails.length === filteredEmails.length;
  const handleSelectAllEmails = () => {
    if (areAllSelected) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails(filteredEmails.map(email => email.id));
    }
  };

  const handleMoveToTrash = async () => {
    await emailMutation.mutateAsync({ action: 'delete', ids: selectedEmails });
  };

  const handleArchive = async () => {
    await emailMutation.mutateAsync({ action: 'archive', ids: selectedEmails });
  };

  const handleMarkAsRead = async () => {
    await emailMutation.mutateAsync({ action: 'read', ids: selectedEmails });
  };

  const handleMarkAsUnread = async () => {
    await emailMutation.mutateAsync({ action: 'unread', ids: selectedEmails });
  };

  const handleStar = async () => {
    await emailMutation.mutateAsync({ action: 'star', ids: selectedEmails });
  };

  const handleUnstar = async () => {
    await emailMutation.mutateAsync({ action: 'unstar', ids: selectedEmails });
  };
  
  const handleSingleDelete = (id: string) => emailMutation.mutate({ action: 'delete', ids: [id] });
  const handleSingleArchive = (id: string) => emailMutation.mutate({ action: 'archive', ids: [id] });
  const handleToggleStar = (id: string, isStarred: boolean) => {
    emailMutation.mutate({ action: isStarred ? 'unstar' : 'star', ids: [id] });
  };
  const handleReply = (email: Email) => {
    setReplyToEmail(email);
    setComposeOpen(true);
  };

  const hasEmailAccounts = emailAccounts.length > 0;

  return (
    <div className="h-full flex flex-col">
      <EmailCompose
        open={isComposeOpen}
        onOpenChange={(isOpen) => {
          setComposeOpen(isOpen);
          if (!isOpen) {
            setReplyToEmail(null);
          }
        }}
        replyTo={replyToEmail}
      />

      <div className="border-b">
        <div className="container flex items-center h-14">
          <h1 className="text-2xl font-semibold">E-mail</h1>
        </div>
      </div>

      <div className="container h-full flex flex-col md:flex-row flex-1 min-h-0">
        <EmailSidebar
          activeFolder={activeFolder}
          setActiveFolder={setActiveFolder}
          onComposeClick={() => setComposeOpen(true)}
          hasEmailAccounts={hasEmailAccounts}
        />

        <div className="flex-1 p-4 flex flex-col">
          <EmailToolbar
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            selectedAccountId={selectedAccountId}
            onSelectedAccountIdChange={setSelectedAccountId}
            hasEmailAccounts={hasEmailAccounts}
            emailAccounts={emailAccounts}
            onRefresh={refetch}
            selectedEmailsCount={selectedEmails.length}
            onMarkAsRead={handleMarkAsRead}
            onMarkAsUnread={handleMarkAsUnread}
            onStar={handleStar}
            onUnstar={handleUnstar}
            onDelete={handleMoveToTrash}
            onArchive={handleArchive}
          />

          {isLoadingEmails ? (
            <div className="text-center flex-1 flex items-center justify-center">E-mails laden...</div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <EmailList
                emails={filteredEmails}
                selectedEmails={selectedEmails}
                onSelectEmail={handleSelectEmail}
                areAllSelected={areAllSelected}
                onSelectAll={handleSelectAllEmails}
                onReply={handleReply}
                onToggleStar={handleToggleStar}
                onArchive={handleSingleArchive}
                onDelete={handleSingleDelete}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
