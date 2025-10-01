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
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Email() {
  const isMobile = useIsMobile();
  const [selectedFolder, setSelectedFolder] = useState('inbox');
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
          "border-r border-border bg-card",
          isMobile ? "w-full" : "w-64"
        )}>
          <div className="p-4 border-b border-border">
            <Button className="w-full" size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Compose
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
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
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
          <div className="p-2 mt-4">
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
              Labels
            </div>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-muted">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <span>Work</span>
              <span className="ml-auto text-xs text-muted-foreground">5</span>
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-muted">
              <div className="h-3 w-3 rounded-full bg-blue-500" />
              <span>Personal</span>
              <span className="ml-auto text-xs text-muted-foreground">8</span>
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-muted">
              <Tag className="h-4 w-4" />
              <span>New Label</span>
            </button>
          </div>

          {/* Account Info */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                JD
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">john@example.com</div>
                <div className="text-xs text-muted-foreground">Connected</div>
              </div>
            </div>
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
            <Button variant="outline" size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Thread List */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            {/* Placeholder threads */}
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                onClick={() => setSelectedThread(`thread-${i}`)}
                className={cn(
                  "p-4 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors",
                  selectedThread === `thread-${i}` && "bg-muted"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm truncate">
                        Sender Name {i}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        10:30 AM
                      </span>
                    </div>
                    <div className="text-sm font-medium truncate mb-1">
                      Email Subject Line {i}
                    </div>
                    <div className="text-sm text-muted-foreground truncate">
                      This is a preview of the email content that will appear here...
                    </div>
                  </div>
                  <Star className="h-4 w-4 text-muted-foreground hover:text-yellow-500 cursor-pointer" />
                </div>
              </div>
            ))}
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
                  ←
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
    </div>
  );
}

