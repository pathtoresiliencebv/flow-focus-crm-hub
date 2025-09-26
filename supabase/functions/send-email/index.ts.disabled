import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'npm:@supabase/supabase-js@2';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendEmailRequest {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body_text: string;
  body_html: string;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>;
  email_settings_id: string;
  in_reply_to?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify the JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const emailRequest: SendEmailRequest = await req.json();

    // Get email settings to verify ownership and get from address
    const { data: emailSettings, error: settingsError } = await supabase
      .from('user_email_settings')
      .select('*')
      .eq('id', emailRequest.email_settings_id)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (settingsError || !emailSettings) {
      throw new Error('Email settings not found or not authorized');
    }

    // Add signature if enabled
    let bodyHtml = emailRequest.body_html;
    let bodyText = emailRequest.body_text;
    
    if (emailSettings.auto_add_signature && emailSettings.signature_html) {
      bodyHtml += '<br><br>' + emailSettings.signature_html;
    }
    if (emailSettings.auto_add_signature && emailSettings.signature_text) {
      bodyText += '\n\n' + emailSettings.signature_text;
    }

    // Prepare email data for Resend
    const emailData: any = {
      from: `${emailSettings.display_name} <${emailSettings.email_address}>`,
      to: emailRequest.to,
      subject: emailRequest.subject,
      text: bodyText,
      html: bodyHtml,
    };

    if (emailRequest.cc && emailRequest.cc.length > 0) {
      emailData.cc = emailRequest.cc;
    }

    if (emailRequest.bcc && emailRequest.bcc.length > 0) {
      emailData.bcc = emailRequest.bcc;
    }

    if (emailRequest.attachments && emailRequest.attachments.length > 0) {
      emailData.attachments = emailRequest.attachments.map(att => ({
        filename: att.filename,
        content: att.content,
        contentType: att.contentType,
      }));
    }

    if (emailRequest.in_reply_to) {
      emailData.headers = {
        'In-Reply-To': emailRequest.in_reply_to,
        'References': emailRequest.in_reply_to,
      };
    }

    // Send email via Resend
    const emailResponse = await resend.emails.send(emailData);

    if (emailResponse.error) {
      throw new Error(`Resend error: ${emailResponse.error.message}`);
    }

    console.log("Email sent successfully:", emailResponse);

    // Save email to database
    const { error: insertError } = await supabase
      .from('emails')
      .insert({
        user_id: user.id,
        email_settings_id: emailRequest.email_settings_id,
        subject: emailRequest.subject,
        from_address: emailSettings.email_address,
        from_name: emailSettings.display_name,
        to_addresses: emailRequest.to,
        cc_addresses: emailRequest.cc || null,
        bcc_addresses: emailRequest.bcc || null,
        body_text: emailRequest.body_text,
        body_html: emailRequest.body_html,
        folder: 'sent',
        is_sent: true,
        sent_at: new Date().toISOString(),
        in_reply_to: emailRequest.in_reply_to || null,
        message_id: emailResponse.data?.id || null,
      });

    if (insertError) {
      console.error('Error saving email to database:', insertError);
      // Don't fail the request if database save fails, email was already sent
    }

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);