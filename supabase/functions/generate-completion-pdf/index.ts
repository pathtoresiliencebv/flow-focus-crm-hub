import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
// For proper PDF generation, we would use: import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CompletionData {
  project_id: string;
  installer_id: string;
  completion_date: string;
  work_performed: string;
  materials_used?: string;
  recommendations?: string;
  notes?: string;
  customer_satisfaction: number;
  customer_signature: string;
  installer_signature: string;
  photos: Array<{
    id: string;
    url: string;
    description: string;
    category: string;
  }>;
}

interface ProjectData {
  id: string;
  title: string;
  description?: string;
  customer_name: string;
  customer_email: string;
  address: string;
  phone?: string;
  status: string;
  created_at: string;
}

interface InstallerData {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  company?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { completionData }: { completionData: CompletionData } = await req.json();

    if (!completionData.project_id || !completionData.installer_id) {
      throw new Error("Project ID and Installer ID are required");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', completionData.project_id)
      .single();

    if (projectError || !project) {
      throw new Error('Project not found');
    }

    // Get installer details
    const { data: installer, error: installerError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', completionData.installer_id)
      .single();

    if (installerError || !installer) {
      throw new Error('Installer not found');
    }

    // Save completion record to database
    const { data: completionRecord, error: completionError } = await supabase
      .from('project_completions')
      .insert({
        project_id: completionData.project_id,
        installer_id: completionData.installer_id,
        completion_date: completionData.completion_date,
        work_performed: completionData.work_performed,
        materials_used: completionData.materials_used,
        recommendations: completionData.recommendations,
        notes: completionData.notes,
        customer_satisfaction: completionData.customer_satisfaction,
        customer_signature: completionData.customer_signature,
        installer_signature: completionData.installer_signature,
        status: 'completed',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (completionError) {
      throw new Error('Failed to save completion record');
    }

    // Save completion photos
    if (completionData.photos && completionData.photos.length > 0) {
      const photoRecords = completionData.photos.map(photo => ({
        completion_id: completionRecord.id,
        photo_url: photo.url,
        description: photo.description,
        category: photo.category,
        file_name: photo.id,
      }));

      const { error: photosError } = await supabase
        .from('completion_photos')
        .insert(photoRecords);

      if (photosError) {
        console.error('Failed to save photos:', photosError);
      }
    }

    // Generate PDF content
    const pdfHtml = generatePDFHTML(project, installer, completionData, completionRecord);

    // In a real implementation, you would use a PDF generation service
    // For now, we'll return the HTML content and save it as a file
    const pdfFileName = `completion_report_${project.id}_${new Date().toISOString().split('T')[0]}.html`;
    
    // Save PDF content to storage
    const { data: pdfUpload, error: pdfError } = await supabase.storage
      .from('completion-reports')
      .upload(pdfFileName, new Blob([pdfHtml], { type: 'text/html' }), {
        contentType: 'text/html',
        upsert: true,
      });

    if (pdfError) {
      throw new Error('Failed to save PDF');
    }

    // Get public URL for the PDF
    const { data: { publicUrl } } = supabase.storage
      .from('completion-reports')
      .getPublicUrl(pdfFileName);

    // Update completion record with PDF URL
    await supabase
      .from('project_completions')
      .update({ pdf_url: publicUrl })
      .eq('id', completionRecord.id);

    // Send email to customer
    const emailSent = await sendCompletionEmailViaService(
      project,
      installer,
      completionData,
      publicUrl
    );

    // Update project status to completed
    await supabase
      .from('projects')
      .update({ 
        status: 'Afgerond',
        completion_date: completionData.completion_date,
        updated_at: new Date().toISOString(),
      })
      .eq('id', completionData.project_id);

    return new Response(JSON.stringify({
      success: true,
      completion_id: completionRecord.id,
      pdf_url: publicUrl,
      email_sent: emailSent,
      message: 'Project completion processed successfully'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error processing completion:", error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to process project completion'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

function generatePDFHTML(
  project: ProjectData, 
  installer: InstallerData, 
  completionData: CompletionData,
  completionRecord: any
): string {
  const currentDate = new Date().toLocaleDateString('nl-NL');
  const completionDate = new Date(completionData.completion_date).toLocaleDateString('nl-NL');
  
  return `
<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Werkrapport - ${project.title}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
            color: #333;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #3b82f6;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .company-logo {
            font-size: 24px;
            font-weight: bold;
            color: #3b82f6;
            margin-bottom: 5px;
        }
        .report-title {
            font-size: 28px;
            color: #1e40af;
            margin: 20px 0;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }
        .info-section {
            background: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #3b82f6;
        }
        .info-section h3 {
            margin: 0 0 10px 0;
            color: #1e40af;
            font-size: 16px;
        }
        .info-section p {
            margin: 5px 0;
            font-size: 14px;
        }
        .work-section {
            margin: 30px 0;
            padding: 20px;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
        }
        .work-section h3 {
            color: #1e40af;
            margin-bottom: 15px;
            font-size: 18px;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 5px;
        }
        .photos-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .photo-item {
            text-align: center;
            background: #f8fafc;
            padding: 10px;
            border-radius: 8px;
        }
        .photo-item img {
            max-width: 100%;
            height: 150px;
            object-fit: cover;
            border-radius: 4px;
            border: 1px solid #e2e8f0;
        }
        .photo-caption {
            font-size: 12px;
            color: #64748b;
            margin-top: 5px;
        }
        .satisfaction {
            display: flex;
            align-items: center;
            gap: 10px;
            margin: 15px 0;
        }
        .stars {
            color: #fbbf24;
            font-size: 20px;
        }
        .signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin: 40px 0;
        }
        .signature-box {
            text-align: center;
            padding: 20px;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            background: #f8fafc;
        }
        .signature-line {
            border-bottom: 1px solid #9ca3af;
            margin: 20px 0 10px 0;
            height: 40px;
            display: flex;
            align-items: end;
            justify-content: center;
            font-style: italic;
            color: #3b82f6;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            font-size: 12px;
            color: #64748b;
        }
        @media print {
            body { margin: 0; padding: 15px; }
            .info-grid { grid-template-columns: 1fr; }
            .photos-grid { grid-template-columns: repeat(2, 1fr); }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-logo">🏠 Kozijnen & Ramen Service</div>
        <div class="report-title">Werkrapport</div>
        <p>Gegenereerd op: ${currentDate}</p>
    </div>

    <div class="info-grid">
        <div class="info-section">
            <h3>📋 Project Informatie</h3>
            <p><strong>Project:</strong> ${project.title}</p>
            <p><strong>Omschrijving:</strong> ${project.description || 'Geen omschrijving'}</p>
            <p><strong>Status:</strong> Afgerond</p>
            <p><strong>Afgerond op:</strong> ${completionDate}</p>
        </div>
        
        <div class="info-section">
            <h3>👤 Klant Informatie</h3>
            <p><strong>Naam:</strong> ${project.customer_name}</p>
            <p><strong>Email:</strong> ${project.customer_email}</p>
            <p><strong>Adres:</strong> ${project.address}</p>
            ${project.phone ? `<p><strong>Telefoon:</strong> ${project.phone}</p>` : ''}
        </div>
    </div>

    <div class="info-grid">
        <div class="info-section">
            <h3>🔧 Monteur Informatie</h3>
            <p><strong>Naam:</strong> ${installer.full_name}</p>
            <p><strong>Email:</strong> ${installer.email}</p>
            ${installer.phone ? `<p><strong>Telefoon:</strong> ${installer.phone}</p>` : ''}
            ${installer.company ? `<p><strong>Bedrijf:</strong> ${installer.company}</p>` : ''}
        </div>
        
        <div class="info-section">
            <h3>⭐ Klant Tevredenheid</h3>
            <div class="satisfaction">
                <span class="stars">${'★'.repeat(completionData.customer_satisfaction)}${'☆'.repeat(5 - completionData.customer_satisfaction)}</span>
                <span>${completionData.customer_satisfaction}/5</span>
            </div>
        </div>
    </div>

    <div class="work-section">
        <h3>🔨 Uitgevoerde Werkzaamheden</h3>
        <p>${completionData.work_performed}</p>
    </div>

    ${completionData.materials_used ? `
    <div class="work-section">
        <h3>📦 Gebruikte Materialen</h3>
        <p>${completionData.materials_used}</p>
    </div>
    ` : ''}

    ${completionData.recommendations ? `
    <div class="work-section">
        <h3>💡 Aanbevelingen</h3>
        <p>${completionData.recommendations}</p>
    </div>
    ` : ''}

    ${completionData.notes ? `
    <div class="work-section">
        <h3>📝 Aanvullende Opmerkingen</h3>
        <p>${completionData.notes}</p>
    </div>
    ` : ''}

    ${completionData.photos && completionData.photos.length > 0 ? `
    <div class="work-section">
        <h3>📸 Foto's van het Uitgevoerde Werk</h3>
        <div class="photos-grid">
            ${completionData.photos.map(photo => `
            <div class="photo-item">
                <img src="${photo.url}" alt="${photo.description}" />
                <div class="photo-caption">
                    <strong>${photo.category.charAt(0).toUpperCase() + photo.category.slice(1)}</strong>
                    ${photo.description ? `<br>${photo.description}` : ''}
                </div>
            </div>
            `).join('')}
        </div>
    </div>
    ` : ''}

    <div class="signatures">
        <div class="signature-box">
            <h4>Handtekening Klant</h4>
            <div class="signature-line">${completionData.customer_signature}</div>
            <p>${project.customer_name}</p>
            <p>Datum: ${completionDate}</p>
        </div>
        
        <div class="signature-box">
            <h4>Handtekening Monteur</h4>
            <div class="signature-line">${completionData.installer_signature}</div>
            <p>${installer.full_name}</p>
            <p>Datum: ${completionDate}</p>
        </div>
    </div>

    <div class="footer">
        <p>Dit rapport is automatisch gegenereerd door het CRM systeem.</p>
        <p>Voor vragen of opmerkingen kunt u contact opnemen via info@kozijnenservice.nl</p>
        <p>© 2024 Kozijnen & Ramen Service - Alle rechten voorbehouden</p>
    </div>
</body>
</html>`;
}

async function sendCompletionEmailViaService(
  project: ProjectData,
  installer: InstallerData,
  completionData: CompletionData,
  pdfUrl: string
): Promise<boolean> {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const emailData = {
      to: project.customer_email,
      customer_name: project.customer_name,
      project_title: project.title,
      project_address: project.address,
      installer_name: installer.full_name,
      completion_date: completionData.completion_date,
      customer_satisfaction: completionData.customer_satisfaction,
      work_performed: completionData.work_performed,
      recommendations: completionData.recommendations,
      pdf_url: pdfUrl,
    };

    const { data, error } = await supabase.functions.invoke('send-completion-email', {
      body: emailData,
    });

    if (error) {
      console.error('Email service error:', error);
      return false;
    }

    return data?.success || false;
  } catch (error) {
    console.error('Error calling email service:', error);
    return false;
  }
}