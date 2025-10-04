import React, { useState, useEffect, useCallback } from 'react';
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
  Loader2,
  Receipt,
  Reply,
  Forward,
  StarOff
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { cn } from '@/lib/utils';
import { useEmailAccounts } from '@/hooks/useEmailAccounts';
import { useCachedEmails } from '@/hooks/useCachedEmails';
import { SMTPIMAPSetup } from '@/components/email/SMTPIMAPSetup';
import { EmailComposer } from '@/components/email/EmailComposer';
import { EmailDebug } from '@/components/email/EmailDebug';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';

export default function Email() {
  const { accounts, loading: accountsLoading } = useEmailAccounts();
  const [showAccountSetup, setShowAccountSetup] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [replyTo, setReplyTo] = useState<{ to: string; subject: string; messageId?: string } | undefined>();
  const [selectedFolder, setSelectedFolder] = useState('inbox');
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Email actions - work on database
  const handleStarToggle = async (messageId: string, currentlyStarred: boolean) => {
    try {
      const { error } = await supabase
        .from('email_messages')
        .update({ is_starred: !currentlyStarred })
        .eq('id', messageId);
      
      if (error) throw error;
      
      // Reload emails to show updated state
      if (primaryAccount?.id) {
        if (selectedFolder === 'inbox') {
          await syncEmails(primaryAccount.id, { maxMessages: 200 });
        } else {
          await fetchEmails(primaryAccount.id, selectedFolder);
        }
      }
      
      toast({
        title: currentlyStarred ? "Ster verwijderd" : "Met ster gemarkeerd",
      });
    } catch (err: any) {
      toast({
        title: "Fout",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (messageId: string) => {
    try {
      // Move to trash folder
      const { error } = await supabase
        .from('email_messages')
        .update({ folder: 'trash' })
        .eq('id', messageId);
      
      if (error) throw error;
      
      setSelectedThread(null);
      
      // Reload current folder
      if (primaryAccount?.id) {
        if (selectedFolder === 'inbox') {
          await syncEmails(primaryAccount.id, { maxMessages: 200 });
        } else {
          await fetchEmails(primaryAccount.id, selectedFolder);
        }
      }
      
      toast({
        title: "Email verwijderd",
        description: "Email verplaatst naar prullenbak",
      });
    } catch (err: any) {
      toast({
        title: "Fout bij verwijderen",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  // Filter out old accounts without SMTP/IMAP configuration
  const validAccounts = accounts.filter(acc => acc.smtp_host && acc.imap_host);
  const primaryAccount = validAccounts.find(acc => acc.is_primary) || validAccounts[0];
  
  // ✅ USE CACHED EMAILS from database (synced from IMAP)
  const { messages, loading: messagesLoading, fetchEmails, syncEmails, getFolders } = useCachedEmails();

  // Mark email as read when opened
  useEffect(() => {
    if (selectedThread) {
      const markAsRead = async () => {
        try {
          await supabase
            .from('email_messages')
            .update({ status: 'read' })
            .eq('id', selectedThread)
            .eq('status', 'unread'); // Only update if currently unread
        } catch (err) {
          console.error('Failed to mark as read:', err);
        }
      };
      markAsRead();
    }
  }, [selectedThread]);

  // Auto-fetch/sync emails when folder changes
  useEffect(() => {
    if (primaryAccount?.id && selectedFolder) {
      const loadEmails = async () => {
        try {
          // For inbox: Always sync LIVE from IMAP
          if (selectedFolder === 'inbox') {
            console.log('🔄 Auto-syncing inbox from IMAP...');
            await syncEmails(primaryAccount.id, { maxMessages: 200 });
          } else {
            // Other folders: Load from database
            await fetchEmails(primaryAccount.id, selectedFolder);
          }
        } catch (err) {
          console.error('Failed to auto-load emails:', err);
        }
      };
      loadEmails();
    }
  }, [primaryAccount?.id, selectedFolder]); // Remove function dependencies to prevent infinite loop

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

  // Custom folders feature temporarily disabled to fix infinite loop
  // TODO: Re-implement with proper memoization

  // Simple folder counts (no useEffect to prevent loops)
  const folders = [
    { id: 'inbox', label: 'Postvak IN', icon: Inbox, count: selectedFolder === 'inbox' ? messages.length : 0 },
    { id: 'sent', label: 'Verzonden', icon: Send, count: 0 },
    { id: 'drafts', label: 'Concepten', icon: Mail, count: 0 },
    { id: 'starred', label: 'Met ster', icon: Star, count: 0 },
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
            variant="outline"
            size="sm"
            onClick={() => setShowDebug(true)}
          >
            🔍 Debug
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

              {/* Custom folders temporarily disabled - will re-add after testing */}
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
                  <ContextMenu key={message.id}>
                    <ContextMenuTrigger asChild>
                      <div
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
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem
                        onClick={() => {
                          setReplyTo({
                            to: message.from_email,
                            subject: message.subject?.startsWith('Re:') ? message.subject : `Re: ${message.subject}`,
                            messageId: message.external_message_id,
                          });
                          setComposerOpen(true);
                        }}
                      >
                        <Reply className="h-4 w-4 mr-2" />
                        Beantwoorden
                      </ContextMenuItem>
                      <ContextMenuItem
                        onClick={() => {
                          toast({ title: "Forward", description: "Doorsturen functie komt binnenkort" });
                        }}
                      >
                        <Forward className="h-4 w-4 mr-2" />
                        Doorsturen
                      </ContextMenuItem>
                      <ContextMenuItem
                        onClick={() => handleStarToggle(message.id, message.is_starred)}
                      >
                        {message.is_starred ? (
                          <><StarOff className="h-4 w-4 mr-2" />Ster verwijderen</>
                        ) : (
                          <><Star className="h-4 w-4 mr-2" />Met ster markeren</>
                        )}
                      </ContextMenuItem>
                      <ContextMenuItem
                        onClick={() => handleDelete(message.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Verwijderen
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
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
                      onClick={() => handleStarToggle(selectedMessage.id, selectedMessage.is_starred)}
                      title={selectedMessage.is_starred ? "Ster verwijderen" : "Met ster markeren"}
                    >
                      <Star className={cn("h-4 w-4", selectedMessage.is_starred && "fill-yellow-500")} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        toast({ title: "Archiveren", description: "Archief functie komt binnenkort" });
                      }}
                      title="Archiveren"
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDelete(selectedMessage.id)}
                      title="Verwijderen"
                    >
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
                      <div 
                        className="text-gray-700 whitespace-pre-wrap break-words"
                        style={{ wordBreak: 'break-word' }}
                      >
                        {selectedMessage.body_text || selectedMessage.body_html || '(Geen inhoud)'}
                      </div>
                      {/* TODO: HTML rendering komt later na IMAP parser is stabiel */}
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
                              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <Paperclip className="h-5 w-5 text-gray-400 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {attachment.filename || attachment.name || `Bijlage ${idx + 1}`}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Download via Hostnet webmail
                                </p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  try {
                                    // Call OX API to download attachment
                                    const { data, error } = await supabase.functions.invoke('ox-mail-get-attachment', {
                                      body: {
                                        accountId: primaryAccount?.id,
                                        messageId: selectedMessage.uid,
                                        attachmentId: idx + 1, // OX uses 1-based index
                                      }
                                    });

                                    if (error) throw error;

                                    // Create download link
                                    const blob = new Blob([data]);
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = attachment.filename;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    URL.revokeObjectURL(url);

                                    toast({
                                      title: "Bijlage gedownload",
                                      description: attachment.filename,
                                    });
                                  } catch (err: any) {
                                    toast({
                                      title: "Download mislukt",
                                      description: err.message,
                                      variant: "destructive",
                                    });
                                  }
                                }}
                              >
                                Download
                              </Button>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-3">
                          💡 Tip: Directe download vanuit CRM komt in een volgende update
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="border-t p-4 flex gap-2 flex-wrap">
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

                  {/* Save as Receipt button - only if email has attachments */}
                  {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                    <Button
                      variant="outline"
                      className="ml-auto bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                      onClick={async () => {
                        try {
                          // Get current user
                          const { data: userData } = await supabase.auth.getUser();
                          
                          // Create receipt for each attachment
                          const receipts = selectedMessage.attachments.map((attachment: any) => ({
                            user_id: userData.user?.id,
                            email_from: selectedMessage.from_email,
                            subject: selectedMessage.subject,
                            description: `Email van ${selectedMessage.from_email} - ${selectedMessage.subject}`,
                            receipt_file_url: attachment.url || attachment.storage_url,
                            receipt_file_name: attachment.filename || attachment.name || 'bijlage.pdf',
                            receipt_file_type: attachment.mime_type || 'application/pdf',
                            status: 'pending',
                            email_message_id: selectedMessage.external_message_id,
                            category: 'email',
                          }));

                          const { error } = await supabase
                            .from('receipts')
                            .insert(receipts);

                          if (error) throw error;

                          toast({
                            title: "✅ Opgeslagen als bon",
                            description: `${receipts.length} bijlage(n) opgeslagen als bonnetje (status: in behandeling)`,
                          });
                        } catch (err: any) {
                          toast({
                            title: "Fout bij opslaan bon",
                            description: err.message,
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      <Receipt className="h-4 w-4 mr-2" />
                      Opslaan als bon
                    </Button>
                  )}
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

      {/* Debug Dialog */}
      <Dialog open={showDebug} onOpenChange={setShowDebug}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>🔍 Email Debug Tool</DialogTitle>
          </DialogHeader>
          {primaryAccount && (
            <EmailDebug accountId={primaryAccount.id} />
          )}
        </DialogContent>
      </Dialog>

      {/* Custom folders dialog temporarily disabled */}
    </div>
  );
}
