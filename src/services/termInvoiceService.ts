import { supabase } from "@/integrations/supabase/client";
import { Quote } from "@/types/quote";
import { PaymentTerm } from "@/components/quotes/PaymentTermsSelector";

export interface TermInvoiceOptions {
  quote: Quote;
  paymentTerms: PaymentTerm[];
}

export const convertQuoteToTermInvoices = async ({ quote, paymentTerms }: TermInvoiceOptions): Promise<string[]> => {
  try {
    console.log('Converting quote to term invoices:', quote.id, paymentTerms);

    if (!paymentTerms || paymentTerms.length === 0) {
      throw new Error('Geen betaalvoorwaarden gedefinieerd');
    }

    // Validate that payment terms add up to 100%
    const totalPercentage = paymentTerms.reduce((sum, term) => sum + term.percentage, 0);
    if (totalPercentage !== 100) {
      throw new Error(`Betaalvoorwaarden moeten optellen tot 100%, nu ${totalPercentage}%`);
    }

    // Generate base invoice number
    const { data: baseInvoiceNumber, error: numberError } = await supabase.rpc('generate_invoice_number_with_sequence');
    if (numberError) {
      console.error('Error generating invoice number:', numberError);
      throw new Error('Kon geen factuurnummer genereren');
    }

    const invoiceIds: string[] = [];
    const today = new Date();

    // Create invoices for each payment term
    for (let i = 0; i < paymentTerms.length; i++) {
      const term = paymentTerms[i];
      const sequenceNumber = i + 1;
      
      // Calculate due date based on term
      let dueDate = new Date(today);
      if (term.daysAfter) {
        dueDate.setDate(today.getDate() + term.daysAfter + 30); // + 30 days payment period
      } else {
        dueDate.setDate(today.getDate() + 30); // Default 30 days
      }

      // Generate invoice number with sequence
      const { data: invoiceNumber } = await supabase.rpc('generate_invoice_number_with_sequence', {
        base_number: baseInvoiceNumber,
        sequence_num: sequenceNumber
      });

      // Calculate term amounts from quote totals
      const quoteSubtotal = quote.total_amount / 1.21; // Assume 21% VAT
      const quoteVatAmount = quote.total_amount - quoteSubtotal;
      const termSubtotal = (quoteSubtotal * term.percentage) / 100;
      const termVatAmount = (quoteVatAmount * term.percentage) / 100;
      const termTotal = (quote.total_amount * term.percentage) / 100;

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invoiceNumber,
          customer_name: quote.customer_name,
          customer_email: quote.customer_email,
          customer_id: quote.customer_id || null,
          project_title: `${quote.project_title || 'Project'} - ${term.description}`,
          project_id: quote.project_id || null,
          message: `${term.description} (${term.percentage}% van totaal)`,
          source_quote_id: quote.id,
          subtotal: termSubtotal,
          vat_amount: termVatAmount,
          total_amount: termTotal,
          payment_term_sequence: sequenceNumber,
          total_payment_terms: paymentTerms.length,
          original_quote_total: quote.total_amount,
          status: sequenceNumber === 1 ? 'concept' : 'concept', // First invoice active, others scheduled
          due_date: dueDate.toISOString().split('T')[0],
          invoice_date: today.toISOString().split('T')[0],
          user_id: quote.user_id || null
        })
        .select('id')
        .single();

      if (invoiceError) {
        console.error('Error creating invoice:', invoiceError);
        throw new Error(`Fout bij aanmaken factuur ${sequenceNumber}: ${invoiceError.message}`);
      }

      invoiceIds.push(invoice.id);

      // Create invoice items from quote blocks (proportional)
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
                  const proportionalTotal = ((item.total || 0) * term.percentage) / 100;
                  const proportionalUnitPrice = ((item.unit_price || 0) * term.percentage) / 100;
                  
                  invoiceItemInserts.push({
                    invoice_id: invoice.id,
                    type: item.type,
                    description: `${item.description} (${term.percentage}%)`,
                    quantity: item.quantity || 1,
                    unit_price: proportionalUnitPrice,
                    vat_rate: item.vat_rate || 21,
                    total: proportionalTotal,
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
            // Continue with other invoices even if items fail
          }
        }
      }
    }

    console.log('Successfully created term invoices:', invoiceIds);
    return invoiceIds;

  } catch (error) {
    console.error('Error in convertQuoteToTermInvoices:', error);
    throw error;
  }
};