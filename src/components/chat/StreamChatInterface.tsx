import React, { useState, useEffect } from 'react';
import { Chat, Channel, ChannelHeader, ChannelList, MessageInput, MessageList, Thread, Window } from 'stream-chat-react';
import { useStreamChat } from '@/contexts/StreamChatContext';
import { useAuth } from '@/contexts/AuthContext';
import { createDirectChannel } from '@/lib/stream-chat';
import { Button } from '@/components/ui/button';
import { Loader2, MessageSquare, Users } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { LegacyChatViewer } from './LegacyChatViewer';
import 'stream-chat-react/dist/css/v2/index.css';

export const StreamChatInterface: React.FC = () => {
  const { client, isConnected, isConnecting, availableUsers, currentChannel, setCurrentChannel, error } = useStreamChat();
  const { user, profile } = useAuth();
  const isMobile = useIsMobile();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showLegacyChat, setShowLegacyChat] = useState(false);
  const [showUserList, setShowUserList] = useState(!isMobile);

  // Create direct channel when user is selected
  const handleSelectUser = async (otherUserId: string) => {
    if (!client || !user) return;

    try {
      console.log('📝 Creating channel with user:', otherUserId);
      const channel = await createDirectChannel(user.id, otherUserId);
      setCurrentChannel(channel);
      setSelectedUserId(otherUserId);
      
      // Hide user list on mobile after selection
      if (isMobile) {
        setShowUserList(false);
      }
    } catch (error) {
      console.error('❌ Error creating channel:', error);
    }
  };

  // Toggle user list on mobile
  const toggleUserList = () => {
    setShowUserList(!showUserList);
    if (!showUserList) {
      setCurrentChannel(null);
    }
  };

  // Loading state
  if (isConnecting) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Verbinden met chat...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <div className="text-center max-w-md">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Chat niet beschikbaar</h3>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Opnieuw proberen
          </Button>
        </div>
      </div>
    );
  }

  // Not connected yet
  if (!isConnected || !client) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Chat laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with Legacy Chat Button */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Chat</h2>
        </div>
        <div className="flex gap-2">
          {isMobile && (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleUserList}
            >
              <Users className="h-4 w-4 mr-2" />
              {showUserList ? 'Terug' : 'Contacten'}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLegacyChat(true)}
          >
            Oude Berichten
          </Button>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 overflow-hidden">
        <Chat client={client} theme="str-chat__theme-light">
          <div className={`flex h-full ${isMobile ? 'flex-col' : ''}`}>
            {/* User List Sidebar */}
            {(showUserList || !isMobile) && (
              <div className={`${isMobile ? 'w-full' : 'w-80'} border-r bg-background overflow-y-auto`}>
                <div className="p-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Beschikbare Contacten
                  </h3>
                  <div className="space-y-2">
                    {availableUsers.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Geen contacten beschikbaar
                      </p>
                    ) : (
                      availableUsers.map((chatUser) => (
                        <button
                          key={chatUser.id}
                          onClick={() => handleSelectUser(chatUser.id)}
                          className={`w-full text-left p-3 rounded-lg hover:bg-accent transition-colors ${
                            selectedUserId === chatUser.id ? 'bg-accent' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-sm font-semibold text-primary">
                                  {chatUser.full_name?.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              {chatUser.is_online && (
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{chatUser.full_name}</p>
                              <p className="text-xs text-muted-foreground truncate">{chatUser.role}</p>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Chat Area */}
            {(!isMobile || !showUserList) && (
              <div className="flex-1 flex flex-col">
                {currentChannel ? (
                  <Channel channel={currentChannel}>
                    <Window>
                      <ChannelHeader />
                      <MessageList />
                      <MessageInput />
                    </Window>
                    <Thread />
                  </Channel>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Selecteer een contact om te beginnen met chatten</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Chat>
      </div>

      {/* Legacy Chat Viewer Modal */}
      {showLegacyChat && (
        <LegacyChatViewer onClose={() => setShowLegacyChat(false)} />
      )}
    </div>
  );
};

