import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useSimpleChat } from '@/hooks/useSimpleChat';
import { useToast } from '@/hooks/use-toast';

interface ChatTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ChatTestDialog: React.FC<ChatTestDialogProps> = ({ open, onOpenChange }) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const chat = useSimpleChat();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [testMessage, setTestMessage] = useState('Test bericht van chat debug 🧪');

  const runChatDiagnostics = async () => {
    if (!user) return;

    console.log('🔍 Running chat diagnostics...');
    const info = {
      user: {
        id: user.id,
        email: user.email,
        role: profile?.role
      },
      chat: {
        loading: chat.loading,
        conversations: chat.conversations.length,
        availableUsers: chat.availableUsers.length,
        connectionState: chat.connectionState,
        selectedConversation: chat.selectedConversation
      },
      availableUsers: chat.availableUsers.map(u => ({
        id: u.id,
        name: u.full_name,
        role: u.role
      })),
      conversations: chat.conversations.map(c => ({
        id: c.id,
        otherUser: c.other_user.full_name,
        unreadCount: c.unread_count,
        hasLastMessage: !!c.last_message
      }))
    };

    setDebugInfo(info);
    console.log('📊 Chat diagnostics:', info);

    toast({
      title: "Chat Diagnostics Complete",
      description: `Found ${info.chat.availableUsers} available users, ${info.chat.conversations} conversations`,
    });
  };

  const testSendMessage = async () => {
    if (chat.availableUsers.length === 0) {
      toast({
        title: "No Users Available",
        description: "No available users found to send test message to",
        variant: "destructive",
      });
      return;
    }

    const testUser = chat.availableUsers[0];
    try {
      await chat.sendMessage(testMessage, testUser.id);
      toast({
        title: "Test Message Sent!",
        description: `Message sent to ${testUser.full_name}`,
      });
    } catch (error: any) {
      toast({
        title: "Send Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const reconnectChat = () => {
    chat.reconnectChat();
    toast({
      title: "Reconnecting...",
      description: "Attempting to reconnect chat",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>🧪 Chat System Debug & Test</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📊 Status Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div><strong>Loading:</strong> <Badge variant={chat.loading ? 'destructive' : 'default'}>{chat.loading ? 'Yes' : 'No'}</Badge></div>
                <div><strong>Available Users:</strong> <Badge>{chat.availableUsers.length}</Badge></div>
                <div><strong>Conversations:</strong> <Badge>{chat.conversations.length}</Badge></div>
                <div><strong>Connection:</strong> <Badge variant={chat.connectionState.isConnected ? 'default' : 'destructive'}>{chat.connectionState.isConnected ? 'Connected' : 'Disconnected'}</Badge></div>
              </div>
            </CardContent>
          </Card>

          {/* Test Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🎯 Test Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={runChatDiagnostics} size="sm">
                  🔄 Run Diagnostics
                </Button>
                <Button onClick={reconnectChat} variant="outline" size="sm">
                  🔗 Reconnect Chat
                </Button>
                <Button 
                  onClick={testSendMessage} 
                  disabled={chat.availableUsers.length === 0}
                  size="sm"
                >
                  📤 Send Test Message
                </Button>
                <Button 
                  onClick={() => window.open('/?tab=chat', '_blank')} 
                  variant="outline"
                  size="sm"
                >
                  💬 Open Chat Tab
                </Button>
              </div>

              <div>
                <label className="text-sm font-medium">Test Message:</label>
                <input
                  type="text"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  placeholder="Enter test message..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Available Users */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">👥 Available Chat Users</CardTitle>
            </CardHeader>
            <CardContent>
              {chat.availableUsers.length > 0 ? (
                <div className="space-y-2">
                  {chat.availableUsers.map((user) => (
                    <div key={user.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="font-medium">{user.full_name}</span>
                      <Badge variant="outline">{user.role}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-4">
                  No available chat users found
                </div>
              )}
            </CardContent>
          </Card>

          {/* Debug Info */}
          {Object.keys(debugInfo).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">🔍 Debug Information</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-64">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
