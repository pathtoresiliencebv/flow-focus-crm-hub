import React, { useState } from 'react';
import { MessageSquare, Users, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useUsers } from "@/hooks/useUsers";
import { useChat } from "@/hooks/useChat";

interface Channel {
  id: string;
  name: string;
  type: string;
  is_direct_message?: boolean;
  unread_count?: number;
}

interface MobileChatChannelListProps {
  channels: Channel[];
  onSelectChannel: (channelId: string) => void;
  onCreateChannel?: (name: string, type: string, projectId?: string, participants?: string[]) => Promise<string | null>;
}

export const MobileChatChannelList: React.FC<MobileChatChannelListProps> = ({
  channels,
  onSelectChannel,
  onCreateChannel
}) => {
  const { users } = useUsers();
  const { availableUsers, createDirectChannel } = useChat();
  const [activeTab, setActiveTab] = useState("channels");

  // Separate channels by type
  const projectChannels = channels.filter(c => c.type === 'project');
  const generalChannels = channels.filter(c => c.type === 'general');
  const directChannels = channels.filter(c => c.type === 'direct' || c.is_direct_message);

  const handleStartDirectChat = async (userId: string) => {
    const channelId = await createDirectChannel(userId);
    if (channelId) {
      onSelectChannel(channelId);
    }
  };

  const ChannelItem = ({ channel }: { channel: Channel }) => (
    <div
      className="p-3 rounded-lg border bg-card hover:bg-accent cursor-pointer"
      onClick={() => onSelectChannel(channel.id)}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{channel.name}</p>
          <p className="text-sm text-muted-foreground capitalize">
            {channel.is_direct_message ? 'Directe chat' : channel.type}
          </p>
        </div>
        {(channel.unread_count || 0) > 0 && (
          <Badge variant="destructive" className="text-xs">
            {channel.unread_count! > 9 ? '9+' : channel.unread_count}
          </Badge>
        )}
      </div>
    </div>
  );

  const UserItem = ({ user }: { user: any }) => (
    <div
      className="p-3 rounded-lg border bg-card hover:bg-accent cursor-pointer"
      onClick={() => handleStartDirectChat(user.id)}
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback>
            {user.full_name?.split(" ").map((n: string) => n[0]).join("") || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{user.full_name || "Onbekende gebruiker"}</p>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {user.role}
            </Badge>
            {user.is_online && (
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
      <TabsList className="grid w-full grid-cols-2 mx-4 mt-4">
        <TabsTrigger value="channels">
          <MessageSquare className="h-4 w-4 mr-2" />
          Kanalen
        </TabsTrigger>
        <TabsTrigger value="users">
          <Users className="h-4 w-4 mr-2" />
          Personen
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="channels" className="flex-1 mt-4">
        <ScrollArea className="h-full px-4">
          <div className="space-y-4">
            {/* Project Channels */}
            {projectChannels.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">PROJECT KANALEN</h3>
                <div className="space-y-1">
                  {projectChannels.map((channel) => (
                    <ChannelItem key={channel.id} channel={channel} />
                  ))}
                </div>
              </div>
            )}

            {/* Direct Messages */}
            {directChannels.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">DIRECTE BERICHTEN</h3>
                <div className="space-y-1">
                  {directChannels.map((channel) => (
                    <ChannelItem key={channel.id} channel={channel} />
                  ))}
                </div>
              </div>
            )}

            {/* General Channels */}
            {generalChannels.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">ALGEMENE KANALEN</h3>
                <div className="space-y-1">
                  {generalChannels.map((channel) => (
                    <ChannelItem key={channel.id} channel={channel} />
                  ))}
                </div>
              </div>
            )}

            {channels.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Geen kanalen beschikbaar</p>
                <p className="text-sm mt-1">Start een nieuwe conversatie</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </TabsContent>
      
      <TabsContent value="users" className="flex-1 mt-4">
        <ScrollArea className="h-full px-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">BESCHIKBARE PERSONEN</h3>
            <div className="space-y-1">
              {availableUsers.map((user) => (
                <UserItem key={user.id} user={user} />
              ))}
            </div>
            
            {availableUsers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Geen personen beschikbaar</p>
                <p className="text-sm mt-1">Contact je administrator</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </TabsContent>
    </Tabs>
  );
};