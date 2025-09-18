import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StripeAccount {
  id: string;
  display_name: string;
  country: string;
  business_type: string;
  email: string;
}

interface StripeBalance {
  available: number;
  currency: string;
}

interface StripeProduct {
  id: string;
  name: string;
  active: boolean;
}

interface StripePrice {
  id: string;
  unit_amount: number | null;
  currency: string;
  type: string;
}

interface StripeConfigData {
  success: boolean;
  account?: StripeAccount;
  webhookConfigured?: boolean;
  balance?: StripeBalance;
  products?: StripeProduct[];
  prices?: StripePrice[];
  testDate?: string;
  error?: string;
}

export const useStripeConfig = () => {
  const [configData, setConfigData] = useState<StripeConfigData | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { toast } = useToast();

  const testStripeConfig = useCallback(async () => {
    setLoading(true);
    try {
      console.log('Testing Stripe configuration...');
      
      const { data, error } = await supabase.functions.invoke('stripe-config-test');

      if (error) {
        console.error('Stripe config test error:', error);
        throw new Error(error.message || 'Failed to test Stripe configuration');
      }

      console.log('Stripe config test response:', data);
      setConfigData(data);
      setLastUpdated(new Date());

      if (data.success) {
        toast({
          title: "Stripe Configuratie Getest",
          description: `Verbonden met account: ${data.account?.display_name || 'Unknown'}`,
        });
      } else {
        toast({
          title: "Stripe Test Mislukt",
          description: data.error || 'Onbekende fout bij testen van Stripe configuratie',
          variant: "destructive",
        });
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to test Stripe config:', errorMessage);
      
      setConfigData({
        success: false,
        error: errorMessage
      });

      toast({
        title: "Stripe Test Fout",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Auto-test on first load
  useEffect(() => {
    testStripeConfig();
  }, [testStripeConfig]);

  const getConnectionStatus = () => {
    if (loading) return 'testing';
    if (!configData) return 'unknown';
    return configData.success ? 'connected' : 'error';
  };

  const getStatusColor = () => {
    const status = getConnectionStatus();
    switch (status) {
      case 'connected': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'testing': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = () => {
    const status = getConnectionStatus();
    switch (status) {
      case 'connected': return 'Verbonden';
      case 'error': return 'Fout';
      case 'testing': return 'Testen...';
      default: return 'Onbekend';
    }
  };

  return {
    configData,
    loading,
    lastUpdated,
    testStripeConfig,
    getConnectionStatus,
    getStatusColor,
    getStatusText,
    isConnected: configData?.success === true,
    error: configData?.error
  };
};