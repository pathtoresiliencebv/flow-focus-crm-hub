import { useEffect, useCallback, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

interface RealtimeEvent {
  type: string;
  payload: any;
  timestamp: string;
  channel?: string;
}

interface SyncStatus {
  connected: boolean;
  lastSyncAt: string | null;
  failedEvents: number;
  queuedEvents: number;
}

export const useRealtimeSync = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    connected: false,
    lastSyncAt: null,
    failedEvents: 0,
    queuedEvents: 0
  });
  
  const channelsRef = useRef<Map<string, any>>(new Map());
  const eventQueueRef = useRef<RealtimeEvent[]>([]);

  // Enhanced connection monitoring
  const setupConnectionMonitoring = useCallback(() => {
    const checkConnection = () => {
      const isConnected = supabase.channel('_ping').state === 'joined';
      setSyncStatus(prev => ({
        ...prev,
        connected: isConnected,
        lastSyncAt: isConnected ? new Date().toISOString() : prev.lastSyncAt
      }));
    };

    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, []);

  // Real-time chat synchronization
  const setupChatSync = useCallback(() => {
    if (!user) return;

    const chatChannel = supabase
      .channel('chat-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages'
        },
        (payload) => {
          logRealtimeEvent('chat_message', payload, 'chat-realtime');
          // Broadcast to all subscribers
          window.dispatchEvent(new CustomEvent('chat-message-update', { 
            detail: payload 
          }));
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_participants'
        },
        (payload) => {
          logRealtimeEvent('chat_participant', payload, 'chat-realtime');
          window.dispatchEvent(new CustomEvent('chat-participant-update', { 
            detail: payload 
          }));
        }
      )
      .subscribe();

    channelsRef.current.set('chat', chatChannel);
    return () => {
      supabase.removeChannel(chatChannel);
      channelsRef.current.delete('chat');
    };
  }, [user]);

  // Real-time project synchronization
  const setupProjectSync = useCallback(() => {
    if (!user) return;

    const projectChannel = supabase
      .channel('project-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects'
        },
        (payload) => {
          logRealtimeEvent('project_update', payload, 'project-realtime');
          window.dispatchEvent(new CustomEvent('project-update', { 
            detail: payload 
          }));
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_tasks'
        },
        (payload) => {
          logRealtimeEvent('project_task', payload, 'project-realtime');
          window.dispatchEvent(new CustomEvent('project-task-update', { 
            detail: payload 
          }));
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_deliveries'
        },
        (payload) => {
          logRealtimeEvent('project_delivery', payload, 'project-realtime');
          window.dispatchEvent(new CustomEvent('project-delivery-update', { 
            detail: payload 
          }));
        }
      )
      .subscribe();

    channelsRef.current.set('projects', projectChannel);
    return () => {
      supabase.removeChannel(projectChannel);
      channelsRef.current.delete('projects');
    };
  }, [user]);

  // Real-time user presence tracking
  const setupPresenceSync = useCallback(() => {
    if (!user) return;

    const presenceChannel = supabase
      .channel('user-presence')
      .on('presence', { event: 'sync' }, () => {
        const newState = presenceChannel.presenceState();
        window.dispatchEvent(new CustomEvent('presence-sync', { 
          detail: { state: newState } 
        }));
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        window.dispatchEvent(new CustomEvent('user-joined', { 
          detail: { key, newPresences } 
        }));
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        window.dispatchEvent(new CustomEvent('user-left', { 
          detail: { key, leftPresences } 
        }));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: user.id,
            full_name: user.user_metadata?.full_name || 'Anonymous',
            online_at: new Date().toISOString(),
          });
        }
      });

    channelsRef.current.set('presence', presenceChannel);
    return () => {
      supabase.removeChannel(presenceChannel);
      channelsRef.current.delete('presence');
    };
  }, [user]);

  // Log real-time events for analytics
  const logRealtimeEvent = useCallback(async (eventType: string, payload: any, channelId?: string) => {
    try {
      await supabase
        .from('realtime_event_logs')
        .insert({
          event_type: eventType,
          user_id: user?.id,
          channel_id: channelId,
          event_data: payload,
          delivery_status: 'sent'
        });
    } catch (error) {
      console.error('Error logging realtime event:', error);
    }
  }, [user]);

  // Queue events when offline
  const queueEvent = useCallback((event: RealtimeEvent) => {
    eventQueueRef.current.push(event);
    setSyncStatus(prev => ({
      ...prev,
      queuedEvents: eventQueueRef.current.length
    }));
  }, []);

  // Process queued events when back online
  const processQueuedEvents = useCallback(async () => {
    if (eventQueueRef.current.length === 0) return;

    try {
      const events = [...eventQueueRef.current];
      eventQueueRef.current = [];

      for (const event of events) {
        await logRealtimeEvent(event.type, event.payload, event.channel);
      }

      setSyncStatus(prev => ({
        ...prev,
        queuedEvents: 0,
        lastSyncAt: new Date().toISOString()
      }));

      toast({
        title: "Gesynchroniseerd",
        description: `${events.length} gebeurtenissen verwerkt`,
      });
    } catch (error) {
      console.error('Error processing queued events:', error);
      setSyncStatus(prev => ({
        ...prev,
        failedEvents: prev.failedEvents + eventQueueRef.current.length
      }));
    }
  }, [logRealtimeEvent, toast]);

  // Subscribe to a custom channel
  const subscribeToChannel = useCallback((channelName: string, eventHandlers: Record<string, (payload: any) => void>) => {
    if (!user) return;

    const channel = supabase.channel(channelName);
    
    Object.entries(eventHandlers).forEach(([event, handler]) => {
      if (event.startsWith('postgres_changes:')) {
        const [, changeType, table] = event.split(':');
        channel.on('postgres_changes', {
          event: changeType as any,
          schema: 'public',
          table
        }, handler);
      } else {
        channel.on(event as any, {}, handler);
      }
    });

    channel.subscribe();
    channelsRef.current.set(channelName, channel);

    return () => {
      supabase.removeChannel(channel);
      channelsRef.current.delete(channelName);
    };
  }, [user]);

  // Broadcast real-time event
  const broadcastEvent = useCallback(async (channel: string, event: string, payload: any) => {
    const targetChannel = channelsRef.current.get(channel);
    if (targetChannel) {
      await targetChannel.send({
        type: 'broadcast',
        event,
        payload
      });
    }
  }, []);

  // Setup all real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const cleanupFunctions = [
      setupConnectionMonitoring(),
      setupChatSync(),
      setupProjectSync(),
      setupPresenceSync()
    ];

    // Process queued events when coming back online
    const handleOnline = () => {
      processQueuedEvents();
    };

    window.addEventListener('online', handleOnline);

    return () => {
      cleanupFunctions.forEach(cleanup => cleanup?.());
      window.removeEventListener('online', handleOnline);
      
      // Cleanup all channels
      channelsRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
      channelsRef.current.clear();
    };
  }, [user, setupConnectionMonitoring, setupChatSync, setupProjectSync, setupPresenceSync, processQueuedEvents]);

  return {
    syncStatus,
    subscribeToChannel,
    broadcastEvent,
    queueEvent,
    processQueuedEvents
  };
};