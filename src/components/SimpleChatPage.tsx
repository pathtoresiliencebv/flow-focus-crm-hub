import React, { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { ConversationList } from './chat/ConversationList';
import { ChatArea } from './chat/ChatArea';
import { useFixedChat } from '@/hooks/useFixedChat';
import { Button } from '@/components/ui/button';

export const SimpleChatPage: React.FC = () => {
  const isMobile = useIsMobile();
  const {
    conversations,
    selectedConversation,
    messages,
    loading,
    sending,
    selectConversation,
    sendMessage
  } = useFixedChat();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Chat laden...</p>
          <p className="text-xs text-muted-foreground mt-1">
            Verbinding maken met chat server...
          </p>
        </div>
      </div>
    );
  }

  if (isMobile) {
    // Mobile: show either conversation list or chat area
    if (selectedConversation) {
      return (
        <div className="flex flex-col h-full">
          <ChatArea
            conversation={conversations.find(c => c.id === selectedConversation)}
            messages={messages}
            onSendMessage={(content) => sendMessage(content, selectedConversation)}
            onBack={() => selectConversation(null)}
            isMobile={true}
            sending={sending}
          />
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full">
        <ConversationList
          conversations={conversations}
          selectedConversation={selectedConversation}
          onSelectConversation={selectConversation}
          isMobile={true}
        />
      </div>
    );
  }

  // Desktop: show both panels
  return (
    <div className="flex h-full bg-background rounded-lg shadow-lg overflow-hidden border border-border">
      <div className="w-80 border-r border-border bg-card">
        <ConversationList
          conversations={conversations}
          selectedConversation={selectedConversation}
          onSelectConversation={selectConversation}
          isMobile={false}
        />
      </div>
      <div className="flex-1">
        {selectedConversation ? (
          <ChatArea
            conversation={conversations.find(c => c.id === selectedConversation)}
            messages={messages}
            onSendMessage={(content) => sendMessage(content, selectedConversation)}
            isMobile={false}
            sending={sending}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-lg font-semibold mb-2">Selecteer een gesprek</h3>
              <p className="text-muted-foreground">
                Kies een contact om te beginnen met chatten
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};