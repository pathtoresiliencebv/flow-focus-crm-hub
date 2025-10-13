
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

    // Create invoice with user_id, project_id, and customer_id
    const invoiceData = {
      invoice_number: invoiceNumber,
      customer_name: quote.customer_name,
      customer_email: quote.customer_email,
      customer_id: quote.customer_id || null,
      project_title: quote.project_title,
      project_id: quote.project_id || null,
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0],
      message: quote.message,
      subtotal: quote.total_amount,
      vat_amount: quote.total_vat_amount,
      total_amount: quote.total_amount + quote.total_vat_amount,
      status: 'concept',
      source_quote_id: quote.id,
      user_id: quote.user_id || null
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

    // Convert quote items to invoice items with enhanced block structure preservation
    const invoiceItems: any[] = [];
    let orderIndex = 0;
    let blockIndex = 0;

    console.log('Processing quote for invoice items with block structure preservation...');
    console.log('Quote blocks:', quote.blocks);

    if (quote.blocks && quote.blocks.length > 0) {
      // Enhanced blocks structure processing with formatting preservation
      console.log('Processing quote blocks with formatting:', quote.blocks);
      
      for (const block of quote.blocks) {
        blockIndex++;
        
        // Add block header with enhanced styling
        invoiceItems.push({
          invoice_id: invoice.id,
          type: 'block_header',
          description: `${block.title}`,
          quantity: null,
          unit_price: null,
          vat_rate: 0,
          total: null,
          order_index: orderIndex++,
          block_title: block.title,
          block_order: blockIndex,
          item_formatting: { 
            is_block_header: true,
            block_type: block.type
          }
        });

        // Add block items with formatting preservation
        if (block.items && block.items.length > 0) {
          for (const item of block.items) {
            const itemFormatting = {
              ...item.formatting,
              block_type: block.type,
              in_block: true
            };

            invoiceItems.push({
              invoice_id: invoice.id,
              type: item.type || 'product',
              description: item.description,
              quantity: item.quantity || null,
              unit_price: item.unit_price || null,
              vat_rate: item.vat_rate || 21,
              total: item.total || null,
              order_index: orderIndex++,
              block_title: block.title,
              block_order: blockIndex,
              item_formatting: itemFormatting
            });
          }
        }
        
        // Add block subtotal if it has products
        const hasProducts = block.items?.some(item => item.type === 'product');
        if (hasProducts && block.subtotal) {
          invoiceItems.push({
            invoice_id: invoice.id,
            type: 'block_subtotal',
            description: `Subtotaal ${block.title}`,
            quantity: null,
            unit_price: null,
            vat_rate: 0,
            total: block.subtotal + (block.vat_amount || 0),
            order_index: orderIndex++,
            block_title: block.title,
            block_order: blockIndex,
            item_formatting: { 
              is_block_subtotal: true,
              subtotal: block.subtotal,
              vat_amount: block.vat_amount
            }
          });
        }
      }
    } else if (quote.items) {
      // Fallback: Handle raw items from database
      console.log('Processing quote raw items with basic block structure:', quote.items);
      
      let parsedItems: any[] = [];
      try {
        if (typeof quote.items === 'string') {
          parsedItems = JSON.parse(quote.items);
        } else if (Array.isArray(quote.items)) {
          parsedItems = quote.items as any[];
        }
      } catch (e) {
        console.error('Error parsing quote items:', e);
        parsedItems = [];
      }

      for (const item of parsedItems) {
        if (item.items && Array.isArray(item.items)) {
          // Block structure from raw data
          blockIndex++;
          
          invoiceItems.push({
            invoice_id: invoice.id,
            type: 'block_header',
            description: item.title || 'Blok',
            quantity: null,
            unit_price: null,
            vat_rate: 0,
            total: null,
            order_index: orderIndex++,
            block_title: item.title || 'Blok',
            block_order: blockIndex,
            item_formatting: { is_block_header: true }
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
              order_index: orderIndex++,
              block_title: item.title || 'Blok',
              block_order: blockIndex,
              item_formatting: blockItem.formatting || {}
            });
          }
        } else {
          // Direct item (old structure)
          invoiceItems.push({
            invoice_id: invoice.id,
            type: item.type || 'product',
            description: item.description,
            quantity: item.quantity || null,
            unit_price: item.unit_price || null,
            vat_rate: item.vat_rate || 21,
            total: item.total || null,
            order_index: orderIndex++,
            block_title: 'Items',
            block_order: 1,
            item_formatting: item.formatting || {}
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
