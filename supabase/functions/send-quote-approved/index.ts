import { serve } from 'https://deno.land/std@0.178.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.0'
import { corsHeaders } from '../_shared/cors.ts'

interface SendQuoteApprovedRequest {
  quoteId: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { quoteId }: SendQuoteApprovedRequest = await req.json()

    if (!quoteId) {
      throw new Error('Quote ID is required')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch quote with customer data
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select(`
        *,
        customer:customers(*)
      `)
      .eq('id', quoteId)
      .single()

    if (quoteError || !quote) {
      throw new Error('Quote not found')
    }

    console.log('📧 Processing quote:', quote.quote_number)

    // Generate quote HTML (for now, similar to invoice)
    const quoteHtml = generateQuoteHTML(quote)

    // Send email
    const emailHtml = generateApprovalEmail(quote)

    const { error: emailError } = await supabase.functions.invoke('send-email-smans', {
      body: {
        to: quote.customer.email,
        subject: `✅ Offerte ${quote.quote_number} Goedgekeurd - Onderhoud en Service J.J.P. Smans`,
        html: emailHtml
      }
    })

    if (emailError) {
      throw new Error(`Failed to send email: ${emailError.message}`)
    }

    console.log('✅ Quote approval email sent successfully')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Quote approval email sent successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error: any) {
    console.error('❌ Error sending quote approval:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to send quote approval'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

function generateQuoteHTML(quote: any): string {
  // Basic quote HTML generation - this would be more detailed in production
  const blocks = quote.blocks || []
  let blocksHTML = ''
  
  blocks.forEach((block: any) => {
    blocksHTML += `<div class="quote-block">
      <h3>${block.title}</h3>
      <p>${block.description || ''}</p>
    </div>`
  })

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .quote-block { margin: 20px 0; padding: 15px; border: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <h1>Offerte ${quote.quote_number}</h1>
  <p>Klant: ${quote.customer_name}</p>
  ${blocksHTML}
  <p><strong>Totaal:</strong> €${(quote.total_amount + quote.total_vat_amount).toFixed(2)}</p>
</body>
</html>
  `
}

function generateApprovalEmail(quote: any): string {
  const customer = quote.customer || {}
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .content {
      padding: 30px;
    }
    .quote-details {
      background-color: #f0fdf4;
      border-left: 4px solid #10b981;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .quote-details p {
      margin: 5px 0;
    }
    .amount {
      font-size: 32px;
      font-weight: bold;
      color: #10b981;
      margin: 20px 0;
      text-align: center;
    }
    .button {
      display: inline-block;
      background-color: #10b981;
      color: white !important;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 10px 0;
    }
    .footer {
      background-color: #f8f9fa;
      text-align: center;
      padding: 20px;
      font-size: 12px;
      color: #6c757d;
      border-top: 1px solid #e9ecef;
    }
    .checkmark {
      width: 80px;
      height: 80px;
      margin: 20px auto;
      background-color: #10b981;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 48px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="checkmark">✓</div>
      <h1>Offerte Goedgekeurd!</h1>
    </div>
    
    <div class="content">
      <p>Beste ${customer.name || 'Klant'},</p>
      
      <p>Hartelijk dank voor het goedkeuren van offerte <strong>${quote.quote_number}</strong>!</p>
      
      <p>We zijn blij dat u voor Onderhoud en Service J.J.P. Smans heeft gekozen. Wij gaan direct aan de slag met de voorbereidingen.</p>
      
      <div class="quote-details">
        <p><strong>Offertenummer:</strong> ${quote.quote_number}</p>
        <p><strong>Offertedatum:</strong> ${new Date(quote.quote_date).toLocaleDateString('nl-NL')}</p>
        ${quote.project_title ? `<p><strong>Project:</strong> ${quote.project_title}</p>` : ''}
      </div>
      
      <div class="amount">
        €${(quote.total_amount + quote.total_vat_amount).toFixed(2)}
      </div>
      
      <h3>Wat gebeurt er nu?</h3>
      <ol>
        <li>We plannen het project in overleg met u</li>
        <li>Onze monteur komt langs voor de werkzaamheden</li>
        <li>Na afronding ontvangt u de factuur</li>
      </ol>
      
      <p>Binnen enkele werkdagen nemen wij contact met u op om een afspraak in te plannen.</p>
      
      <p style="margin-top: 30px;">Bij vragen kunt u altijd contact met ons opnemen!</p>
      
      <p>Met vriendelijke groet,<br>
      <strong>Het team van Onderhoud en Service J.J.P. Smans</strong></p>
    </div>
    
    <div class="footer">
      <p>Onderhoud en Service J.J.P. Smans | info@smansonderhoud.nl | ${new Date().getFullYear()}</p>
    </div>
  </div>
</body>
</html>
  `
}

