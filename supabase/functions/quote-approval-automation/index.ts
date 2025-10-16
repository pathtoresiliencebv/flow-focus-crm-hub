import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QuoteApprovalRequest {
  quote_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { quote_id }: QuoteApprovalRequest = await req.json();

    console.log('Starting quote approval automation for quote:', quote_id);

    // 1. Get the approved quote
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', quote_id)
      .in('status', ['approved', 'goedgekeurd'])
      .single();

    if (quoteError || !quote) {
      console.error('Quote not found or not approved:', quoteError);
      return new Response(JSON.stringify({ error: 'Quote not found or not approved' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 2. Check if project already exists for this quote
    const { data: existingProject } = await supabase
      .from('projects')
      .select('id')
      .eq('quote_id', quote_id)
      .single();

    if (existingProject) {
      console.log('Project already exists for this quote');
      return new Response(JSON.stringify({ 
        success: true, 
        project_id: existingProject.id,
        message: 'Project already exists' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 3. Find or create customer
    let customerId = null;
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('name', quote.customer_name)
      .eq('email', quote.customer_email || '')
      .single();

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          name: quote.customer_name,
          email: quote.customer_email,
          status: 'Actief'
        })
        .select('id')
        .single();

      if (customerError) {
        console.error('Error creating customer:', customerError);
        return new Response(JSON.stringify({ error: 'Failed to create customer' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      customerId = newCustomer.id;
    }

    // 4. Create project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        title: quote.project_title || `Project voor ${quote.customer_name}`,
        description: quote.message,
        customer_id: customerId,
        quote_id: quote_id,
        project_status: 'te-plannen',
        status: 'te-plannen',
        value: quote.total_amount,
        date: new Date().toISOString().split('T')[0]
      })
      .select('id')
      .single();

    if (projectError) {
      console.error('Error creating project:', projectError);
      return new Response(JSON.stringify({ error: 'Failed to create project' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Created project:', project.id);

    // 5. Convert quote blocks to project tasks
    let parsedItems: any[] = [];
    if (quote.items) {
      if (typeof quote.items === 'string') {
        parsedItems = JSON.parse(quote.items);
      } else if (Array.isArray(quote.items)) {
        parsedItems = quote.items;
      }
    }

    const taskInserts: any[] = [];
    let orderIndex = 0;

    // Check if items contain blocks structure
    if (parsedItems.length > 0 && parsedItems[0] && typeof parsedItems[0] === 'object' && parsedItems[0].items) {
      // New blocks structure
      for (const block of parsedItems) {
        for (const item of block.items || []) {
          taskInserts.push({
            project_id: project.id,
            block_title: block.title || 'Untitled Block',
            task_description: item.description,
            is_info_block: item.type === 'textblock',
            info_text: item.type === 'textblock' ? item.description : null,
            is_completed: false,
            order_index: orderIndex++,
            source_quote_item_id: item.id
          });
        }
      }
    } else {
      // Old flat structure - create single block
      for (const item of parsedItems) {
        taskInserts.push({
          project_id: project.id,
          block_title: 'Items',
          task_description: item.description,
          is_info_block: item.type === 'textblock',
          info_text: item.type === 'textblock' ? item.description : null,
          is_completed: false,
          order_index: orderIndex++,
          source_quote_item_id: item.id
        });
      }
    }

    if (taskInserts.length > 0) {
      const { error: tasksError } = await supabase
        .from('project_tasks')
        .insert(taskInserts);

      if (tasksError) {
        console.error('Error creating project tasks:', tasksError);
      } else {
        console.log('Created', taskInserts.length, 'project tasks');
      }
    }

    // 6. Check if quote has payment terms for enhanced invoice creation
    let paymentTerms: any[] = [];
    try {
      if (quote.payment_terms && typeof quote.payment_terms === 'string') {
        paymentTerms = JSON.parse(quote.payment_terms);
      } else if (Array.isArray(quote.payment_terms)) {
        paymentTerms = quote.payment_terms;
      }
    } catch (error) {
      console.log('No payment terms found, using single invoice');
    }

    let invoiceId: string | null = null;

    // Generate invoices based on payment terms
    if (paymentTerms && paymentTerms.length > 1) {
      // Create term invoices
      const { data: baseInvoiceNumber } = await supabase.rpc('generate_invoice_number_with_sequence');
      const invoiceIds: string[] = [];

      for (let i = 0; i < paymentTerms.length; i++) {
        const term = paymentTerms[i];
        const sequenceNumber = i + 1;
        
        const { data: invoiceNumber } = await supabase.rpc('generate_invoice_number_with_sequence', {
          base_number: baseInvoiceNumber,
          sequence_num: sequenceNumber
        });
        
        const quoteSubtotal = quote.total_amount / 1.21; // Assume 21% VAT
        const quoteVatAmount = quote.total_amount - quoteSubtotal;
        const termSubtotal = (quoteSubtotal * term.percentage) / 100;
        const termVatAmount = (quoteVatAmount * term.percentage) / 100;
        const termTotal = (quote.total_amount * term.percentage) / 100;

        const { data: invoice, error: invoiceError } = await supabase
          .from('invoices')
          .insert({
            invoice_number: invoiceNumber,
            customer_name: quote.customer_name,
            customer_email: quote.customer_email,
            customer_id: customerId,
            project_title: `${quote.project_title || 'Project'} - ${term.description}`,
            project_id: project.id,
            message: `${term.description} (${term.percentage}% van totaal)`,
            source_quote_id: quote_id,
            subtotal: termSubtotal,
            vat_amount: termVatAmount,
            total_amount: termTotal,
            payment_term_sequence: sequenceNumber,
            total_payment_terms: paymentTerms.length,
            original_quote_total: quote.total_amount,
            status: 'concept',
            due_date: new Date(Date.now() + (30 + (term.daysAfter || 0)) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            invoice_date: new Date().toISOString().split('T')[0],
            user_id: quote.user_id || null
          })
          .select('id')
          .single();

        if (!invoiceError && invoice) {
          invoiceIds.push(invoice.id);
          if (i === 0) invoiceId = invoice.id;
        }
      }
      
      console.log('Created', invoiceIds.length, 'term invoices');
    } else {
      // Single invoice (original behavior)
      const { data: invoiceNumberResult } = await supabase.rpc('generate_invoice_number');
      const invoiceNumber = invoiceNumberResult || `INV-${new Date().getFullYear()}-${Date.now()}`;

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invoiceNumber,
          customer_name: quote.customer_name,
          customer_email: quote.customer_email,
          customer_id: customerId,
          project_title: quote.project_title,
          project_id: project.id,
          message: quote.message,
          source_quote_id: quote_id,
          subtotal: quote.total_amount / 1.21,
          vat_amount: quote.total_amount - (quote.total_amount / 1.21),
          total_amount: quote.total_amount,
          status: 'concept',
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          invoice_date: new Date().toISOString().split('T')[0],
          user_id: quote.user_id || null
        })
        .select('id')
        .single();

      if (invoiceError) {
        console.error('Error creating invoice:', invoiceError);
      } else {
        console.log('Created concept invoice:', invoice.id);
        invoiceId = invoice.id;

        const invoiceItemInserts: any[] = [];
        orderIndex = 0;

        if (parsedItems.length > 0 && parsedItems[0] && typeof parsedItems[0] === 'object' && parsedItems[0].items) {
          for (const block of parsedItems) {
            for (const item of block.items || []) {
              if (item.type === 'product') {
                invoiceItemInserts.push({
                  invoice_id: invoice.id,
                  description: item.description,
                  quantity: item.quantity || 1,
                  unit_price: item.unit_price || 0,
                  vat_rate: item.vat_rate || 21,
                  total: item.total || 0,
                  type: item.type,
                  order_index: orderIndex++
                });
              }
            }
          }
        } else {
          for (const item of parsedItems) {
            if (item.type === 'product') {
              invoiceItemInserts.push({
                invoice_id: invoice.id,
                description: item.description,
                quantity: item.quantity || 1,
                unit_price: item.unit_price || 0,
                vat_rate: item.vat_rate || 21,
                total: item.total || 0,
                type: item.type,
                order_index: orderIndex++
              });
            }
          }
        }

        if (invoiceItemInserts.length > 0) {
          const { error: invoiceItemsError } = await supabase
            .from('invoice_items')
            .insert(invoiceItemInserts);

          if (invoiceItemsError) {
            console.error('Error creating invoice items:', invoiceItemsError);
          } else {
            console.log('Created', invoiceItemInserts.length, 'invoice items');
          }
        }
      }
    }

    // 7. Send confirmation email to customer
    try {
      const { error: confirmationEmailError } = await supabase.functions.invoke('send-quote-confirmation-email', {
        body: {
          quoteId: quote_id
        }
      });

      if (confirmationEmailError) {
        console.error('Error sending customer confirmation email:', confirmationEmailError);
      } else {
        console.log('Customer confirmation email sent successfully');
      }
    } catch (confirmationEmailError) {
      console.error('Failed to send customer confirmation email:', confirmationEmailError);
    }

    // 8. Send notification email to admin with PDF attachment
    try {
      const { error: emailError } = await supabase.functions.invoke('send-quote-email', {
        body: {
          quoteId: quote_id,
          recipientEmail: 'admin@smanscrm.nl',
          recipientName: 'SMANS Administratie',
          subject: `Offerte ${quote.quote_number} goedgekeurd door ${quote.customer_name}`,
          message: `Goed nieuws! De offerte ${quote.quote_number} voor klant ${quote.customer_name} is zojuist goedgekeurd. Het project en concept factuur zijn automatisch aangemaakt in het systeem.`
        }
      });

      if (emailError) {
        console.error('Error sending notification email:', emailError);
      } else {
        console.log('Notification email sent successfully');
      }
    } catch (emailError) {
      console.error('Failed to send notification email:', emailError);
    }

    console.log('Quote approval automation completed successfully');

    return new Response(JSON.stringify({
      success: true,
      project_id: project.id,
      invoice_id: invoiceId,
      message: 'Project and concept invoice created successfully, confirmation and notification emails sent'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error in quote approval automation:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

serve(handler);


