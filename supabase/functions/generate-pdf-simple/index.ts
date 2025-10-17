import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { format } from "https://deno.land/std@0.208.0/datetime/format.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Function to generate the HTML for the work order
const generateWorkOrderHTML = (
  completion: any,
  project: any,
  installer: any,
  workOrder: any,
  tasks: any[],
  photos: any[]
): string => {

  const groupedTasks = (tasks || []).reduce((acc, task) => {
    const block = task.block_title || 'Overige Taken';
    if (!acc[block]) {
      acc[block] = [];
    }
    acc[block].push(task.task_description);
    return acc;
  }, {} as Record<string, string[]>);

  const tasksHtml = Object.keys(groupedTasks).length > 0
    ? Object.entries(groupedTasks).map(([blockTitle, taskDescriptions]) => `
        <div style="margin-bottom: 10px;">
          <h4 style="font-weight: bold; color: #333; font-size: 13px;">${blockTitle}</h4>
          <ul style="list-style-type: disc; list-style-position: inside; padding-left: 15px; margin-top: 5px;">
            ${taskDescriptions.map(desc => `<li>${desc}</li>`).join('')}
          </ul>
        </div>
      `).join('')
    : 'Geen specifieke taken geselecteerd voor deze werkbon.';

  const workSummary = completion.work_performed || workOrder?.summary_text || '';
  const summaryHtml = workSummary
    ? `<div class="section-title">Samenvatting Oplevering</div><div class="work-summary"><p>${workSummary}</p></div>`
    : '';

  const photosHtml = photos && photos.length > 0 ? `
    <div class="section-title">Opleverfoto's</div>
    <div class="photo-gallery">
      ${photos.map(p => `<div class="photo-item"><img src="${p.photo_url}" alt="${p.description || 'foto'}"><p>${p.description || ''}</p></div>`).join('')}
    </div>
  ` : '';
  
  const nlLocale = { code: 'nl-NL' } as any;
  const formatDate = (date: string | Date, fmt: string) => {
    try {
      return format(new Date(date), fmt, { locale: nlLocale });
    } catch {
      return 'Ongeldige datum';
    }
  }

  const projectName = project?.name || project?.title || 'N/A';
  const customerName = project?.customer?.name || completion?.customer_name || 'N/A';
  const signedAt = workOrder?.signed_at || completion?.created_at;

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
      .container { max-width: 800px; margin: auto; border: 1px solid #eee; padding: 20px; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
      .header img { max-width: 150px; }
      .header h1 { font-size: 24px; color: #333; }
      .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
      .info-box { padding: 10px; background: #f9f9f9; border-radius: 5px; }
      .info-box h3 { font-size: 14px; margin-top: 0; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
      .section-title { font-size: 16px; font-weight: bold; margin-top: 20px; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px solid #eee; }
      .work-summary p { white-space: pre-wrap; }
      .signature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 30px; }
      .signature-box { border: 1px solid #ddd; padding: 15px; text-align: center; }
      .signature-box img { max-width: 200px; max-height: 100px; }
      .photo-gallery { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
      .photo-item img { width: 100%; border: 1px solid #ddd; }
      .photo-item p { font-size: 12px; text-align: center; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <img src="https://www.smanscrm.nl/lovable-uploads/ad3fa40e-af0e-42d9-910f-59eab7f8e4ed.png" alt="Logo Smans" />
        <h1>Werkbon</h1>
      </div>

      <div class="info-grid">
        <div class="info-box">
          <h3>Project Informatie</h3>
          <p><strong>Project:</strong> ${projectName}</p>
          <p><strong>Datum:</strong> ${formatDate(signedAt, 'dd-MM-yyyy HH:mm')}</p>
        </div>
        <div class="info-box">
          <h3>Klant Informatie</h3>
          <p><strong>Klant:</strong> ${customerName}</p>
        </div>
      </div>

      ${summaryHtml}
      
      <div class="section-title">Uitgevoerde Taken</div>
      ${tasksHtml}

      ${photosHtml}

      <div class="signature-grid">
        <div class="signature-box">
          <h4>Handtekening Klant</h4>
          <img src="${completion.customer_signature || ''}" alt="Handtekening Klant"/>
          <p>${customerName}</p>
          <p>${formatDate(signedAt, 'dd-MM-yyyy HH:mm')}</p>
        </div>
        <div class="signature-box">
          <h4>Handtekening Monteur</h4>
          <img src="${completion.installer_signature || ''}" alt="Handtekening Monteur"/>
          <p>${installer.full_name}</p>
          <p>${formatDate(signedAt, 'dd-MM-yyyy HH:mm')}</p>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { completionId } = await req.json()
    if (!completionId) throw new Error("completionId is vereist.");

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // --- 1. Fetch all essential data with admin rights ---
    const { data: completion, error: completionError } = await supabaseAdmin
      .from('project_completions')
      .select('*')
      .eq('id', completionId)
      .single();
    if (completionError) throw new Error(`Kon oplevering niet vinden: ${completionError.message}`);

    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('*, customer:customers(*)')
      .eq('id', completion.project_id)
      .single();
    if (projectError) throw new Error(`Kon project niet vinden: ${projectError.message}`);

    const { data: installer, error: installerError } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('id', completion.installer_id)
      .single();
    if (installerError) throw new Error(`Kon monteur niet vinden: ${installerError.message}`);

    const { data: workOrder, error: workOrderError } = await supabaseAdmin
      .from('project_work_orders')
      .select('id, signed_at, summary_text')
      .eq('completion_id', completionId)
      .single();
    if (workOrderError) throw new Error(`Kon werkbon niet vinden: ${workOrderError.message}`);

    const { data: tasks, error: tasksError } = await supabaseAdmin
      .from('project_tasks')
      .select('task_description, block_title')
      .eq('work_order_id', workOrder.id);
    if (tasksError) throw new Error(`Kon taken niet vinden: ${tasksError.message}`);

    const { data: photos, error: photosError } = await supabaseAdmin
      .from('completion_photos')
      .select('photo_url, description')
      .eq('completion_id', completionId);
    if (photosError) console.warn("Let op: kon geen foto's vinden.", photosError.message);

    // --- 2. Generate HTML ---
    const html = generateWorkOrderHTML(completion, project, installer, workOrder, tasks || [], photos || []);
    
    // --- 3. Return HTML for preview ---
    return new Response(JSON.stringify({ html }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
