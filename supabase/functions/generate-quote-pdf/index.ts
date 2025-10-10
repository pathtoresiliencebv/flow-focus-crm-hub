import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateQuotePDFRequest {
  quoteId: string;
  includeSigned?: boolean;
}

const generateQuoteHTML = (quote: any, settings: any) => {
  const blocks = quote.items || [];
  let blocksHTML = '';
  
  if (Array.isArray(blocks)) {
    blocks.forEach((block: any) => {
      if (block.items && Array.isArray(block.items)) {
        // Block structure
        blocksHTML += `
          <div class="quote-block">
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
          border-bottom: 2px solid #0066cc; 
          padding-bottom: 20px;
        }
        .company-info { 
          text-align: right; 
          margin-bottom: 20px;
        }
        .quote-details { 
          display: flex; 
          justify-content: space-between; 
          margin-bottom: 30px;
        }
        .quote-block {
          margin-bottom: 30px;
          border: 1px solid #ddd;
          border-radius: 5px;
          padding: 15px;
        }
        .block-title {
          margin: 0 0 15px 0;
          color: #0066cc;
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
          background-color: #f0f8ff;
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
          border-top: 2px solid #0066cc !important;
        }
        .signature-section {
          margin-top: 50px;
          display: flex;
          justify-content: space-between;
        }
        .signature-box {
          width: 45%;
          border: 1px solid #ddd;
          padding: 20px;
          min-height: 80px;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-info">
          <h1>${settings?.company_name || 'Uw Bedrijf'}</h1>
          <p>${settings?.address || ''}</p>
          <p>${settings?.postal_code || ''} ${settings?.city || ''}</p>
          <p>KvK: ${settings?.kvk_number || ''} | BTW: ${settings?.btw_number || ''}</p>
        </div>
      </div>

      <div class="quote-details">
        <div>
          <h2>Offerte</h2>
          <p><strong>Nummer:</strong> ${quote.quote_number}</p>
          <p><strong>Datum:</strong> ${quote.quote_date}</p>
          <p><strong>Geldig tot:</strong> ${quote.valid_until}</p>
        </div>
        <div>
          <h3>Klant</h3>
          <p><strong>${quote.customer_name}</strong></p>
          <p>${quote.customer_email || ''}</p>
        </div>
      </div>

      ${quote.project_title ? `<p><strong>Project:</strong> ${quote.project_title}</p>` : ''}
      ${quote.message ? `<p><strong>Bericht:</strong> ${quote.message}</p>` : ''}

      ${blocksHTML}

      <div class="totals">
        <table>
          <tr>
            <td>Subtotaal:</td>
            <td>€${(quote.subtotal || 0).toFixed(2)}</td>
          </tr>
          <tr>
            <td>BTW:</td>
            <td>€${(quote.vat_amount || 0).toFixed(2)}</td>
          </tr>
          <tr class="total-final">
            <td>Totaal:</td>
            <td>€${(quote.total_amount || 0).toFixed(2)}</td>
          </tr>
        </table>
      </div>

      ${quote.client_signature_data || quote.admin_signature_data || (quote.status === 'approved' || quote.status === 'goedgekeurd') ? `
      <div class="signature-section">
        ${quote.client_signature_data ? `
        <div class="signature-box">
          <p><strong>Klant akkoord:</strong></p>
          <p>${quote.client_name || ''}</p>
          <p>${quote.client_signed_at ? new Date(quote.client_signed_at).toLocaleDateString() : ''}</p>
          ${(quote.status === 'approved' || quote.status === 'goedgekeurd') ? `
          <div style="margin-top: 12px; padding: 8px; background-color: #dcfce7; color: #166534; border-radius: 4px; font-size: 12px; font-weight: 600;">
            ✅ Goedgekeurd door klant
          </div>
          ` : ''}
        </div>
        ` : ''}
        ${(quote.status === 'approved' || quote.status === 'goedgekeurd') && !quote.client_signature_data ? `
        <div class="signature-box">
          <p><strong>Status:</strong></p>
          <div style="margin-top: 8px; padding: 8px; background-color: #dcfce7; color: #166534; border-radius: 4px; font-size: 12px; font-weight: 600;">
            ✅ Goedgekeurd
          </div>
        </div>
        ` : ''}
        ${quote.admin_signature_data ? `
        <div class="signature-box">
          <p><strong>Namens bedrijf:</strong></p>
          <p>${new Date().toLocaleDateString()}</p>
        </div>
        ` : ''}
      </div>
      ` : ''}

      <div class="footer">
        <p>${settings?.general_terms || 'Algemene voorwaarden van toepassing.'}</p>
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
    const { quoteId, includeSigned = false }: GenerateQuotePDFRequest = await req.json();

    if (!quoteId) {
      return new Response(
        JSON.stringify({ error: 'Quote ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch quote details
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', quoteId)
      .single();

    if (quoteError || !quote) {
      return new Response(
        JSON.stringify({ error: 'Quote not found' }),
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

    const htmlContent = generateQuoteHTML(quote, settings);
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
    console.error('Error in generate-quote-pdf function:', error);
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