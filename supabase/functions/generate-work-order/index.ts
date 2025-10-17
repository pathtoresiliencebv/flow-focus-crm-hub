import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'npm:resend@2.0.0'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WorkOrderData {
  completionId: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 [generate-work-order] Starting...')
    console.log('📋 Checking environment variables...')
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')
    const htmlpdfKey = Deno.env.get('HTMLPDF_API_KEY')
    const pdfshiftKey = Deno.env.get('PDFSHIFT_API_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ CRITICAL: Missing Supabase environment variables')
      console.error('  SUPABASE_URL:', supabaseUrl ? '✅ SET' : '❌ MISSING')
      console.error('  SUPABASE_ANON_KEY:', supabaseKey ? '✅ SET' : '❌ MISSING')
      throw new Error('Missing Supabase credentials')
    }
    
    console.log('✅ Supabase credentials OK')
    console.log('📋 PDF Services available:')
    console.log('  HTMLPDF_API_KEY:', htmlpdfKey ? '✅ SET' : '❌ MISSING')
    console.log('  PDFSHIFT_API_KEY:', pdfshiftKey ? '✅ SET' : '❌ MISSING')

    // Use service role key for full database access
    // Edge functions need elevated permissions to update completion records
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || supabaseKey
    const supabaseClient = createClient(
      supabaseUrl,
      serviceRoleKey
    )

    // Get completion ID from request
    console.log('📋 Parsing request body...')
    let body
    try {
      body = await req.json()
    } catch (e) {
      console.error('❌ Failed to parse request JSON:', e)
      throw new Error('Invalid JSON in request body')
    }
    
    const { completionId }: WorkOrderData = body

    if (!completionId) {
      console.error('❌ Missing completionId in request')
      throw new Error('Completion ID is required')
    }

    console.log('📋 [STEP 1] Fetching completion record:', completionId)

    // Fetch completion data with all related information
    const { data: completion, error: completionError } = await supabaseClient
      .from('project_completions')
      .select(`
        *,
        project:projects(*)
      `)
      .eq('id', completionId)
      .single()

    if (completionError) throw completionError
    if (!completion) throw new Error('Completion not found')

    // Fetch customer data from project
    let customer = null
    if (completion.project) {
      const { data: customerData } = await supabaseClient
        .from('customers')
        .select('*')
        .eq('id', completion.project.customer_id)
        .single()
      customer = customerData
    }

    // Fetch photos
    const { data: photos } = await supabaseClient
      .from('completion_photos')
      .select('*')
      .eq('completion_id', completionId)
      .order('uploaded_at')

    // Fetch materials from project_materials table
    const { data: materials } = await supabaseClient
      .from('project_materials')
      .select('*')
      .eq('project_id', completion.project_id)
      .order('created_at')

    // Fetch tasks
    const { data: tasks } = await supabaseClient
      .from('project_tasks')
      .select('*')
      .eq('project_id', completion.project_id)
      .order('created_at')

    // Filter tasks by selected_task_ids if available
    let tasksForWorkOrder = tasks || []
    if (completion.selected_task_ids) {
      try {
        // Parse JSON string to array
        const selectedIds = JSON.parse(completion.selected_task_ids)
        if (Array.isArray(selectedIds) && selectedIds.length > 0) {
          console.log('📋 Filtering tasks by selected_task_ids:', selectedIds)
          tasksForWorkOrder = tasksForWorkOrder.filter((t: any) => 
            selectedIds.includes(t.id)
          )
          console.log(`✅ Filtered ${tasksForWorkOrder.length} tasks for work order out of ${tasks?.length || 0} total`)
        } else {
          console.log('ℹ️ selected_task_ids is empty array - using all tasks')
        }
      } catch (e) {
        console.error('⚠️ Error parsing selected_task_ids JSON:', e)
        console.log('ℹ️ Using all tasks due to parsing error')
      }
    } else {
      console.log('ℹ️ No selected_task_ids found - using all tasks')
    }

    // Fetch monteur data
    const { data: monteur } = await supabaseClient
      .from('profiles')
      .select('full_name, email')
      .eq('id', completion.installer_id)
      .single()

    console.log('Data fetched successfully:', {
      completion: !!completion,
      customer: !!customer,
      photos: photos?.length || 0,
      materials: materials?.length || 0,
      tasks: tasks?.length || 0
    })

    // Generate HTML for work order
    const html = generateWorkOrderHTML({
      completion,
      customer,
      project: completion.project,
      monteur,
      photos: photos || [],
      materials: materials || [],
      tasks: tasksForWorkOrder
    })

    // Generate PDF using Puppeteer (via Deno Deploy's browser API)
    // For now, return HTML - in production, use a PDF generation service
    const pdfBuffer = await generatePDFFromHTML(html)

    // Upload PDF to Supabase Storage
    const fileName = `werkbon-${completionId}-${Date.now()}.pdf`
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('completion-reports')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false
      })

    if (uploadError) throw uploadError

    // Get public URL
    const { data: { publicUrl } } = supabaseClient.storage
      .from('completion-reports')
      .getPublicUrl(fileName)

    // Update completion record with PDF URL
    await supabaseClient
      .from('project_completions')
      .update({ 
        pdf_url: publicUrl,
        status: 'completed'
      })
      .eq('id', completionId)

    // Save to project_work_orders table
    const workOrderNumber = `WB-${Date.now()}-${completionId.slice(0, 8).toUpperCase()}`;
    
    const { data: workOrder, error: workOrderError } = await supabaseClient
      .from('project_work_orders')
      .insert({
        project_id: completion.project_id,
        work_order_number: workOrderNumber,
        client_signature_data: completion.customer_signature,
        client_name: customer?.name || completion.customer_name,
        signed_at: new Date(completion.completion_date).toISOString(),
        work_photos: photos.map((p: any) => ({
          url: p.photo_url,
          category: p.category,
          description: p.description
        })),
        summary_text: `
Voltooide taken: ${tasksForWorkOrder.filter((t: any) => t.is_completed).length}/${tasksForWorkOrder.length}
Openstaande taken: ${tasksForWorkOrder.filter((t: any) => !t.is_completed).length}

Uitgevoerde werkzaamheden:
${completion.work_performed}

${completion.recommendations ? `Aanbevelingen:\n${completion.recommendations}` : ''}
        `.trim(),
        pdf_url: publicUrl
      })
      .select()
      .single();

    if (workOrderError) {
      console.error('Error saving work order:', workOrderError);
      // Don't throw - PDF is still generated
    } else {
      console.log('✅ Work order saved:', workOrderNumber);
    }

    // Send email to customer via SMANS SMTP
    if (customer?.email) {
      // Download PDF and convert to base64 for attachment
      let pdfBase64 = null;
      try {
        console.log('📥 Downloading PDF for email attachment:', publicUrl);
        const pdfResponse = await fetch(publicUrl);
        if (pdfResponse.ok) {
          const pdfBuffer = await pdfResponse.arrayBuffer();
          pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));
          console.log('✅ PDF converted to base64');
        }
      } catch (pdfError) {
        console.error('⚠️ Warning: Could not attach PDF:', pdfError);
      }

      // Send email via Resend (same as quote emails - proven to work)
      const emailResponse = await resend.emails.send({
        from: "Onderhoud en Service J.J.P. Smans <info@smansonderhoud.nl>",
        to: [customer.email],
        subject: `Uw werkbon voor project ${completion.project?.title || 'ID ' + completionId.slice(0, 8)}`,
        html: generateEmailHTML(customer, publicUrl, completion, tasks),
        attachments: pdfBase64 ? [{
          filename: `werkbon-${completionId.slice(0, 8)}.pdf`,
          content: pdfBase64
        }] : []
      });

      const emailError = emailResponse.error;

      if (emailError) {
        console.error('Email send error:', emailError);
        // Don't throw - PDF is still generated and saved
      } else {
        console.log('✅ Email sent to customer:', customer.email);
        
        // Update email sent timestamp
        await supabaseClient
          .from('project_completions')
          .update({ email_sent_at: new Date().toISOString() })
          .eq('id', completionId);
      }
    }

    console.log('Work order generated successfully:', publicUrl)

    return new Response(
      JSON.stringify({
        success: true,
        pdfUrl: publicUrl,
        fileName,
        emailSent: !!customer?.email
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error generating work order:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

function generateWorkOrderHTML(data: any): string {
  const { completion, customer, project, monteur, photos, materials, tasks } = data

  const beforePhotos = photos.filter((p: any) => p.category === 'before')
  const duringPhotos = photos.filter((p: any) => p.category === 'during')
  const afterPhotos = photos.filter((p: any) => p.category === 'after')
  const detailPhotos = photos.filter((p: any) => p.category === 'detail')
  const overviewPhotos = photos.filter((p: any) => p.category === 'overview')
  const materialCost = materials.reduce((sum: number, m: any) => 
    sum + ((m.quantity_used || 0) * (m.unit_price || 0)), 0
  )

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.6;
      color: #333;
      padding: 40px;
    }
    .header {
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #2563eb;
      font-size: 24pt;
      margin-bottom: 5px;
    }
    .header .subtitle {
      color: #6b7280;
      font-size: 11pt;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-bottom: 30px;
    }
    .info-box {
      background: #f9fafb;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #2563eb;
    }
    .info-box h3 {
      color: #1f2937;
      font-size: 11pt;
      margin-bottom: 10px;
      font-weight: 600;
    }
    .info-box p {
      margin: 5px 0;
      color: #4b5563;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      background: #eff6ff;
      color: #1e40af;
      padding: 10px 15px;
      font-size: 12pt;
      font-weight: 600;
      border-radius: 6px;
      margin-bottom: 15px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
    }
    th {
      background: #f3f4f6;
      padding: 10px;
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid #d1d5db;
    }
    td {
      padding: 10px;
      border-bottom: 1px solid #e5e7eb;
    }
    .photo-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin-bottom: 20px;
    }
    .photo-item {
      text-align: center;
    }
    .photo-item img {
      width: 100%;
      height: 150px;
      object-fit: cover;
      border-radius: 8px;
      border: 1px solid #d1d5db;
    }
    .photo-item p {
      margin-top: 5px;
      font-size: 9pt;
      color: #6b7280;
    }
    .satisfaction {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 15px;
      background: #fef3c7;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .stars {
      color: #f59e0b;
      font-size: 18pt;
    }
    .signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-top: 30px;
    }
    .signature-box {
      border: 2px dashed #d1d5db;
      padding: 20px;
      border-radius: 8px;
      min-height: 100px;
      text-align: center;
    }
    .signature-box h4 {
      margin-bottom: 10px;
      color: #4b5563;
    }
    .signature-text {
      font-family: 'Brush Script MT', cursive;
      font-size: 18pt;
      color: #1f2937;
      margin: 15px 0;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 9pt;
    }
    .summary-box {
      background: #ecfdf5;
      border: 2px solid #10b981;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .summary-box h3 {
      color: #047857;
      margin-bottom: 10px;
    }
    .summary-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #d1fae5;
    }
    .summary-item:last-child {
      border-bottom: none;
      font-weight: 600;
      font-size: 12pt;
      padding-top: 15px;
      margin-top: 10px;
      border-top: 2px solid #10b981;
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <h1>WERKBON</h1>
    <p class="subtitle">Opdrachtbevestiging & Werkrapport</p>
  </div>

  <!-- Basic Info -->
  <div class="info-grid">
    <div class="info-box">
      <h3>📋 Project Informatie</h3>
      <p><strong>Project:</strong> ${project?.title || 'N/A'}</p>
      <p><strong>Werkbon Nr:</strong> ${completion.id.slice(0, 8).toUpperCase()}</p>
      <p><strong>Datum:</strong> ${new Date(completion.completion_date).toLocaleDateString('nl-NL', { 
        year: 'numeric', month: 'long', day: 'numeric' 
      })}</p>
      <p><strong>Status:</strong> ${completion.work_completed ? '✅ Voltooid' : '⏳ In Behandeling'}</p>
    </div>

    <div class="info-box">
      <h3>👤 Klant Gegevens</h3>
      <p><strong>Naam:</strong> ${customer?.name || completion.customer_name || 'N/A'}</p>
      <p><strong>Email:</strong> ${customer?.email || 'N/A'}</p>
      <p><strong>Telefoon:</strong> ${customer?.phone || 'N/A'}</p>
      <p><strong>Adres:</strong> ${customer?.address || 'N/A'}</p>
    </div>
  </div>

  <!-- Work Summary -->
  <div class="section">
    <div class="section-title">📝 Uitgevoerde Werkzaamheden</div>
    <p style="padding: 15px; background: white; border-radius: 6px; border: 1px solid #e5e7eb;">
      ${completion.work_summary || 'Geen beschrijving beschikbaar'}
    </p>
  </div>

  <!-- Tasks -->
  ${tasks && tasks.length > 0 ? `
  <div class="section">
    <div class="section-title">✅ Voltooide Taken</div>
    <table>
      <thead>
        <tr>
          <th style="width: 50px;">Status</th>
          <th>Taak Beschrijving</th>
        </tr>
      </thead>
      <tbody>
        ${tasks.filter((t: any) => t.is_completed).map((task: any) => `
          <tr>
            <td style="text-align: center;">✅</td>
            <td>${task.block_title}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  
  ${tasks.filter((t: any) => !t.is_completed).length > 0 ? `
  <div class="section">
    <div class="section-title">⏳ Openstaande Taken</div>
    <table>
      <thead>
        <tr>
          <th style="width: 50px;">Status</th>
          <th>Taak Beschrijving</th>
        </tr>
      </thead>
      <tbody>
        ${tasks.filter((t: any) => !t.is_completed).map((task: any) => `
          <tr>
            <td style="text-align: center;">⏳</td>
            <td>${task.block_title}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}
  ` : ''}

  <!-- Time Registration -->
  <div class="section">
    <div class="section-title">⏱️ Tijd Registratie</div>
    <table>
      <tr>
        <td><strong>Start Tijd:</strong></td>
        <td>${new Date(completion.actual_start_time).toLocaleString('nl-NL')}</td>
        <td><strong>Eind Tijd:</strong></td>
        <td>${new Date(completion.actual_end_time).toLocaleString('nl-NL')}</td>
      </tr>
      <tr>
        <td><strong>Totale Werktijd:</strong></td>
        <td>${completion.total_hours?.toFixed(1) || '0'} uur</td>
        <td><strong>Pauze:</strong></td>
        <td>${completion.break_minutes || 0} minuten</td>
      </tr>
    </table>
  </div>

  <!-- Materials -->
  ${materials && materials.length > 0 ? `
  <div class="section">
    <div class="section-title">📦 Gebruikte Materialen</div>
    <table>
      <thead>
        <tr>
          <th>Materiaal</th>
          <th>Leverancier</th>
          <th style="text-align: right;">Hoeveelheid</th>
        </tr>
      </thead>
      <tbody>
        ${materials.map((m: any) => `
          <tr>
            <td>${m.material_name}</td>
            <td>${m.supplier || '-'}</td>
            <td style="text-align: right;">${m.quantity} ${m.unit || ''}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  <!-- Photos -->
  ${photos.length > 0 ? `
  <div class="section">
    <div class="section-title">📸 Foto Documentatie</div>
    
    ${beforePhotos.length > 0 ? `
    <h4 style="margin: 15px 0 10px 0; color: #4b5563;">📷 Voor Foto's (${beforePhotos.length})</h4>
    <div class="photo-grid">
      ${beforePhotos.slice(0, 6).map((photo: any) => `
        <div class="photo-item">
          <img src="${photo.photo_url}" alt="${photo.description || 'Voor foto'}">
          <p>${photo.description || 'Voor'}</p>
        </div>
      `).join('')}
    </div>
    ` : ''}

    ${duringPhotos.length > 0 ? `
    <h4 style="margin: 15px 0 10px 0; color: #4b5563;">⚙️ Tijdens Werk Foto's (${duringPhotos.length})</h4>
    <div class="photo-grid">
      ${duringPhotos.slice(0, 6).map((photo: any) => `
        <div class="photo-item">
          <img src="${photo.photo_url}" alt="${photo.description || 'Tijdens foto'}">
          <p>${photo.description || 'Tijdens'}</p>
        </div>
      `).join('')}
    </div>
    ` : ''}

    ${afterPhotos.length > 0 ? `
    <h4 style="margin: 15px 0 10px 0; color: #4b5563;">✅ Na Foto's (${afterPhotos.length})</h4>
    <div class="photo-grid">
      ${afterPhotos.slice(0, 6).map((photo: any) => `
        <div class="photo-item">
          <img src="${photo.photo_url}" alt="${photo.description || 'Na foto'}">
          <p>${photo.description || 'Na'}</p>
        </div>
      `).join('')}
    </div>
    ` : ''}

    ${detailPhotos.length > 0 || overviewPhotos.length > 0 ? `
    <h4 style="margin: 15px 0 10px 0; color: #4b5563;">🔍 Detail & Overzicht Foto's</h4>
    <div class="photo-grid">
      ${[...detailPhotos, ...overviewPhotos].slice(0, 6).map((photo: any) => `
        <div class="photo-item">
          <img src="${photo.photo_url}" alt="${photo.description || photo.category}">
          <p>${photo.description || photo.category}</p>
        </div>
      `).join('')}
    </div>
    ` : ''}
  </div>
  ` : ''}

  <!-- Customer Satisfaction -->
  ${completion.customer_satisfaction ? `
  <div class="section">
    <div class="section-title">⭐ Klant Tevredenheid</div>
    <div class="satisfaction">
      <div class="stars">
        ${'★'.repeat(completion.customer_satisfaction)}${'☆'.repeat(5 - completion.customer_satisfaction)}
      </div>
      <div>
        <strong>${completion.customer_satisfaction}/5 sterren</strong>
        ${completion.notes ? `<p style="margin-top: 5px; color: #6b7280;">"${completion.notes}"</p>` : ''}
      </div>
    </div>
  </div>
  ` : ''}

  <!-- Recommendations -->
  ${completion.recommendations ? `
  <div class="section">
    <div class="section-title">💡 Aanbevelingen</div>
    <p style="padding: 15px; background: #fffbeb; border-radius: 6px; border: 1px solid #fbbf24;">
      ${completion.recommendations}
    </p>
  </div>
  ` : ''}

  <!-- Signatures -->
  <div class="section">
    <div class="section-title">✍️ Handtekeningen</div>
    <div class="signatures">
      <div class="signature-box">
        <h4>Klant</h4>
        ${completion.customer_signature ? `<img src="${completion.customer_signature}" alt="Klant handtekening" style="max-width: 200px; max-height: 60px; margin: 10px auto;">` : '<p>Geen handtekening</p>'}
        <p><strong>${customer?.name || 'Klant'}</strong></p>
        <p style="font-size: 8pt; color: #9ca3af;">Datum: ${new Date(completion.completion_date).toLocaleDateString('nl-NL')}</p>
      </div>
      <div class="signature-box">
        <h4>Monteur</h4>
        ${completion.installer_signature ? `<img src="${completion.installer_signature}" alt="Monteur handtekening" style="max-width: 200px; max-height: 60px; margin: 10px auto;">` : '<p>Geen handtekening</p>'}
        <p><strong>${monteur?.full_name || 'Monteur'}</strong></p>
        <p style="font-size: 8pt; color: #9ca3af;">Datum: ${new Date(completion.completion_date).toLocaleDateString('nl-NL')}</p>
      </div>
    </div>
  </div>

  <!-- Summary Box -->
  <div class="summary-box">
    <h3>📊 Samenvatting</h3>
    <div class="summary-item">
      <span>Werktijd:</span>
      <span>${completion.total_hours?.toFixed(1) || '0'} uur</span>
    </div>
    <div class="summary-item">
      <span>Aantal Foto's:</span>
      <span>${photos.length}</span>
    </div>
    <div class="summary-item">
      <span>Voltooide Taken:</span>
      <span>${tasks.filter((t: any) => t.is_completed).length}/${tasks.length}</span>
    </div>
    <div class="summary-item">
      <span>Klant Tevredenheid:</span>
      <span>${completion.customer_satisfaction ? `${completion.customer_satisfaction}/5 ⭐` : 'N/A'}</span>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <p>Dit document is automatisch gegenereerd op ${new Date().toLocaleString('nl-NL')}</p>
    <p>Werkbon ID: ${completion.id}</p>
    <p style="margin-top: 10px;">Voor vragen kunt u contact opnemen via ${monteur?.email || 'info@example.com'}</p>
  </div>
</body>
</html>
  `.trim()
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
              right: '15mm',
              bottom: '20mm',
              left: '15mm'
            },
            printBackground: true,
            displayHeaderFooter: false
          }
        })
      })
      
      if (response.ok) {
        const pdfBuffer = await response.arrayBuffer()
        console.log('✅ PDF generated successfully via HTML2PDF service')
        return new Uint8Array(pdfBuffer)
      } else {
        const errorText = await response.text()
        console.warn('⚠️ HTML2PDF error:', response.status, errorText)
        throw new Error(`HTML2PDF error: ${response.status}`)
      }
    } catch (error) {
      console.warn('⚠️ HTML2PDF failed, trying PDFShift fallback:', error.message)
    }
  }
  
  // FALLBACK: Try PDFShift
  const pdfshiftKey = Deno.env.get('PDFSHIFT_API_KEY')
  
  if (pdfshiftKey) {
    try {
      console.log('🔄 Generating PDF via PDFShift...')
      
      const response = await fetch('https://api.pdfshift.io/v3/convert/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`api:${pdfshiftKey}`)}`
        },
        body: JSON.stringify({
          source: html,
          sandbox: false,
          format: 'A4',
          margin: '20mm',
          print_background: true
        })
      })
      
      if (response.ok) {
        const pdfBuffer = await response.arrayBuffer()
        console.log('✅ PDF generated via PDFShift')
        return new Uint8Array(pdfBuffer)
      } else {
        const errorText = await response.text()
        console.warn('⚠️ PDFShift error:', response.status, errorText)
        throw new Error(`PDFShift error: ${response.status}`)
      }
    } catch (error) {
      console.warn('⚠️ PDFShift failed, using fallback:', error.message)
    }
  }
  
  // FINAL FALLBACK: Return HTML as plain text that can be converted
  console.log('⚠️ No PDF service configured - generating basic HTML output')
  console.log('💡 To enable proper PDF generation, set one of these environment variables:')
  console.log('   - HTMLPDF_API_KEY: From html2pdf.app')
  console.log('   - PDFSHIFT_API_KEY: From pdfshift.io')
  
  // Convert HTML to UTF-8 encoded bytes (PDF viewers might handle this)
  const encoder = new TextEncoder()
  const htmlWithPrintStyles = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Werkbon</title>
  <style>
    @media print {
      body { margin: 0; }
    }
  </style>
</head>
<body>
${html}
</body>
</html>
  `
  
  return encoder.encode(htmlWithPrintStyles)
}

function generateEmailHTML(customer: any, pdfUrl: string, completion: any, tasks: any[]): string {
  const completedTasks = tasks.filter((t: any) => t.is_completed);
  const openTasks = tasks.filter((t: any) => !t.is_completed);
  
  return `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: #2563eb;
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .content {
      background: #f9fafb;
      padding: 30px;
      border-radius: 0 0 10px 10px;
    }
    .button {
      display: inline-block;
      background: #2563eb;
      color: white;
      padding: 15px 30px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
    .info-box {
      background: white;
      padding: 15px;
      border-left: 4px solid #10b981;
      margin: 20px 0;
      border-radius: 6px;
    }
    .task-list {
      margin: 15px 0;
      padding: 15px;
      background: #f8fafc;
      border-radius: 6px;
    }
    .task-item {
      padding: 8px 0;
      border-bottom: 1px solid #e2e8f0;
    }
    .task-item:last-child {
      border-bottom: none;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>✅ Werkzaamheden Afgerond</h1>
  </div>
  <div class="content">
    <p>Beste ${customer?.name || 'klant'},</p>
    
    <p>Bedankt voor uw vertrouwen! De werkzaamheden zijn succesvol afgerond.</p>
    
    <div class="info-box">
      <strong>📋 Project:</strong> ${completion.project?.title || 'N/A'}<br>
      <strong>📅 Datum:</strong> ${new Date(completion.completion_date).toLocaleDateString('nl-NL')}<br>
      <strong>⭐ Tevredenheid:</strong> ${completion.customer_satisfaction ? `${completion.customer_satisfaction}/5 sterren` : 'N/A'}
    </div>
    
    <h3>Overzicht van de werkzaamheden:</h3>
    
    <div class="task-list">
      <h4 style="margin-top: 0;">✅ Voltooide taken (${completedTasks.length})</h4>
      ${completedTasks.map((t: any) => `
        <div class="task-item">✓ ${t.block_title}</div>
      `).join('')}
    </div>
    
    ${openTasks.length > 0 ? `
    <div class="task-list">
      <h4 style="margin-top: 0;">⏳ Openstaande taken (${openTasks.length})</h4>
      ${openTasks.map((t: any) => `
        <div class="task-item">○ ${t.block_title}</div>
      `).join('')}
    </div>
    ` : ''}
    
    <p>In de bijlage vindt u de complete werkbon met alle details, foto's en handtekeningen.</p>
    
    <center>
      <a href="${pdfUrl}" class="button">📄 Download Werkbon</a>
    </center>
    
    <p>Heeft u vragen of opmerkingen? Neem gerust contact met ons op!</p>
    
    <p>Met vriendelijke groet,<br>
    Onderhoud en Service J.J.P. Smans</p>
  </div>
</body>
</html>
  `.trim()
}

