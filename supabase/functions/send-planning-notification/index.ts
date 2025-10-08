import { serve } from 'https://deno.land/std@0.190.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PlanningNotificationData {
  planningId: string
  customerId: string
  notificationType: 'planning_created' | 'planning_updated' | 'planning_cancelled'
  channel?: 'email' | 'sms' | 'both'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { planningId, customerId, notificationType, channel = 'email' }: PlanningNotificationData = await req.json()

    if (!planningId || !customerId) {
      throw new Error('planningId and customerId are required')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('📅 Sending planning notification:', { planningId, customerId, notificationType })

    // Fetch planning data
    const { data: planning, error: planningError } = await supabase
      .from('planning_items')
      .select(`
        *,
        project:projects(*),
        assigned_user:profiles!planning_items_assigned_user_id_fkey(full_name, email)
      `)
      .eq('id', planningId)
      .single()

    if (planningError) throw planningError
    if (!planning) throw new Error('Planning not found')

    // Fetch customer data
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single()

    if (customerError) throw customerError
    if (!customer) throw new Error('Customer not found')

    console.log('✅ Data fetched:', {
      planning: planning.title,
      customer: customer.full_name,
      monteur: planning.assigned_user?.full_name
    })

    // Generate iCal content
    const icalContent = generateICalContent({
      planningId: planning.id,
      title: planning.title,
      description: planning.description || '',
      location: planning.location || customer.address || '',
      startDateTime: new Date(`${planning.start_date}T${planning.start_time}`),
      endDateTime: new Date(`${planning.start_date}T${planning.end_time}`),
      customerName: customer.full_name,
      customerEmail: customer.email,
      monteurName: planning.assigned_user?.full_name || 'SMANS BV',
      confirmationUrl: `${Deno.env.get('APP_URL') || 'https://smanscrm.nl'}/confirm/${planningId}`
    })

    // Convert to base64 for attachment
    const icalBase64 = btoa(icalContent)

    // Send email notification
    if (channel === 'email' || channel === 'both') {
      const emailHtml = generateEmailHTML({
        customer,
        planning,
        monteur: planning.assigned_user,
        notificationType,
        confirmationUrl: `${Deno.env.get('APP_URL') || 'https://smanscrm.nl'}/confirm/${planningId}`
      })

      // Use smtp-send function
      const { data: emailResult, error: emailError } = await supabase.functions.invoke('smtp-send', {
        body: {
          to: customer.email,
          from: Deno.env.get('SMTP_FROM') || 'planning@smansbv.nl',
          subject: `Afspraak ${notificationType === 'planning_created' ? 'bevestiging' : 'update'} - ${planning.title}`,
          html: emailHtml,
          attachments: [
            {
              filename: 'afspraak.ics',
              content: icalBase64,
              encoding: 'base64',
              contentType: 'text/calendar'
            }
          ]
        }
      })

      if (emailError) {
        console.error('Email send error:', emailError)
        throw new Error(`Failed to send email: ${emailError.message}`)
      }

      console.log('✅ Email sent successfully to:', customer.email)

      // Create notification record
      await supabase
        .from('customer_notifications')
        .insert({
          customer_id: customerId,
          planning_id: planningId,
          project_id: planning.project_id,
          notification_type: notificationType,
          channel: 'email',
          subject: `Afspraak ${notificationType === 'planning_created' ? 'bevestiging' : 'update'}`,
          message: emailHtml,
          sent_at: new Date().toISOString(),
          status: 'sent',
          recipient_email: customer.email,
          recipient_name: customer.full_name,
          metadata: {
            ical_attached: true,
            confirmation_url: `${Deno.env.get('APP_URL')}/confirm/${planningId}`
          }
        })
    }

    // SMS notification (optional)
    if ((channel === 'sms' || channel === 'both') && customer.phone) {
      const smsMessage = generateSMSMessage({
        customer,
        planning,
        notificationType
      })

      // TODO: Integrate with Twilio/MessageBird
      console.log('📱 SMS would be sent to:', customer.phone, smsMessage)

      // Create notification record for SMS
      await supabase
        .from('customer_notifications')
        .insert({
          customer_id: customerId,
          planning_id: planningId,
          project_id: planning.project_id,
          notification_type: notificationType,
          channel: 'sms',
          message: smsMessage,
          sent_at: new Date().toISOString(),
          status: 'pending', // Will be 'sent' when integrated
          recipient_phone: customer.phone,
          recipient_name: customer.full_name
        })
    }

    return new Response(JSON.stringify({
      success: true,
      planningId,
      customer: customer.full_name,
      notificationsSent: {
        email: channel === 'email' || channel === 'both',
        sms: (channel === 'sms' || channel === 'both') && !!customer.phone
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('❌ Error sending planning notification:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to send planning notification'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

// iCal generation (simplified for Edge Function)
function generateICalContent(params: any): string {
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  }

  const escapeText = (text: string) => text.replace(/[\\;,\n]/g, (m) => `\\${m}`)

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//SMANS CRM//Planning//NL
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:planning-${params.planningId}@smanscrm.nl
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(params.startDateTime)}
DTEND:${formatDate(params.endDateTime)}
SUMMARY:${escapeText(params.title)}
DESCRIPTION:${escapeText(params.description)}
LOCATION:${escapeText(params.location)}
STATUS:TENTATIVE
ORGANIZER;CN=${escapeText(params.monteurName)}:mailto:planning@smansbv.nl
ATTENDEE;CN=${escapeText(params.customerName)};RSVP=TRUE;PARTSTAT=NEEDS-ACTION:mailto:${params.customerEmail}
URL:${params.confirmationUrl}
BEGIN:VALARM
ACTION:DISPLAY
TRIGGER:-PT24H
DESCRIPTION:Herinnering: Afspraak morgen bij SMANS BV
END:VALARM
END:VEVENT
END:VCALENDAR`
}

// Email HTML template
function generateEmailHTML(params: any): string {
  const { customer, planning, monteur, notificationType, confirmationUrl } = params
  
  const startDate = new Date(`${planning.start_date}T${planning.start_time}`)
  const formattedDate = startDate.toLocaleDateString('nl-NL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  const formattedTime = startDate.toLocaleTimeString('nl-NL', {
    hour: '2-digit',
    minute: '2-digit'
  })

  return `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Afspraak Bevestiging</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #3b82f6, #1e40af); color: white; padding: 30px 20px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px;">📅 Afspraak ${notificationType === 'planning_created' ? 'Bevestiging' : 'Update'}</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">SMANS BV - Uw kozijnenspecialist</p>
    </div>

    <!-- Content -->
    <div style="padding: 30px 20px;">
      <p style="font-size: 16px; margin: 0 0 20px 0;">Beste ${customer.full_name},</p>
      
      <p style="margin: 0 0 20px 0;">
        ${notificationType === 'planning_created' 
          ? 'Wij bevestigen graag uw afspraak voor de uitvoering van uw project.' 
          : notificationType === 'planning_updated'
          ? 'Uw afspraak is gewijzigd. Hieronder vindt u de nieuwe gegevens.'
          : 'Uw afspraak is geannuleerd. Neem contact met ons op voor een nieuwe afspraak.'}
      </p>

      <!-- Planning Details -->
      <div style="background: #f8fafc; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
        <h3 style="margin: 0 0 15px 0; color: #1e40af; font-size: 18px;">Afspraak Details</h3>
        
        <div style="margin: 8px 0;">
          <strong style="color: #64748b;">Project:</strong> ${planning.title}
        </div>
        
        <div style="margin: 8px 0;">
          <strong style="color: #64748b;">Datum:</strong> ${formattedDate}
        </div>
        
        <div style="margin: 8px 0;">
          <strong style="color: #64748b;">Tijd:</strong> ${formattedTime}
        </div>
        
        ${planning.location ? `
        <div style="margin: 8px 0;">
          <strong style="color: #64748b;">Locatie:</strong> ${planning.location}
        </div>
        ` : ''}
        
        ${monteur ? `
        <div style="margin: 8px 0;">
          <strong style="color: #64748b;">Monteur:</strong> ${monteur.full_name}
        </div>
        ` : ''}
        
        ${planning.description ? `
        <div style="margin: 15px 0 0 0;">
          <strong style="color: #64748b;">Werkzaamheden:</strong>
          <p style="margin: 5px 0 0 0; color: #334155;">${planning.description}</p>
        </div>
        ` : ''}
      </div>

      <!-- Calendar Attachment -->
      <div style="background: #f0fdf4; border: 2px solid #16a34a; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <p style="margin: 0 0 10px 0; font-weight: 600; color: #16a34a;">📎 iCal bijlage bijgevoegd</p>
        <p style="margin: 0; font-size: 14px; color: #166534;">
          Open de bijlage 'afspraak.ics' om deze afspraak toe te voegen aan uw agenda.
        </p>
      </div>

      <!-- Confirmation Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${confirmationUrl}" 
           style="display: inline-block; background: #16a34a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
          ✅ Bevestig Afspraak
        </a>
      </div>

      <p style="margin: 20px 0 0 0; font-size: 14px; color: #64748b;">
        Klik op de knop hierboven om uw afspraak te bevestigen. U kunt ook contact met ons opnemen als u vragen heeft of de afspraak wilt wijzigen.
      </p>

      <p style="margin: 20px 0;">
        Met vriendelijke groet,<br>
        <strong>SMANS BV</strong>
      </p>
    </div>

    <!-- Footer -->
    <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0 0 10px 0;"><strong>SMANS BV</strong></p>
      <p style="margin: 5px 0; font-size: 14px; color: #64748b;">
        📧 info@smansbv.nl | 📞 +31 (0)20 123 4567
      </p>
      <p style="margin: 5px 0; font-size: 14px; color: #64748b;">
        🌐 www.smansbv.nl
      </p>
      <p style="margin: 15px 0 0 0; font-size: 12px; color: #94a3b8;">
        Dit is een automatisch gegenereerd bericht.
      </p>
    </div>
  </div>
</body>
</html>`
}

// SMS message template
function generateSMSMessage(params: any): string {
  const { customer, planning, notificationType } = params
  
  const startDate = new Date(`${planning.start_date}T${planning.start_time}`)
  const formattedDate = startDate.toLocaleDateString('nl-NL', { day: '2-digit', month: 'short' })
  const formattedTime = startDate.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })

  if (notificationType === 'planning_cancelled') {
    return `SMANS BV: Uw afspraak voor ${planning.title} is geannuleerd. Bel ons voor een nieuwe afspraak: 020-1234567`
  }

  return `SMANS BV: Afspraak ${notificationType === 'planning_created' ? 'bevestigd' : 'gewijzigd'} - ${planning.title} op ${formattedDate} om ${formattedTime}. Check uw email voor details.`
}

