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
  MoreVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEmailAccounts } from '@/hooks/useEmailAccounts';
import { useLiveEmails } from '@/hooks/useLiveEmails';
import { SMTPIMAPSetup } from '@/components/email/SMTPIMAPSetup';
import { EmailComposer } from '@/components/email/EmailComposer';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

export default function Email() {
  const { accounts, loading: accountsLoading } = useEmailAccounts();
  const [showAccountSetup, setShowAccountSetup] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState('inbox');
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Filter out old accounts without SMTP/IMAP configuration
  const validAccounts = accounts.filter(acc => acc.smtp_host && acc.imap_host);
  const primaryAccount = validAccounts.find(acc => acc.is_primary) || validAccounts[0];
  
  // ✅ USE LIVE EMAILS instead of database threads
  const { messages, loading: messagesLoading, fetchEmails, refresh } = useLiveEmails();

  // Auto-fetch emails when account changes
  useEffect(() => {
    if (primaryAccount?.id) {
      fetchEmails(primaryAccount.id).catch(err => {
        console.error('Failed to fetch emails on mount:', err);
      });
    }
  }, [primaryAccount?.id, fetchEmails]);

  const handleSync = async () => {
    if (!primaryAccount) return;
    
    try {
      console.log('🔄 Starting LIVE sync for account:', primaryAccount.id);
      
      // Use LIVE email fetch
      const result = await refresh(primaryAccount.id);
      
      console.log('✅ LIVE Sync completed:', result);
      
      toast({
        title: "Synchronisatie voltooid",
        description: `${result.messageCount || 0} berichten opgehaald van IMAP server.`,
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

  const folders = [
    { id: 'inbox', label: 'Postvak IN', icon: Inbox, count: messages?.length || 0 },
    { id: 'sent', label: 'Verzonden', icon: Send, count: 0 },
    { id: 'drafts', label: 'Concepten', icon: Mail, count: 0 },
    { id: 'starred', label: 'Met ster', icon: Star, count: messages?.filter(m => m.isStarred).length || 0 },
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
            onClick={() => setComposerOpen(true)}
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
            </div>

            {/* Removed hardcoded storage info */}
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
                <div className="p-8 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300 mx-auto mb-2"></div>
                  <p className="text-sm">Emails laden van IMAP server...</p>
                </div>
              ) : messages && messages.length > 0 ? (
                messages.map((message) => (
                  <div
                    key={message.uid}
                    onClick={() => setSelectedThread(String(message.uid))}
                    className={cn(
                      "p-3 border-b cursor-pointer transition-colors hover:bg-gray-50",
                      selectedThread === String(message.uid) ? "bg-blue-50" : "",
                      !message.isRead ? "bg-blue-50/30" : ""
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {!message.isRead && (
                            <div className="h-2 w-2 rounded-full bg-blue-600 flex-shrink-0"></div>
                          )}
                          <span className={cn(
                            "font-medium text-sm truncate",
                            !message.isRead ? "text-gray-900" : "text-gray-700"
                          )}>
                            {message.from || 'Onbekend'}
                          </span>
                        </div>
                        <h3 className={cn(
                          "text-sm truncate mt-1",
                          !message.isRead ? "font-semibold text-gray-900" : "text-gray-700"
                        )}>
                          {message.subject || '(Geen onderwerp)'}
                        </h3>
                        <p className="text-xs text-gray-500 truncate mt-1">
                          {message.body?.substring(0, 100) || 'Geen preview beschikbaar'}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="text-xs text-gray-500">
                          {new Date(message.date).toLocaleDateString('nl-NL', {
                            day: 'numeric',
                            month: 'short'
                          })}
                        </span>
                        {message.isStarred && (
                          <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                        )}
                      </div>
                    </div>
                  </div>
                ))
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
          {selectedThread ? (
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
                  <h2 className="font-semibold text-lg">Email Subject</h2>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Star className="h-4 w-4" />
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
                  <div className="mb-6">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-red-600 flex items-center justify-center text-white font-semibold">
                        X
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">XENAPO<L className="h-4 w-4" /></div>
                        <div className="text-sm text-gray-500">noreply@mailgun.efaktura.nl</div>
                        <div className="text-xs text-gray-400 mt-1">
                          15:30 · {new Date().toLocaleDateString('nl-NL')}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="prose max-w-none">
                    <p className="text-gray-700">
                      Email content wordt hier weergegeven wanneer je een email selecteert.
                    </p>
                    <p className="text-gray-500 text-sm mt-4">
                      Klik op "Nieuw bericht" om een email te versturen.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t p-4 flex gap-2">
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

      {/* Email Composer Modal */}
      {composerOpen && primaryAccount && (
        <EmailComposer
          account={primaryAccount}
          open={composerOpen}
          onOpenChange={setComposerOpen}
        />
      )}
    </div>
  );
}
