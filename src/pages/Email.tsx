import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Paperclip,
  MoreVertical,
  Loader2
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useEmailAccounts } from '@/hooks/useEmailAccounts';
import { useCachedEmails } from '@/hooks/useCachedEmails';
import { SMTPIMAPSetup } from '@/components/email/SMTPIMAPSetup';
import { EmailComposer } from '@/components/email/EmailComposer';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';

export default function Email() {
  const { accounts, loading: accountsLoading } = useEmailAccounts();
  const [showAccountSetup, setShowAccountSetup] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<{ to: string; subject: string; messageId?: string } | undefined>();
  const [selectedFolder, setSelectedFolder] = useState('inbox');
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Filter out old accounts without SMTP/IMAP configuration
  const validAccounts = accounts.filter(acc => acc.smtp_host && acc.imap_host);
  const primaryAccount = validAccounts.find(acc => acc.is_primary) || validAccounts[0];
  
  // ✅ USE CACHED EMAILS from database (synced from IMAP)
  const { messages, loading: messagesLoading, fetchEmails, syncEmails, getFolders } = useCachedEmails();

  // Auto-fetch emails when account or folder changes
  useEffect(() => {
    if (primaryAccount?.id) {
      // Auto-load emails for current folder
      if (selectedFolder === 'inbox') {
        // For inbox: fetch cached first, then optionally sync
        fetchEmails(primaryAccount.id, selectedFolder).catch(err => {
          console.error('Failed to fetch cached emails:', err);
        });
      } else {
        // For other folders: always fetch from database
        fetchEmails(primaryAccount.id, selectedFolder).catch(err => {
          console.error('Failed to fetch folder emails:', err);
        });
      }
    }
  }, [primaryAccount?.id, selectedFolder, fetchEmails]);

  const handleSync = async (loadMore: boolean = false) => {
    if (!primaryAccount) return;
    
    try {
      console.log('🔄 Starting email sync:', { accountId: primaryAccount.id, loadMore });
      
      // Sync emails LIVE from IMAP
      const result = await syncEmails(primaryAccount.id, { 
        maxMessages: 200,
        loadMore 
      });
      
      console.log('✅ Sync completed:', result);
      
      const messageCount = result.messageCount || result.messages?.length || 0;
      
      toast({
        title: "Synchronisatie voltooid",
        description: `${messageCount} berichten opgehaald`,
      });
    } catch (error: any) {
      console.error('❌ Sync failed:', error);
      
      // Show user-friendly error message
      let errorMessage = "Er is een fout opgetreden tijdens synchronisatie.";
      
      if (error.message?.includes('EMAIL_ENCRYPTION_KEY')) {
        errorMessage = "Email encryptie sleutel niet ingesteld. Configureer EMAIL_ENCRYPTION_KEY in Supabase.";
      } else if (error.message?.includes('authentication')) {
        errorMessage = "Email authenticatie gefaald. Controleer je wachtwoord.";
      } else if (error.message?.includes('connection')) {
        errorMessage = "Kan geen verbinding maken met email server.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Synchronisatie mislukt",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Show SMTP/IMAP setup if no valid accounts or user clicked "Add Account"
  if ((!accountsLoading && validAccounts.length === 0) || showAccountSetup) {
    return (
      <div className="h-full overflow-auto bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="w-full max-w-4xl mx-auto">
          <SMTPIMAPSetup 
            accountId={primaryAccount?.id} // ✅ LOAD EXISTING ACCOUNT!
            onSuccess={() => {
              setShowAccountSetup(false);
              toast({
                title: "Account toegevoegd",
                description: "Je email account is succesvol gekoppeld!",
              });
            }}
            onCancel={validAccounts.length > 0 ? () => setShowAccountSetup(false) : undefined}
          />
        </div>
      </div>
    );
  }

  if (accountsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Email accounts laden...</p>
        </div>
      </div>
    );
  }

  // Load custom folders
  useEffect(() => {
    if (primaryAccount?.id) {
      loadCustomFolders();
    }
  }, [primaryAccount?.id]);

  const loadCustomFolders = async () => {
    try {
      const { data, error } = await supabase
        .from('email_labels')
        .select('*')
        .eq('account_id', primaryAccount?.id)
        .eq('label_type', 'custom')
        .order('name');
      
      if (error) throw error;
      
      setCustomFolders(data?.map(f => ({
        id: f.id,
        name: f.name,
        count: f.message_count || 0,
      })) || []);
    } catch (err) {
      console.error('Failed to load custom folders:', err);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !primaryAccount?.id) return;
    
    setCreatingFolder(true);
    try {
      const { error } = await supabase
        .from('email_labels')
        .insert({
          account_id: primaryAccount.id,
          name: newFolderName.trim(),
          label_type: 'custom',
          color: '#6366f1',
          message_count: 0,
        });
      
      if (error) throw error;
      
      toast({
        title: "Map aangemaakt",
        description: `Map "${newFolderName}" is toegevoegd`,
      });
      
      setNewFolderName('');
      setShowNewFolderDialog(false);
      loadCustomFolders();
    } catch (err: any) {
      toast({
        title: "Fout bij aanmaken map",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setCreatingFolder(false);
    }
  };

  const folders = [
    { id: 'inbox', label: 'Postvak IN', icon: Inbox, count: messages?.length || 0 },
    { id: 'sent', label: 'Verzonden', icon: Send, count: 0 },
    { id: 'drafts', label: 'Concepten', icon: Mail, count: 0 },
    { id: 'starred', label: 'Met ster', icon: Star, count: messages?.filter(m => m.is_starred).length || 0 },
    { id: 'archive', label: 'Archief', icon: Archive, count: 0 },
    { id: 'trash', label: 'Prullenbak', icon: Trash2, count: 0 },
  ];

  // Roundcube-style Email Interface
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
            onClick={() => {
              setReplyTo(undefined); // Reset reply when composing new email
              setComposerOpen(true);
            }}
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
        {(!isMobile || !selectedThread) && (
          <div className={cn(
            "border-r bg-white",
            isMobile ? "w-full" : "w-56"
          )}>
            <div className="p-3">
              {/* Standard folders */}
              {folders.map((folder) => {
                const Icon = folder.icon;
                return (
                  <button
                    key={folder.id}
                    onClick={() => {
                      setSelectedFolder(folder.id);
                      setSelectedThread(null);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded text-sm transition-colors mb-1",
                      selectedFolder === folder.id
                        ? "bg-red-50 text-red-700 font-medium"
                        : "hover:bg-gray-100 text-gray-700"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span>{folder.label}</span>
                    </div>
                    {folder.count > 0 && (
                      <span className={cn(
                        "text-xs px-1.5 py-0.5 rounded",
                        selectedFolder === folder.id
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-200 text-gray-600"
                      )}>
                        {folder.count}
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Custom folders */}
              {customFolders.length > 0 && (
                <>
                  <div className="border-t my-2"></div>
                  <div className="text-xs font-semibold text-gray-500 px-3 py-1 mb-1">
                    MIJN MAPPEN
                  </div>
                  {customFolders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => {
                        setSelectedFolder(folder.id);
                        setSelectedThread(null);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded text-sm transition-colors mb-1",
                        selectedFolder === folder.id
                          ? "bg-red-50 text-red-700 font-medium"
                          : "hover:bg-gray-100 text-gray-700"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span>{folder.name}</span>
                      </div>
                      {folder.count > 0 && (
                        <span className={cn(
                          "text-xs px-1.5 py-0.5 rounded",
                          selectedFolder === folder.id
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-200 text-gray-600"
                        )}>
                          {folder.count}
                        </span>
                      )}
                    </button>
                  ))}
                </>
              )}

              {/* New Folder Button */}
              <div className="border-t mt-2 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-gray-600 hover:text-gray-900"
                  onClick={() => setShowNewFolderDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nieuwe map
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Email List */}
        {(!isMobile || (isMobile && !selectedThread)) && (
          <div className={cn(
            "border-r bg-white flex flex-col",
            isMobile ? "flex-1" : "w-96"
          )}>
            {/* Search */}
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Zoek in emails..."
                  className="pl-9 h-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Email Messages (LIVE from IMAP) */}
            <div className="flex-1 overflow-y-auto">
              {messagesLoading ? (
                // Loading skeletons (placeholders)
                <div className="space-y-0">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="p-3 border-b animate-pulse">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-gray-200"></div>
                            <div className="h-4 w-32 bg-gray-200 rounded"></div>
                          </div>
                          <div className="h-4 w-48 bg-gray-200 rounded"></div>
                          <div className="h-3 w-64 bg-gray-100 rounded"></div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div className="h-3 w-12 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : messages && messages.length > 0 ? (
                <>
                {messages.map((message) => {
                  // Strip HTML from preview text
                  const stripHtml = (html: string) => {
                    return html?.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim() || '';
                  };
                  
                  const previewText = stripHtml(message.body_text || message.body_html || '');
                  const hasAttachments = message.attachments && message.attachments.length > 0;
                  
                  return (
                  <div
                    key={message.id}
                    onClick={() => setSelectedThread(message.id)}
                    className={cn(
                      "p-3 border-b cursor-pointer transition-colors hover:bg-gray-50",
                      selectedThread === message.id ? "bg-blue-50" : "",
                      message.status === 'unread' ? "bg-blue-50/30" : ""
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {message.status === 'unread' && (
                            <div className="h-2 w-2 rounded-full bg-blue-600 flex-shrink-0"></div>
                          )}
                          <span className={cn(
                            "font-medium text-sm truncate",
                            message.status === 'unread' ? "text-gray-900" : "text-gray-700"
                          )}>
                            {message.from_email || 'Onbekend'}
                          </span>
                          {hasAttachments && (
                            <Paperclip className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                          )}
                        </div>
                        <h3 className={cn(
                          "text-sm truncate mt-1",
                          message.status === 'unread' ? "font-semibold text-gray-900" : "text-gray-700"
                        )}>
                          {message.subject || '(Geen onderwerp)'}
                        </h3>
                        <p className="text-xs text-gray-500 truncate mt-1">
                          {previewText.substring(0, 100) || 'Geen preview beschikbaar'}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="text-xs text-gray-500">
                          {new Date(message.received_at).toLocaleDateString('nl-NL', {
                            day: 'numeric',
                            month: 'short'
                          })}
                        </span>
                        {message.is_starred && (
                          <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                        )}
                      </div>
                    </div>
                  </div>
                  );
                })}
                
                {/* Load More Button */}
                {messages.length > 0 && messages.length % 200 === 0 && (
                  <div className="p-4 border-t bg-gray-50">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleSync(true)}
                      disabled={messagesLoading}
                    >
                      <RefreshCw className={cn("h-4 w-4 mr-2", messagesLoading && "animate-spin")} />
                      Laad oudere emails (200 meer)
                    </Button>
                  </div>
                )}
                </>
              ) : (
                <div className="p-8 text-center">
                  <Mail className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Geen emails in deze map</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Klik op Synchroniseren om emails op te halen
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Email Detail View */}
        <div className={cn(
          "flex-1 bg-white flex flex-col",
          isMobile && !selectedThread && "hidden"
        )}>
          {(() => {
            // ✅ FIND SELECTED CACHED EMAIL
            const selectedMessage = messages.find(m => m.id === selectedThread);
            
            return selectedMessage ? (
              <>
                <div className="border-b p-4 flex items-center justify-between">
                  {isMobile && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedThread(null)}
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
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className={selectedMessage.is_starred ? "text-yellow-500" : ""}
                    >
                      <Star className={cn("h-4 w-4", selectedMessage.is_starred && "fill-yellow-500")} />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Archive className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
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
                            Aan: {selectedMessage.to_email?.join(', ') || primaryAccount?.email_address}
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
                      {selectedMessage.body_html ? (
                        // Render HTML emails properly
                        <div 
                          className="text-gray-700"
                          dangerouslySetInnerHTML={{ __html: selectedMessage.body_html }}
                          style={{ wordBreak: 'break-word' }}
                        />
                      ) : (
                        // Plain text emails
                        <div 
                          className="text-gray-700 whitespace-pre-wrap break-words"
                          style={{ wordBreak: 'break-word' }}
                        >
                          {selectedMessage.body_text || '(Geen inhoud)'}
                        </div>
                      )}
                    </div>

                    {/* Attachments Section */}
                    {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                      <div className="mt-6 border-t pt-4">
                        <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                          <Paperclip className="h-4 w-4" />
                          Bijlagen ({selectedMessage.attachments.length})
                        </h3>
                        <div className="space-y-2">
                          {selectedMessage.attachments.map((attachment: any, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                              onClick={() => {
                                if (attachment.url) {
                                  window.open(attachment.url, '_blank');
                                }
                              }}
                            >
                              <Paperclip className="h-5 w-5 text-gray-400 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {attachment.filename || attachment.name || `Bijlage ${idx + 1}`}
                                </p>
                                {attachment.size && (
                                  <p className="text-xs text-gray-500">
                                    {(attachment.size / 1024).toFixed(1)} KB
                                  </p>
                                )}
                              </div>
                              <Button variant="ghost" size="sm">
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
                <div className="border-t p-4 flex gap-2">
                  <Button 
                    className="bg-red-600 hover:bg-red-700"
                    onClick={() => {
                      setReplyTo({
                        to: selectedMessage.from_email,
                        subject: selectedMessage.subject?.startsWith('Re:') 
                          ? selectedMessage.subject 
                          : `Re: ${selectedMessage.subject}`,
                        messageId: selectedMessage.external_message_id,
                      });
                      setComposerOpen(true);
                    }}
                  >
                    Beantwoorden
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      const allRecipients = [
                        selectedMessage.from_email,
                        ...(selectedMessage.to_email || [])
                      ].filter(email => email !== primaryAccount?.email_address).join(', ');
                      
                      setReplyTo({
                        to: allRecipients,
                        subject: selectedMessage.subject?.startsWith('Re:') 
                          ? selectedMessage.subject 
                          : `Re: ${selectedMessage.subject}`,
                        messageId: selectedMessage.external_message_id,
                      });
                      setComposerOpen(true);
                    }}
                  >
                    Allen beantwoorden
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      toast({
                        title: "Forward functie",
                        description: "Forward functionaliteit wordt nog geïmplementeerd",
                      });
                    }}
                  >
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
            );
          })()}
        </div>
      </div>

      {/* Email Composer Modal */}
      {composerOpen && primaryAccount && (
        <EmailComposer
          account={primaryAccount}
          open={composerOpen}
          onOpenChange={(open) => {
            setComposerOpen(open);
            if (!open) {
              setReplyTo(undefined); // Reset reply data when closing
            }
          }}
          replyTo={replyTo}
        />
      )}

      {/* New Folder Dialog */}
      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nieuwe map aanmaken</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="folderName">Map naam</Label>
            <Input
              id="folderName"
              placeholder="Bijv. Projecten, Klanten, Belangrijk..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !creatingFolder) {
                  handleCreateFolder();
                }
              }}
              className="mt-2"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowNewFolderDialog(false);
                setNewFolderName('');
              }}
              disabled={creatingFolder}
            >
              Annuleren
            </Button>
            <Button
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim() || creatingFolder}
            >
              {creatingFolder ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Aanmaken...
                </>
              ) : (
                'Map aanmaken'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
