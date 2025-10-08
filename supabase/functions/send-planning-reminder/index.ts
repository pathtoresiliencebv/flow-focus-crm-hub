import { serve } from 'https://deno.land/std@0.190.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * send-planning-reminder Edge Function
 * 
 * Scheduled to run hourly via Supabase Cron Jobs
 * Sends 24h reminder emails to customers for upcoming appointments
 * 
 * Setup: supabase functions deploy send-planning-reminder --no-verify-jwt
 * Schedule: Create via Dashboard → Database → Cron Jobs
 * 
 * Expression: 0 * * * * (every hour)
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🔔 Running 24h planning reminder check...')

    // Calculate time window: 23.5h to 24.5h from now
    const now = new Date()
    const reminderStart = new Date(now.getTime() + (23.5 * 60 * 60 * 1000))
    const reminderEnd = new Date(now.getTime() + (24.5 * 60 * 60 * 1000))

    console.log('Time window:', {
      now: now.toISOString(),
      reminderStart: reminderStart.toISOString(),
      reminderEnd: reminderEnd.toISOString()
    })

    // Fetch planning items in the 24h window
    const { data: plannings, error: planningsError } = await supabase
      .from('planning_items')
      .select(`
        *,
        project:projects(*),
        assigned_user:profiles!planning_items_assigned_user_id_fkey(full_name, email)
      `)
      .gte('start_date', reminderStart.toISOString().split('T')[0])
      .lte('start_date', reminderEnd.toISOString().split('T')[0])
      .eq('status', 'Gepland')
      .not('customer_id', 'is', null)

    if (planningsError) {
      console.error('Error fetching plannings:', planningsError)
      throw planningsError
    }

    console.log(`Found ${plannings?.length || 0} plannings in 24h window`)

    if (!plannings || plannings.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No plannings requiring reminders',
        reminders_sent: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    let remindersSent = 0
    const errors: any[] = []

    // Process each planning
    for (const planning of plannings) {
      try {
        // Check if reminder already sent
        const { data: existingReminder } = await supabase
          .from('customer_notifications')
          .select('id')
          .eq('planning_id', planning.id)
          .eq('notification_type', 'reminder')
          .eq('status', 'sent')
          .maybeSingle()

        if (existingReminder) {
          console.log(`Reminder already sent for planning ${planning.id}`)
          continue
        }

        // Fetch customer
        const { data: customer, error: customerError } = await supabase
          .from('customers')
          .select('*')
          .eq('id', planning.customer_id)
          .single()

        if (customerError || !customer) {
          console.error(`Customer not found for planning ${planning.id}`)
          errors.push({ planning: planning.id, error: 'Customer not found' })
          continue
        }

        if (!customer.email) {
          console.warn(`Customer ${customer.id} has no email`)
          continue
        }

        // Generate reminder email
        const emailHtml = generateReminderEmailHTML({
          customer,
          planning,
          monteur: planning.assigned_user
        })

        // Send email
        const { data: emailResult, error: emailError } = await supabase.functions.invoke('smtp-send', {
          body: {
            to: customer.email,
            from: Deno.env.get('SMTP_FROM') || 'planning@smansbv.nl',
            subject: `🔔 Herinnering: Afspraak morgen - ${planning.title}`,
            html: emailHtml
          }
        })

        if (emailError) {
          console.error(`Failed to send reminder for planning ${planning.id}:`, emailError)
          errors.push({ planning: planning.id, error: emailError.message })
          continue
        }

        // Create notification record
        await supabase
          .from('customer_notifications')
          .insert({
            customer_id: customer.id,
            planning_id: planning.id,
            project_id: planning.project_id,
            notification_type: 'reminder',
            channel: 'email',
            subject: `Herinnering: Afspraak morgen`,
            message: emailHtml,
            sent_at: new Date().toISOString(),
            status: 'sent',
            recipient_email: customer.email,
            recipient_name: customer.full_name,
            metadata: {
              reminder_type: '24h',
              planning_date: planning.start_date,
              planning_time: planning.start_time
            }
          })

        remindersSent++
        console.log(`✅ Reminder sent to ${customer.email} for planning ${planning.id}`)

      } catch (error) {
        console.error(`Error processing planning ${planning.id}:`, error)
        errors.push({ planning: planning.id, error: error.message })
      }
    }

    console.log(`📧 Reminders sent: ${remindersSent}/${plannings.length}`)

    return new Response(JSON.stringify({
      success: true,
      message: `Sent ${remindersSent} reminders`,
      reminders_sent: remindersSent,
      total_checked: plannings.length,
      errors: errors.length > 0 ? errors : undefined
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('❌ Fatal error in reminder function:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to process reminders'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

function generateReminderEmailHTML(params: any): string {
  const { customer, planning, monteur } = params
  
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
  <title>Afspraak Herinnering</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 30px 20px; text-align: center;">
      <h1 style="margin: 0; font-size: 28px;">🔔 Herinnering</h1>
      <p style="margin: 10px 0 0 0; font-size: 18px; font-weight: 600;">Afspraak Morgen!</p>
    </div>

    <!-- Content -->
    <div style="padding: 30px 20px;">
      <p style="font-size: 16px; margin: 0 0 20px 0;">Beste ${customer.full_name},</p>
      
      <p style="margin: 0 0 20px 0; font-size: 16px;">
        Dit is een <strong>vriendelijke herinnering</strong> voor uw afspraak morgen bij SMANS BV.
      </p>

      <!-- Planning Details -->
      <div style="background: #fef3c7; border: 3px solid #f59e0b; padding: 25px; margin: 20px 0; border-radius: 12px;">
        <h3 style="margin: 0 0 20px 0; color: #92400e; font-size: 20px; text-align: center;">
          ⏰ Morgen om ${formattedTime}
        </h3>
        
        <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
          <div style="margin: 10px 0;">
            <strong style="color: #78350f;">📅 Datum:</strong> ${formattedDate}
          </div>
          
          <div style="margin: 10px 0;">
            <strong style="color: #78350f;">🏠 Project:</strong> ${planning.title}
          </div>
          
          ${planning.location ? `
          <div style="margin: 10px 0;">
            <strong style="color: #78350f;">📍 Locatie:</strong> ${planning.location}
          </div>
          ` : ''}
          
          ${monteur ? `
          <div style="margin: 10px 0;">
            <strong style="color: #78350f;">👷 Monteur:</strong> ${monteur.full_name}
          </div>
          ` : ''}
        </div>

        ${planning.description ? `
        <div style="background: white; padding: 15px; border-radius: 8px;">
          <strong style="color: #78350f;">📝 Werkzaamheden:</strong>
          <p style="margin: 10px 0 0 0; color: #1c1917;">${planning.description}</p>
        </div>
        ` : ''}
      </div>

      <!-- Important Notes -->
      <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
        <h4 style="margin: 0 0 10px 0; color: #1e40af;">📌 Belangrijk</h4>
        <ul style="margin: 5px 0; padding-left: 20px; color: #1e3a8a;">
          <li style="margin: 5px 0;">Zorg dat iemand thuis is</li>
          <li style="margin: 5px 0;">Maak de werkplek vrij toegankelijk</li>
          <li style="margin: 5px 0;">Zet huisdieren in een andere ruimte</li>
        </ul>
      </div>

      <!-- Contact Info -->
      <div style="text-align: center; margin: 30px 0; padding: 20px; background: #f8fafc; border-radius: 8px;">
        <p style="margin: 0 0 10px 0; font-size: 16px; color: #1e293b;">
          <strong>Vragen of wijzigingen?</strong>
        </p>
        <p style="margin: 5px 0; font-size: 14px; color: #64748b;">
          📞 Bel ons: <strong style="color: #1e293b;">+31 (0)20 123 4567</strong>
        </p>
        <p style="margin: 5px 0; font-size: 14px; color: #64748b;">
          📧 Email: <strong style="color: #1e293b;">planning@smansbv.nl</strong>
        </p>
      </div>

      <p style="margin: 20px 0 0 0;">
        Tot morgen!<br>
        <strong>Team SMANS BV</strong>
      </p>
    </div>

    <!-- Footer -->
    <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0 0 10px 0;"><strong>SMANS BV - Uw Kozijnenspecialist</strong></p>
      <p style="margin: 5px 0; font-size: 14px; color: #64748b;">
        www.smansbv.nl
      </p>
      <p style="margin: 15px 0 0 0; font-size: 12px; color: #94a3b8;">
        Dit is een automatische herinnering.
      </p>
    </div>
  </div>
</body>
</html>`
}

/**
 * DEPLOYMENT INSTRUCTIONS:
 * 
 * 1. Deploy function:
 *    supabase functions deploy send-planning-reminder --no-verify-jwt
 * 
 * 2. Setup Cron Job via Supabase Dashboard:
 *    - Go to Database → Cron Jobs
 *    - Create new job:
 *      Name: send-planning-reminders
 *      Schedule: 0 * * * * (every hour)
 *      SQL: SELECT net.http_post(
 *             url:='https://your-project.supabase.co/functions/v1/send-planning-reminder',
 *             headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
 *           ) as request_id;
 * 
 * 3. Test manually:
 *    curl -X POST https://your-project.supabase.co/functions/v1/send-planning-reminder \
 *      -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
 * 
 * 4. Monitor logs:
 *    supabase functions logs send-planning-reminder --follow
 */

