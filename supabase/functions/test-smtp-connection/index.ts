import { serve } from 'https://deno.land/std@0.178.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.0'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { testEmail } = await req.json()

    if (!testEmail) {
      throw new Error('Test email is required')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch SMTP settings
    const { data: settings } = await supabase
      .from('system_notification_settings')
      .select('*')
      .single()

    if (!settings || !settings.smtp_enabled) {
      throw new Error('SMTP is not enabled')
    }

    console.log('📧 Testing SMTP connection to:', settings.smtp_host)
    console.log('📧 Sending test email to:', testEmail)

    // Send test email via send-email-smans function
    const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-email-smans', {
      body: {
        to: testEmail,
        subject: '✅ SMTP Test - SMANS CRM',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; border: 2px solid #10b981; border-radius: 8px; padding: 30px; }
              .header { text-align: center; margin-bottom: 20px; }
              .checkmark { font-size: 48px; color: #10b981; }
              .details { background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="checkmark">✅</div>
                <h1>SMTP Test Geslaagd!</h1>
              </div>
              <p>Deze email is succesvol verzonden via uw SMTP configuratie.</p>
              <div class="details">
                <strong>SMTP Details:</strong><br>
                Server: ${settings.smtp_host}:${settings.smtp_port}<br>
                Van: ${settings.smtp_from_email}<br>
                Timestamp: ${new Date().toLocaleString('nl-NL')}
              </div>
              <p>Uw SMTP configuratie werkt correct en is klaar voor gebruik!</p>
              <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
                Dit is een automatische test email van SMANS CRM Systeem.
              </p>
            </div>
          </body>
          </html>
        `
      }
    })

    if (emailError) {
      console.error('❌ SMTP test failed:', emailError)
      throw new Error(emailError.message || 'Failed to send test email')
    }

    console.log('✅ SMTP test email sent successfully')

    return new Response(
      JSON.stringify({
        success: true,
        message: `Test email sent to ${testEmail}`,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error: any) {
    console.error('❌ SMTP test error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'SMTP test failed'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
