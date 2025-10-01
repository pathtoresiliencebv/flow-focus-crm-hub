import React from 'react';
import { Conversation } from '@/hooks/useFixedChat';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversation: string | null;
  onSelectConversation: (id: string) => void;
  isMobile: boolean;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedConversation,
  onSelectConversation,
  isMobile
}) => {
  const getInitials = (name: string | null) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true, 
        locale: nl 
      });
    } catch {
      return '';
    }
  };

  if (conversations.length === 0) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center h-full text-center p-4",
        isMobile ? "min-h-screen" : ""
      )}>
        <div className="text-4xl mb-4">👥</div>
        <h3 className="text-lg font-semibold mb-2">Geen gesprekken</h3>
        <p className="text-muted-foreground text-sm">
          Er zijn geen beschikbare contacten om mee te chatten.
        </p>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-col bg-background",
      isMobile ? "min-h-screen" : "h-full"
    )}>
      <div className="p-4 border-b border-border">
        <h2 className="text-xl font-semibold">Gesprekken</h2>
        <p className="text-sm text-muted-foreground">
          {conversations.length} beschikbare contact{conversations.length !== 1 ? 'en' : ''}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            onClick={() => onSelectConversation(conversation.id)}
            className={cn(
              "flex items-center p-4 border-b border-border cursor-pointer transition-colors",
              "hover:bg-muted/50 active:bg-muted",
              selectedConversation === conversation.id && "bg-muted"
            )}
          >
            <Avatar className="h-12 w-12 mr-3">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(conversation.other_user.full_name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-sm truncate">
                  {conversation.other_user.full_name || 'Naamloze Gebruiker'}
                </h3>
                {conversation.last_message && (
                  <span className="text-xs text-muted-foreground">
                    {formatTime(conversation.last_message.created_at)}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground truncate">
                  {conversation.last_message?.content || 'Nog geen berichten'}
                </p>
                {conversation.unread_count > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-1 ml-2">
                    {conversation.unread_count}
                  </span>
                )}
              </div>

              <p className="text-xs text-muted-foreground mt-1">
                {conversation.other_user.role}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};