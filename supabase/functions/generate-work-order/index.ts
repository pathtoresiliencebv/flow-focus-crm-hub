import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get completion ID from request
    const { completionId }: WorkOrderData = await req.json()

    if (!completionId) {
      throw new Error('Completion ID is required')
    }

    console.log('Generating work order for completion:', completionId)

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

    // Fetch materials - parse from materials_used text field
    // In the future, this could be from a separate materials table
    const materials = []

    // Fetch tasks
    const { data: tasks } = await supabaseClient
      .from('project_tasks')
      .select('*')
      .eq('project_id', completion.project_id)
      .order('created_at')

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
      tasks: tasks || []
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

    // Send email to customer
    if (customer?.email) {
      await supabaseClient.functions.invoke('send-email', {
        body: {
          to: customer.email,
          subject: `Werkbon - ${completion.project?.title || 'Project'}`,
          html: generateEmailHTML(customer, publicUrl, completion),
          attachments: [
            {
              filename: `werkbon-${completionId}.pdf`,
              path: publicUrl
            }
          ]
        }
      })
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
    <div class="section-title">✓ Voltooide Taken</div>
    <table>
      <thead>
        <tr>
          <th style="width: 50px;">Status</th>
          <th>Taak Beschrijving</th>
        </tr>
      </thead>
      <tbody>
        ${tasks.filter((t: any) => t.completed).map((task: any) => `
          <tr>
            <td style="text-align: center;">✅</td>
            <td>${task.description}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
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
          <th style="text-align: right;">Hoeveelheid</th>
          <th style="text-align: right;">Prijs per eenheid</th>
          <th style="text-align: right;">Totaal</th>
        </tr>
      </thead>
      <tbody>
        ${materials.map((m: any) => `
          <tr>
            <td>${m.material_name}</td>
            <td style="text-align: right;">${m.quantity_used} ${m.unit || ''}</td>
            <td style="text-align: right;">€${(m.unit_price || 0).toFixed(2)}</td>
            <td style="text-align: right;"><strong>€${((m.quantity_used || 0) * (m.unit_price || 0)).toFixed(2)}</strong></td>
          </tr>
        `).join('')}
        <tr style="background: #f9fafb; font-weight: 600;">
          <td colspan="3" style="text-align: right;">Totaal Materiaalkosten:</td>
          <td style="text-align: right;">€${materialCost.toFixed(2)}</td>
        </tr>
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
      <span>Materiaalkosten:</span>
      <span>€${materialCost.toFixed(2)}</span>
    </div>
    <div class="summary-item">
      <span>Aantal Foto's:</span>
      <span>${photos.length}</span>
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
   * PDF Generation Options:
   * 
   * 1. HTMLPdfService (Primary) - Free tier available
   * 2. Fallback to base HTML if service unavailable
   * 
   * To use HTMLPdfService:
   * - Set HTMLPDF_API_KEY in Supabase secrets
   * - Service: https://api.html2pdf.app or similar
   */
  
  const apiKey = Deno.env.get('HTMLPDF_API_KEY')
  
  if (apiKey) {
    try {
      console.log('🔄 Generating PDF via HTML2PDF service...')
      
      // Use HTML to PDF conversion service
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
        console.log('✅ PDF generated successfully via service')
        return new Uint8Array(pdfBuffer)
      } else {
        console.warn('⚠️ PDF service error:', response.status, await response.text())
        throw new Error('PDF service unavailable')
      }
    } catch (error) {
      console.warn('⚠️ PDF service failed, using fallback:', error.message)
      // Fall through to fallback
    }
  }
  
  // FALLBACK: Use PDFShift (alternative service) if available
  const pdfshiftKey = Deno.env.get('PDFSHIFT_API_KEY')
  
  if (pdfshiftKey) {
    try {
      console.log('🔄 Generating PDF via PDFShift fallback...')
      
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
        console.warn('⚠️ PDFShift error:', response.status)
        throw new Error('PDFShift service unavailable')
      }
    } catch (error) {
      console.warn('⚠️ PDFShift failed:', error.message)
      // Fall through to final fallback
    }
  }
  
  // FINAL FALLBACK: Use in-browser PDF generation via data URL
  // This returns the HTML wrapped for browser-side PDF printing
  console.log('⚠️ No PDF service configured, using HTML fallback')
  console.log('💡 To enable PDF generation:')
  console.log('   Set HTMLPDF_API_KEY or PDFSHIFT_API_KEY in Supabase secrets')
  console.log('   Or use browser print: window.print() on HTML document')
  
  // Wrap HTML in a complete document with print styling
  const printableHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Werkbon</title>
  <style>
    @media print {
      body { margin: 0; padding: 20mm; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  ${html}
  <script>
    // Auto-print when opened
    if (typeof window !== 'undefined') {
      window.onload = function() { window.print(); }
    }
  </script>
</body>
</html>`
  
  const encoder = new TextEncoder()
  return encoder.encode(printableHtml)
}

function generateEmailHTML(customer: any, pdfUrl: string, completion: any): string {
  return `
<!DOCTYPE html>
<html>
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
  </style>
</head>
<body>
  <div class="header">
    <h1>✅ Werkzaamheden Afgerond</h1>
  </div>
  <div class="content">
    <p>Beste ${customer.name},</p>
    
    <p>Bedankt voor uw vertrouwen! De werkzaamheden zijn succesvol afgerond.</p>
    
    <div class="info-box">
      <strong>📋 Project:</strong> ${completion.project?.title || 'N/A'}<br>
      <strong>📅 Datum:</strong> ${new Date(completion.completion_date).toLocaleDateString('nl-NL')}<br>
        <strong>⭐ Tevredenheid:</strong> ${completion.customer_satisfaction ? `${completion.customer_satisfaction}/5 sterren` : 'N/A'}
    </div>
    
    <p>In de bijlage vindt u de werkbon met alle details van de uitgevoerde werkzaamheden.</p>
    
    <center>
      <a href="${pdfUrl}" class="button">📄 Download Werkbon</a>
    </center>
    
    <p>Heeft u vragen of opmerkingen? Neem gerust contact met ons op!</p>
    
    <p>Met vriendelijke groet,<br>
    Het Team</p>
  </div>
</body>
</html>
  `.trim()
}

