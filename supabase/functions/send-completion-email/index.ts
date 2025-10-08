import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CompletionEmailData {
  completionId: string;
  customerEmail: string;
  customerName: string;
  projectTitle: string;
  projectAddress?: string;
  monteurName: string;
  completionDate: string;
  customerSatisfaction: number;
  workPerformed: string;
  recommendations?: string;
  pdfUrl: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const emailData: CompletionEmailData = await req.json();

    if (!emailData.customerEmail || !emailData.pdfUrl) {
      throw new Error("Customer email and PDF URL are required");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Generate email subject and body
    const emailSubject = `Werkbon - ${emailData.projectTitle} - Project Afgerond ✅`;
    const emailHtml = generateEmailHTML(emailData);

    // Download PDF and convert to base64 for attachment
    let pdfAttachment = null;
    try {
      console.log('📥 Downloading PDF from:', emailData.pdfUrl);
      const pdfResponse = await fetch(emailData.pdfUrl);
      if (!pdfResponse.ok) {
        throw new Error(`Failed to download PDF: ${pdfResponse.statusText}`);
      }
      const pdfBuffer = await pdfResponse.arrayBuffer();
      const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));
      
      pdfAttachment = {
        filename: `werkbon-${emailData.completionId.slice(0, 8)}.pdf`,
        content: pdfBase64,
        contentType: 'application/pdf'
      };
      console.log('✅ PDF converted to base64 for attachment');
    } catch (pdfError) {
      console.error('⚠️ Warning: Could not attach PDF:', pdfError);
      // Continue without PDF attachment, email still contains link
    }

    // Send email via SMANS SMTP
    const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-email-smans', {
      body: {
        to: emailData.customerEmail,
        subject: emailSubject,
        html: emailHtml,
        attachments: pdfAttachment ? [pdfAttachment] : undefined
      }
    });

    if (emailError) {
      console.error('❌ SMANS SMTP send error:', emailError);
      throw emailError;
    }

    // Update completion record with email sent timestamp
    await supabase
      .from('project_completions')
      .update({ 
        email_sent_at: new Date().toISOString(),
        status: 'sent'
      })
      .eq('id', emailData.completionId);

    console.log('✅ Completion email sent successfully to:', emailData.customerEmail);

    return new Response(JSON.stringify({
      success: true,
      emailSent: true,
      message: 'Completion email sent successfully'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("❌ Error sending completion email:", error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to send completion email'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

function generateEmailHTML(data: CompletionEmailData): string {
  const completionDate = new Date(data.completionDate).toLocaleDateString('nl-NL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const satisfactionStars = '★'.repeat(data.customerSatisfaction) + '☆'.repeat(5 - data.customerSatisfaction);

  return `
<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Werkbon - ${data.projectTitle}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .email-container {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #3b82f6, #1e40af);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0 0 10px 0;
            font-size: 24px;
            font-weight: 700;
        }
        .header p {
            margin: 0;
            opacity: 0.9;
            font-size: 16px;
        }
        .content {
            padding: 30px 20px;
        }
        .project-info {
            background: #f8fafc;
            border-left: 4px solid #3b82f6;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }
        .project-info h3 {
            margin: 0 0 15px 0;
            color: #1e40af;
            font-size: 18px;
        }
        .info-row {
            margin: 8px 0;
            padding: 5px 0;
        }
        .info-label {
            font-weight: 600;
            color: #64748b;
            display: inline-block;
            min-width: 140px;
        }
        .info-value {
            color: #334155;
        }
        .satisfaction {
            text-align: center;
            margin: 25px 0;
            padding: 20px;
            background: #f0fdf4;
            border-radius: 8px;
            border: 2px solid #16a34a;
        }
        .satisfaction .stars {
            font-size: 24px;
            color: #fbbf24;
            margin: 10px 0;
        }
        .satisfaction .score {
            font-size: 18px;
            font-weight: 700;
            color: #16a34a;
        }
        .work-section {
            margin: 25px 0;
            padding: 20px;
            background: #fefefe;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
        }
        .work-section h4 {
            margin: 0 0 15px 0;
            color: #1e40af;
            font-size: 16px;
        }
        .work-section p {
            margin: 0;
            line-height: 1.7;
            white-space: pre-wrap;
        }
        .pdf-button {
            text-align: center;
            margin: 30px 0;
        }
        .pdf-button a {
            display: inline-block;
            background: #16a34a;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
        }
        .footer {
            background: #f8fafc;
            padding: 25px 20px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        .footer p {
            margin: 5px 0;
            font-size: 14px;
            color: #64748b;
        }
        .company-info {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>🏠 Project Afgerond!</h1>
            <p>Uw werkrapport is gereed</p>
        </div>
        
        <div class="content">
            <p>Beste ${data.customerName},</p>
            
            <p>Wij zijn blij u mee te delen dat uw project succesvol is afgerond! Hieronder vindt u een overzicht van de uitgevoerde werkzaamheden.</p>
            
            <div class="project-info">
                <h3>📋 Project Details</h3>
                <div class="info-row">
                    <span class="info-label">Project:</span>
                    <span class="info-value">${data.projectTitle}</span>
                </div>
                ${data.projectAddress ? `
                <div class="info-row">
                    <span class="info-label">Adres:</span>
                    <span class="info-value">${data.projectAddress}</span>
                </div>
                ` : ''}
                <div class="info-row">
                    <span class="info-label">Monteur:</span>
                    <span class="info-value">${data.monteurName}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Afgerond op:</span>
                    <span class="info-value">${completionDate}</span>
                </div>
            </div>

            <div class="satisfaction">
                <h4 style="margin: 0 0 10px 0;">⭐ Uw Tevredenheid</h4>
                <div class="stars">${satisfactionStars}</div>
                <div class="score">${data.customerSatisfaction}/5 Sterren</div>
                <p style="margin: 10px 0 0 0; font-size: 14px; color: #64748b;">
                    Bedankt voor uw beoordeling!
                </p>
            </div>

            <div class="work-section">
                <h4>🔨 Uitgevoerde Werkzaamheden</h4>
                <p>${data.workPerformed}</p>
            </div>

            ${data.recommendations ? `
            <div class="work-section">
                <h4>💡 Aanbevelingen</h4>
                <p>${data.recommendations}</p>
            </div>
            ` : ''}

            <div class="pdf-button">
                <a href="${data.pdfUrl}" target="_blank">
                    📄 Bekijk Volledig Werkrapport (PDF)
                </a>
            </div>

            <p>Het complete werkrapport bevat ook alle foto's van het uitgevoerde werk en de handtekeningen ter bevestiging.</p>
            
            <p>Heeft u nog vragen over het uitgevoerde werk? Neem dan gerust contact met ons op. Wij helpen u graag verder!</p>
            
            <p>Hartelijk dank voor het vertrouwen in onze dienstverlening.</p>
            
            <p style="margin-top: 20px;">Met vriendelijke groet,<br>
            <strong>${data.monteurName}</strong><br>
            SMANS BV</p>
        </div>
        
        <div class="footer">
            <div class="company-info">
                <p><strong>SMANS BV</strong></p>
                <p>📧 info@smansbv.nl | 📞 +31 (0)20 123 4567</p>
                <p>🌐 www.smansbv.nl</p>
            </div>
            <p style="margin-top: 20px; font-size: 12px;">
                Dit is een automatisch gegenereerd bericht van ons project management systeem.
            </p>
        </div>
    </div>
</body>
</html>`;
}

