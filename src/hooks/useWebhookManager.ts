import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface WebhookEndpoint {
  id: string;
  user_id: string;
  name: string;
  url: string;
  secret_key?: string;
  event_types: string[];
  is_active: boolean;
  last_triggered_at?: string;
  created_at: string;
  updated_at: string;
}

export interface WebhookEvent {
  type: string;
  data: any;
  timestamp: string;
  source: string;
}

export const useWebhookManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [loading, setLoading] = useState(true);

  // Load user webhooks
  const loadWebhooks = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('webhook_endpoints')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setWebhooks(data || []);
    } catch (error) {
      console.error('Error loading webhooks:', error);
      toast({
        title: "Fout",
        description: "Kon webhooks niet laden",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Create webhook
  const createWebhook = useCallback(async (webhook: Omit<WebhookEndpoint, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'last_triggered_at'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('webhook_endpoints')
        .insert({
          ...webhook,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      setWebhooks(prev => [data, ...prev]);
      
      toast({
        title: "Webhook aangemaakt",
        description: `Webhook "${webhook.name}" is succesvol aangemaakt`,
      });

      return data;
    } catch (error) {
      console.error('Error creating webhook:', error);
      toast({
        title: "Fout",
        description: "Kon webhook niet aanmaken",
        variant: "destructive"
      });
      return null;
    }
  }, [user, toast]);

  // Update webhook
  const updateWebhook = useCallback(async (id: string, updates: Partial<WebhookEndpoint>) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('webhook_endpoints')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setWebhooks(prev => 
        prev.map(webhook => 
          webhook.id === id ? { ...webhook, ...data } : webhook
        )
      );

      toast({
        title: "Webhook bijgewerkt",
        description: "Webhook instellingen zijn opgeslagen",
      });

      return true;
    } catch (error) {
      console.error('Error updating webhook:', error);
      toast({
        title: "Fout",
        description: "Kon webhook niet bijwerken",
        variant: "destructive"
      });
      return false;
    }
  }, [user, toast]);

  // Delete webhook
  const deleteWebhook = useCallback(async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('webhook_endpoints')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setWebhooks(prev => prev.filter(webhook => webhook.id !== id));
      
      toast({
        title: "Webhook verwijderd",
        description: "Webhook is succesvol verwijderd",
      });

      return true;
    } catch (error) {
      console.error('Error deleting webhook:', error);
      toast({
        title: "Fout",
        description: "Kon webhook niet verwijderen",
        variant: "destructive"
      });
      return false;
    }
  }, [user, toast]);

  // Test webhook
  const testWebhook = useCallback(async (id: string) => {
    if (!user) return false;

    try {
      const webhook = webhooks.find(w => w.id === id);
      if (!webhook) return false;

      const testEvent: WebhookEvent = {
        type: 'webhook.test',
        data: {
          webhook_id: id,
          webhook_name: webhook.name,
          test_message: 'Dit is een test webhook van FlowFocus CRM'
        },
        timestamp: new Date().toISOString(),
        source: 'flowfocus-crm'
      };

      const { error } = await supabase.functions.invoke('webhook-processor', {
        body: {
          type: 'send_webhook',
          webhook_id: id,
          event: testEvent
        }
      });

      if (error) throw error;

      toast({
        title: "Test webhook verzonden",
        description: "Controleer je endpoint voor de test data",
      });

      return true;
    } catch (error) {
      console.error('Error testing webhook:', error);
      toast({
        title: "Fout",
        description: "Kon test webhook niet verzenden",
        variant: "destructive"
      });
      return false;
    }
  }, [webhooks, user, toast]);

  // Send webhook event
  const sendWebhookEvent = useCallback(async (eventType: string, eventData: any, targetWebhooks?: string[]) => {
    if (!user) return false;

    try {
      const relevantWebhooks = webhooks.filter(webhook => 
        webhook.is_active && 
        webhook.event_types.includes(eventType) &&
        (!targetWebhooks || targetWebhooks.includes(webhook.id))
      );

      if (relevantWebhooks.length === 0) return true;

      const event: WebhookEvent = {
        type: eventType,
        data: eventData,
        timestamp: new Date().toISOString(),
        source: 'flowfocus-crm'
      };

      const promises = relevantWebhooks.map(webhook =>
        supabase.functions.invoke('webhook-processor', {
          body: {
            type: 'send_webhook',
            webhook_id: webhook.id,
            event
          }
        })
      );

      await Promise.allSettled(promises);
      return true;
    } catch (error) {
      console.error('Error sending webhook event:', error);
      return false;
    }
  }, [webhooks, user]);

  // Generate secret key
  const generateSecretKey = useCallback(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }, []);

  // Available event types
  const availableEventTypes = [
    'project.created',
    'project.updated',
    'project.completed',
    'quote.created',
    'quote.approved',
    'quote.rejected',
    'invoice.created',
    'invoice.paid',
    'chat.message',
    'task.completed',
    'delivery.completed',
    'user.login',
    'system.error'
  ];

  // Load webhooks on mount
  useEffect(() => {
    if (user) {
      loadWebhooks();
    }
  }, [user, loadWebhooks]);

  return {
    webhooks,
    loading,
    createWebhook,
    updateWebhook,
    deleteWebhook,
    testWebhook,
    sendWebhookEvent,
    generateSecretKey,
    availableEventTypes,
    loadWebhooks
  };
};