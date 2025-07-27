import React, { useState, useEffect, useRef } from 'react';
import { useDirectChat, DirectMessage, ChatUser } from '@/hooks/useDirectChat';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Users, Send, ArrowLeft, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DirectChatWindowProps {
  onBack?: () => void;
}

export const DirectChatWindow: React.FC<DirectChatWindowProps> = ({ onBack }) => {
  const { user, profile } = useAuth();
  const {
    messages,
    availableUsers,
    selectedUserId,
    setSelectedUserId,
    loading,
    sendMessage,
    getUnreadCount
  } = useDirectChat();

  const [newMessage, setNewMessage] = useState('');
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load unread counts for all users
  useEffect(() => {
    const loadUnreadCounts = async () => {
      const counts: Record<string, number> = {};
      for (const user of availableUsers) {
        const count = await getUnreadCount(user.id);
        counts[user.id] = count;
      }
      setUnreadCounts(counts);
    };

    if (availableUsers.length > 0) {
      loadUnreadCounts();
    }
  }, [availableUsers, getUnreadCount]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUserId || isSending) return;

    try {
      setIsSending(true);
      await sendMessage(selectedUserId, newMessage);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('nl-NL', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const selectedUser = availableUsers.find(user => user.id === selectedUserId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Laden van chat...</p>
        </div>
      </div>
    );
  }

  // Show user list if no user is selected
  if (!selectedUserId) {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">
            {profile?.role === 'Installateur' ? 'Administratie' : 'Monteurs'}
          </h2>
        </div>

        {/* User List */}
        <ScrollArea className="flex-1 p-4">
          {availableUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Geen gebruikers beschikbaar voor chat
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {availableUsers.map((user) => (
                <Card 
                  key={user.id}
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => setSelectedUserId(user.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {user.full_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{user.full_name || 'Onbekend'}</span>
                          {user.is_online && (
                            <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                          )}
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {user.role}
                        </Badge>
                      </div>
                      {unreadCounts[user.id] > 0 && (
                        <Badge variant="destructive" className="h-6 min-w-6 text-xs">
                          {unreadCounts[user.id]}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    );
  }

  // Show chat window with selected user
  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center gap-3 p-4 border-b">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setSelectedUserId(null)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Avatar className="h-8 w-8">
          <AvatarFallback>
            {selectedUser?.full_name?.charAt(0) || '?'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{selectedUser?.full_name || 'Onbekend'}</span>
            {selectedUser?.is_online && (
              <Circle className="h-2 w-2 fill-green-500 text-green-500" />
            )}
          </div>
          <Badge variant="secondary" className="text-xs">
            {selectedUser?.role}
          </Badge>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Nog geen berichten. Start een gesprek!
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.from_user_id === user?.id;
              const displayContent = message.translated_content && 
                message.translated_content[profile?.role === 'Installateur' ? 'pl' : 'nl'] 
                ? message.translated_content[profile?.role === 'Installateur' ? 'pl' : 'nl']
                : message.content;

              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    isOwn ? "justify-end" : "justify-start"
                  )}
                >
                  {!isOwn && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {message.sender?.full_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      "max-w-[70%] rounded-lg p-3",
                      isOwn
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{displayContent}</p>
                    <p className={cn(
                      "text-xs mt-1",
                      isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}>
                      {formatTime(message.created_at)}
                    </p>
                  </div>
                  {isOwn && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {profile?.full_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <Separator />

      {/* Message Input */}
      <div className="p-4">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Typ een bericht..."
            disabled={isSending}
            className="flex-1"
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isSending}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};