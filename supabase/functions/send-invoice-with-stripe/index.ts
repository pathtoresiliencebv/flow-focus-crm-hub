import { serve } from 'https://deno.land/std@0.178.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.0'
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno'
import { corsHeaders } from '../_shared/cors.ts'

interface SendInvoiceRequest {
  invoiceId: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { invoiceId }: SendInvoiceRequest = await req.json()

    if (!invoiceId) {
      throw new Error('Invoice ID is required')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch invoice with customer data
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        customer:customers(*)
      `)
      .eq('id', invoiceId)
      .single()

    if (invoiceError || !invoice) {
      throw new Error('Invoice not found')
    }

    console.log('📧 Processing invoice:', invoice.invoice_number)

    // Initialize Stripe
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) {
      console.warn('⚠️ No Stripe key configured, skipping payment link')
    }

    let paymentUrl = ''
    let qrCodeDataUrl = ''

    if (stripeKey) {
      const stripe = new Stripe(stripeKey, {
        apiVersion: '2023-10-16',
      })

      // Create Stripe Payment Link
      console.log('💳 Creating Stripe payment link...')
      const paymentLink = await stripe.paymentLinks.create({
        line_items: [{
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Factuur ${invoice.invoice_number}`,
              description: invoice.project_title || 'SMANS Onderhoud Factuur'
            },
            unit_amount: Math.round(invoice.total_amount * 100) // Convert to cents
          },
          quantity: 1
        }],
        metadata: {
          invoice_id: invoice.id,
          invoice_number: invoice.invoice_number,
          customer_id: invoice.customer_id
        }
      })

      paymentUrl = paymentLink.url
      console.log('✅ Payment link created:', paymentUrl)

      // Generate QR Code for payment link
      try {
        const qrResponse = await fetch(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(paymentUrl)}`)
        if (qrResponse.ok) {
          const qrImageBuffer = await qrResponse.arrayBuffer()
          qrCodeDataUrl = `data:image/png;base64,${btoa(String.fromCharCode(...new Uint8Array(qrImageBuffer)))}`
          console.log('✅ QR code generated')
        }
      } catch (qrError) {
        console.warn('⚠️ Could not generate QR code:', qrError)
      }
    }

    // Generate invoice PDF with payment info
    const { data: pdfData, error: pdfError } = await supabase.functions.invoke('generate-invoice-pdf', {
      body: {
        invoiceId: invoice.id,
        includePayment: true,
        paymentUrl: paymentUrl,
        qrCodeDataUrl: qrCodeDataUrl
      }
    })

    if (pdfError) {
      console.error('❌ PDF generation error:', pdfError)
      throw new Error('Failed to generate PDF')
    }

    // If HTML content is returned, we need to convert it to PDF
    // For now, we'll just send the email with the payment link
    const emailHtml = generateInvoiceEmail(invoice, paymentUrl, qrCodeDataUrl)

    // Send email via SMANS SMTP
    const { error: emailError } = await supabase.functions.invoke('send-email-smans', {
      body: {
        to: invoice.customer.email,
        subject: `Factuur ${invoice.invoice_number} - SMANS Onderhoud`,
        html: emailHtml
      }
    })

    if (emailError) {
      throw new Error(`Failed to send email: ${emailError.message}`)
    }

    // Update invoice status
    await supabase
      .from('invoices')
      .update({
        status: 'verzonden',
        sent_at: new Date().toISOString()
      })
      .eq('id', invoiceId)

    console.log('✅ Invoice email sent successfully')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Invoice sent successfully',
        paymentUrl: paymentUrl
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error: any) {
    console.error('❌ Error sending invoice:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to send invoice'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

function generateInvoiceEmail(invoice: any, paymentUrl: string, qrCodeDataUrl: string): string {
  const customer = invoice.customer || {}
  const hasPayment = Boolean(paymentUrl && qrCodeDataUrl)

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
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
    .invoice-details {
      background-color: #f8f9fa;
      border-left: 4px solid #667eea;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .invoice-details p {
      margin: 5px 0;
    }
    .payment-section {
      margin-top: 30px;
      border: 2px solid #3b82f6;
      padding: 20px;
      border-radius: 8px;
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      text-align: center;
    }
    .payment-section h3 {
      color: #1e40af;
      margin-top: 0;
    }
    .qr-code {
      margin: 20px auto;
      padding: 15px;
      background: white;
      border-radius: 8px;
      display: inline-block;
    }
    .qr-code img {
      display: block;
    }
    .button {
      display: inline-block;
      background-color: #3b82f6;
      color: white !important;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 10px 0;
      transition: background-color 0.3s;
    }
    .button:hover {
      background-color: #2563eb;
    }
    .footer {
      background-color: #f8f9fa;
      text-align: center;
      padding: 20px;
      font-size: 12px;
      color: #6c757d;
      border-top: 1px solid #e9ecef;
    }
    .amount {
      font-size: 32px;
      font-weight: bold;
      color: #667eea;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📧 Nieuwe Factuur</h1>
      <p>SMANS Onderhoud</p>
    </div>
    
    <div class="content">
      <p>Beste ${customer.name || 'Klant'},</p>
      
      <p>Hierbij ontvangt u factuur <strong>${invoice.invoice_number}</strong> van SMANS Onderhoud.</p>
      
      <div class="invoice-details">
        <p><strong>Factuurnummer:</strong> ${invoice.invoice_number}</p>
        <p><strong>Factuurdatum:</strong> ${new Date(invoice.invoice_date).toLocaleDateString('nl-NL')}</p>
        <p><strong>Vervaldatum:</strong> ${invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('nl-NL') : 'Direct'}</p>
        ${invoice.project_title ? `<p><strong>Project:</strong> ${invoice.project_title}</p>` : ''}
      </div>
      
      <div class="amount">
        €${invoice.total_amount.toFixed(2)}
      </div>
      
      ${hasPayment ? `
      <div class="payment-section">
        <h3>💳 Direct Betalen</h3>
        <p>Scan de QR code met uw telefoon of gebruik de betaallink:</p>
        
        <div class="qr-code">
          <img src="${qrCodeDataUrl}" alt="Betaal QR Code" width="200" height="200" />
        </div>
        
        <a href="${paymentUrl}" class="button">
          🔗 Open Betaallink
        </a>
        
        <p style="font-size: 12px; color: #64748b; margin-top: 15px;">
          Veilig betalen via Stripe
        </p>
      </div>
      ` : `
      <p>Voor betalingsinstructies, neem contact met ons op via <a href="mailto:info@smansonderhoud.nl">info@smansonderhoud.nl</a>.</p>
      `}
      
      <p style="margin-top: 30px;">Heeft u vragen over deze factuur? Neem dan gerust contact met ons op.</p>
      
      <p>Met vriendelijke groet,<br>
      <strong>SMANS Onderhoud</strong></p>
    </div>
    
    <div class="footer">
      <p>SMANS Onderhoud | info@smansonderhoud.nl</p>
      <p>&copy; ${new Date().getFullYear()} SMANS Onderhoud. Alle rechten voorbehouden.</p>
    </div>
  </div>
</body>
</html>
  `
}

