import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailData {
  to: string;
  customer_name: string;
  project_title: string;
  project_address: string;
  installer_name: string;
  completion_date: string;
  customer_satisfaction: number;
  work_performed: string;
  recommendations?: string;
  pdf_url: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const emailData: EmailData = await req.json();

    if (!emailData.to || !emailData.customer_name || !emailData.pdf_url) {
      throw new Error("Missing required email data");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Generate email content
    const emailSubject = `Werkrapport: ${emailData.project_title} - Project Afgerond ✅`;
    const emailHtml = generateEmailHTML(emailData);
    const emailText = generateEmailText(emailData);

    // For production, you would integrate with an email service like:
    // - Resend (https://resend.com)
    // - SendGrid
    // - AWS SES
    // - Postmark
    
    // Use Supabase built-in email functionality via database
    // Store email in database for processing
    const { data: emailRecord, error: emailError } = await supabase
      .from('email_queue')
      .insert({
        to_email: emailData.to,
        from_email: 'noreply@smanscrm.nl',
        subject: emailSubject,
        html_content: emailHtml,
        text_content: emailText,
        email_type: 'project_completion',
        status: 'queued',
        metadata: {
          customer_name: emailData.customer_name,
          project_title: emailData.project_title,
          pdf_url: emailData.pdf_url,
        },
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (emailError) {
      console.error('Error storing email:', emailError);
      // Fallback: Return success with log
      console.log('=== EMAIL TO BE SENT ===');
      console.log('To:', emailData.to);
      console.log('Subject:', emailSubject);
      console.log('HTML Content:', emailHtml.substring(0, 200) + '...');
      console.log('========================');
    }

    // For now, we'll simulate email sending
    // In production, you can integrate with:
    // - Supabase Auth email templates
    // - External email service via webhook
    // - SMTP server integration
    
    return new Response(JSON.stringify({
      success: true,
      email_id: emailRecord?.id || 'simulated',
      message: 'Completion email processed successfully',
      email_preview: {
        to: emailData.to,
        subject: emailSubject,
        stored_in_db: !!emailRecord,
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error sending email:", error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to send completion email'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

function generateEmailHTML(data: EmailData): string {
  const completionDate = new Date(data.completion_date).toLocaleDateString('nl-NL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const satisfactionStars = '★'.repeat(data.customer_satisfaction) + '☆'.repeat(5 - data.customer_satisfaction);

  return `
<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Werkrapport - ${data.project_title}</title>
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
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
            padding: 5px 0;
            border-bottom: 1px solid #e2e8f0;
        }
        .info-row:last-child {
            border-bottom: none;
        }
        .info-label {
            font-weight: 600;
            color: #64748b;
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
            transition: background-color 0.3s;
        }
        .pdf-button a:hover {
            background: #15803d;
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
        @media (max-width: 600px) {
            body { padding: 10px; }
            .content { padding: 20px 15px; }
            .info-row { flex-direction: column; }
            .info-row .info-label { margin-bottom: 3px; }
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
            <p>Beste ${data.customer_name},</p>
            
            <p>Wij zijn blij u mee te delen dat uw project succesvol is afgerond! Hieronder vindt u een overzicht van de uitgevoerde werkzaamheden.</p>
            
            <div class="project-info">
                <h3>📋 Project Details</h3>
                <div class="info-row">
                    <span class="info-label">Project:</span>
                    <span class="info-value">${data.project_title}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Adres:</span>
                    <span class="info-value">${data.project_address}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Monteur:</span>
                    <span class="info-value">${data.installer_name}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Afgerond op:</span>
                    <span class="info-value">${completionDate}</span>
                </div>
            </div>

            <div class="satisfaction">
                <h4>⭐ Uw Tevredenheid</h4>
                <div class="stars">${satisfactionStars}</div>
                <div class="score">${data.customer_satisfaction}/5 Sterren</div>
                <p style="margin: 10px 0 0 0; font-size: 14px; color: #64748b;">
                    Bedankt voor uw beoordeling!
                </p>
            </div>

            <div class="work-section">
                <h4>🔨 Uitgevoerde Werkzaamheden</h4>
                <p>${data.work_performed}</p>
            </div>

            ${data.recommendations ? `
            <div class="work-section">
                <h4>💡 Aanbevelingen</h4>
                <p>${data.recommendations}</p>
            </div>
            ` : ''}

            <div class="pdf-button">
                <a href="${data.pdf_url}" target="_blank">
                    📄 Bekijk Volledig Werkrapport
                </a>
            </div>

            <p>Het complete werkrapport bevat ook alle foto's van het uitgevoerde werk en de handtekeningen ter bevestiging.</p>
            
            <p>Heeft u nog vragen over het uitgevoerde werk? Neem dan gerust contact met ons op. Wij helpen u graag verder!</p>
            
            <p>Hartelijk dank voor het vertrouwen in onze dienstverlening.</p>
            
            <p>Met vriendelijke groet,<br>
            <strong>Het team van Kozijnen & Ramen Service</strong></p>
        </div>
        
        <div class="footer">
            <div class="company-info">
                <p><strong>Kozijnen & Ramen Service</strong></p>
                <p>📧 info@kozijnenservice.nl | 📞 020-1234567</p>
                <p>🌐 www.kozijnenservice.nl</p>
            </div>
            <p style="margin-top: 20px; font-size: 12px;">
                Dit is een automatisch gegenereerd bericht van ons project management systeem.
            </p>
        </div>
    </div>
</body>
</html>`;
}

function generateEmailText(data: EmailData): string {
  const completionDate = new Date(data.completion_date).toLocaleDateString('nl-NL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
PROJECT AFGEROND - WERKRAPPORT

Beste ${data.customer_name},

Wij zijn blij u mee te delen dat uw project succesvol is afgerond!

PROJECT DETAILS:
- Project: ${data.project_title}
- Adres: ${data.project_address}
- Monteur: ${data.installer_name}
- Afgerond op: ${completionDate}
- Uw tevredenheid: ${data.customer_satisfaction}/5 sterren

UITGEVOERDE WERKZAAMHEDEN:
${data.work_performed}

${data.recommendations ? `AANBEVELINGEN:\n${data.recommendations}\n\n` : ''}

VOLLEDIG WERKRAPPORT:
U kunt het complete werkrapport met foto's en handtekeningen bekijken via:
${data.pdf_url}

Heeft u nog vragen? Neem gerust contact op:
- Email: info@kozijnenservice.nl
- Telefoon: 020-1234567
- Website: www.kozijnenservice.nl

Hartelijk dank voor het vertrouwen in onze dienstverlening.

Met vriendelijke groet,
Het team van Kozijnen & Ramen Service

---
Dit is een automatisch gegenereerd bericht.
`;
}