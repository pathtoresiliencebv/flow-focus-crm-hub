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
  payment_status?: string;
  payment_date?: string;
  payment_method?: string;
  stripe_checkout_session_id?: string;
  stripe_payment_intent_id?: string;
  payment_link_url?: string;
  payment_failure_reason?: string;
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
      const updateData: any = { status, updated_at: new Date().toISOString() };
      
      // If marking as paid, also set payment_date
      if (status === 'betaald') {
        updateData.payment_date = new Date().toISOString();
        updateData.payment_status = 'paid';
      }

      const { error } = await supabase
        .from('invoices')
        .update(updateData)
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

  const deleteInvoiceMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: "Factuur verwijderd",
        description: "De factuur is succesvol verwijderd.",
      });
    },
    onError: (error) => {
      console.error('Error deleting invoice:', error);
      toast({
        title: "Fout bij verwijderen",
        description: "Er is een fout opgetreden bij het verwijderen van de factuur.",
        variant: "destructive",
      });
    }
  });

  const duplicateInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      console.log('🔄 Duplicating invoice:', invoiceId);
      
      // Get original invoice with items
      const { data: original, error: fetchError } = await supabase
        .from('invoices')
        .select(`
          *,
          invoice_items (*)
        `)
        .eq('id', invoiceId)
        .single();

      if (fetchError) {
        console.error('❌ Error fetching original invoice:', fetchError);
        throw fetchError;
      }

      if (!original) {
        throw new Error('Factuur niet gevonden');
      }

      console.log('✅ Original invoice fetched:', {
        id: original.id,
        invoice_number: original.invoice_number,
        items_count: original.invoice_items?.length || 0
      });

      // Generate new invoice number with retry logic
      let newNumber = null;
      let attempts = 0;
      const maxAttempts = 5;
      
      while (attempts < maxAttempts && !newNumber) {
        try {
          const { data, error } = await supabase.rpc('generate_invoice_number');
          if (data && !error) {
            // Verify uniqueness
            const { data: existing } = await supabase
              .from('invoices')
              .select('id')
              .eq('invoice_number', data)
              .maybeSingle();
              
            if (!existing) {
              newNumber = data;
              console.log('✅ Generated unique invoice number:', newNumber);
              break;
            }
          }
        } catch (error) {
          console.error(`Invoice number generation attempt ${attempts + 1} failed:`, error);
        }
        attempts++;
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 200 * attempts));
      }
      
      // Fallback if all attempts failed
      if (!newNumber) {
        newNumber = `FACT-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}-DUP`;
        console.warn('⚠️ Using fallback invoice number:', newNumber);
      }

      // Prepare duplicate data (exclude invoice_items from spread)
      const { invoice_items, ...invoiceDataWithoutItems } = original;

      // Create duplicate invoice
      const duplicateData = {
        ...invoiceDataWithoutItems,
        id: undefined,
        invoice_number: newNumber,
        status: 'concept',
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +30 days
        created_at: undefined, // Let database handle
        updated_at: undefined, // Let database handle
        // Reset payment/sending data
        sent_at: null,
        paid_at: null,
        payment_date: null,
        payment_status: 'pending',
        // Reset signatures (pdf_url removed - column doesn't exist in schema)
        admin_signature_data: null,
        client_signature_data: null,
        client_signed_at: null,
      };

      console.log('📝 Inserting duplicate invoice:', {
        invoice_number: duplicateData.invoice_number,
        customer_id: duplicateData.customer_id
      });

      const { data: newInvoice, error: createError } = await supabase
        .from('invoices')
        .insert([duplicateData])
        .select()
        .single();

      if (createError) {
        console.error('❌ Error inserting duplicate invoice:', createError);
        throw createError;
      }

      console.log('✅ Invoice created:', newInvoice.id);

      // Duplicate invoice items
      if (invoice_items && invoice_items.length > 0) {
        console.log(`📝 Duplicating ${invoice_items.length} invoice items...`);
        
        const duplicateItems = invoice_items.map((item: any) => {
          // Deep clone to avoid reference issues
          const { id, invoice_id, created_at, updated_at, ...itemData } = item;
          return {
            ...itemData,
            invoice_id: newInvoice.id
          };
        });

        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(duplicateItems);

        if (itemsError) {
          console.error('❌ Error inserting invoice items:', itemsError);
          throw itemsError;
        }

        console.log('✅ Invoice items duplicated successfully');
      }

      console.log('✅ Invoice duplicated successfully:', newInvoice.id);
      return newInvoice;
    },
    onSuccess: (newInvoice) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: "✅ Factuur gedupliceerd",
        description: `Nieuwe factuur ${newInvoice.invoice_number} is aangemaakt`,
      });
    },
    onError: (error: any) => {
      console.error('❌ Error duplicating invoice:', error);
      toast({
        title: "❌ Fout bij dupliceren",
        description: error.message || "Er is een fout opgetreden bij het dupliceren van de factuur.",
        variant: "destructive",
      });
    }
  });

  const archiveInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      const { error } = await supabase
        .from('invoices')
        .update({ 
          is_archived: true,
          archived_at: new Date().toISOString(),
          archived_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', invoiceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoices', 'archived'] });
      toast({
        title: "Factuur gearchiveerd",
        description: "De factuur is succesvol gearchiveerd.",
      });
    },
    onError: (error) => {
      console.error('Error archiving invoice:', error);
      toast({
        title: "Fout bij archiveren",
        description: "Er is een fout opgetreden bij het archiveren van de factuur.",
        variant: "destructive",
      });
    }
  });

  const restoreInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      const { error } = await supabase
        .from('invoices')
        .update({ 
          is_archived: false,
          archived_at: null,
          archived_by: null
        })
        .eq('id', invoiceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoices', 'archived'] });
      toast({
        title: "Factuur hersteld",
        description: "De factuur is succesvol hersteld.",
      });
    },
    onError: (error) => {
      console.error('Error restoring invoice:', error);
      toast({
        title: "Fout bij herstellen",
        description: "Er is een fout opgetreden bij het herstellen van de factuur.",
        variant: "destructive",
      });
    }
  });

  const sendPaymentReminder = async (invoice: Invoice) => {
    try {
      console.log('📧 Sending payment reminder for invoice:', invoice.id, invoice.invoice_number);
      
      const { data, error } = await supabase.functions.invoke('send-payment-reminder', {
        body: {
          invoiceId: invoice.id,        // ✅ CORRECT parameter name
          reminderNumber: 1             // ✅ Always send first reminder
        }
      });

      if (error) {
        console.error('❌ Payment reminder error:', error);
        throw error;
      }
      
      console.log('✅ Payment reminder sent successfully:', data);
      
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: "Herinnering verstuurd",
        description: `Betalingsherinnering verstuurd naar ${invoice.customer_email}`,
      });
    } catch (error) {
      console.error('❌ Error sending payment reminder:', error);
      toast({
        title: "Fout bij versturen herinnering",
        description: "Er is een fout opgetreden bij het versturen van de betalingsherinnering.",
        variant: "destructive",
      });
    }
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
    deleteInvoice: (id: string) => deleteInvoiceMutation.mutate(id),
    duplicateInvoice: (id: string) => duplicateInvoiceMutation.mutate(id),
    archiveInvoice: (id: string) => archiveInvoiceMutation.mutate(id),
    restoreInvoice: (id: string) => restoreInvoiceMutation.mutate(id),
    sendPaymentReminder,
    refetch
  };
}