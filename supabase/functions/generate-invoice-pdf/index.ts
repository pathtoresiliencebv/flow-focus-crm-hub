import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateInvoicePDFRequest {
  invoiceId: string;
  includePayment?: boolean;
  paymentUrl?: string;
  qrCodeDataUrl?: string;
}

const generateInvoiceHTML = (invoice: any, settings: any, paymentData?: { paymentUrl: string; qrCodeDataUrl: string }) => {
  const blocks = invoice.items || [];
  let blocksHTML = '';
  
  if (Array.isArray(blocks)) {
    blocks.forEach((block: any) => {
      if (block.items && Array.isArray(block.items)) {
        // Block structure
        blocksHTML += `
          <div class="invoice-block">
            <h3 class="block-title">${block.title || 'Blok'}</h3>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Omschrijving</th>
                  <th>Aantal</th>
                  <th>Prijs</th>
                  <th>BTW</th>
                  <th>Totaal</th>
                </tr>
              </thead>
              <tbody>
        `;
        
        block.items.forEach((item: any) => {
          if (item.type === 'product') {
            blocksHTML += `
              <tr>
                <td>${item.description || ''}</td>
                <td>${item.quantity || 1}</td>
                <td>€${(item.unit_price || 0).toFixed(2)}</td>
                <td>${item.vat_rate || 21}%</td>
                <td>€${(item.total || 0).toFixed(2)}</td>
              </tr>
            `;
          } else if (item.type === 'textblock') {
            blocksHTML += `
              <tr>
                <td colspan="5" class="text-block">${item.description || ''}</td>
              </tr>
            `;
          }
        });
        
        blocksHTML += `
              </tbody>
            </table>
            <div class="block-total">
              <strong>Blok totaal: €${(block.subtotal || 0).toFixed(2)}</strong>
            </div>
          </div>
        `;
      } else {
        // Legacy flat structure
        if (block.type === 'product') {
          blocksHTML += `
            <tr>
              <td>${block.description || ''}</td>
              <td>${block.quantity || 1}</td>
              <td>€${(block.unit_price || 0).toFixed(2)}</td>
              <td>${block.vat_rate || 21}%</td>
              <td>€${(block.total || 0).toFixed(2)}</td>
            </tr>
          `;
        } else if (block.type === 'textblock') {
          blocksHTML += `
            <tr>
              <td colspan="5" class="text-block">${block.description || ''}</td>
            </tr>
          `;
        }
      }
    });
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { 
          font-family: Arial, sans-serif; 
          line-height: 1.4; 
          margin: 0; 
          padding: 20px; 
          color: #333;
        }
        .header { 
          margin-bottom: 30px; 
          border-bottom: 2px solid #dc2626; 
          padding-bottom: 20px;
        }
        .company-info { 
          text-align: right; 
          margin-bottom: 20px;
        }
        .invoice-details { 
          display: flex; 
          justify-content: space-between; 
          margin-bottom: 30px;
        }
        .invoice-block {
          margin-bottom: 30px;
          border: 1px solid #ddd;
          border-radius: 5px;
          padding: 15px;
        }
        .block-title {
          margin: 0 0 15px 0;
          color: #dc2626;
          font-size: 16px;
          font-weight: bold;
        }
        .items-table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-bottom: 15px;
        }
        .items-table th, .items-table td { 
          border: 1px solid #ddd; 
          padding: 8px; 
          text-align: left;
        }
        .items-table th { 
          background-color: #f5f5f5; 
          font-weight: bold;
        }
        .text-block {
          font-style: italic;
          background-color: #f9f9f9;
        }
        .block-total {
          text-align: right;
          margin-top: 10px;
          padding: 10px;
          background-color: #fef2f2;
          border-radius: 3px;
        }
        .totals { 
          text-align: right; 
          margin-top: 30px;
        }
        .totals table { 
          margin-left: auto; 
          border-collapse: collapse;
        }
        .totals td { 
          padding: 5px 15px; 
          border-bottom: 1px solid #ddd;
        }
        .total-final { 
          font-weight: bold; 
          font-size: 18px; 
          border-top: 2px solid #dc2626 !important;
        }
        .payment-info {
          margin-top: 50px;
          padding: 20px;
          background-color: #f9f9f9;
          border-radius: 5px;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          font-size: 12px;
          color: #666;
        }
        .qr-code {
          text-align: center;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-info">
          <h1>${settings?.company_name || 'SMANS BV'}</h1>
          <p>
            ${settings?.address || 'Adres niet beschikbaar'}<br>
            ${settings?.postal_code || ''} ${settings?.city || ''}<br>
            Tel: ${settings?.phone || ''}<br>
            Email: ${settings?.email || 'info@smanscrm.nl'}
          </p>
        </div>
        
        <div class="invoice-details">
          <div>
            <h2>FACTUUR</h2>
            <p><strong>Factuurnummer:</strong> ${invoice.invoice_number}</p>
            <p><strong>Factuurdatum:</strong> ${new Date(invoice.invoice_date).toLocaleDateString('nl-NL')}</p>
            <p><strong>Vervaldatum:</strong> ${new Date(invoice.due_date).toLocaleDateString('nl-NL')}</p>
          </div>
          
          <div>
            <h3>Factuur naar:</h3>
            <p>
              <strong>${invoice.customer_name}</strong><br>
              ${invoice.customer_email}
            </p>
          </div>
        </div>
      </div>

      <div class="content">
        ${blocksHTML ? `
          <div class="items-section">
            ${blocksHTML}
          </div>
        ` : ''}
        
        <div class="totals">
          <table>
            <tr>
              <td>Subtotaal:</td>
              <td>€${(invoice.subtotal || 0).toFixed(2)}</td>
            </tr>
            <tr>
              <td>BTW (21%):</td>
              <td>€${(invoice.vat_amount || 0).toFixed(2)}</td>
            </tr>
            <tr class="total-final">
              <td>Totaal:</td>
              <td>€${(invoice.total_amount || 0).toFixed(2)}</td>
            </tr>
          </table>
        </div>

        ${invoice.message ? `
          <div class="message">
            <h3>Opmerkingen:</h3>
            <p>${invoice.message}</p>
          </div>
        ` : ''}

        <div class="payment-info">
          <h3>Betalingsinformatie</h3>
          <p><strong>Te betalen binnen:</strong> ${Math.ceil((new Date(invoice.due_date).getTime() - new Date(invoice.invoice_date).getTime()) / (1000 * 60 * 60 * 24))} dagen</p>
          <p><strong>IBAN:</strong> ${settings?.iban || 'NL91ABNA0417164300'}</p>
          <p><strong>BIC:</strong> ${settings?.bic || 'ABNANL2A'}</p>
          <p><strong>Ten name van:</strong> ${settings?.company_name || 'SMANS BV'}</p>
          
          <div class="qr-code">
            <p><strong>QR Code voor betaling:</strong></p>
            <div style="width: 150px; height: 150px; background-color: #f0f0f0; margin: 10px auto; display: flex; align-items: center; justify-content: center; border: 1px solid #ddd;">
              <span style="color: #666; font-size: 12px;">QR Code</span>
            </div>
          </div>
        </div>
      </div>

      <div class="footer">
        <p>Deze factuur is automatisch gegenereerd door het SMANS CRM systeem.</p>
        <p>Voor vragen over deze factuur kunt u contact met ons opnemen.</p>
      </div>
    </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invoiceId, includePayment, paymentUrl, qrCodeDataUrl }: GenerateInvoicePDFRequest = await req.json();

    if (!invoiceId) {
      return new Response(
        JSON.stringify({ error: 'Invoice ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch invoice details
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return new Response(
        JSON.stringify({ error: 'Invoice not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Fetch company settings
    const { data: settings } = await supabase
      .from('company_settings')
      .select('*')
      .limit(1)
      .single();

    // Include payment data if requested
    const paymentData = includePayment && paymentUrl ? { paymentUrl, qrCodeDataUrl: qrCodeDataUrl || '' } : undefined;
    
    const htmlContent = generateInvoiceHTML(invoice, settings, paymentData);
    const dataUrl = `data:text/html;base64,${btoa(htmlContent)}`;

    return new Response(
      JSON.stringify({ 
        success: true,
        pdfUrl: dataUrl,
        htmlContent: htmlContent
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error in generate-invoice-pdf function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
};

serve(handler);
