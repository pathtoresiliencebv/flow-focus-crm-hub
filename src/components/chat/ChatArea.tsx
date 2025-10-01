import React, { useState, useRef, useEffect } from 'react';
import { Conversation, DirectMessage } from '@/hooks/useFixedChat';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface ChatAreaProps {
  conversation?: Conversation;
  messages: DirectMessage[];
  onSendMessage: (content: string) => void;
  onBack?: () => void;
  isMobile: boolean;
  sending?: boolean;
  userLanguage?: string;
}

export const ChatArea: React.FC<ChatAreaProps> = ({ 
  conversation, 
  messages, 
  onSendMessage,
  onBack,
  isMobile,
  sending = false,
  userLanguage = 'nl'
}) => {
  const { user } = useAuth();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    console.log('💬 ChatArea - Messages updated:', messages.length, 'messages', messages);
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    console.log('👤 ChatArea - Conversation changed:', conversation?.other_user.full_name, 'ID:', conversation?.id);
  }, [conversation]);

  const handleSend = () => {
    if (inputValue.trim() && !sending) {
      console.log('📤 ChatArea - Sending message:', inputValue);
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full text-center">
        <div>
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-lg font-semibold mb-2">Geen gesprek geselecteerd</h3>
          <p className="text-muted-foreground">
            Selecteer een contact om te beginnen met chatten
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-col bg-background",
      isMobile ? "min-h-screen" : "h-full"
    )}>
      {/* Header */}
      <div className="flex items-center p-4 border-b border-border bg-background">
        {isMobile && onBack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="mr-3 p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        
        <Avatar className="h-10 w-10 mr-3">
          <AvatarFallback className="bg-primary text-primary-foreground">
            {getInitials(conversation.other_user.full_name)}
          </AvatarFallback>
        </Avatar>
        
        <div>
          <h3 className="font-semibold">{conversation.other_user.full_name || 'Naamloze Gebruiker'}</h3>
          <p className="text-sm text-muted-foreground">{conversation.other_user.role}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <div className="text-4xl mb-4">👋</div>
            <p>Nog geen berichten in dit gesprek.</p>
            <p className="text-sm mt-2">Stuur een bericht om te beginnen!</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.from_user_id === user?.id}
              userLanguage={userLanguage}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-background">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Typ een bericht..."
            className="flex-1"
            disabled={sending}
          />
          <Button onClick={handleSend} disabled={!inputValue.trim() || sending}>
            {sending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};