import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateQuotePDFRequest {
  quoteId: string;
}

const generateQuoteHTML = (quote: any, settings: any) => {
  const currentDate = new Date().toLocaleDateString('nl-NL');
  
  return `
    <!DOCTYPE html>
    <html lang="nl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Offerte ${quote.quote_number}</title>
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
        
        .quote-title {
          text-align: right;
        }
        
        .quote-title h1 {
          font-size: 32px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 8px;
        }
        
        .quote-number {
          font-size: 18px;
          font-weight: 600;
          color: #dc2626;
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
        
        .quote-details {
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
        
        .message-box {
          margin-bottom: 30px;
          padding: 16px;
          background: #eff6ff;
          border-radius: 8px;
          border-left: 4px solid #3b82f6;
        }
        
        .message-box h4 {
          margin-bottom: 8px;
          color: #1e40af;
          font-weight: 600;
        }
        
        .message-box p {
          color: #1e3a8a;
          white-space: pre-line;
        }
        
        .blocks-section {
          margin-bottom: 40px;
        }
        
        .blocks-title {
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 3px solid #dc2626;
        }
        
        .text-block {
          margin: 20px 0;
          padding: 16px;
          background: #f8fafc;
          border-radius: 6px;
          color: #374151;
          white-space: pre-line;
          font-size: 14px;
        }
        
        .product-block {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .block-title {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 16px;
        }
        
        .items-table th {
          background: #f3f4f6;
          padding: 12px 8px;
          text-align: left;
          font-weight: 600;
          font-size: 13px;
          color: #374151;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .items-table td {
          padding: 12px 8px;
          border-bottom: 1px solid #f3f4f6;
          font-size: 13px;
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
        
        .block-totals {
          display: flex;
          justify-content: flex-end;
          margin-top: 16px;
        }
        
        .totals-box {
          width: 250px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 12px;
        }
        
        .totals-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
          font-size: 13px;
        }
        
        .totals-row.final {
          border-top: 1px solid #d1d5db;
          padding-top: 8px;
          margin-top: 8px;
          font-weight: 600;
          color: #dc2626;
        }
        
        .grand-totals {
          display: flex;
          justify-content: flex-end;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
        }
        
        .grand-totals-box {
          width: 300px;
          background: #f9fafb;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
        }
        
        .grand-total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 16px;
        }
        
        .grand-total-row.final {
          border-top: 2px solid #374151;
          padding-top: 12px;
          margin-top: 12px;
          font-weight: 700;
          font-size: 20px;
          color: #dc2626;
        }
        
        .signatures-section {
          margin-top: 60px;
          padding-top: 30px;
          border-top: 2px solid #e5e7eb;
        }
        
        .signatures-title {
          font-size: 20px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 24px;
        }
        
        .signatures-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
        }
        
        .signature-block {
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 16px;
          background: #f9fafb;
        }
        
        .signature-block h4 {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 16px;
        }
        
        .signature-image {
          max-width: 100%;
          height: 80px;
          object-fit: contain;
          margin-bottom: 12px;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          background: white;
          padding: 4px;
        }
        
        .signature-info {
          font-size: 13px;
          color: #6b7280;
        }
        
        .signature-info p {
          margin-bottom: 4px;
        }
        
        .approval-badge {
          margin-top: 12px;
          padding: 8px;
          background: #dcfce7;
          color: #166534;
          font-size: 12px;
          border-radius: 4px;
          font-weight: 600;
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
        
        .footer .terms {
          background: #f9fafb;
          padding: 16px;
          border-radius: 8px;
          margin-top: 20px;
        }
        
        .footer .terms h4 {
          font-weight: 600;
          margin-bottom: 8px;
          color: #1f2937;
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
          <div class="quote-title">
            <h1>OFFERTE</h1>
            <div class="quote-number">${quote.quote_number}</div>
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
            <p class="company-name">${quote.customer_name}</p>
            ${quote.project_title ? `<p style="margin-top: 12px; color: #dc2626;">Project: ${quote.project_title}</p>` : ''}
          </div>
        </div>

        <!-- Quote Details -->
        <div class="quote-details">
          <div class="detail-item">
            <h4>Offertedatum</h4>
            <p>${new Date(quote.quote_date).toLocaleDateString('nl-NL')}</p>
          </div>
          <div class="detail-item">
            <h4>Geldig tot</h4>
            <p>${new Date(quote.valid_until).toLocaleDateString('nl-NL')}</p>
          </div>
          <div class="detail-item">
            <h4>Status</h4>
            <p style="text-transform: capitalize;">${quote.status}</p>
          </div>
        </div>

        <!-- Message -->
        ${quote.message ? `
          <div class="message-box">
            <h4>Bericht:</h4>
            <p>${quote.message}</p>
          </div>
        ` : ''}

        <!-- Quote Blocks -->
        <div class="blocks-section">
          <h2 class="blocks-title">OFFERTEONDERDELEN</h2>
          
          ${Array.isArray(quote.items) && quote.items.length > 0 ? 
            quote.items.map((block: any, blockIndex: number) => {
              if (block.type === 'textblock') {
                return `<div class="text-block">${block.content || 'Geen tekst ingevoerd'}</div>`;
              }
              
              // Product block
              return `
                <div class="product-block">
                  <div class="block-title">${block.title || 'Onderdeel'}</div>
                  
                  ${block.items && block.items.length > 0 ? `
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
                        ${block.items.map((item: any) => {
                          if (item.type === 'product') {
                            return `
                              <tr>
                                <td>${item.description || 'Geen beschrijving'}</td>
                                <td class="text-center">${item.quantity || 1}</td>
                                <td class="text-right">€${(item.unit_price || 0).toFixed(2)}</td>
                                <td class="text-center">${item.vat_rate || 21}%</td>
                                <td class="text-right">€${(item.total || 0).toFixed(2)}</td>
                              </tr>
                            `;
                          } else {
                            return `
                              <tr>
                                <td colspan="5" style="padding: 8px; color: #6b7280; font-style: italic;">
                                  ${item.description || 'Geen tekst'}
                                </td>
                              </tr>
                            `;
                          }
                        }).join('')}
                      </tbody>
                    </table>
                  ` : '<p style="color: #6b7280; font-style: italic;">Geen items in dit blok</p>'}
                  
                  ${block.items && block.items.some((item: any) => item.type === 'product') ? `
                    <div class="block-totals">
                      <div class="totals-box">
                        <div class="totals-row">
                          <span>Subtotaal:</span>
                          <span>€${(block.subtotal || 0).toFixed(2)}</span>
                        </div>
                        <div class="totals-row">
                          <span>BTW:</span>
                          <span>€${(block.vat_amount || 0).toFixed(2)}</span>
                        </div>
                        <div class="totals-row final">
                          <span>Totaal ${block.title}:</span>
                          <span>€${((block.subtotal || 0) + (block.vat_amount || 0)).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ` : ''}
                </div>
              `;
            }).join('') 
            : '<p style="color: #6b7280; font-style: italic; text-align: center; padding: 40px;">Geen onderdelen toegevoegd aan deze offerte</p>'
          }
        </div>

        <!-- Grand Totals -->
        <div class="grand-totals">
          <div class="grand-totals-box">
            <div class="grand-total-row">
              <span>Totaal excl. BTW:</span>
              <span>€${(quote.total_amount || 0).toFixed(2)}</span>
            </div>
            <div class="grand-total-row">
              <span>Totaal BTW:</span>
              <span>€${(quote.total_vat_amount || 0).toFixed(2)}</span>
            </div>
            <div class="grand-total-row final">
              <span>EINDTOTAAL:</span>
              <span>€${((quote.total_amount || 0) + (quote.total_vat_amount || 0)).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <!-- Signatures Section -->
        ${(quote.client_signature_data || quote.admin_signature_data) ? `
          <div class="signatures-section">
            <h3 class="signatures-title">HANDTEKENINGEN</h3>
            <div class="signatures-grid">
              
              ${quote.client_signature_data ? `
                <div class="signature-block">
                  <h4>Klant Handtekening</h4>
                  <img 
                    src="${quote.client_signature_data}" 
                    alt="Klant handtekening" 
                    class="signature-image"
                  />
                  <div class="signature-info">
                    <p><strong>Naam:</strong> ${quote.client_name || 'Niet opgegeven'}</p>
                    ${quote.client_signed_at ? `<p><strong>Ondertekend op:</strong> ${new Date(quote.client_signed_at).toLocaleDateString('nl-NL')} om ${new Date(quote.client_signed_at).toLocaleTimeString('nl-NL')}</p>` : ''}
                  </div>
                  ${(quote.status === 'approved' || quote.status === 'goedgekeurd') ? `
                    <div class="approval-badge">
                      ✅ Goedgekeurd door klant
                    </div>
                  ` : ''}
                </div>
              ` : ''}

              ${quote.admin_signature_data ? `
                <div class="signature-block">
                  <h4>${settings?.company_name || 'SMANS BV'}</h4>
                  <img 
                    src="${quote.admin_signature_data}" 
                    alt="Bedrijf handtekening" 
                    class="signature-image"
                  />
                  <div class="signature-info">
                    <p>Namens ${settings?.company_name || 'SMANS BV'}</p>
                  </div>
                </div>
              ` : ''}
            </div>
          </div>
        ` : ''}

        <!-- Footer -->
        <div class="footer">
          <p><strong>Deze offerte is geldig tot ${new Date(quote.valid_until).toLocaleDateString('nl-NL')}.</strong></p>
          <p>Door akkoord te gaan met deze offerte gaat u een overeenkomst aan met ${settings?.company_name || 'SMANS BV'} onder de hieronder vermelde voorwaarden.</p>
          <p>Prijzen zijn inclusief BTW tenzij anders vermeld. Bij aanvaarding van deze offerte zijn onze algemene voorwaarden van toepassing.</p>
          
          <div class="terms">
            <h4>Akkoord verklaring:</h4>
            <p>Door digitaal te ondertekenen gaat u akkoord met de voorwaarden en prijzen zoals vermeld in deze offerte.</p>
          </div>
          
          <p style="margin-top: 20px; font-size: 11px;">
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
    const { quoteId }: GenerateQuotePDFRequest = await req.json()

    if (!quoteId) {
      return new Response(
        JSON.stringify({ error: 'Quote ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Generating PDF for quote:', quoteId);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get quote data
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', quoteId)
      .single();

    if (quoteError || !quote) {
      console.error('Quote not found:', quoteError);
      return new Response(
        JSON.stringify({ error: 'Quote not found' }),
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

    console.log('Found quote:', quote.quote_number);

    // Generate HTML content
    const htmlContent = generateQuoteHTML(quote, settings);
    console.log('Generated HTML content length:', htmlContent.length);

    // Return HTML as base64 data URL for viewing/printing
    const base64Html = btoa(unescape(encodeURIComponent(htmlContent)));
    const dataUrl = `data:text/html;base64,${base64Html}`;
    
    console.log('Returning HTML as data URL for direct viewing/printing');

    return new Response(JSON.stringify({
      success: true,
      pdfUrl: dataUrl,
      message: 'Quote HTML generated for viewing/printing'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error generating quote PDF:', error)
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