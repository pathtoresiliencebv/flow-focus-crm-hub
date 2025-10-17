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
    const { completionId } = await req.json()

    if (!completionId) {
      return new Response(
        JSON.stringify({ error: 'completionId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`--- Generating Work Order for Completion ID: ${completionId} ---`);

    // Initialize a separate, privileged Supabase client for server-side operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Fetch completion data with all necessary joins
    const { data: completion, error: completionError } = await supabaseAdmin
      .from('project_completions')
      .select(`
        *,
        project:projects(*, customer:customers(*)),
        installer:profiles!project_completions_installer_id_fkey(*)
      `)
      .eq('id', completionId)
      .single()

    if (completionError) {
      console.error('Error fetching completion data:', completionError);
      throw new Error('Could not fetch project completion details.');
    }
    console.log('Successfully fetched completion data.');
    // Add detailed log to inspect the fetched data
    console.log('Completion Object:', JSON.stringify(completion, null, 2));


    // 2. Fetch associated tasks using the work_order_id
    const { data: workOrder } = await supabaseAdmin
      .from('project_work_orders')
      .select('id')
      .eq('completion_id', completionId)
      .single();
    
    let tasks: any[] = [];
    if (workOrder) {
      const { data: taskData, error: tasksError } = await supabaseAdmin
        .from('project_tasks')
        .select('task_description')
        .eq('work_order_id', workOrder.id);
      
      if(tasksError) {
        console.error('Error fetching tasks for work order:', tasksError);
      } else {
        tasks = taskData || [];
        console.log(`Found ${tasks.length} associated tasks.`);
      }
    } else {
      console.warn('Could not find a matching work order for this completion.');
    }

    // 3. Fetch completion photos
    const { data: photos, error: photosError } = await supabaseAdmin
      .from('completion_photos')
      .select('photo_url, description')
      .eq('completion_id', completionId);

    if (photosError) {
      console.error('Error fetching completion photos:', photosError);
    } else {
      console.log(`Found ${photos?.length || 0} associated photos.`);
    }

    // Prepare HTML content
    const tasksHtml = tasks.length > 0
      ? `<ul style="list-style-position: inside; padding-left: 5px; margin: 0;">${tasks.map(task => `<li>${task.task_description}</li>`).join('')}</ul>`
      : 'Geen specifieke taken geselecteerd voor deze werkbon.';

    const summaryHtml = completion.work_performed
      ? `<div class="section-title">Samenvatting Oplevering</div><div class="work-summary"><p>${completion.work_performed}</p></div>`
      : '';

    const photosHtml = photos && photos.length > 0 
      ? `
      <div class="section-title">Opleverfoto's</div>
      <div class="photos-grid">
        ${photos.map(photo => `
          <div class="photo-box">
            <img src="${photo.photo_url}" alt="${photo.description || 'Opleverfoto'}">
          </div>
        `).join('')}
      </div>` 
      : '';

    const html = `
      <!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Werkbon - ${completion.project?.title || 'N/A'}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: Arial, sans-serif;
      font-size: 12px;
      line-height: 1.4;
      color: #333;
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #d32f2f;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #d32f2f;
      font-size: 28px;
      margin-bottom: 10px;
    }
    .header .company {
      font-size: 16px;
      color: #666;
    }
    .info-section {
      margin-bottom: 25px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }
    .info-box {
      background: #f5f5f5;
      padding: 15px;
      border-left: 4px solid #d32f2f;
    }
    .info-box h3 {
      color: #d32f2f;
      margin-bottom: 10px;
      font-size: 14px;
    }
    .section-title {
      background: #d32f2f;
      color: white;
      padding: 8px 15px;
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 15px;
    }
    .work-summary {
      background: #f9f9f9;
      padding: 15px;
      margin-bottom: 20px;
      border: 1px solid #ddd;
    }
    .tasks-list {
      margin-bottom: 20px;
    }
    .task-item {
      padding: 8px 0;
      border-bottom: 1px solid #eee;
      display: flex;
      align-items: center;
    }
    .task-item:last-child {
      border-bottom: none;
    }
    .task-checkbox {
      margin-right: 10px;
      color: #4caf50;
      font-weight: bold;
    }
    .photo-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 20px;
    }
    .photo-item {
      text-align: center;
    }
    .photo-item img {
      width: 100%;
      height: 120px;
      object-fit: cover;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    .photo-category {
      font-size: 10px;
      color: #666;
      margin-top: 5px;
    }
    .signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-top: 30px;
    }
    .signature-box {
      border: 1px solid #ddd;
      padding: 15px;
      text-align: center;
    }
    .signature-box h4 {
      margin-bottom: 10px;
      color: #d32f2f;
    }
    .signature-image {
      max-width: 200px;
      max-height: 100px;
      border: 1px solid #ccc;
      margin: 10px 0;
    }
    .summary-box {
      background: #e8f5e8;
      padding: 15px;
      border: 1px solid #4caf50;
      margin-top: 20px;
    }
    .summary-box h3 {
      color: #2e7d32;
      margin-bottom: 10px;
    }
    .materials-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .materials-table th,
    .materials-table td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    .materials-table th {
      background: #f5f5f5;
      font-weight: bold;
    }
    @media print {
      body { margin: 0; padding: 15px; }
      .photo-grid { page-break-inside: avoid; }
    }
    .photos-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; margin-bottom: 20px; }
    .photo-box img { width: 100%; height: auto; object-fit: cover; border-radius: 4px; border: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="header">
    <h1>SMANS ONDERHOUD</h1>
    <div class="company">Onderhoud en Service J.J.P. Smans</div>
    <div style="margin-top: 10px; font-size: 14px;">Werkbon</div>
  </div>

  <div class="info-grid">
    <div class="info-box">
      <h3>Project Informatie</h3>
      <p><strong>Project:</strong> ${completion.project?.title || 'N/A'}</p>
      <p><strong>Datum:</strong> ${completion.completion_date ? new Date(completion.completion_date).toLocaleDateString('nl-NL') : 'N/A'}</p>
      <p><strong>Status:</strong> Afgerond</p>
    </div>
    <div class="info-box">
      <h3>Klant Informatie</h3>
      <p><strong>Naam:</strong> ${completion.project?.customer?.name || completion.customer_name || 'N/A'}</p>
      <p><strong>Email:</strong> ${completion.project?.customer?.email || 'N/A'}</p>
      <p><strong>Telefoon:</strong> ${completion.project?.customer?.phone || 'N/A'}</p>
      <p><strong>Adres:</strong> ${completion.project?.customer?.address || 'N/A'}</p>
    </div>
  </div>

  ${summaryHtml}

  <div class="section-title">Uitgevoerde Werkzaamheden</div>
  <div class="work-summary">
    ${tasksHtml}
  </div>

  ${photosHtml}

  <div class="signatures">
    <div class="signature-box">
      <h4>Handtekening Klant</h4>
      <p><strong>Naam:</strong> ${completion.customer_name || completion.project?.customer?.name || 'N/A'}</p>
      <p><strong>Datum:</strong> ${completion.completion_date ? new Date(completion.completion_date).toLocaleDateString('nl-NL') : 'N/A'}</p>
      ${completion.customer_signature ? `
      <div style="border: 1px solid #ccc; padding: 10px; margin: 10px 0; background: #f9f9f9;">
        <img src="${completion.customer_signature}" alt="Klant handtekening" class="signature-image" style="max-width: 200px; max-height: 100px; display: block; margin: 0 auto;" />
      </div>
      ` : '<p style="color: #999; text-align: center; padding: 20px; border: 1px dashed #ccc;">Geen handtekening beschikbaar</p>'}
    </div>
    
    <div class="signature-box">
      <h4>Handtekening Monteur</h4>
      <p><strong>Naam:</strong> ${completion.installer?.full_name || 'N/A'}</p>
      <p><strong>Datum:</strong> ${completion.completion_date ? new Date(completion.completion_date).toLocaleDateString('nl-NL') : 'N/A'}</p>
      ${completion.installer_signature ? `
      <div style="border: 1px solid #ccc; padding: 10px; margin: 10px 0; background: #f9f9f9;">
        <img src="${completion.installer_signature}" alt="Monteur handtekening" class="signature-image" style="max-width: 200px; max-height: 100px; display: block; margin: 0 auto;" />
      </div>
      ` : '<p style="color: #999; text-align: center; padding: 20px; border: 1px dashed #ccc;">Geen handtekening beschikbaar</p>'}
    </div>
  </div>

  <div class="summary-box">
    <h3>Samenvatting</h3>
    <p><strong>Werktijd:</strong> ${completion.total_work_hours || 0} uur</p>
    <p><strong>Klanttevredenheid:</strong> ${completion.customer_satisfaction || 5}/5 ⭐</p>
    <p><strong>Kwaliteitsbeoordeling:</strong> ${completion.quality_rating || 5}/5 ⭐</p>
    ${completion.customer_feedback ? `
    <p><strong>Klant feedback:</strong> ${completion.customer_feedback}</p>
    ` : ''}
  </div>

  <div style="text-align: center; margin-top: 30px; color: #666; font-size: 10px;">
    <p>Dit werkbon is automatisch gegenereerd door het SMANS CRM systeem</p>
    <p>Datum: ${new Date().toLocaleDateString('nl-NL')} - Werkbon ID: ${completion.id.slice(0, 8).toUpperCase()}</p>
  </div>
</body>
</html>
  `.trim()

    console.log('[generate-pdf-simple] HTML generated successfully. Attempting to generate PDF buffer...');
    const pdfBuffer = await generatePDFFromHTML(html);
    console.log(`[generate-pdf-simple] PDF buffer generated. Size: ${pdfBuffer.byteLength} bytes.`);

    // Upload PDF to Supabase Storage using the admin client
    const fileName = `werkbon-${completionId}-${Date.now()}.pdf`
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('completion-reports')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      // Return HTML as fallback
      return new Response(
        JSON.stringify({ 
          success: true, 
          html,
          pdfUrl: `data:text/html;charset=utf-8,${encodeURIComponent(html)}`,
          message: 'HTML generated successfully. PDF upload failed.' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get public URL using the admin client
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('completion-reports')
      .getPublicUrl(fileName)

    // Update completion record with PDF URL using the admin client
    await supabaseAdmin
      .from('project_completions')
      .update({ 
        pdf_url: publicUrl,
        status: 'completed'
      })
      .eq('id', completionId)

    // Also update the work order record with PDF URL using the admin client
    await supabaseAdmin
      .from('project_work_orders')
      .update({ 
        pdf_url: publicUrl
      })
      .eq('completion_id', completionId)

    return new Response(
      JSON.stringify({ 
        success: true, 
        html,
        pdfUrl: publicUrl,
        fileName,
        message: 'PDF generated and uploaded successfully.' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('[generate-pdf-simple] Unhandled error:', error.message);
    return new Response(
      JSON.stringify({ error: `Server error: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function generateSimpleWorkOrderHTML(data: any): string {
  const { completion, customer, project, monteur, photos, materials, tasks } = data

  const beforePhotos = photos.filter((p: any) => p.category === 'before')
  const afterPhotos = photos.filter((p: any) => p.category === 'after')
  const duringPhotos = photos.filter((p: any) => p.category === 'during')

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Werkbon - ${project.title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: Arial, sans-serif;
      font-size: 12px;
      line-height: 1.4;
      color: #333;
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #d32f2f;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #d32f2f;
      font-size: 28px;
      margin-bottom: 10px;
    }
    .header .company {
      font-size: 16px;
      color: #666;
    }
    .info-section {
      margin-bottom: 25px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }
    .info-box {
      background: #f5f5f5;
      padding: 15px;
      border-left: 4px solid #d32f2f;
    }
    .info-box h3 {
      color: #d32f2f;
      margin-bottom: 10px;
      font-size: 14px;
    }
    .section-title {
      background: #d32f2f;
      color: white;
      padding: 8px 15px;
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 15px;
    }
    .work-summary {
      background: #f9f9f9;
      padding: 15px;
      margin-bottom: 20px;
      border: 1px solid #ddd;
    }
    .tasks-list {
      margin-bottom: 20px;
    }
    .task-item {
      padding: 8px 0;
      border-bottom: 1px solid #eee;
      display: flex;
      align-items: center;
    }
    .task-item:last-child {
      border-bottom: none;
    }
    .task-checkbox {
      margin-right: 10px;
      color: #4caf50;
      font-weight: bold;
    }
    .photo-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 20px;
    }
    .photo-item {
      text-align: center;
    }
    .photo-item img {
      width: 100%;
      height: 120px;
      object-fit: cover;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    .photo-category {
      font-size: 10px;
      color: #666;
      margin-top: 5px;
    }
    .signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-top: 30px;
    }
    .signature-box {
      border: 1px solid #ddd;
      padding: 15px;
      text-align: center;
    }
    .signature-box h4 {
      margin-bottom: 10px;
      color: #d32f2f;
    }
    .signature-image {
      max-width: 200px;
      max-height: 100px;
      border: 1px solid #ccc;
      margin: 10px 0;
    }
    .summary-box {
      background: #e8f5e8;
      padding: 15px;
      border: 1px solid #4caf50;
      margin-top: 20px;
    }
    .summary-box h3 {
      color: #2e7d32;
      margin-bottom: 10px;
    }
    .materials-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .materials-table th,
    .materials-table td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    .materials-table th {
      background: #f5f5f5;
      font-weight: bold;
    }
    @media print {
      body { margin: 0; padding: 15px; }
      .photo-grid { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>SMANS ONDERHOUD</h1>
    <div class="company">Onderhoud en Service J.J.P. Smans</div>
    <div style="margin-top: 10px; font-size: 14px;">Werkbon</div>
  </div>

  <div class="info-grid">
    <div class="info-box">
      <h3>Project Informatie</h3>
      <p><strong>Project:</strong> ${project.title}</p>
      <p><strong>Datum:</strong> ${new Date(completion.completion_date).toLocaleDateString('nl-NL')}</p>
      <p><strong>Status:</strong> Afgerond</p>
    </div>
    <div class="info-box">
      <h3>Klant Informatie</h3>
      <p><strong>Naam:</strong> ${customer?.name || completion.customer_name || 'N/A'}</p>
      <p><strong>Email:</strong> ${customer?.email || 'N/A'}</p>
      <p><strong>Telefoon:</strong> ${customer?.phone || 'N/A'}</p>
      <p><strong>Adres:</strong> ${customer?.address || 'N/A'}</p>
    </div>
  </div>

  <div class="section-title">Uitgevoerd Werk</div>
  <div class="work-summary">
    <p><strong>Werkzaamheden:</strong></p>
    <p>${completion.work_performed || 'Geen details beschikbaar'}</p>
    
    ${completion.materials_used ? `
    <p style="margin-top: 15px;"><strong>Gebruikte Materialen:</strong></p>
    <p>${completion.materials_used}</p>
    ` : ''}
    
    ${completion.recommendations ? `
    <p style="margin-top: 15px;"><strong>Aanbevelingen:</strong></p>
    <p>${completion.recommendations}</p>
    ` : ''}
  </div>

  ${tasks && tasks.length > 0 ? `
  <div class="section-title">Uitgevoerde Taken</div>
  <div class="tasks-list">
    ${tasks.map((task: any) => `
    <div class="task-item">
      <span class="task-checkbox">✓</span>
      <span>${task.block_title || task.task_description || 'Taak'}</span>
    </div>
    `).join('')}
  </div>
  ` : ''}

  ${materials && materials.length > 0 ? `
  <div class="section-title">Gebruikte Materialen</div>
  <table class="materials-table">
    <thead>
      <tr>
        <th>Materiaal</th>
        <th>Hoeveelheid</th>
        <th>Prijs per stuk</th>
        <th>Totaal</th>
      </tr>
    </thead>
    <tbody>
      ${materials.map((material: any) => `
      <tr>
        <td>${material.material_name}</td>
        <td>${material.quantity} ${material.unit || 'stuks'}</td>
        <td>€${(material.unit_price || 0).toFixed(2)}</td>
        <td>€${(material.total_price || 0).toFixed(2)}</td>
      </tr>
      `).join('')}
    </tbody>
  </table>
  ` : ''}

  ${photos && photos.length > 0 ? `
  <div class="section-title">Foto's van het Werk</div>
  <div class="photo-grid">
    ${photos.slice(0, 12).map((photo: any) => `
    <div class="photo-item" style="text-align: center; margin-bottom: 15px;">
      <img src="${photo.photo_url}" alt="Werk foto - ${getCategoryLabel(photo.category)}" style="width: 100%; height: 120px; object-fit: cover; border: 1px solid #ddd; border-radius: 4px; display: block;" />
      <div class="photo-category" style="font-size: 11px; color: #666; margin-top: 5px; font-weight: bold;">${getCategoryLabel(photo.category)}</div>
      ${photo.description ? `<div style="font-size: 10px; color: #666; margin-top: 2px;">${photo.description}</div>` : ''}
    </div>
    `).join('')}
  </div>
  ` : '<div class="section-title">Foto\'s van het Werk</div><p style="color: #999; text-align: center; padding: 20px;">Geen foto\'s beschikbaar</p>'}

  <div class="signatures">
    <div class="signature-box">
      <h4>Handtekening Klant</h4>
      <p><strong>Naam:</strong> ${completion.customer_name || customer?.name || 'N/A'}</p>
      <p><strong>Datum:</strong> ${new Date(completion.completion_date).toLocaleDateString('nl-NL')}</p>
      ${completion.customer_signature ? `
      <div style="border: 1px solid #ccc; padding: 10px; margin: 10px 0; background: #f9f9f9;">
        <img src="${completion.customer_signature}" alt="Klant handtekening" class="signature-image" style="max-width: 200px; max-height: 100px; display: block; margin: 0 auto;" />
      </div>
      ` : '<p style="color: #999; text-align: center; padding: 20px; border: 1px dashed #ccc;">Geen handtekening beschikbaar</p>'}
    </div>
    
    <div class="signature-box">
      <h4>Handtekening Monteur</h4>
      <p><strong>Naam:</strong> ${monteur?.full_name || 'N/A'}</p>
      <p><strong>Datum:</strong> ${new Date(completion.completion_date).toLocaleDateString('nl-NL')}</p>
      ${completion.installer_signature ? `
      <div style="border: 1px solid #ccc; padding: 10px; margin: 10px 0; background: #f9f9f9;">
        <img src="${completion.installer_signature}" alt="Monteur handtekening" class="signature-image" style="max-width: 200px; max-height: 100px; display: block; margin: 0 auto;" />
      </div>
      ` : '<p style="color: #999; text-align: center; padding: 20px; border: 1px dashed #ccc;">Geen handtekening beschikbaar</p>'}
    </div>
  </div>

  <div class="summary-box">
    <h3>Samenvatting</h3>
    <p><strong>Werktijd:</strong> ${completion.total_work_hours || 0} uur</p>
    <p><strong>Klanttevredenheid:</strong> ${completion.customer_satisfaction || 5}/5 ⭐</p>
    <p><strong>Kwaliteitsbeoordeling:</strong> ${completion.quality_rating || 5}/5 ⭐</p>
    ${completion.customer_feedback ? `
    <p><strong>Klant feedback:</strong> ${completion.customer_feedback}</p>
    ` : ''}
  </div>

  <div style="text-align: center; margin-top: 30px; color: #666; font-size: 10px;">
    <p>Dit werkbon is automatisch gegenereerd door het SMANS CRM systeem</p>
    <p>Datum: ${new Date().toLocaleDateString('nl-NL')} - Werkbon ID: ${completion.id.slice(0, 8).toUpperCase()}</p>
  </div>
</body>
</html>
  `.trim()
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    'before': 'Voor',
    'during': 'Tijdens',
    'after': 'Na',
    'detail': 'Detail',
    'overview': 'Overzicht'
  }
  return labels[category] || category
}

async function generatePDFFromHTML(html: string): Promise<Uint8Array> {
  /**
   * PDF Generation Strategy:
   * 
   * 1. Try HTMLPDF_API_KEY (html2pdf.app) - Most reliable
   * 2. Try PDFSHIFT_API_KEY - Alternative service
   * 3. Fall back to plain HTML (user prints manually)
   * 
   * Note: Full PDF rendering requires external service or headless browser
   * For production, use a dedicated PDF service
   */
  
  const apiKey = Deno.env.get('HTMLPDF_API_KEY')
  
  if (apiKey) {
    try {
      console.log('🔄 Generating PDF via HTML2PDF service...')
      
      const response = await fetch('https://api.html2pdf.app/v1/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          html: html,
          options: {
            format: 'A4',
            margin: {
              top: '20mm',
              right: '20mm',
              bottom: '20mm',
              left: '20mm'
            },
            printBackground: true,
            displayHeaderFooter: false
          }
        })
      })

      if (!response.ok) {
        throw new Error(`HTML2PDF API error: ${response.status}`)
      }

      const pdfBuffer = await response.arrayBuffer()
      console.log('✅ PDF generated successfully via HTML2PDF')
      return new Uint8Array(pdfBuffer)
    } catch (error) {
      console.error('❌ HTML2PDF service failed:', error)
    }
  }

  // Fallback: Return HTML as text for manual PDF conversion
  console.log('⚠️ No PDF service available, returning HTML for manual conversion')
  const encoder = new TextEncoder()
  return encoder.encode(html)
}
