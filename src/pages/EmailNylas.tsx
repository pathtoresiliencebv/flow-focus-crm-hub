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
  MoreVertical
} from 'lucide-react';
import { useNylasAuth, NylasAccount } from '@/hooks/useNylasAuth';
import { useNylasMessages, NylasMessage } from '@/hooks/useNylasMessages';
import { useNylasContacts } from '@/hooks/useNylasContacts';
import { NylasAccountSetup } from '@/components/email/NylasAccountSetup';
import { NylasMessageList } from '@/components/email/NylasMessageList';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export default function EmailNylas() {
  const { 
    accounts, 
    loading: accountsLoading, 
    error: authError, 
    getPrimaryAccount,
    hasAccounts 
  } = useNylasAuth();
  
  const { 
    messages, 
    loading: messagesLoading, 
    syncMessages, 
    getFolderCounts 
  } = useNylasMessages();
  
  const { contacts, fetchContacts } = useNylasContacts();
  
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [selectedFolder, setSelectedFolder] = useState('inbox');
  const [selectedMessage, setSelectedMessage] = useState<NylasMessage | null>(null);
  const [showAccountSetup, setShowAccountSetup] = useState(false);
  const [folderCounts, setFolderCounts] = useState<Record<string, { total: number; unread: number }>>({});
  const [searchQuery, setSearchQuery] = useState('');

  const primaryAccount = getPrimaryAccount();

  // Load folder counts when account changes
  useEffect(() => {
    if (primaryAccount) {
      getFolderCounts(primaryAccount.id).then(setFolderCounts);
    }
  }, [primaryAccount, getFolderCounts]);

  // Load contacts when account changes
  useEffect(() => {
    if (primaryAccount) {
      fetchContacts(primaryAccount.id);
    }
  }, [primaryAccount, fetchContacts]);

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
    // TODO: Open composer
    toast({
      title: "Composer",
      description: "Email composer wordt nog geïmplementeerd",
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
      <div className="h-full overflow-auto bg-gradient-to-br from-gray-50 to-gray-100">
        <NylasAccountSetup 
          onSuccess={() => {
            setShowAccountSetup(false);
            toast({
              title: "Account verbonden! ✅",
              description: "Je email account is succesvol gekoppeld",
            });
          }}
        />
      </div>
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
            <Plus className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Nieuw bericht</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Folders */}
        {(!isMobile || !selectedMessage) && (
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
        {(!isMobile || (isMobile && !selectedMessage)) && primaryAccount && (
          <div className={cn(
            "border-r bg-white flex flex-col",
            isMobile ? "flex-1" : "w-96"
          )}>
            <NylasMessageList
              accountId={primaryAccount.id}
              folder={selectedFolder}
              onMessageSelect={handleMessageSelect}
              selectedMessageId={selectedMessage?.id}
            />
          </div>
        )}

        {/* Message Detail View */}
        <div className={cn(
          "flex-1 bg-white flex flex-col",
          isMobile && !selectedMessage && "hidden"
        )}>
          {selectedMessage ? (
            <>
              <div className="border-b p-4 flex items-center justify-between">
                {isMobile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedMessage(null)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                )}
                <div className="flex-1">
                  <h2 className="font-semibold text-lg truncate">
                    {selectedMessage.subject || '(Geen onderwerp)'}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Star className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Archive className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-3xl mx-auto">
                  {/* Email Header */}
                  <div className="mb-6 pb-6 border-b">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                        {selectedMessage.from_email?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900">
                          {selectedMessage.from_email || 'Onbekend'}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          Aan: {selectedMessage.to_emails?.map(t => t.email).join(', ') || primaryAccount?.email_address}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(selectedMessage.received_at).toLocaleString('nl-NL', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Email Body */}
                  <div className="prose prose-sm max-w-none">
                    <div 
                      className="text-gray-700 whitespace-pre-wrap break-words"
                      style={{ wordBreak: 'break-word' }}
                    >
                      {selectedMessage.body_text || selectedMessage.body_html || '(Geen inhoud)'}
                    </div>
                  </div>

                  {/* Attachments */}
                  {selectedMessage.has_attachments && selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                    <div className="mt-6 border-t pt-4">
                      <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <MailOpen className="h-4 w-4" />
                        Bijlagen ({selectedMessage.attachments.length})
                      </h3>
                      <div className="space-y-2">
                        {selectedMessage.attachments.map((attachment, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <MailOpen className="h-5 w-5 text-gray-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {attachment.filename || `Bijlage ${idx + 1}`}
                              </p>
                              <p className="text-xs text-gray-500">
                                {attachment.content_type} • {(attachment.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                            <Button variant="outline" size="sm">
                              Download
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t p-4 flex gap-2 flex-wrap">
                <Button className="bg-red-600 hover:bg-red-700">
                  Beantwoorden
                </Button>
                <Button variant="outline">
                  Allen beantwoorden
                </Button>
                <Button variant="outline">
                  Doorsturen
                </Button>
              </div>
            </>
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
              onSuccess={() => setShowAccountSetup(false)}
              onCancel={() => setShowAccountSetup(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}



