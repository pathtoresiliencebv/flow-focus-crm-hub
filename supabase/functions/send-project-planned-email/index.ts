import { serve } from 'https://deno.land/std@0.190.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PlanningEmailData {
  customerEmail: string
  customerName: string
  projectTitle: string
  projectLocation: string
  planningDate: string
  planningTime: string
  monteurName: string
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('📧 send-project-planned-email invoked');
    
    const emailData: PlanningEmailData = await req.json()
    console.log('Email data received:', {
      customerEmail: emailData.customerEmail,
      projectTitle: emailData.projectTitle,
      planningDate: emailData.planningDate
    });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch email settings
    console.log('Fetching email notification settings...');
    const { data: settings, error: settingsError } = await supabase
      .from('email_notification_settings')
      .select('*')
      .single()

    if (settingsError) {
      console.error('Error fetching settings:', settingsError);
      // Use defaults if settings not found
    }

    if (settings && !settings.planning_email_enabled) {
      console.log('⚠️ Planning email notifications are disabled');
      return new Response(JSON.stringify({
        success: true,
        message: 'Email notifications disabled'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    // Use settings or defaults
    const emailSubject = settings?.planning_email_subject || 'Uw project is ingepland';
    const emailTemplate = settings?.planning_email_body || `Beste {customer_name},

Uw project "{project_title}" is ingepland.

📅 Datum: {planning_date}
⏰ Tijd: {planning_time}
👷 Monteur: {monteur_name}
📍 Locatie: {project_location}

Wij zien u graag tegemoet!

Met vriendelijke groet,
Onderhoud en Service J.J.P. Smans`;

    // Format date in Dutch
    const planningDate = new Date(emailData.planningDate);
    const formattedDate = planningDate.toLocaleDateString('nl-NL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Format time (remove seconds)
    const formattedTime = emailData.planningTime.slice(0, 5);

    // Replace placeholders in template
    console.log('Replacing placeholders in email template...');
    const emailBody = emailTemplate
      .replace('{customer_name}', emailData.customerName)
      .replace('{project_title}', emailData.projectTitle)
      .replace('{planning_date}', formattedDate)
      .replace('{planning_time}', formattedTime)
      .replace('{monteur_name}', emailData.monteurName)
      .replace('{project_location}', emailData.projectLocation);

    // Create HTML email with styling
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { 
      font-family: Arial, sans-serif; 
      line-height: 1.6; 
      color: #333; 
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container { 
      max-width: 600px; 
      margin: 20px auto; 
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header { 
      background: linear-gradient(135deg, #3b82f6, #1e40af); 
      color: white; 
      padding: 30px; 
      text-align: center; 
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content { 
      padding: 30px; 
      background: white;
    }
    .content p {
      margin: 10px 0;
    }
    .info-box { 
      background: #f8fafc; 
      border-left: 4px solid #3b82f6; 
      padding: 15px; 
      margin: 20px 0;
      border-radius: 4px;
    }
    .footer { 
      text-align: center; 
      padding: 20px;
      background: #f8fafc;
      color: #64748b; 
      font-size: 14px; 
      border-top: 1px solid #e2e8f0;
    }
    .footer p {
      margin: 5px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📅 ${emailSubject}</h1>
    </div>
    <div class="content">
      ${emailBody.split('\n').map(line => `<p>${line}</p>`).join('')}
    </div>
    <div class="footer">
      <p><strong>Onderhoud en Service J.J.P. Smans</strong></p>
      <p>📧 info@smansonderhoud.nl</p>
      <p>📞 Bel ons voor vragen</p>
    </div>
  </div>
</body>
</html>`;

    console.log('Invoking send-email-smans function...');
    
    // Send via SMANS SMTP
    const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-email-smans', {
      body: {
        to: emailData.customerEmail,
        subject: emailSubject,
        html: emailHtml
      }
    })

    if (emailError) {
      console.error('❌ Error sending email via SMANS SMTP:', emailError);
      throw emailError;
    }

    console.log('✅ Email sent successfully:', emailResult);

    return new Response(JSON.stringify({
      success: true,
      message: 'Email sent successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error: any) {
    console.error('❌ Error in send-project-planned-email:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to send email'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})

