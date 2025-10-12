// Edge Function: send-workorder-email-mobile
// Sends werkbon email to customer after project delivery

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { completionId } = await req.json();

    // Fetch completion with project and customer data
    const { data: completion, error } = await supabaseClient
      .from('project_completions')
      .select(`
        *,
        project:projects (
          *,
          customer:customers (*)
        ),
        installer:profiles!installer_id (full_name, language_preference)
      `)
      .eq('id', completionId)
      .single();

    if (error) throw error;

    const customer = completion.project.customer;
    const customerEmail = customer.email || customer.billing_email;

    if (!customerEmail) {
      throw new Error('Geen email adres voor klant');
    }

    // Get system email settings
    const { data: systemSettings } = await supabaseClient
      .from('system_notification_settings')
      .select('*')
      .single();

    // Generate email HTML
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #9d1b1b; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px; background: #f9f9f9; }
    .section { margin-bottom: 20px; }
    h2 { color: #9d1b1b; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
    .button { background: #9d1b1b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>SMANS Onderhoud - Werkbon</h1>
    </div>
    
    <div class="content">
      <p>Beste ${customer.name},</p>
      
      <p>Hierbij ontvangt u de werkbon voor het voltooide project <strong>${completion.project.title}</strong>.</p>
      
      <div class="section">
        <h2>Project Details</h2>
        <p><strong>Datum oplevering:</strong> ${new Date(completion.completion_date).toLocaleDateString('nl-NL')}</p>
        <p><strong>Monteur:</strong> ${completion.installer.full_name}</p>
        <p><strong>Werktijd:</strong> ${completion.net_work_hours || completion.total_work_hours || 0} uur</p>
      </div>

      <div class="section">
        <h2>Uitgevoerd Werk</h2>
        <p>${completion.work_performed}</p>
      </div>

      ${completion.materials_used ? `
      <div class="section">
        <h2>Gebruikte Materialen</h2>
        <p>${completion.materials_used}</p>
      </div>
      ` : ''}

      ${completion.recommendations ? `
      <div class="section">
        <h2>Aanbevelingen</h2>
        <p>${completion.recommendations}</p>
      </div>
      ` : ''}

      <div class="section">
        <p><strong>Klanttevredenheid:</strong> ${completion.customer_satisfaction}/5 ⭐</p>
      </div>

      <p>Hartelijk dank voor het vertrouwen in SMANS Onderhoud.</p>
      
      <p>Met vriendelijke groet,<br>
      ${completion.installer.full_name}<br>
      SMANS Onderhoud</p>
    </div>
    
    <div class="footer">
      <p>SMANS BV | ${systemSettings?.smtp_from_email || 'info@smansonderhoud.nl'}</p>
    </div>
  </div>
</body>
</html>
    `;

    // Send email via SMTP function
    const { error: emailError } = await supabaseClient.functions.invoke('send-email-smans', {
      body: {
        to: customerEmail,
        subject: `Werkbon - ${completion.project.title}`,
        html: emailHtml,
        from_name: 'SMANS Onderhoud',
      },
    });

    if (emailError) {
      console.error('Email send error:', emailError);
      // Don't fail completely, just log
    }

    // Update completion status
    await supabaseClient
      .from('project_completions')
      .update({ 
        status: 'sent',
        email_sent_at: new Date().toISOString()
      })
      .eq('id', completionId);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Werkbon email verzonden',
        emailSent: !emailError,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});

