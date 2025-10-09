import React, { useMemo } from 'react';
import { Conversation } from '@/hooks/useFixedChat';
import { UserAvatar } from '@/components/ui/user-avatar';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useRealUserStore } from '@/hooks/useRealUserStore';

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversation: string | null;
  onSelectConversation: (id: string) => void;
  isMobile: boolean;
  compact?: boolean;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedConversation,
  onSelectConversation,
  isMobile,
  compact = false
}) => {
  const { users } = useRealUserStore();
  
  // Convert conversations to User format for avatar component
  const allUsers = useMemo(() => {
    return conversations.map(conv => ({
      id: conv.other_user?.id || '',
      full_name: conv.other_user?.full_name || null,
      email: conv.other_user?.email
    })).filter(u => u.id);
  }, [conversations]);

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

  // Compact mode (icons only)
  if (compact && !isMobile) {
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="flex-1 overflow-y-auto py-2">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => onSelectConversation(conversation.id)}
              title={conversation.other_user?.full_name || 'Contact'}
              className={cn(
                "flex items-center justify-center p-3 cursor-pointer transition-colors",
                "hover:bg-muted/50",
                selectedConversation === conversation.id && "bg-[hsl(0,71%,36%)]/10 border-l-4 border-[hsl(0,71%,36%)]"
              )}
            >
              <UserAvatar
                user={{
                  id: conversation.other_user?.id || '',
                  full_name: conversation.other_user?.full_name || null,
                  email: conversation.other_user?.email
                }}
                allUsers={allUsers}
                size="md"
                showTooltip={true}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Full mode (mobile or expanded)
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
              selectedConversation === conversation.id && "bg-[hsl(0,71%,36%)]/10 border-l-4 border-[hsl(0,71%,36%)]"
            )}
          >
            <div className="mr-3">
              <UserAvatar
                user={{
                  id: conversation.other_user?.id || '',
                  full_name: conversation.other_user?.full_name || null,
                  email: conversation.other_user?.email
                }}
                allUsers={allUsers}
                size="lg"
                showTooltip={false}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-sm truncate">
                  {conversation.other_user?.full_name || 'Naamloze Gebruiker'}
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

              {conversation.last_message && (
                <p className="text-sm text-muted-foreground truncate">
                  {typeof conversation.last_message === 'string' 
                    ? conversation.last_message 
                    : conversation.last_message.content || ''}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};