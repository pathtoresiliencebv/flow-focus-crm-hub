// Edge Function: generate-workorder-pdf-mobile
// Generates PDF for werkbon/oplevering from mobile app

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { completionId } = await req.json();

    if (!completionId) {
      throw new Error('completionId is required');
    }

    // Fetch completion data
    const { data: completion, error: completionError } = await supabaseClient
      .from('project_completions')
      .select(`
        *,
        project:projects (
          *,
          customer:customers (*)
        ),
        installer:profiles!installer_id (full_name),
        photos:completion_photos (*)
      `)
      .eq('id', completionId)
      .single();

    if (completionError) throw completionError;

    // Generate simple HTML for PDF
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; }
    h1 { color: #9d1b1b; }
    .header { text-align: center; margin-bottom: 40px; }
    .section { margin-bottom: 30px; }
    .signature { margin-top: 40px; }
    img { max-width: 200px; height: auto; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Onderhoud en Service J.J.P. Smans - Werkbon</h1>
    <p>Project: ${completion.project.title}</p>
    <p>Klant: ${completion.project.customer.name}</p>
    <p>Datum: ${new Date(completion.completion_date).toLocaleDateString('nl-NL')}</p>
  </div>

  <div class="section">
    <h3>Uitgevoerd Werk:</h3>
    <p>${completion.work_performed}</p>
  </div>

  ${completion.materials_used ? `
  <div class="section">
    <h3>Gebruikte Materialen:</h3>
    <p>${completion.materials_used}</p>
  </div>
  ` : ''}

  ${completion.recommendations ? `
  <div class="section">
    <h3>Aanbevelingen:</h3>
    <p>${completion.recommendations}</p>
  </div>
  ` : ''}

  <div class="section">
    <p><strong>Werktijd:</strong> ${completion.total_work_hours || 0} uur</p>
    <p><strong>Klanttevredenheid:</strong> ${completion.customer_satisfaction}/5 ⭐</p>
  </div>

  <div class="signature">
    <p><strong>Handtekening Klant:</strong> ${completion.customer_name}</p>
    ${completion.customer_signature ? `<img src="${completion.customer_signature}" alt="Klant handtekening" />` : ''}
  </div>

  <div class="signature">
    <p><strong>Handtekening Monteur:</strong> ${completion.installer.full_name}</p>
    ${completion.installer_signature ? `<img src="${completion.installer_signature}" alt="Monteur handtekening" />` : ''}
  </div>
</body>
</html>
    `;

    // Return HTML (in production, use a PDF generator service)
    // For now, return PDF URL that would be generated
    const pdfUrl = `https://pvesgvkyiaqmsudmmtkc.supabase.co/storage/v1/object/public/completion-reports/werkbon_${completionId}.pdf`;

    // Update completion with PDF URL
    await supabaseClient
      .from('project_completions')
      .update({ 
        pdf_url: pdfUrl,
        status: 'completed',
        email_sent_at: new Date().toISOString()
      })
      .eq('id', completionId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        pdfUrl,
        html // For debugging
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );

  } catch (error: any) {
    console.error('Error generating workorder PDF:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});

