
import { supabase } from "@/integrations/supabase/client";
import { Quote } from '@/types/quote';

export async function convertQuoteToInvoice(quote: Quote): Promise<string> {
  try {
    // Generate unique invoice number
    const { data: invoiceNumber, error: numberError } = await supabase
      .rpc('generate_invoice_number');

    if (numberError) throw numberError;

    // Calculate due date (30 days from today)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    // Create invoice
    const invoiceData = {
      invoice_number: invoiceNumber,
      customer_name: quote.customer_name,
      customer_email: quote.customer_email,
      project_title: quote.project_title,
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0],
      message: quote.message,
      subtotal: quote.total_amount,
      vat_amount: quote.total_vat_amount,
      total_amount: quote.total_amount + quote.total_vat_amount,
      status: 'concept',
      source_quote_id: quote.id
    };

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert([invoiceData])
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    // Convert quote blocks and items to invoice items
    const invoiceItems: any[] = [];
    let orderIndex = 0;

    if (quote.blocks) {
      for (const block of quote.blocks) {
        // Add block title as a header item
        invoiceItems.push({
          invoice_id: invoice.id,
          type: 'textblock',
          description: `=== ${block.title} ===`,
          quantity: null,
          unit_price: null,
          vat_rate: 0,
          total: null,
          order_index: orderIndex++
        });

        // Add block items
        if (block.items) {
          for (const item of block.items) {
            invoiceItems.push({
              invoice_id: invoice.id,
              type: item.type,
              description: item.description,
              quantity: item.quantity || null,
              unit_price: item.unit_price || null,
              vat_rate: item.vat_rate,
              total: item.total || null,
              order_index: orderIndex++
            });
          }
        }
      }
    }

    // Insert invoice items
    if (invoiceItems.length > 0) {
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(invoiceItems);

      if (itemsError) throw itemsError;
    }

    return invoice.id;
  } catch (error) {
    console.error('Error converting quote to invoice:', error);
    throw error;
  }
}
