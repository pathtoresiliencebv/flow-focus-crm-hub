import React, { useState, useCallback } from 'react';
import { ArrowLeft, Users, Settings, Phone, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useDirectChat } from '@/hooks/useDirectChat';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeChat } from '@/hooks/useRealtimeChat';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { ChatInputEnhanced } from '@/components/chat/ChatInputEnhanced';
import { cn } from '@/lib/utils';

interface MobileChatViewProps {
  selectedUserId: string | null;
  onBack: () => void;
  isFullScreen?: boolean;
  showBottomTabs?: boolean;
  enableSwipeGestures?: boolean;
}

export const MobileChatView: React.FC<MobileChatViewProps> = ({
  selectedUserId,
  onBack,
  isFullScreen = true,
  showBottomTabs = false,
  enableSwipeGestures = true
}) => {
  const { user } = useAuth();
  const { 
    messages, 
    sendMessage,
    availableUsers 
  } = useDirectChat();
  
  const { features, setTyping } = useRealtimeChat(selectedUserId || undefined);
  const [isRecording, setIsRecording] = useState(false);

  const selectedUser = availableUsers.find(u => u.id === selectedUserId);
  
  const userMessages = messages.filter(m => 
    (m.from_user_id === selectedUserId && m.to_user_id === user?.id) ||
    (m.from_user_id === user?.id && m.to_user_id === selectedUserId)
  ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const handleSendMessage = useCallback(async (content: string, type: string = 'text') => {
    if (!selectedUserId || !user) return;
    
    try {
      await sendMessage(selectedUserId, content);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [selectedUserId, user, sendMessage]);

  const handleVoiceRecord = useCallback(() => {
    setIsRecording(prev => !prev);
    // Implement voice recording logic here
  }, []);

  const handleFileUpload = useCallback((files: FileList) => {
    // Implement file upload logic here
    console.log('Files to upload:', files);
  }, []);

  if (!selectedUserId || !selectedUser) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>Select a user to start chatting</p>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-col bg-background",
      isFullScreen ? "h-screen" : "h-full"
    )}>
      {/* Mobile Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Button variant="ghost" size="sm" onClick={onBack} className="h-8 w-8 p-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-medium">
                {selectedUser.full_name?.charAt(0) || 'U'}
              </span>
            </div>
            {features.onlinePresence.onlineUsers.includes(selectedUserId) && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate">{selectedUser.full_name}</h3>
            {features.typingIndicators.isTyping && features.typingIndicators.users.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {features.typingIndicators.users[0].name} is typing...
              </p>
            )}
            {features.onlinePresence.onlineUsers.includes(selectedUserId) && (
              <Badge variant="secondary" className="text-xs">Online</Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Video className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 px-4 py-2">
        <div className="space-y-4">
          {userMessages.map((message, index) => {
            const isOwn = message.from_user_id === user?.id;
            const showSender = !isOwn && (index === 0 || userMessages[index - 1].from_user_id !== message.from_user_id);
            
            return (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={isOwn}
                showSender={showSender}
                senderName={selectedUser.full_name}
                onReact={(emoji) => console.log('React:', emoji)}
                onReply={() => console.log('Reply to:', message.id)}
                onTranslate={() => console.log('Translate:', message.id)}
              />
            );
          })}
        </div>
      </ScrollArea>

      {/* Mobile Input */}
      <div className={cn(
        "border-t bg-background",
        showBottomTabs && "pb-16" // Space for bottom tabs
      )}>
        <ChatInputEnhanced
          onSendMessage={handleSendMessage}
          onTyping={setTyping}
          onFileUpload={handleFileUpload}
          onVoiceRecord={handleVoiceRecord}
          isRecording={isRecording}
          placeholder="Type a message..."
          enableVoiceInput={true}
          enableFileUpload={true}
        />
      </div>
    </div>
  );
};