import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Star, 
  Archive, 
  Trash2, 
  Mail, 
  MailOpen,
  Paperclip,
  Clock,
  User,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useNylasMessages } from '@/hooks/useNylasMessages';
import { toast } from 'sonner';

interface NylasMessageListProps {
  onMessageSelect?: (message: any) => void;
  selectedMessageId?: string;
  className?: string;
}

interface Message {
  id: string;
  nylas_message_id: string;
  from_email: string;
  from_name: string;
  to_emails: string[];
  subject: string;
  body_text: string;
  received_at: string;
  sent_at: string;
  is_read: boolean;
  is_starred: boolean;
  labels: string[];
  folder: string;
  has_attachments: boolean;
  attachments: any[];
  thread_id: string;
}

interface Thread {
  id: string;
  nylas_thread_id: string;
  subject: string;
  participants: any[];
  message_count: number;
  last_message_at: string;
  is_read: boolean;
  is_starred: boolean;
  labels: string[];
  messages: Message[];
}

export function NylasMessageList({ 
  onMessageSelect, 
  selectedMessageId,
  className = '' 
}: NylasMessageListProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedFolder, setSelectedFolder] = useState<string>('inbox');
  const [showUnreadOnly, setShowUnreadOnly] = useState<boolean>(false);
  const [showStarredOnly, setShowStarredOnly] = useState<boolean>(false);
  const [groupByThread, setGroupByThread] = useState<boolean>(true);
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const { 
    messages, 
    loading, 
    error, 
    fetchMessages, 
    syncMessages,
    markAsRead, 
    markAsUnread, 
    starMessage, 
    unstarMessage,
    archiveMessage,
    deleteMessage,
    getFolderCounts
  } = useNylasMessages();

  // Load messages on mount
  useEffect(() => {
    fetchMessages(selectedFolder);
  }, [fetchMessages, selectedFolder]);

  // Filter and group messages
  const { filteredMessages, threads } = useMemo(() => {
    if (!messages) return { filteredMessages: [], threads: [] };

    let filtered = messages.filter(message => {
      // Folder filter
      if (message.folder !== selectedFolder) return false;

      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          message.subject.toLowerCase().includes(searchLower) ||
          message.from_name?.toLowerCase().includes(searchLower) ||
          message.from_email.toLowerCase().includes(searchLower) ||
          message.body_text?.toLowerCase().includes(searchLower)
        );
      }

      // Unread filter
      if (showUnreadOnly && message.is_read) return false;

      // Starred filter
      if (showStarredOnly && !message.is_starred) return false;

      return true;
    });

    // Sort by date (newest first)
    filtered.sort((a, b) => 
      new Date(b.received_at || b.sent_at).getTime() - 
      new Date(a.received_at || a.sent_at).getTime()
    );

    if (!groupByThread) {
      return { filteredMessages: filtered, threads: [] };
    }

    // Group by thread
    const threadMap = new Map<string, Thread>();
    
    filtered.forEach(message => {
      const threadId = message.thread_id || message.id;
      
      if (!threadMap.has(threadId)) {
        threadMap.set(threadId, {
          id: threadId,
          nylas_thread_id: message.thread_id || message.nylas_message_id,
          subject: message.subject,
          participants: [],
          message_count: 0,
          last_message_at: message.received_at || message.sent_at,
          is_read: message.is_read,
          is_starred: message.is_starred,
          labels: message.labels,
          messages: []
        });
      }

      const thread = threadMap.get(threadId)!;
      thread.messages.push(message);
      thread.message_count++;
      
      // Update thread metadata
      if (new Date(message.received_at || message.sent_at) > new Date(thread.last_message_at)) {
        thread.last_message_at = message.received_at || message.sent_at;
        thread.subject = message.subject;
        thread.is_read = message.is_read;
        thread.is_starred = message.is_starred;
      }

      // Add participants
      if (!thread.participants.some(p => p.email === message.from_email)) {
        thread.participants.push({
          email: message.from_email,
          name: message.from_name
        });
      }
    });

    const threads = Array.from(threadMap.values())
      .sort((a, b) => 
        new Date(b.last_message_at).getTime() - 
        new Date(a.last_message_at).getTime()
      );

    return { filteredMessages: [], threads };
  }, [messages, selectedFolder, searchTerm, showUnreadOnly, showStarredOnly, groupByThread]);

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  // Handle folder change
  const handleFolderChange = (folder: string) => {
    setSelectedFolder(folder);
    setSearchTerm('');
  };

  // Handle sync
  const handleSync = async () => {
    setIsProcessing(true);
    try {
      await syncMessages();
      toast.success('Berichten gesynchroniseerd');
    } catch (err) {
      console.error('Error syncing messages:', err);
      toast.error('Fout bij synchroniseren');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle message selection
  const handleMessageSelect = (message: Message) => {
    onMessageSelect?.(message);
    
    // Mark as read if not already
    if (!message.is_read) {
      markAsRead(message.id);
    }
  };

  // Handle thread toggle
  const handleThreadToggle = (threadId: string) => {
    const newExpanded = new Set(expandedThreads);
    if (newExpanded.has(threadId)) {
      newExpanded.delete(threadId);
    } else {
      newExpanded.add(threadId);
    }
    setExpandedThreads(newExpanded);
  };

  // Handle star toggle
  const handleStarToggle = async (messageId: string, isStarred: boolean) => {
    setIsProcessing(true);
    try {
      if (isStarred) {
        await unstarMessage(messageId);
      } else {
        await starMessage(messageId);
      }
    } catch (err) {
      console.error('Error toggling star:', err);
      toast.error('Fout bij bijwerken van ster');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle archive
  const handleArchive = async (messageId: string) => {
    setIsProcessing(true);
    try {
      await archiveMessage(messageId);
      toast.success('Bericht gearchiveerd');
    } catch (err) {
      console.error('Error archiving message:', err);
      toast.error('Fout bij archiveren');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle delete
  const handleDelete = async (messageId: string) => {
    if (!confirm('Weet je zeker dat je dit bericht wilt verwijderen?')) {
      return;
    }

    setIsProcessing(true);
    try {
      await deleteMessage(messageId);
      toast.success('Bericht verwijderd');
    } catch (err) {
      console.error('Error deleting message:', err);
      toast.error('Fout bij verwijderen');
    } finally {
      setIsProcessing(false);
    }
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('nl-NL', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString('nl-NL', {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return date.toLocaleDateString('nl-NL', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  // Get folder counts
  const folderCounts = getFolderCounts();

  if (loading) {
    return (
      <Card className={`w-full ${className}`}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Berichten laden...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`w-full ${className}`}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600">{error}</p>
            <Button 
              variant="outline" 
              onClick={() => fetchMessages(selectedFolder)} 
              className="mt-4"
            >
              Opnieuw proberen
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Header */}
      <Card className="mb-4">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Berichten
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={isProcessing}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isProcessing ? 'animate-spin' : ''}`} />
              Synchroniseren
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Zoek berichten..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant={selectedFolder === 'inbox' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFolderChange('inbox')}
            >
              Inbox
            </Button>
            <Button
              variant={selectedFolder === 'sent' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFolderChange('sent')}
            >
              Verzonden
            </Button>
            <Button
              variant={selectedFolder === 'drafts' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFolderChange('drafts')}
            >
              Concepten
            </Button>
            <Button
              variant={selectedFolder === 'archive' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFolderChange('archive')}
            >
              Gearchiveerd
            </Button>
            <Button
              variant={selectedFolder === 'trash' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFolderChange('trash')}
            >
              Prullenbak
            </Button>

            <div className="flex-1" />

            <Button
              variant={showUnreadOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowUnreadOnly(!showUnreadOnly)}
            >
              <MailOpen className="h-4 w-4 mr-1" />
              Ongelezen
            </Button>
            <Button
              variant={showStarredOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowStarredOnly(!showStarredOnly)}
            >
              <Star className="h-4 w-4 mr-1" />
              Sterren
            </Button>
            <Button
              variant={groupByThread ? 'default' : 'outline'}
              size="sm"
              onClick={() => setGroupByThread(!groupByThread)}
            >
              <Filter className="h-4 w-4 mr-1" />
              Threads
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Messages List */}
      <Card>
        <CardContent className="p-0">
          {groupByThread ? (
            // Thread view
            threads.length === 0 ? (
              <div className="text-center py-8">
                <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Geen berichten gevonden</p>
              </div>
            ) : (
              <div className="divide-y">
                {threads.map((thread) => (
                  <div key={thread.id}>
                    <div
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        selectedMessageId && thread.messages.some(m => m.id === selectedMessageId) 
                          ? 'bg-blue-50 border-l-4 border-blue-500' 
                          : ''
                      }`}
                      onClick={() => handleMessageSelect(thread.messages[0])}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`font-medium ${!thread.is_read ? 'font-bold' : ''}`}>
                              {thread.subject}
                            </h3>
                            {thread.is_starred && (
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            )}
                            {!thread.is_read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              <span>
                                {thread.participants.map(p => p.name || p.email).join(', ')}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{formatDate(thread.last_message_at)}</span>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {thread.message_count} bericht{thread.message_count !== 1 ? 'en' : ''}
                            </Badge>
                          </div>

                          {thread.labels.length > 0 && (
                            <div className="flex gap-1">
                              {thread.labels.map((label) => (
                                <Badge key={label} variant="outline" className="text-xs">
                                  {label}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStarToggle(thread.messages[0].id, thread.is_starred);
                            }}
                            disabled={isProcessing}
                            className={thread.is_starred ? 'text-yellow-500' : 'text-gray-400'}
                          >
                            <Star className={`h-4 w-4 ${thread.is_starred ? 'fill-current' : ''}`} />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleArchive(thread.messages[0].id);
                            }}
                            disabled={isProcessing}
                            className="text-orange-600"
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(thread.messages[0].id);
                            }}
                            disabled={isProcessing}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            // List view
            filteredMessages.length === 0 ? (
              <div className="text-center py-8">
                <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Geen berichten gevonden</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      selectedMessageId === message.id 
                        ? 'bg-blue-50 border-l-4 border-blue-500' 
                        : ''
                    }`}
                    onClick={() => handleMessageSelect(message)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-medium ${!message.is_read ? 'font-bold' : ''}`}>
                            {message.subject}
                          </h3>
                          {message.is_starred && (
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          )}
                          {!message.is_read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          )}
                          {message.has_attachments && (
                            <Paperclip className="h-4 w-4 text-gray-500" />
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            <span>{message.from_name || message.from_email}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{formatDate(message.received_at || message.sent_at)}</span>
                          </div>
                        </div>

                        {message.body_text && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {message.body_text.substring(0, 100)}
                            {message.body_text.length > 100 && '...'}
                          </p>
                        )}

                        {message.labels.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {message.labels.map((label) => (
                              <Badge key={label} variant="outline" className="text-xs">
                                {label}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStarToggle(message.id, message.is_starred);
                          }}
                          disabled={isProcessing}
                          className={message.is_starred ? 'text-yellow-500' : 'text-gray-400'}
                        >
                          <Star className={`h-4 w-4 ${message.is_starred ? 'fill-current' : ''}`} />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArchive(message.id);
                          }}
                          disabled={isProcessing}
                          className="text-orange-600"
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(message.id);
                          }}
                          disabled={isProcessing}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}