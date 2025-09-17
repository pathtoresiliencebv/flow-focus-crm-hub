import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { invoiceId } = await req.json()

    if (!invoiceId) {
      return new Response(
        JSON.stringify({ error: 'Invoice ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create a simple PDF response for now
    // In a real implementation, you would generate the actual PDF
    const pdfContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Factuur PDF</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { text-align: center; margin-bottom: 40px; }
          .invoice-info { margin-bottom: 30px; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .items-table th { background-color: #f2f2f2; }
          .totals { float: right; width: 300px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>FACTUUR</h1>
          <p>Factuur ID: ${invoiceId}</p>
        </div>
        
        <div class="invoice-info">
          <p><strong>Datum:</strong> ${new Date().toLocaleDateString('nl-NL')}</p>
          <p><strong>Status:</strong> Concept</p>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Beschrijving</th>
              <th>Aantal</th>
              <th>Prijs</th>
              <th>BTW</th>
              <th>Totaal</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colspan="5">Geen items gevonden</td>
            </tr>
          </tbody>
        </table>

        <div class="totals">
          <p><strong>Subtotaal: €0.00</strong></p>
          <p><strong>BTW: €0.00</strong></p>
          <p><strong>Totaal: €0.00</strong></p>
        </div>
      </body>
      </html>
    `

    return new Response(
      JSON.stringify({ 
        success: true, 
        pdfUrl: `data:text/html;base64,${btoa(pdfContent)}`,
        message: 'PDF gegenereerd (demo versie)'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error generating invoice PDF:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to generate PDF' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})