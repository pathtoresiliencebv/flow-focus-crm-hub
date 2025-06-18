
import { supabase } from "@/integrations/supabase/client";
import { Quote } from '@/types/quote';

export async function convertQuoteToInvoice(quote: Quote): Promise<string> {
  try {
    console.log('Starting quote to invoice conversion for quote:', quote.id);
    console.log('Quote data:', quote);

    // Generate unique invoice number
    const { data: invoiceNumber, error: numberError } = await supabase
      .rpc('generate_invoice_number');

    if (numberError) {
      console.error('Error generating invoice number:', numberError);
      throw numberError;
    }

    console.log('Generated invoice number:', invoiceNumber);

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

    console.log('Creating invoice with data:', invoiceData);

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert([invoiceData])
      .select()
      .single();

    if (invoiceError) {
      console.error('Error creating invoice:', invoiceError);
      throw invoiceError;
    }

    console.log('Created invoice:', invoice);

    // Convert quote items to invoice items
    const invoiceItems: any[] = [];
    let orderIndex = 0;

    // Handle different quote data structures
    let quoteItems: any[] = [];
    
    if (quote.blocks && quote.blocks.length > 0) {
      // New blocks structure
      console.log('Processing quote blocks:', quote.blocks);
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
        if (block.items && block.items.length > 0) {
          for (const item of block.items) {
            invoiceItems.push({
              invoice_id: invoice.id,
              type: item.type || 'product',
              description: item.description,
              quantity: item.quantity || null,
              unit_price: item.unit_price || null,
              vat_rate: item.vat_rate || 21,
              total: item.total || null,
              order_index: orderIndex++
            });
          }
        }
      }
    } else if (quote.items && Array.isArray(quote.items)) {
      // Handle items from database - could be old flat structure or blocks
      console.log('Processing quote items from database:', quote.items);
      
      for (const item of quote.items) {
        if (item.items && Array.isArray(item.items)) {
          // This is a block structure
          invoiceItems.push({
            invoice_id: invoice.id,
            type: 'textblock',
            description: `=== ${item.title || 'Blok'} ===`,
            quantity: null,
            unit_price: null,
            vat_rate: 0,
            total: null,
            order_index: orderIndex++
          });

          // Add block items
          for (const blockItem of item.items) {
            invoiceItems.push({
              invoice_id: invoice.id,
              type: blockItem.type || 'product',
              description: blockItem.description,
              quantity: blockItem.quantity || null,
              unit_price: blockItem.unit_price || null,
              vat_rate: blockItem.vat_rate || 21,
              total: blockItem.total || null,
              order_index: orderIndex++
            });
          }
        } else {
          // This is a direct item (old structure)
          invoiceItems.push({
            invoice_id: invoice.id,
            type: item.type || 'product',
            description: item.description,
            quantity: item.quantity || null,
            unit_price: item.unit_price || null,
            vat_rate: item.vat_rate || 21,
            total: item.total || null,
            order_index: orderIndex++
          });
        }
      }
    } else {
      console.warn('No quote items found to convert');
    }

    console.log('Invoice items to insert:', invoiceItems);

    // Insert invoice items
    if (invoiceItems.length > 0) {
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(invoiceItems);

      if (itemsError) {
        console.error('Error inserting invoice items:', itemsError);
        throw itemsError;
      }

      console.log('Successfully inserted', invoiceItems.length, 'invoice items');
    } else {
      console.warn('No invoice items to insert');
    }

    console.log('Quote to invoice conversion completed successfully');
    return invoice.id;
  } catch (error) {
    console.error('Error converting quote to invoice:', error);
    throw error;
  }
}
