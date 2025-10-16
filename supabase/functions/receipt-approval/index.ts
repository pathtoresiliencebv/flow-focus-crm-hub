import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ApprovalRequest {
  receiptId?: string;
  receipt_id?: string;
  action: 'approve' | 'reject';
  reason?: string;
  userId?: string;
  user_id?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Authentication failed');
    }

    const { receiptId, action, reason, userId }: ApprovalRequest = await req.json();
    console.log('Processing receipt approval:', { receiptId, action, userId });

    // Get receipt details
    const { data: receipt, error: receiptError } = await supabase
      .from('receipts')
      .select('*')
      .eq('id', receiptId)
      .maybeSingle();

    if (receiptError || !receipt) {
      throw new Error('Receipt not found');
    }

    // Update receipt status
    const updateData: any = {
      status: action === 'approve' ? 'approved' : 'rejected',
      approved_by: user.id,
      approved_at: new Date().toISOString()
    };

    if (action === 'reject' && reason) {
      updateData.rejection_reason = reason;
    }

    // If approving and userId is provided, assign the receipt to that user
    if (action === 'approve' && userId) {
      updateData.user_id = userId;
    }

    const { error: updateError } = await supabase
      .from('receipts')
      .update(updateData)
      .eq('id', receiptId);

    if (updateError) {
      throw new Error(`Failed to update receipt: ${updateError.message}`);
    }

    // Get user profile for approver name
    const { data: approverProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const approverName = approverProfile?.full_name || 'Administrator';

    // Send email notification if receipt came from email
    if (receipt.email_from) {
      try {
        const emailSubject = action === 'approve' 
          ? `Bonnetje goedgekeurd: ${receipt.subject || receipt.description}`
          : `Bonnetje afgewezen: ${receipt.subject || receipt.description}`;

        const emailContent = action === 'approve'
          ? `
            <h2>Bonnetje Goedgekeurd</h2>
            <p>Uw bonnetje is goedgekeurd door ${approverName}.</p>
            <p><strong>Omschrijving:</strong> ${receipt.description}</p>
            ${receipt.amount ? `<p><strong>Bedrag:</strong> €${receipt.amount}</p>` : ''}
            <p><strong>Status:</strong> Goedgekeurd</p>
            <p>Het bonnetje is verwerkt in ons systeem.</p>
          `
          : `
            <h2>Bonnetje Afgewezen</h2>
            <p>Uw bonnetje is afgewezen door ${approverName}.</p>
            <p><strong>Omschrijving:</strong> ${receipt.description}</p>
            ${receipt.amount ? `<p><strong>Bedrag:</strong> €${receipt.amount}</p>` : ''}
            ${reason ? `<p><strong>Reden:</strong> ${reason}</p>` : ''}
            <p>Neem contact op als u vragen heeft.</p>
          `;

        await resend.emails.send({
          from: 'Smans CRM <bonnetjes@smanscrm.nl>',
          to: [receipt.email_from],
          subject: emailSubject,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">Smans CRM</h1>
              </div>
              <div style="padding: 20px; background: #f9f9f9;">
                ${emailContent}
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
                <p style="font-size: 12px; color: #666; text-align: center;">
                  Dit is een automatisch gegenereerde email van Smans CRM.
                </p>
              </div>
            </div>
          `
        });

        console.log('Email notification sent successfully');
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Don't fail the approval if email fails
      }
    }

    // Create notification for the assigned user (if different from approver)
    if (userId && userId !== user.id) {
      await supabase
        .from('user_notifications')
        .insert({
          user_id: userId,
          title: action === 'approve' ? 'Bonnetje goedgekeurd' : 'Bonnetje afgewezen',
          message: `Bonnetje "${receipt.description}" is ${action === 'approve' ? 'goedgekeurd' : 'afgewezen'} door ${approverName}`,
          type: 'receipt',
          reference_type: 'receipt',
          reference_id: receiptId
        });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Receipt ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
        receipt: { ...receipt, ...updateData }
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error('Error processing receipt approval:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to process receipt approval'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
};

serve(handler);