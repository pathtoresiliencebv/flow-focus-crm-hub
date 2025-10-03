import React, { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Mail, 
  Send, 
  Inbox, 
  Star, 
  Archive, 
  Trash2, 
  Tag, 
  Search,
  Plus,
  RefreshCw,
  Settings,
  ChevronLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEmailAccounts } from '@/hooks/useEmailAccounts';
import { useEmailThreads } from '@/hooks/useEmailThreads';
import { SMTPIMAPSetup } from '@/components/email/SMTPIMAPSetup';
import { EmailComposer } from '@/components/email/EmailComposer';

export default function Email() {
  const isMobile = useIsMobile();
  const { accounts, loading: accountsLoading, syncAccount } = useEmailAccounts();
  const [selectedFolder, setSelectedFolder] = useState('inbox');
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [showAccountSetup, setShowAccountSetup] = useState(false);

  // Filter out old accounts without SMTP/IMAP configuration
  const validAccounts = accounts.filter(acc => acc.smtp_host && acc.imap_host);
  const primaryAccount = validAccounts.find(acc => acc.is_primary) || validAccounts[0];
  const { threads, loading: threadsLoading } = useEmailThreads(primaryAccount?.id || null, selectedFolder);

  // Debug logging
  console.log('📧 Email Debug:', {
    totalAccounts: accounts.length,
    validAccounts: validAccounts.length,
    accountsLoading,
    showAccountSetup
  });

  const handleSync = async () => {
    if (!primaryAccount) return;
    
    try {
      setSyncing(true);
      await syncAccount(primaryAccount.id);
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  // Show SMTP/IMAP setup if no valid accounts or user clicked "Add Account"
  if ((!accountsLoading && validAccounts.length === 0) || showAccountSetup) {
    return (
      <div className="h-full overflow-auto bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="w-full max-w-4xl mx-auto">
          <SMTPIMAPSetup 
            onSuccess={() => {
              setShowAccountSetup(false);
              // Refresh accounts will happen automatically via useEmailAccounts
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
          <p className="text-muted-foreground">Loading email accounts...</p>
        </div>
      </div>
    );
  }

  const folders = [
    { id: 'inbox', label: 'Inbox', icon: Inbox, count: 12 },
    { id: 'starred', label: 'Starred', icon: Star, count: 3 },
    { id: 'sent', label: 'Sent', icon: Send, count: 0 },
    { id: 'drafts', label: 'Drafts', icon: Mail, count: 2 },
    { id: 'archive', label: 'Archive', icon: Archive, count: 45 },
    { id: 'trash', label: 'Trash', icon: Trash2, count: 8 },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - Folders & Labels */}
      {(!isMobile || !selectedThread) && (
        <div className={cn(
          "border-r border-border bg-card flex flex-col h-full",
          isMobile ? "w-full" : "w-64"
        )}>
          {/* Account Info at top */}
          {primaryAccount && (
            <div className="p-4 border-b border-border">
              <div className="text-sm font-medium text-gray-700 mb-1">Account</div>
              <div className="text-xs text-gray-500 truncate">{primaryAccount.email_address}</div>
            </div>
          )}

          <div className="p-4 border-b border-border">
            <Button 
              className="w-full bg-red-600 hover:bg-red-700 text-white" 
              size="lg"
              onClick={() => setComposerOpen(true)}
              disabled={!primaryAccount}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nieuwe Email
            </Button>
          </div>

          {/* Folders */}
          <div className="p-2">
            {folders.map((folder) => {
              const Icon = folder.icon;
              return (
                <button
                  key={folder.id}
                  onClick={() => setSelectedFolder(folder.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                    selectedFolder === folder.id
                      ? "bg-red-600 text-white"
                      : "hover:bg-gray-100"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    <span>{folder.label}</span>
                  </div>
                  {folder.count > 0 && (
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      selectedFolder === folder.id
                        ? "bg-primary-foreground/20"
                        : "bg-muted-foreground/20"
                    )}>
                      {folder.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Labels */}
          <div className="p-2 mt-4 flex-1 overflow-y-auto">
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
              Labels
            </div>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-gray-100">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <span>Work</span>
              <span className="ml-auto text-xs text-muted-foreground">5</span>
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-gray-100">
              <div className="h-3 w-3 rounded-full bg-blue-500" />
              <span>Personal</span>
              <span className="ml-auto text-xs text-muted-foreground">8</span>
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-gray-100">
              <Tag className="h-4 w-4" />
              <span>New Label</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content - Thread List & Preview */}
      <div className="flex-1 flex flex-col">
        {/* Search Bar */}
        <div className="p-4 border-b border-border bg-background">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search emails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleSync}
              disabled={syncing || !primaryAccount}
              className="border-red-200 hover:bg-red-50 hover:text-red-700"
              title="Sync emails"
            >
              <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* Thread List */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            {threadsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : threads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No emails yet</h3>
                <p className="text-sm text-muted-foreground">
                  Your {selectedFolder} is empty
                </p>
              </div>
            ) : (
              threads.map((thread) => (
                <div
                  key={thread.id}
                  onClick={() => setSelectedThread(thread.id)}
                  className={cn(
                    "p-4 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors",
                    selectedThread === thread.id && "bg-muted",
                    !thread.is_read && "bg-blue-50/30"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          "text-sm truncate",
                          !thread.is_read ? "font-bold" : "font-semibold"
                        )}>
                          {thread.participants[0]?.name || thread.participants[0]?.email || 'Unknown'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {thread.last_message_at ? new Date(thread.last_message_at).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <div className={cn(
                        "text-sm truncate mb-1",
                        !thread.is_read ? "font-semibold" : "font-medium"
                      )}>
                        {thread.subject || '(No Subject)'}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {thread.snippet || ''}
                      </div>
                    </div>
                    <Star 
                      className={cn(
                        "h-4 w-4 cursor-pointer flex-shrink-0",
                        thread.is_starred ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground hover:text-yellow-500"
                      )} 
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Email Preview/Detail (shown when thread selected) */}
      {selectedThread && (
        <div className={cn(
          "border-l border-border bg-background",
          isMobile ? "absolute inset-0 z-50" : "w-[600px]"
        )}>
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center gap-2">
              {isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedThread(null)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              <div className="flex-1">
                <h3 className="font-semibold">Email Subject</h3>
              </div>
              <Button variant="ghost" size="icon">
                <Archive className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Email Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                    SN
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">Sender Name</div>
                    <div className="text-sm text-muted-foreground">sender@example.com</div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Oct 1, 10:30 AM
                  </div>
                </div>
                
                <div className="prose prose-sm max-w-none">
                  <p>Email content will be displayed here...</p>
                  <p>This is a placeholder for the actual email body.</p>
                </div>
              </div>
            </div>

            {/* Quick Reply */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input placeholder="Reply..." className="flex-1" />
                <Button size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Composer Dialog */}
      {primaryAccount && (
        <EmailComposer
          open={composerOpen}
          onOpenChange={setComposerOpen}
          account={primaryAccount}
        />
      )}
    </div>
  );
}

