import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateQuotePDFRequest {
  quoteId: string;
  includeSigned?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { quoteId, includeSigned = false }: GenerateQuotePDFRequest = await req.json();
    
    console.log('Generating PDF for quote ID:', quoteId);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get quote details
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', quoteId)
      .single();

    if (quoteError || !quote) {
      console.error('Error fetching quote:', quoteError);
      return new Response(
        JSON.stringify({ error: 'Quote not found' }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get quote settings
    const { data: settings } = await supabase
      .from('quote_settings')
      .select('*')
      .single();

    // Generate HTML content for the quote
    const quoteHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Offerte ${quote.quote_number}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 20px;
          }
          .header { 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-start; 
            margin-bottom: 30px; 
            border-bottom: 2px solid #2563eb;
            padding-bottom: 20px;
          }
          .logo { height: 60px; }
          .quote-title { 
            text-align: right; 
            color: #2563eb;
          }
          .quote-title h1 { 
            margin: 0; 
            font-size: 28px; 
            font-weight: bold;
          }
          .quote-number { 
            font-size: 18px; 
            margin-top: 5px;
          }
          .info-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 30px; 
            margin-bottom: 30px; 
          }
          .info-section h3 { 
            color: #2563eb; 
            margin-bottom: 10px; 
            font-size: 16px;
          }
          .quote-details { 
            display: grid; 
            grid-template-columns: repeat(3, 1fr); 
            gap: 20px; 
            margin-bottom: 30px; 
          }
          .quote-blocks { 
            margin-bottom: 30px; 
          }
          .block { 
            background: #f8f9fa; 
            border: 1px solid #e9ecef; 
            border-left: 4px solid #2563eb; 
            padding: 20px; 
            margin-bottom: 20px; 
          }
          .block-title { 
            color: #2563eb; 
            font-size: 18px; 
            font-weight: bold; 
            margin-bottom: 15px; 
            text-transform: uppercase;
          }
          .items-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 15px; 
          }
          .items-table th, .items-table td { 
            border: 1px solid #dee2e6; 
            padding: 8px; 
            text-align: left; 
          }
          .items-table th { 
            background-color: #f8f9fa; 
            font-weight: bold; 
          }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .totals { 
            margin-top: 30px; 
            display: flex; 
            justify-content: flex-end; 
          }
          .totals-table { 
            width: 300px; 
          }
          .totals-table td { 
            padding: 5px 10px; 
            border: none; 
          }
          .grand-total { 
            font-weight: bold; 
            font-size: 18px; 
            color: #2563eb; 
            border-top: 2px solid #2563eb; 
          }
          .footer { 
            margin-top: 50px; 
            padding-top: 20px; 
            border-top: 1px solid #dee2e6; 
            font-size: 12px; 
            color: #666; 
          }
        </style>
      </head>
      <body>
        <!-- Header -->
        <div class="header">
          <div>
            <h2>${settings?.company_name || 'SMANS BV'}</h2>
          </div>
          <div class="quote-title">
            <h1>OFFERTE</h1>
            <div class="quote-number">${quote.quote_number}</div>
          </div>
        </div>

        <!-- Company and Customer Info -->
        <div class="info-grid">
          <div class="info-section">
            <h3>Van:</h3>
            <p><strong>${settings?.company_name || 'SMANS BV'}</strong></p>
            <p>${settings?.company_address || 'Bedrijfsstraat 123'}</p>
            <p>${settings?.company_postal_code || '1234 AB'} ${settings?.company_city || 'Amsterdam'}</p>
            <p>${settings?.company_country || 'Nederland'}</p>
            <p>BTW: ${settings?.company_vat_number || 'NL123456789B01'}</p>
            <p>KvK: ${settings?.company_kvk_number || '12345678'}</p>
          </div>
          <div class="info-section">
            <h3>Aan:</h3>
            <p><strong>${quote.customer_name}</strong></p>
            ${quote.project_title ? `<p>Project: ${quote.project_title}</p>` : ''}
          </div>
        </div>

        <!-- Quote Details -->
        <div class="quote-details">
          <div>
            <h4>Offertedatum</h4>
            <p>${new Date(quote.quote_date).toLocaleDateString('nl-NL')}</p>
          </div>
          <div>
            <h4>Geldig tot</h4>
            <p>${new Date(quote.valid_until).toLocaleDateString('nl-NL')}</p>
          </div>
          <div>
            <h4>Status</h4>
            <p>${quote.status}</p>
          </div>
        </div>

        ${quote.message ? `
        <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin-bottom: 30px;">
          <h4>Bericht:</h4>
          <p>${quote.message.replace(/\n/g, '<br>')}</p>
        </div>
        ` : ''}

        <!-- Quote Blocks -->
        <div class="quote-blocks">
          <h3 style="color: #2563eb; font-size: 20px; margin-bottom: 20px;">OFFERTEONDERDELEN</h3>
          ${quote.items && quote.items.length > 0 ? quote.items.map((block: any, index: number) => `
            <div class="block">
              <div class="block-title">${block.title}</div>
              ${block.items && block.items.length > 0 ? `
                <table class="items-table">
                  <thead>
                    <tr>
                      <th>Beschrijving</th>
                      <th class="text-center">Aantal</th>
                      <th class="text-right">Prijs</th>
                      <th class="text-center">BTW%</th>
                      <th class="text-right">Totaal</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${block.items.map((item: any) => `
                      <tr>
                        <td>${item.description || 'Geen beschrijving'}</td>
                        <td class="text-center">${item.type === 'product' ? (item.quantity || 0) : '-'}</td>
                        <td class="text-right">${item.type === 'product' ? '€' + (item.unit_price || 0).toFixed(2) : '-'}</td>
                        <td class="text-center">${item.vat_rate || 0}%</td>
                        <td class="text-right">${item.type === 'product' ? '€' + (item.total || 0).toFixed(2) : '-'}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
                <div class="totals">
                  <table class="totals-table">
                    <tr>
                      <td>Subtotaal ${block.title}:</td>
                      <td class="text-right">€${(block.subtotal || 0).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td>BTW:</td>
                      <td class="text-right">€${(block.vat_amount || 0).toFixed(2)}</td>
                    </tr>
                    <tr class="grand-total">
                      <td>Totaal ${block.title}:</td>
                      <td class="text-right">€${((block.subtotal || 0) + (block.vat_amount || 0)).toFixed(2)}</td>
                    </tr>
                  </table>
                </div>
              ` : `
                <p style="text-align: center; color: #666; font-style: italic;">Geen items toegevoegd aan dit blok</p>
              `}
            </div>
          `).join('') : '<p>Geen blokken toegevoegd aan deze offerte</p>'}
        </div>

        <!-- Grand Totals -->
        <div class="totals">
          <table class="totals-table">
            <tr>
              <td><strong>Totaal excl. BTW:</strong></td>
              <td class="text-right"><strong>€${(quote.total_amount || 0).toFixed(2)}</strong></td>
            </tr>
            <tr>
              <td><strong>Totaal BTW:</strong></td>
              <td class="text-right"><strong>€${(quote.vat_amount || 0).toFixed(2)}</strong></td>
            </tr>
            <tr class="grand-total">
              <td><strong>EINDTOTAAL:</strong></td>
              <td class="text-right"><strong>€${((quote.total_amount || 0) + (quote.vat_amount || 0)).toFixed(2)}</strong></td>
            </tr>
          </table>
        </div>

        <!-- Client Signature (if signed and includeSigned is true) -->
        ${includeSigned && quote.client_signature_data && quote.client_signed_at ? `
        <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #2563eb;">
          <h3 style="color: #2563eb; margin-bottom: 20px;">GOEDKEURING KLANT</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
            <div>
              <h4>Klant handtekening:</h4>
              <div style="border: 1px solid #dee2e6; padding: 15px; background: #f8f9fa; margin: 10px 0;">
                <img src="${quote.client_signature_data}" alt="Klant handtekening" style="max-width: 200px; height: 80px; object-fit: contain;" />
                <p style="margin-top: 10px; font-size: 12px;"><strong>Naam:</strong> ${quote.client_name || 'Niet opgegeven'}</p>
                <p style="font-size: 12px;"><strong>Ondertekend op:</strong> ${new Date(quote.client_signed_at).toLocaleDateString('nl-NL')} om ${new Date(quote.client_signed_at).toLocaleTimeString('nl-NL')}</p>
              </div>
            </div>
            ${quote.admin_signature_data ? `
            <div>
              <h4>${settings?.company_name || 'SMANS BV'}:</h4>
              <div style="border: 1px solid #dee2e6; padding: 15px; background: #f8f9fa; margin: 10px 0;">
                <img src="${quote.admin_signature_data}" alt="Bedrijf handtekening" style="max-width: 200px; height: 80px; object-fit: contain;" />
                <p style="margin-top: 10px; font-size: 12px;"><strong>Namens ${settings?.company_name || 'SMANS BV'}</strong></p>
              </div>
            </div>
            ` : ''}
          </div>
          <div style="background: #e8f5e8; padding: 15px; border-radius: 5px; margin-top: 20px;">
            <p style="color: #2d5a2d; font-weight: bold; margin: 0;">✅ Deze offerte is goedgekeurd en ondertekend door de klant.</p>
          </div>
        </div>
        ` : ''}

        <!-- Footer -->
        <div class="footer">
          <p><strong>Deze offerte is geldig tot ${new Date(quote.valid_until).toLocaleDateString('nl-NL')}.</strong></p>
          <p>Door akkoord te gaan met deze offerte gaat u een overeenkomst aan met ${settings?.company_name || 'SMANS BV'} onder de hieronder vermelde voorwaarden.</p>
          <p>Prijzen zijn inclusief BTW tenzij anders vermeld. Bij aanvaarding van deze offerte zijn onze algemene voorwaarden van toepassing.</p>
          
          ${settings?.terms_and_conditions ? `
          <div style="margin-top: 30px;">
            <h4>Algemene Voorwaarden</h4>
            <p style="white-space: pre-line; font-size: 11px;">${settings.terms_and_conditions}</p>
          </div>
          ` : ''}
        </div>
      </body>
      </html>
    `;

    // For now, return the HTML (in production you'd convert to PDF using a service like Puppeteer)
    // Since we're in Deno edge function, we'll use an HTML-to-PDF service
    
    // Using htmlcsstoimage.com API (you'll need to add API key to secrets)
    const htmlToPdfResponse = await fetch('https://hcti.io/v1/image', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + Deno.env.get('HTMLCSSTOIMAGE_API_KEY'),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: quoteHtml,
        format: 'pdf',
        width: 794,
        height: 1123 // A4 size
      })
    });

    if (!htmlToPdfResponse.ok) {
      console.error('PDF generation failed:', htmlToPdfResponse.statusText);
      // Fallback: return HTML as base64
      const htmlBase64 = btoa(unescape(encodeURIComponent(quoteHtml)));
      return new Response(
        JSON.stringify({ 
          success: true, 
          pdfData: htmlBase64,
          contentType: 'text/html',
          filename: `offerte-${quote.quote_number}.html`
        }),
        { 
          status: 200, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    const pdfData = await htmlToPdfResponse.text();

    return new Response(
      JSON.stringify({ 
        success: true, 
        pdfData: pdfData,
        contentType: 'application/pdf',
        filename: `offerte-${quote.quote_number}.pdf`
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );

  } catch (error: any) {
    console.error("Error in generate-quote-pdf function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  }
};

serve(handler);