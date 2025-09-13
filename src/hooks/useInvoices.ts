
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from '@/hooks/use-toast';

export interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_email?: string;
  project_title?: string;
  invoice_date: string;
  due_date: string;
  message?: string;
  subtotal: number;
  vat_amount: number;
  total_amount: number;
  status: string;
  source_quote_id?: string;
  payment_term_sequence?: number;
  total_payment_terms?: number;
  original_quote_total?: number;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  type: string;
  description: string;
  quantity?: number;
  unit_price?: number;
  vat_rate: number;
  total?: number;
  order_index: number;
}

export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast({
        title: "Fout bij ophalen facturen",
        description: "Er is een fout opgetreden bij het ophalen van de facturen.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoiceItems = async (invoiceId: string): Promise<InvoiceItem[]> => {
    try {
      const { data, error } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching invoice items:', error);
      return [];
    }
  };

  const updateInvoiceStatus = async (invoiceId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', invoiceId);

      if (error) throw error;
      
      await fetchInvoices();
      toast({
        title: "Status bijgewerkt",
        description: "De factuurstatus is succesvol bijgewerkt.",
      });
    } catch (error) {
      console.error('Error updating invoice status:', error);
      toast({
        title: "Fout bij bijwerken status",
        description: "Er is een fout opgetreden bij het bijwerken van de status.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  return {
    invoices,
    loading,
    fetchInvoices,
    fetchInvoiceItems,
    updateInvoiceStatus
  };
}
