import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { puppeteer } from "https://deno.land/x/puppeteer@16.2.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GenerateInvoicePDFRequest {
  invoiceId: string;
}

const generateInvoiceHTML = (invoice: any, settings: any) => {
  const currentDate = new Date().toLocaleDateString('nl-NL');
  
  return `
    <!DOCTYPE html>
    <html lang="nl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Factuur ${invoice.invoice_number}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          line-height: 1.6;
          color: #1f2937;
          background: #ffffff;
          font-size: 14px;
        }
        
        .container {
          max-width: 210mm;
          margin: 0 auto;
          padding: 20mm;
          background: white;
          min-height: 297mm;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e5e7eb;
        }
        
        .logo {
          max-height: 60px;
          width: auto;
        }
        
        .invoice-title {
          text-align: right;
        }
        
        .invoice-title h1 {
          font-size: 32px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 8px;
        }
        
        .invoice-number {
          font-size: 18px;
          font-weight: 600;
          color: #059669;
        }
        
        .addresses {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-bottom: 30px;
        }
        
        .address-block h3 {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 12px;
          color: #1f2937;
        }
        
        .address-block p {
          margin-bottom: 4px;
          color: #4b5563;
        }
        
        .address-block .company-name {
          font-weight: 600;
          color: #1f2937;
        }
        
        .invoice-details {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 40px;
          padding: 20px;
          background: #f9fafb;
          border-radius: 8px;
        }
        
        .detail-item h4 {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 4px;
        }
        
        .detail-item p {
          font-size: 14px;
          color: #6b7280;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .items-table th {
          background: #f3f4f6;
          padding: 16px 12px;
          text-align: left;
          font-weight: 600;
          font-size: 13px;
          color: #374151;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .items-table td {
          padding: 16px 12px;
          border-bottom: 1px solid #f3f4f6;
          font-size: 14px;
        }
        
        .items-table tr:last-child td {
          border-bottom: none;
        }
        
        .text-right {
          text-align: right;
        }
        
        .text-center {
          text-align: center;
        }
        
        .totals {
          float: right;
          width: 300px;
          margin-top: 20px;
        }
        
        .totals-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .totals-table td {
          padding: 8px 12px;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .totals-table .total-row {
          font-weight: 600;
          font-size: 16px;
          background: #f9fafb;
        }
        
        .totals-table .final-total {
          font-size: 18px;
          background: #059669;
          color: white;
        }
        
        .footer {
          margin-top: 60px;
          padding-top: 30px;
          border-top: 1px solid #e5e7eb;
          font-size: 12px;
          color: #6b7280;
          line-height: 1.8;
        }
        
        .footer p {
          margin-bottom: 8px;
        }
        
        .payment-info {
          background: #f0f9ff;
          padding: 20px;
          border-radius: 8px;
          margin-top: 30px;
          border-left: 4px solid #0ea5e9;
        }
        
        .payment-info h4 {
          font-weight: 600;
          margin-bottom: 10px;
          color: #0c4a6e;
        }
        
        @media print {
          .container {
            max-width: none;
            margin: 0;
            padding: 15mm;
          }
          
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="logo-section">
            <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" alt="Logo" class="logo">
          </div>
          <div class="invoice-title">
            <h1>FACTUUR</h1>
            <div class="invoice-number">${invoice.invoice_number}</div>
          </div>
        </div>

        <!-- Addresses -->
        <div class="addresses">
          <div class="address-block">
            <h3>Van:</h3>
            <p class="company-name">${settings?.company_name || 'SMANS BV'}</p>
            <p>${settings?.company_address || 'Bedrijfsstraat 123'}</p>
            <p>${settings?.company_postal_code || '1234 AB'} ${settings?.company_city || 'Amsterdam'}</p>
            <p>${settings?.company_country || 'Nederland'}</p>
            <p style="margin-top: 12px;">BTW: ${settings?.company_vat_number || 'NL123456789B01'}</p>
            <p>KvK: ${settings?.company_kvk_number || '12345678'}</p>
          </div>
          <div class="address-block">
            <h3>Aan:</h3>
            <p class="company-name">${invoice.customer_name}</p>
            ${invoice.project_title ? `<p style="margin-top: 12px; color: #059669;">Project: ${invoice.project_title}</p>` : ''}
          </div>
        </div>

        <!-- Invoice Details -->
        <div class="invoice-details">
          <div class="detail-item">
            <h4>Factuurdatum</h4>
            <p>${new Date(invoice.invoice_date || invoice.created_at).toLocaleDateString('nl-NL')}</p>
          </div>
          <div class="detail-item">
            <h4>Vervaldatum</h4>
            <p>${new Date(invoice.due_date || Date.now() + 30*24*60*60*1000).toLocaleDateString('nl-NL')}</p>
          </div>
          <div class="detail-item">
            <h4>Status</h4>
            <p style="text-transform: capitalize;">${invoice.status}</p>
          </div>
        </div>

        <!-- Message -->
        ${invoice.message ? `
          <div style="margin-bottom: 30px; padding: 16px; background: #eff6ff; border-radius: 8px; border-left: 4px solid #3b82f6;">
            <h4 style="margin-bottom: 8px; color: #1e40af;">Bericht:</h4>
            <p style="color: #1e3a8a; white-space: pre-line;">${invoice.message}</p>
          </div>
        ` : ''}

        <!-- Items Table -->
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 50%;">Beschrijving</th>
              <th style="width: 12%;" class="text-center">Aantal</th>
              <th style="width: 15%;" class="text-right">Prijs</th>
              <th style="width: 8%;" class="text-center">BTW%</th>
              <th style="width: 15%;" class="text-right">Totaal</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items && invoice.items.length > 0 ? 
              invoice.items.map((item: any) => `
                <tr>
                  <td>${item.description || 'Geen beschrijving'}</td>
                  <td class="text-center">${item.quantity || 1}</td>
                  <td class="text-right">€${(item.unit_price || 0).toFixed(2)}</td>
                  <td class="text-center">${item.vat_rate || 21}%</td>
                  <td class="text-right">€${(item.total || 0).toFixed(2)}</td>
                </tr>
              `).join('') : `
                <tr>
                  <td colspan="5" style="text-align: center; padding: 40px; color: #9ca3af; font-style: italic;">
                    Geen factuurregels gevonden
                  </td>
                </tr>
              `
            }
          </tbody>
        </table>

        <!-- Totals -->
        <div class="totals">
          <table class="totals-table">
            <tr>
              <td>Subtotaal:</td>
              <td class="text-right">€${(invoice.subtotal || 0).toFixed(2)}</td>
            </tr>
            <tr>
              <td>BTW (21%):</td>
              <td class="text-right">€${(invoice.vat_amount || 0).toFixed(2)}</td>
            </tr>
            <tr class="final-total">
              <td><strong>Totaal te betalen:</strong></td>
              <td class="text-right"><strong>€${(invoice.total_amount || 0).toFixed(2)}</strong></td>
            </tr>
          </table>
        </div>

        <div style="clear: both;"></div>

        <!-- Payment Information -->
        <div class="payment-info">
          <h4>Betaalinstructies</h4>
          <p><strong>Gelieve het bedrag van €${(invoice.total_amount || 0).toFixed(2)} over te maken op:</strong></p>
          <p>IBAN: NL12 ABCD 0123 4567 89</p>
          <p>BIC: ABCDNL2A</p>
          <p>O.v.v. ${invoice.invoice_number}</p>
          <p style="margin-top: 12px; font-size: 13px;">
            Betaling dient te geschieden binnen 30 dagen na factuurdatum. 
            Bij te late betaling zijn wij gerechtigd rente in rekening te brengen.
          </p>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p><strong>Bedankt voor uw vertrouwen in ${settings?.company_name || 'SMANS BV'}!</strong></p>
          <p>Voor vragen over deze factuur kunt u contact met ons opnemen via info@smanscrm.nl of 020-1234567.</p>
          <p>Deze factuur is automatisch gegenereerd en geldig zonder handtekening.</p>
          <p style="margin-top: 16px; font-size: 11px;">
            ${settings?.company_name || 'SMANS BV'} | ${settings?.company_address || 'Bedrijfsstraat 123'} | 
            ${settings?.company_postal_code || '1234 AB'} ${settings?.company_city || 'Amsterdam'} | 
            BTW: ${settings?.company_vat_number || 'NL123456789B01'}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { invoiceId }: GenerateInvoicePDFRequest = await req.json()

    if (!invoiceId) {
      return new Response(
        JSON.stringify({ error: 'Invoice ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Generating PDF for invoice:', invoiceId);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get invoice data with items
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        items:invoice_items(*)
      `)
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      console.error('Invoice not found:', invoiceError);
      return new Response(
        JSON.stringify({ error: 'Invoice not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get quote settings
    const { data: settings } = await supabase
      .from('quote_settings')
      .select('*')
      .single();

    console.log('Found invoice:', invoice.invoice_number);

    // Generate HTML content
    const htmlContent = generateInvoiceHTML(invoice, settings);
    console.log('Generated HTML content length:', htmlContent.length);

    // Generate PDF using Puppeteer
    console.log('Launching browser for PDF generation...');
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10mm',
        bottom: '10mm',
        left: '10mm',
        right: '10mm'
      }
    });
    
    await browser.close();
    
    // Convert buffer to base64 for storage/transmission
    const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));
    
    // Store PDF in Supabase Storage
    const fileName = `factuur-${invoice.invoice_number}-${Date.now()}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from('invoices')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });
    
    if (uploadError) {
      console.error('Error uploading PDF:', uploadError);
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('invoices')
      .getPublicUrl(fileName);
    
    console.log('PDF generated successfully:', fileName);

    return new Response(JSON.stringify({
      success: true,
      pdfUrl: urlData.publicUrl,
      pdfData: pdfBase64,
      filename: fileName,
      contentType: 'application/pdf',
      message: 'Invoice PDF generated successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error generating invoice PDF:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate PDF',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

serve(handler)