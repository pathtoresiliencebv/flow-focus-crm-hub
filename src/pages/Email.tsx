import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  RefreshCw, 
  Settings, 
  Search,
  Inbox,
  Send,
  Archive,
  Trash2,
  Star,
  Mail,
  ChevronLeft,
  Loader2,
  MailOpen,
  Users,
  Calendar,
  MoreVertical,
  MessageSquare,
  UserPlus,
  MailPlus
} from 'lucide-react';
import { useNylasAuth, NylasAccount } from '@/hooks/useNylasAuth';
import { useNylasMessages, NylasMessage } from '@/hooks/useNylasMessages';
import { useNylasContacts } from '@/hooks/useNylasContacts';
import { NylasAccountSetup } from '@/components/email/NylasAccountSetup';
import { NylasMessageList } from '@/components/email/NylasMessageList';
import { NylasMessageDetail } from '@/components/email/NylasMessageDetail';
import { NylasMessageComposer } from '@/components/email/NylasMessageComposer';
import { NylasContactManager } from '@/components/email/NylasContactManager';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export default function Email() {
  // Use real Nylas hooks
  const { 
    accounts, 
    accountsLoading, 
    authError, 
    getPrimaryAccount, 
    hasAccounts,
    initiateNylasOAuth,
    disconnectAccount,
    fetchAccounts
  } = useNylasAuth();

  const { 
    messages, 
    messagesLoading, 
    syncMessages, 
    sendMessage,
    markAsRead,
    deleteMessage
  } = useNylasMessages();

  const { 
    contacts, 
    contactsLoading, 
    fetchContacts, 
    createContact,
    updateContact,
    deleteContact
  } = useNylasContacts();
  
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [selectedFolder, setSelectedFolder] = useState('inbox');
  const [selectedMessage, setSelectedMessage] = useState<NylasMessage | null>(null);
  const [showAccountSetup, setShowAccountSetup] = useState(false);
  const [folderCounts, setFolderCounts] = useState<Record<string, { total: number; unread: number }>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<'messages' | 'compose' | 'contacts'>('messages');
  const [showComposer, setShowComposer] = useState(false);
  const [replyTo, setReplyTo] = useState<any>(null);

  const primaryAccount = getPrimaryAccount();

  // Load folder counts when account changes
  useEffect(() => {
    if (primaryAccount) {
      // TODO: Implement folder counts
      setFolderCounts({});
    }
  }, [primaryAccount]);

  // Load contacts when account changes
  useEffect(() => {
    if (primaryAccount) {
      // TODO: Implement contact fetching
      console.log('Loading contacts for account:', primaryAccount.id);
    }
  }, [primaryAccount]);

  const handleSync = async () => {
    if (!primaryAccount) return;
    
    try {
      await syncMessages(primaryAccount.id, { fullSync: false, maxMessages: 100 });
      toast({
        title: "Synchronisatie voltooid",
        description: "Emails zijn bijgewerkt",
      });
    } catch (error: any) {
      toast({
        title: "Synchronisatie mislukt",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleMessageSelect = (message: NylasMessage) => {
    setSelectedMessage(message);
  };

  const handleCompose = () => {
    setActiveView('compose');
    setShowComposer(true);
    setReplyTo(null);
  };

  const handleReply = (message: any) => {
    setActiveView('compose');
    setShowComposer(true);
    setReplyTo({
      messageId: message.id,
      subject: message.subject,
      from: message.from_email
    });
  };

  const handleReplyAll = (message: any) => {
    setActiveView('compose');
    setShowComposer(true);
    setReplyTo({
      messageId: message.id,
      subject: message.subject,
      from: message.from_email,
      cc: message.cc_emails
    });
  };

  const handleForward = (message: any) => {
    setActiveView('compose');
    setShowComposer(true);
    setReplyTo({
      messageId: message.id,
      subject: `Fwd: ${message.subject}`,
      forward: true
    });
  };

  const handleComposerClose = () => {
    setShowComposer(false);
    setReplyTo(null);
    setActiveView('messages');
  };

  const handleComposerSend = () => {
    setShowComposer(false);
    setReplyTo(null);
    setActiveView('messages');
      toast({
      title: "Email verzonden! ✅",
      description: "Je bericht is succesvol verzonden",
    });
  };

  const folders = [
    { 
      id: 'inbox', 
      label: 'Postvak IN', 
      icon: Inbox, 
      count: folderCounts.inbox?.total || 0,
      unread: folderCounts.inbox?.unread || 0
    },
    { 
      id: 'sent', 
      label: 'Verzonden', 
      icon: Send, 
      count: folderCounts.sent?.total || 0,
      unread: 0
    },
    { 
      id: 'drafts', 
      label: 'Concepten', 
      icon: Mail, 
      count: folderCounts.drafts?.total || 0,
      unread: 0
    },
    { 
      id: 'starred', 
      label: 'Met ster', 
      icon: Star, 
      count: 0, // TODO: Calculate starred count
      unread: 0
    },
    { 
      id: 'archive', 
      label: 'Archief', 
      icon: Archive, 
      count: folderCounts.archive?.total || 0,
      unread: 0
    },
    { 
      id: 'trash', 
      label: 'Prullenbak', 
      icon: Trash2, 
      count: folderCounts.trash?.total || 0,
      unread: 0
    },
  ];

  // Show account setup if no accounts
  if (!accountsLoading && !hasAccounts()) {
    return (
      <NylasAccountSetup 
            onSuccess={() => {
              setShowAccountSetup(false);
              toast({
            title: "Account verbonden! ✅",
            description: "Je email account is succesvol gekoppeld",
              });
            }}
          />
    );
  }

  if (accountsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
          <p className="text-gray-500">Email accounts laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top Toolbar */}
      <div className="border-b bg-white px-4 py-2 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-gray-800">Email</h1>
          {primaryAccount && (
            <span className="text-sm text-gray-500 hidden md:inline">
              ({primaryAccount.email_address})
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center gap-1 mr-4">
            <Button
              variant={activeView === 'messages' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveView('messages')}
              disabled={!primaryAccount}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Berichten
            </Button>
            <Button
              variant={activeView === 'contacts' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveView('contacts')}
              disabled={!primaryAccount}
            >
              <Users className="h-4 w-4 mr-1" />
              Contacten
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={messagesLoading || !primaryAccount}
          >
            <RefreshCw className={cn("h-4 w-4", messagesLoading && "animate-spin")} />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAccountSetup(true)}
          >
            <Settings className="h-4 w-4" />
          </Button>
          
          <Button 
            size="sm" 
            className="bg-red-600 hover:bg-red-700"
            onClick={handleCompose}
            disabled={!primaryAccount}
          >
            <MailPlus className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Nieuw bericht</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Folders (only for messages view) */}
        {(!isMobile || !selectedMessage) && activeView === 'messages' && (
          <div className={cn(
            "border-r bg-white",
            isMobile ? "w-full" : "w-56"
          )}>
            <div className="p-3">
              {/* Standard folders */}
              {folders.map((folder) => {
                const Icon = folder.icon;
                const isSelected = selectedFolder === folder.id;
                
                return (
                  <button
                    key={folder.id}
                    onClick={() => {
                      setSelectedFolder(folder.id);
                      setSelectedMessage(null);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded text-sm transition-colors mb-1",
                      isSelected
                        ? "bg-red-50 text-red-700 font-medium"
                        : "hover:bg-gray-100 text-gray-700"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span>{folder.label}</span>
                      {folder.unread > 0 && (
                        <div className="h-2 w-2 rounded-full bg-blue-600 flex-shrink-0" />
                      )}
                    </div>
                    {folder.count > 0 && (
                      <span className={cn(
                        "text-xs px-1.5 py-0.5 rounded",
                        isSelected
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-200 text-gray-600"
                      )}>
                        {folder.count}
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Connected Accounts */}
              <div className="mt-6 pt-4 border-t">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Accounts
                </h3>
                {accounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600"
                  >
                    <div className={cn(
                      "h-2 w-2 rounded-full",
                      account.sync_state === 'synced' ? "bg-green-500" :
                      account.sync_state === 'syncing' ? "bg-blue-500" :
                      account.sync_state === 'error' ? "bg-red-500" :
                      "bg-gray-400"
                    )} />
                    <span className="truncate">{account.email_address}</span>
                  </div>
                ))}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAccountSetup(true)}
                  className="w-full mt-2 text-gray-500 hover:text-gray-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Account
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Message List */}
        {(!isMobile || (isMobile && !selectedMessage)) && primaryAccount && activeView === 'messages' && (
          <div className={cn(
            "border-r bg-white flex flex-col",
            isMobile ? "flex-1" : "w-96"
          )}>
            <NylasMessageList
              onMessageSelect={handleMessageSelect}
              selectedMessageId={selectedMessage?.id}
              className="h-full"
                />
              </div>
        )}

        {/* Contact Manager */}
        {(!isMobile || (isMobile && !selectedMessage)) && primaryAccount && activeView === 'contacts' && (
          <div className={cn(
            "border-r bg-white flex flex-col",
            isMobile ? "flex-1" : "w-96"
          )}>
            <NylasContactManager className="h-full" />
          </div>
        )}

        {/* Message Detail View / Composer */}
        <div className={cn(
          "flex-1 bg-white flex flex-col",
          isMobile && !selectedMessage && !showComposer && "hidden"
        )}>
          {showComposer ? (
            <NylasMessageComposer
              replyTo={replyTo}
              onSend={handleComposerSend}
              onCancel={handleComposerClose}
              className="h-full"
            />
          ) : selectedMessage ? (
            <NylasMessageDetail
              messageId={selectedMessage.id}
              onReply={handleReply}
              onReplyAll={handleReplyAll}
              onForward={handleForward}
              onClose={() => setSelectedMessage(null)}
              className="h-full"
            />
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Mail className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p>Selecteer een email om te lezen</p>
                </div>
              </div>
          )}
        </div>
      </div>

      {/* Account Setup Modal */}
      {showAccountSetup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <NylasAccountSetup 
              onSuccess={() => {
                setShowAccountSetup(false);
                toast({
                  title: "Account verbonden! ✅",
                  description: "Je email account is succesvol gekoppeld",
                });
              }}
              onCancel={() => setShowAccountSetup(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}