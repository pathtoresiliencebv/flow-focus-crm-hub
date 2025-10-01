import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useSimpleChat } from '@/hooks/useSimpleChat';

export const ChatDebug: React.FC = () => {
  const { user, profile } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const chat = useSimpleChat();

  const runDiagnostics = async () => {
    if (!user) return;

    console.log('🔍 Running chat diagnostics...');
    const info: any = {
      user: {
        id: user.id,
        email: user.email
      },
      profile: {
        full_name: profile?.full_name,
        role: profile?.role,
        status: profile?.status
      },
      chat: {
        loading: chat.loading,
        conversations: chat.conversations.length,
        availableUsers: chat.availableUsers.length,
        connectionState: chat.connectionState
      }
    };

    // Test RPC function
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_available_chat_users', {
        current_user_id: user.id
      });
      
      info.rpc = {
        success: !rpcError,
        error: rpcError?.message,
        data: rpcData || [],
        count: rpcData?.length || 0
      };
    } catch (error) {
      info.rpc = {
        success: false,
        error: error.message,
        data: [],
        count: 0
      };
    }

    // Test direct_messages table access
    try {
      const { data: messagesData, error: messagesError } = await supabase
        .from('direct_messages')
        .select('*')
        .limit(1);
        
      info.directMessages = {
        success: !messagesError,
        error: messagesError?.message,
        canAccess: true
      };
    } catch (error) {
      info.directMessages = {
        success: false,
        error: error.message,
        canAccess: false
      };
    }

    // Test profiles table access
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .limit(5);
        
      info.profiles = {
        success: !profilesError,
        error: profilesError?.message,
        count: profilesData?.length || 0,
        data: profilesData || []
      };
    } catch (error) {
      info.profiles = {
        success: false,
        error: error.message,
        count: 0,
        data: []
      };
    }

    setDebugInfo(info);
    console.log('📊 Chat diagnostics complete:', info);
  };

  useEffect(() => {
    if (user && profile) {
      runDiagnostics();
    }
  }, [user, profile]);

  const sendTestMessage = async () => {
    if (chat.availableUsers.length > 0) {
      const testUser = chat.availableUsers[0];
      await chat.sendMessage('Test bericht van chat debug 🧪', testUser.id);
      console.log('📤 Test message sent to:', testUser.full_name);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Chat Diagnostics</h2>
        <Button onClick={runDiagnostics}>
          🔄 Refresh Diagnostics
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">👤 User Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div><strong>ID:</strong> {debugInfo.user?.id}</div>
            <div><strong>Email:</strong> {debugInfo.user?.email}</div>
            <div><strong>Name:</strong> {debugInfo.profile?.full_name || 'N/A'}</div>
            <div>
              <strong>Role:</strong> 
              <Badge className="ml-2" variant={debugInfo.profile?.role === 'Administrator' ? 'default' : 'secondary'}>
                {debugInfo.profile?.role || 'N/A'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Chat Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">💬 Chat Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div><strong>Loading:</strong> <Badge variant={chat.loading ? 'destructive' : 'default'}>{chat.loading ? 'Yes' : 'No'}</Badge></div>
            <div><strong>Available Users:</strong> <Badge>{chat.availableUsers.length}</Badge></div>
            <div><strong>Conversations:</strong> <Badge>{chat.conversations.length}</Badge></div>
            <div>
              <strong>Connection:</strong> 
              <Badge variant={chat.connectionState.isConnected ? 'default' : 'destructive'}>
                {chat.connectionState.isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* RPC Function */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🔧 RPC Function</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <strong>get_available_chat_users:</strong>
              <Badge className="ml-2" variant={debugInfo.rpc?.success ? 'default' : 'destructive'}>
                {debugInfo.rpc?.success ? 'Working' : 'Error'}
              </Badge>
            </div>
            <div><strong>Users Found:</strong> <Badge>{debugInfo.rpc?.count || 0}</Badge></div>
            {debugInfo.rpc?.error && (
              <div className="text-red-600 text-sm">
                <strong>Error:</strong> {debugInfo.rpc.error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Database Access */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🗄️ Database Access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <strong>direct_messages:</strong>
              <Badge className="ml-2" variant={debugInfo.directMessages?.success ? 'default' : 'destructive'}>
                {debugInfo.directMessages?.success ? 'OK' : 'Error'}
              </Badge>
            </div>
            <div>
              <strong>profiles:</strong>
              <Badge className="ml-2" variant={debugInfo.profiles?.success ? 'default' : 'destructive'}>
                {debugInfo.profiles?.success ? 'OK' : 'Error'}
              </Badge>
            </div>
            <div><strong>Profiles Count:</strong> <Badge>{debugInfo.profiles?.count || 0}</Badge></div>
          </CardContent>
        </Card>

        {/* Available Users */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">👥 Available Users</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {chat.availableUsers.length > 0 ? (
              <div className="space-y-1">
                {chat.availableUsers.map((user) => (
                  <div key={user.id} className="flex justify-between items-center text-sm">
                    <span>{user.full_name}</span>
                    <Badge variant="outline">{user.role}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground">No users available</div>
            )}
          </CardContent>
        </Card>

        {/* Test Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🧪 Test Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              onClick={sendTestMessage}
              disabled={chat.availableUsers.length === 0}
              className="w-full"
              size="sm"
            >
              Send Test Message
            </Button>
            <Button 
              onClick={() => chat.reconnectChat()}
              variant="outline"
              className="w-full"
              size="sm"
            >
              Reconnect Chat
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Raw Debug Data */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📊 Raw Debug Data</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-96">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
};
