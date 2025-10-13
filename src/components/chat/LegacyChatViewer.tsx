import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Archive, MessageSquare, X } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface LegacyMessage {
  id: string;
  from_user_id: string;
  to_user_id: string;
  content: string;
  created_at: string;
  sender?: {
    id: string;
    full_name: string;
  };
}

interface LegacyConversation {
  user_id: string;
  user_name: string;
  last_message_date: string;
  message_count: number;
}

interface LegacyChatViewerProps {
  onClose: () => void;
}

export const LegacyChatViewer: React.FC<LegacyChatViewerProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<LegacyConversation[]>([]);
  const [messages, setMessages] = useState<LegacyMessage[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Load legacy conversations
  useEffect(() => {
    const loadConversations = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Get all messages involving this user
        const { data: messagesData, error } = await supabase
          .from('direct_messages')
          .select('from_user_id, to_user_id, created_at')
          .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Group by conversation partner
        const conversationMap = new Map<string, { lastDate: string; count: number }>();

        messagesData?.forEach((msg) => {
          const partnerId = msg.from_user_id === user.id ? msg.to_user_id : msg.from_user_id;
          
          if (!conversationMap.has(partnerId)) {
            conversationMap.set(partnerId, {
              lastDate: msg.created_at,
              count: 1,
            });
          } else {
            const existing = conversationMap.get(partnerId)!;
            existing.count++;
          }
        });

        // Get user details for all conversation partners
        const partnerIds = Array.from(conversationMap.keys());
        
        if (partnerIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', partnerIds);

          const conversationsArray = profiles?.map((profile) => {
            const convData = conversationMap.get(profile.id)!;
            return {
              user_id: profile.id,
              user_name: profile.full_name,
              last_message_date: convData.lastDate,
              message_count: convData.count,
            };
          }) || [];

          // Sort by last message date
          conversationsArray.sort((a, b) => 
            new Date(b.last_message_date).getTime() - new Date(a.last_message_date).getTime()
          );

          setConversations(conversationsArray);
        }
      } catch (error) {
        console.error('Error loading legacy conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [user]);

  // Load messages for selected conversation
  const loadMessages = async (otherUserId: string) => {
    if (!user) return;

    try {
      setLoadingMessages(true);
      setSelectedUserId(otherUserId);

      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`and(from_user_id.eq.${user.id},to_user_id.eq.${otherUserId}),and(from_user_id.eq.${otherUserId},to_user_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Enrich with sender info
      if (data && data.length > 0) {
        const enrichedMessages = await Promise.all(
          data.map(async (msg: any) => {
            const { data: senderData } = await supabase
              .from('profiles')
              .select('id, full_name')
              .eq('id', msg.from_user_id)
              .single();
            
            return {
              ...msg,
              sender: senderData || { id: msg.from_user_id, full_name: 'Unknown' }
            };
          })
        );
        setMessages(enrichedMessages as LegacyMessage[]);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Oude Berichten (Archief)
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Dit zijn je oude berichten voordat we overstapten naar het nieuwe chat systeem. Deze berichten zijn alleen-lezen.
          </p>
        </DialogHeader>

        <div className="flex-1 flex gap-4 overflow-hidden">
          {/* Conversations List */}
          <div className="w-1/3 border-r pr-4">
            <ScrollArea className="h-full">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Geen oude berichten gevonden</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conv) => (
                    <button
                      key={conv.user_id}
                      onClick={() => loadMessages(conv.user_id)}
                      className={`w-full text-left p-3 rounded-lg hover:bg-accent transition-colors ${
                        selectedUserId === conv.user_id ? 'bg-accent' : ''
                      }`}
                    >
                      <p className="font-medium truncate">{conv.user_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {conv.message_count} bericht{conv.message_count !== 1 ? 'en' : ''} • {' '}
                        {format(new Date(conv.last_message_date), 'd MMM yyyy', { locale: nl })}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Messages Area */}
          <div className="flex-1 flex flex-col">
            {loadingMessages ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : !selectedUserId ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Selecteer een conversatie om berichten te bekijken</p>
                </div>
              </div>
            ) : (
              <ScrollArea className="flex-1 px-4">
                <div className="space-y-4 py-4">
                  {messages.map((message) => {
                    const isOwn = message.from_user_id === user?.id;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            isOwn
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                          <p
                            className={`text-xs mt-1 ${
                              isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                            }`}
                          >
                            {format(new Date(message.created_at), 'HH:mm • d MMM yyyy', { locale: nl })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose} variant="outline">
            <X className="h-4 w-4 mr-2" />
            Sluiten
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

