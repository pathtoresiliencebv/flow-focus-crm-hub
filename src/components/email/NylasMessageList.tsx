import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Mail, 
  Star, 
  StarOff, 
  Archive, 
  Trash2, 
  Reply, 
  Forward, 
  Paperclip,
  Search,
  Filter,
  MoreVertical,
  ChevronDown,
  ChevronRight,
  Loader2,
  RefreshCw,
  MailOpen,
  MailCheck
} from 'lucide-react';
import { useNylasMessages, NylasMessage } from '@/hooks/useNylasMessages';
import { useNylasAuth } from '@/hooks/useNylasAuth';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';

interface NylasMessageListProps {
  accountId: string;
  folder?: string;
  onMessageSelect?: (message: NylasMessage) => void;
  selectedMessageId?: string;
  className?: string;
}

interface ThreadGroup {
  threadId: string | null;
  messages: NylasMessage[];
  subject: string;
  participants: string[];
  lastMessage: NylasMessage;
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
}

export const NylasMessageList: React.FC<NylasMessageListProps> = ({
  accountId,
  folder = 'inbox',
  onMessageSelect,
  selectedMessageId,
  className,
}) => {
  const { 
    messages, 
    loading, 
    error, 
    fetchMessages, 
    syncMessages, 
    markAsRead, 
    starMessage, 
    deleteMessage,
    searchMessages 
  } = useNylasMessages();
  
  const { getPrimaryAccount } = useNylasAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());

  // Load messages when account or folder changes
  useEffect(() => {
    if (accountId) {
      if (searchQuery.trim()) {
        searchMessages(accountId, searchQuery, folder);
      } else {
        fetchMessages(accountId, folder);
      }
    }
  }, [accountId, folder, searchQuery, fetchMessages, searchMessages]);

  // Group messages by thread
  const threadGroups = useMemo((): ThreadGroup[] => {
    const groups = new Map<string | null, NylasMessage[]>();
    
    messages.forEach(message => {
      const threadId = message.thread_id;
      if (!groups.has(threadId)) {
        groups.set(threadId, []);
      }
      groups.get(threadId)!.push(message);
    });

    return Array.from(groups.entries()).map(([threadId, messages]) => {
      // Sort messages by date
      const sortedMessages = messages.sort((a, b) => 
        new Date(a.received_at).getTime() - new Date(b.received_at).getTime()
      );
      
      const lastMessage = sortedMessages[sortedMessages.length - 1];
      const participants = Array.from(new Set(
        sortedMessages.flatMap(m => [
          m.from_email,
          ...m.to_emails.map(t => t.email),
          ...m.cc_emails.map(c => c.email)
        ])
      ));

      return {
        threadId,
        messages: sortedMessages,
        subject: lastMessage.subject || '(Geen onderwerp)',
        participants,
        lastMessage,
        isRead: sortedMessages.every(m => m.is_read),
        isStarred: sortedMessages.some(m => m.is_starred),
        hasAttachments: sortedMessages.some(m => m.has_attachments),
      };
    }).sort((a, b) => 
      new Date(b.lastMessage.received_at).getTime() - new Date(a.lastMessage.received_at).getTime()
    );
  }, [messages]);

  const handleMessageClick = async (message: NylasMessage) => {
    onMessageSelect?.(message);
    
    // Mark as read if unread
    if (!message.is_read) {
      await markAsRead(message.id, true);
    }
  };

  const handleStarToggle = async (message: NylasMessage) => {
    await starMessage(message.id, !message.is_starred);
  };

  const handleDelete = async (message: NylasMessage) => {
    await deleteMessage(message.id);
  };

  const handleSync = async () => {
    if (accountId) {
      await syncMessages(accountId, { fullSync: false, maxMessages: 100 });
    }
  };

  const toggleThreadExpansion = (threadId: string | null) => {
    const newExpanded = new Set(expandedThreads);
    if (newExpanded.has(threadId || '')) {
      newExpanded.delete(threadId || '');
    } else {
      newExpanded.add(threadId || '');
    }
    setExpandedThreads(newExpanded);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString('nl-NL', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
    }
  };

  const getSenderInitials = (email: string) => {
    return email.split('@')[0].substring(0, 2).toUpperCase();
  };

  const getSenderColor = (email: string) => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-orange-500'
    ];
    const hash = email.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  if (loading && messages.length === 0) {
    return (
      <div className={cn("flex items-center justify-center h-64", className)}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
          <p className="text-gray-500">Emails laden...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("flex items-center justify-center h-64", className)}>
        <div className="text-center">
          <Mail className="h-8 w-8 mx-auto mb-2 text-red-400" />
          <p className="text-red-500 mb-2">Fout bij laden emails</p>
          <p className="text-sm text-gray-500">{error}</p>
          <Button onClick={handleSync} variant="outline" className="mt-2">
            <RefreshCw className="h-4 w-4 mr-2" />
            Opnieuw proberen
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="p-4 border-b bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900">
              {folder === 'inbox' ? 'Postvak IN' : 
               folder === 'sent' ? 'Verzonden' :
               folder === 'drafts' ? 'Concepten' :
               folder === 'starred' ? 'Met ster' :
               folder === 'archive' ? 'Archief' :
               folder === 'trash' ? 'Prullenbak' : folder}
            </h2>
            <Badge variant="secondary">{messages.length}</Badge>
          </div>
          <Button onClick={handleSync} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Zoek in emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto">
        {threadGroups.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Mail className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">Geen emails in deze map</p>
              <p className="text-sm text-gray-400 mt-1">
                {searchQuery ? 'Geen resultaten gevonden' : 'Klik op Synchroniseren om emails op te halen'}
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y">
            {threadGroups.map((group) => {
              const isExpanded = expandedThreads.has(group.threadId || '');
              const isSelected = selectedMessageId && group.messages.some(m => m.id === selectedMessageId);
              
              return (
                <div
                  key={group.threadId || group.lastMessage.id}
                  className={cn(
                    "p-4 hover:bg-gray-50 cursor-pointer transition-colors",
                    isSelected && "bg-blue-50 border-l-4 border-blue-500"
                  )}
                >
                  {/* Thread Header */}
                  <div 
                    className="flex items-start gap-3"
                    onClick={() => handleMessageClick(group.lastMessage)}
                  >
                    {/* Avatar */}
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarFallback className={getSenderColor(group.lastMessage.from_email)}>
                        {getSenderInitials(group.lastMessage.from_email)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          "font-medium text-sm",
                          !group.isRead && "font-semibold text-gray-900"
                        )}>
                          {group.lastMessage.from_email}
                        </span>
                        {!group.isRead && (
                          <div className="h-2 w-2 rounded-full bg-blue-600 flex-shrink-0" />
                        )}
                        {group.isStarred && (
                          <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                        )}
                        {group.hasAttachments && (
                          <Paperclip className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                        )}
                      </div>
                      
                      <h3 className={cn(
                        "text-sm truncate mb-1",
                        !group.isRead && "font-semibold text-gray-900"
                      )}>
                        {group.subject}
                      </h3>
                      
                      <p className="text-xs text-gray-500 truncate">
                        {group.lastMessage.body_text?.substring(0, 100) || 'Geen preview beschikbaar'}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500">
                        {formatDate(group.lastMessage.received_at)}
                      </span>
                      
                      {group.threadId && group.messages.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleThreadExpansion(group.threadId);
                          }}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Thread Messages (if expanded) */}
                  {isExpanded && group.threadId && group.messages.length > 1 && (
                    <div className="ml-13 mt-2 space-y-2">
                      {group.messages.slice(0, -1).map((message) => (
                        <div
                          key={message.id}
                          className={cn(
                            "p-2 rounded border-l-2 hover:bg-gray-50 cursor-pointer",
                            selectedMessageId === message.id && "bg-blue-50 border-blue-500"
                          )}
                          onClick={() => handleMessageClick(message)}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-gray-600">
                              {message.from_email}
                            </span>
                            <span className="text-xs text-gray-400">
                              {formatDate(message.received_at)}
                            </span>
                            {message.is_starred && (
                              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                            )}
                          </div>
                          <p className="text-xs text-gray-600 truncate">
                            {message.body_text?.substring(0, 80) || 'Geen preview'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="flex items-center gap-1 mt-2 ml-13">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStarToggle(group.lastMessage);
                      }}
                      className="text-gray-400 hover:text-yellow-500"
                    >
                      {group.isStarred ? (
                        <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      ) : (
                        <StarOff className="h-4 w-4" />
                      )}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Implement reply
                      }}
                      className="text-gray-400 hover:text-blue-500"
                    >
                      <Reply className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(group.lastMessage);
                      }}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
