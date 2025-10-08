import { serve } from 'https://deno.land/std@0.178.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.0'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { testNumber } = await req.json()

    if (!testNumber) {
      throw new Error('Test phone number is required')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch SMS settings
    const { data: settings } = await supabase
      .from('system_notification_settings')
      .select('*')
      .single()

    if (!settings || !settings.sms_enabled) {
      throw new Error('SMS is not enabled')
    }

    const smsApiKey = Deno.env.get('SMS_API_KEY')
    if (!smsApiKey) {
      throw new Error('SMS_API_KEY not configured in Supabase Secrets')
    }

    console.log('📱 Testing SMS connection via', settings.sms_provider)
    console.log('📱 Sending test SMS to:', testNumber)

    let result
    
    // MessageBird
    if (settings.sms_provider === 'messagebird') {
      const response = await fetch('https://rest.messagebird.com/messages', {
        method: 'POST',
        headers: {
          'Authorization': `AccessKey ${smsApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          originator: settings.sms_from_number || 'SMANS',
          recipients: [testNumber],
          body: `✅ SMS Test geslaagd! Uw SMANS CRM SMS configuratie werkt correct. Timestamp: ${new Date().toLocaleTimeString('nl-NL')}`
        })
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`MessageBird error: ${error}`)
      }

      result = await response.json()
    }
    // Twilio
    else if (settings.sms_provider === 'twilio') {
      const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
      const authToken = smsApiKey

      if (!accountSid) {
        throw new Error('TWILIO_ACCOUNT_SID not configured')
      }

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            From: settings.sms_from_number || '',
            To: testNumber,
            Body: `✅ SMS Test geslaagd! Uw SMANS CRM SMS configuratie werkt correct. Timestamp: ${new Date().toLocaleTimeString('nl-NL')}`
          })
        }
      )

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Twilio error: ${error}`)
      }

      result = await response.json()
    }
    // Vonage (Nexmo)
    else if (settings.sms_provider === 'nexmo') {
      const response = await fetch('https://rest.nexmo.com/sms/json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          api_key: smsApiKey,
          api_secret: Deno.env.get('NEXMO_API_SECRET'),
          from: settings.sms_from_number || 'SMANS',
          to: testNumber.replace('+', ''),
          text: `✅ SMS Test geslaagd! Uw SMANS CRM SMS configuratie werkt correct. Timestamp: ${new Date().toLocaleTimeString('nl-NL')}`
        })
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Vonage error: ${error}`)
      }

      result = await response.json()
    }
    else {
      throw new Error(`Unsupported SMS provider: ${settings.sms_provider}`)
    }

    console.log('✅ SMS test sent successfully:', result)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Test SMS sent to ${testNumber}`,
        provider: settings.sms_provider,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error: any) {
    console.error('❌ SMS test error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'SMS test failed'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

