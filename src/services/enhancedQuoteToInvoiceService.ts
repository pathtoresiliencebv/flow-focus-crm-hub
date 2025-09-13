import { supabase } from "@/integrations/supabase/client";
import { Quote } from "@/types/quote";
import { PaymentTerm } from "@/components/quotes/PaymentTermsSelector";
import { convertQuoteToTermInvoices } from "./termInvoiceService";

export interface EnhancedQuoteToInvoiceOptions {
  quote: Quote;
  paymentTerms?: PaymentTerm[];
  useTermInvoices?: boolean;
}

export const enhancedConvertQuoteToInvoice = async ({ 
  quote, 
  paymentTerms, 
  useTermInvoices = false 
}: EnhancedQuoteToInvoiceOptions): Promise<string[]> => {
  
  // If payment terms are provided and user wants term invoices
  if (useTermInvoices && paymentTerms && paymentTerms.length > 1) {
    console.log('Converting to term invoices');
    return await convertQuoteToTermInvoices({ quote, paymentTerms });
  }
  
  // Otherwise, create single invoice (original behavior)
  console.log('Converting to single invoice');
  
  try {
    // Generate invoice number
    const { data: invoiceNumber, error: numberError } = await supabase.rpc('generate_invoice_number');
    if (numberError) {
      console.error('Error generating invoice number:', numberError);
      throw new Error('Kon geen factuurnummer genereren');
    }

    // Calculate due date (30 days from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    // Calculate amounts from quote totals
    const subtotal = quote.total_amount / 1.21; // Assume 21% VAT
    const vatAmount = quote.total_amount - subtotal;

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        invoice_number: invoiceNumber,
        customer_name: quote.customer_name,
        customer_email: quote.customer_email,
        project_title: quote.project_title,
        message: quote.message,
        source_quote_id: quote.id,
        subtotal: subtotal,
        vat_amount: vatAmount,
        total_amount: quote.total_amount,
        payment_term_sequence: 1,
        total_payment_terms: 1,
        original_quote_total: quote.total_amount,
        status: 'concept',
        due_date: dueDate.toISOString().split('T')[0],
        invoice_date: new Date().toISOString().split('T')[0]
      })
      .select('id')
      .single();

    if (invoiceError) {
      console.error('Error creating invoice:', invoiceError);
      throw new Error(`Fout bij aanmaken factuur: ${invoiceError.message}`);
    }

    // Create invoice items from quote blocks
    if (quote.items && typeof quote.items === 'string') {
      const quoteBlocks = JSON.parse(quote.items);
      const invoiceItemInserts = [];
      let orderIndex = 0;

      // Process blocks structure
      if (Array.isArray(quoteBlocks) && quoteBlocks.length > 0) {
        for (const block of quoteBlocks) {
          // Add block header
          invoiceItemInserts.push({
            invoice_id: invoice.id,
            type: 'block_header',
            description: `=== ${block.title || 'Blok'} ===`,
            quantity: 1,
            unit_price: 0,
            vat_rate: 0,
            total: 0,
            order_index: orderIndex++,
            block_title: block.title,
            block_order: orderIndex
          });

          // Add block items
          if (block.items && Array.isArray(block.items)) {
            for (const item of block.items) {
              if (item.type === 'product') {
                invoiceItemInserts.push({
                  invoice_id: invoice.id,
                  type: item.type,
                  description: item.description,
                  quantity: item.quantity || 1,
                  unit_price: item.unit_price || 0,
                  vat_rate: item.vat_rate || 21,
                  total: item.total || 0,
                  order_index: orderIndex++,
                  item_formatting: item.formatting,
                  block_title: block.title,
                  block_order: orderIndex
                });
              } else if (item.type === 'textblock') {
                invoiceItemInserts.push({
                  invoice_id: invoice.id,
                  type: item.type,
                  description: item.description,
                  quantity: 1,
                  unit_price: 0,
                  vat_rate: 0,
                  total: 0,
                  order_index: orderIndex++,
                  item_formatting: item.formatting,
                  block_title: block.title,
                  block_order: orderIndex
                });
              }
            }
          }
        }
      }

      // Insert invoice items
      if (invoiceItemInserts.length > 0) {
        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(invoiceItemInserts);

        if (itemsError) {
          console.error('Error creating invoice items:', itemsError);
          // Continue even if items fail
        }
      }
    }

    console.log('Successfully created single invoice:', invoice.id);
    return [invoice.id];

  } catch (error) {
    console.error('Error in enhancedConvertQuoteToInvoice:', error);
    throw error;
  }
};
