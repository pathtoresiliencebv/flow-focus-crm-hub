import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { completionId, customerEmail } = await req.json()

    if (!completionId) {
      return new Response(
        JSON.stringify({ error: 'completionId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Fetch completion data
    const { data: completion, error: completionError } = await supabaseClient
      .from('project_completions')
      .select(`
        *,
        project:projects(*, customer:customers(*)),
        installer:profiles!project_completions_installer_id_fkey(*)
      `)
      .eq('id', completionId)
      .single()

    if (completionError) throw completionError

    const customer = completion.project.customer
    const project = completion.project
    const monteur = completion.installer

    // Generate PDF HTML
    const { data: pdfData, error: pdfError } = await supabaseClient.functions.invoke('generate-pdf-simple', {
      body: { completionId }
    })

    if (pdfError) throw pdfError

    // Get system notification settings
    const { data: settings } = await supabaseClient
      .from('system_notification_settings')
      .select('*')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single()

    if (!settings?.smtp_enabled) {
      return new Response(
        JSON.stringify({ error: 'Email not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prepare email content
    const emailSubject = `Werkbon - ${project.title} (${new Date(completion.completion_date).toLocaleDateString('nl-NL')})`
    
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background: #d32f2f; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .footer { background: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666; }
    .button { 
      display: inline-block; 
      background: #d32f2f; 
      color: white; 
      padding: 12px 24px; 
      text-decoration: none; 
      border-radius: 4px; 
      margin: 15px 0;
    }
    .summary-box {
      background: #f9f9f9;
      padding: 15px;
      border-left: 4px solid #d32f2f;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>SMANS ONDERHOUD</h1>
    <p>Werkbon Overzicht</p>
  </div>
  
  <div class="content">
    <h2>Beste ${customer?.name || 'Klant'},</h2>
    
    <p>Hierbij ontvangt u het werkbon voor het project <strong>${project.title}</strong> dat is uitgevoerd op ${new Date(completion.completion_date).toLocaleDateString('nl-NL')}.</p>
    
    <div class="summary-box">
      <h3>Project Samenvatting</h3>
      <p><strong>Project:</strong> ${project.title}</p>
      <p><strong>Uitgevoerd door:</strong> ${monteur?.full_name || 'Monteur'}</p>
      <p><strong>Werktijd:</strong> ${completion.total_work_hours || 0} uur</p>
      <p><strong>Klanttevredenheid:</strong> ${completion.customer_satisfaction || 5}/5 ⭐</p>
    </div>
    
    <h3>Uitgevoerd Werk</h3>
    <p>${completion.work_performed || 'Geen details beschikbaar'}</p>
    
    ${completion.materials_used ? `
    <h3>Gebruikte Materialen</h3>
    <p>${completion.materials_used}</p>
    ` : ''}
    
    ${completion.recommendations ? `
    <h3>Aanbevelingen</h3>
    <p>${completion.recommendations}</p>
    ` : ''}
    
    <p>Het complete werkbon met foto's en handtekeningen vindt u in de bijlage van deze email.</p>
    
    <p>Mocht u vragen hebben over het uitgevoerde werk, neem dan gerust contact met ons op.</p>
    
    <p>Met vriendelijke groet,<br>
    <strong>SMANS Onderhoud</strong><br>
    ${settings?.smtp_from_name || 'Onderhoud en Service J.J.P. Smans'}</p>
  </div>
  
  <div class="footer">
    <p>Dit is een automatisch gegenereerde email van het SMANS CRM systeem</p>
    <p>Voor vragen: ${settings?.smtp_from_email || 'info@smansonderhoud.nl'}</p>
  </div>
</body>
</html>
    `

    const emailText = `
Beste ${customer?.name || 'Klant'},

Hierbij ontvangt u het werkbon voor het project "${project.title}" dat is uitgevoerd op ${new Date(completion.completion_date).toLocaleDateString('nl-NL')}.

PROJECT SAMENVATTING:
- Project: ${project.title}
- Uitgevoerd door: ${monteur?.full_name || 'Monteur'}
- Werktijd: ${completion.total_work_hours || 0} uur
- Klanttevredenheid: ${completion.customer_satisfaction || 5}/5 ⭐

UITGEVOERD WERK:
${completion.work_performed || 'Geen details beschikbaar'}

${completion.materials_used ? `GEBRUIKTE MATERIALEN:
${completion.materials_used}` : ''}

${completion.recommendations ? `AANBEVELINGEN:
${completion.recommendations}` : ''}

Het complete werkbon met foto's en handtekeningen vindt u in de bijlage van deze email.

Mocht u vragen hebben over het uitgevoerde werk, neem dan gerust contact met ons op.

Met vriendelijke groet,
SMANS Onderhoud
${settings?.smtp_from_name || 'Onderhoud en Service J.J.P. Smans'}

---
Dit is een automatisch gegenereerde email van het SMANS CRM systeem
Voor vragen: ${settings?.smtp_from_email || 'info@smansonderhoud.nl'}
    `

    // Send email using the system's SMTP settings
    const emailData = {
      to: customerEmail || customer?.email,
      subject: emailSubject,
      html: emailHtml,
      text: emailText,
      attachments: [
        {
          filename: `werkbon-${project.title.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date(completion.completion_date).toISOString().split('T')[0]}.html`,
          content: pdfData.html,
          contentType: 'text/html'
        }
      ]
    }

    // Use the existing email system
    const { data: emailResult, error: emailError } = await supabaseClient.functions.invoke('send-email', {
      body: emailData
    })

    if (emailError) throw emailError

    // Update completion record to mark email as sent
    await supabaseClient
      .from('project_completions')
      .update({ 
        email_sent_at: new Date().toISOString(),
        status: 'completed'
      })
      .eq('id', completionId)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Werkbon email verzonden',
        emailSent: true,
        recipient: customerEmail || customer?.email
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error sending work order email:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
