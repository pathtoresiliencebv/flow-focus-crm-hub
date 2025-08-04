import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface InvoicePayment {
  id: string;
  invoice_id: string;
  invoice_number: string;
  amount: number;
  payment_method: string;
  stripe_payment_id?: string;
  stripe_payment_intent_id?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  paid_at?: string;
  created_at: string;
  metadata?: any;
}

export interface PaymentLinkRequest {
  invoiceNumber: string;
  customerName: string;
  customerEmail?: string;
  total: number;
}

export const usePayments = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);

  // Get all payments for an invoice
  const useInvoicePayments = (invoiceNumber: string) => {
    return useQuery({
      queryKey: ['invoice-payments', invoiceNumber],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('invoice_payments')
          .select('*')
          .eq('invoice_number', invoiceNumber)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data as InvoicePayment[];
      },
      enabled: !!invoiceNumber,
    });
  };

  // Create payment link
  const createPaymentLink = useMutation({
    mutationFn: async (paymentData: PaymentLinkRequest) => {
      setIsCreatingPayment(true);
      
      const { data, error } = await supabase.functions.invoke('create-invoice-payment', {
        body: { invoiceData: paymentData }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Betalingslink aangemaakt",
        description: `Betalingslink voor factuur ${variables.invoiceNumber} is succesvol aangemaakt.`,
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-payments', variables.invoiceNumber] });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij aanmaken betalingslink",
        description: error.message || "Er is een onbekende fout opgetreden.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsCreatingPayment(false);
    },
  });

  // Get payment status for invoice
  const getPaymentStatus = async (invoiceNumber: string) => {
    const { data, error } = await supabase
      .from('invoice_payments')
      .select('*')
      .eq('invoice_number', invoiceNumber)
      .eq('status', 'completed')
      .order('paid_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    return data.length > 0 ? 'paid' : 'unpaid';
  };

  // Send payment reminder
  const sendPaymentReminder = useMutation({
    mutationFn: async ({ invoiceNumber, customerEmail }: { invoiceNumber: string; customerEmail: string }) => {
      const { data, error } = await supabase.functions.invoke('send-payment-reminder', {
        body: { invoiceNumber, customerEmail }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Betalingsherinnering verzonden",
        description: `Herinnering voor factuur ${variables.invoiceNumber} is verzonden naar ${variables.customerEmail}.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij verzenden herinnering",
        description: error.message || "Er is een onbekende fout opgetreden.",
        variant: "destructive",
      });
    },
  });

  // Check if invoice is paid
  const isInvoicePaid = (payments: InvoicePayment[]) => {
    return payments.some(payment => payment.status === 'completed');
  };

  // Get total paid amount for invoice
  const getTotalPaidAmount = (payments: InvoicePayment[]) => {
    return payments
      .filter(payment => payment.status === 'completed')
      .reduce((total, payment) => total + payment.amount, 0);
  };

  // Get payment method display name
  const getPaymentMethodDisplay = (method: string) => {
    switch (method) {
      case 'stripe':
        return 'Online betaling (Stripe)';
      case 'bank_transfer':
        return 'Bankoverschrijving';
      case 'cash':
        return 'Contant';
      case 'ideal':
        return 'iDEAL';
      default:
        return method;
    }
  };

  return {
    useInvoicePayments,
    createPaymentLink,
    sendPaymentReminder,
    getPaymentStatus,
    isInvoicePaid,
    getTotalPaidAmount,
    getPaymentMethodDisplay,
    isCreatingPayment,
  };
};