import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  is_archived?: boolean;
  archived_at?: string;
  archived_by?: string;
  auto_saved_at?: string;
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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch active invoices
  const { data: invoices = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Invoice[];
    }
  });

  // Fetch archived invoices
  const { data: archivedInvoices = [], isLoading: archivedLoading } = useQuery({
    queryKey: ['invoices', 'archived'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('is_archived', true)
        .order('archived_at', { ascending: false });

      if (error) throw error;
      return data as Invoice[];
    }
  });

  const fetchInvoiceById = async (invoiceId: string): Promise<Invoice | null> => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching invoice:', error);
      return null;
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
      
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
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

  const addInvoice = async (invoiceData: any) => {
    const { data, error } = await supabase
      .from('invoices')
      .insert([invoiceData])
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const updateInvoice = async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('invoices')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const deleteInvoice = async (id: string) => {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);

    if (error) throw error;
  };

  const duplicateInvoice = async (invoiceId: string) => {
    // Get original invoice with items
    const { data: original, error: fetchError } = await supabase
      .from('invoices')
      .select(`
        *,
        invoice_items (*)
      `)
      .eq('id', invoiceId)
      .single();

    if (fetchError) throw fetchError;

    // Generate new invoice number
    const { data: newNumber, error: numberError } = await supabase.rpc('generate_invoice_number');
    if (numberError) throw numberError;

    // Create duplicate invoice
    const duplicateData = {
      ...original,
      id: undefined,
      invoice_number: newNumber,
      status: 'concept',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sent_at: null,
      paid_at: null
    };

    const { data: newInvoice, error: createError } = await supabase
      .from('invoices')
      .insert([duplicateData])
      .select()
      .single();

    if (createError) throw createError;

    // Duplicate invoice items
    if (original.invoice_items?.length > 0) {
      const duplicateItems = original.invoice_items.map((item: any) => ({
        ...item,
        id: undefined,
        invoice_id: newInvoice.id
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(duplicateItems);

      if (itemsError) throw itemsError;
    }

    return newInvoice;
  };

  const archiveInvoice = async (invoiceId: string) => {
    const { error } = await supabase
      .from('invoices')
      .update({ 
        is_archived: true,
        archived_at: new Date().toISOString(),
        archived_by: (await supabase.auth.getUser()).data.user?.id
      })
      .eq('id', invoiceId);

    if (error) throw error;
  };

  const restoreInvoice = async (invoiceId: string) => {
    const { error } = await supabase
      .from('invoices')
      .update({ 
        is_archived: false,
        archived_at: null,
        archived_by: null
      })
      .eq('id', invoiceId);

    if (error) throw error;
  };

  return {
    invoices,
    loading,
    archivedInvoices,
    archivedLoading,
    fetchInvoiceById,
    fetchInvoiceItems,
    updateInvoiceStatus,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    duplicateInvoice,
    archiveInvoice,
    restoreInvoice,
    refetch
  };
}