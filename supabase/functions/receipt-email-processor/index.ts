import { serve } from 'https://deno.land/std@0.178.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.0'
import { corsHeaders } from '../_shared/cors.ts'

interface EmailAttachment {
  filename: string
  content: string // base64 encoded
  contentType: string
  size?: number
}

interface EmailWebhookData {
  from: string
  to: string
  subject?: string
  text?: string
  html?: string
  attachments?: EmailAttachment[]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('📧 Receipt email processor triggered')
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse incoming email webhook data
    const emailData: EmailWebhookData = await req.json()
    
    console.log('📨 Email from:', emailData.from)
    console.log('📨 Attachments:', emailData.attachments?.length || 0)

    if (!emailData.attachments || emailData.attachments.length === 0) {
      console.log('⚠️ No attachments found in email')
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No attachments found'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 // Still return 200 to prevent webhook retries
        }
      )
    }

    let processedCount = 0
    let errorCount = 0

    // Process each attachment
    for (const attachment of emailData.attachments) {
      try {
        // Only process image files
        if (!attachment.contentType?.startsWith('image/')) {
          console.log('⏭️ Skipping non-image attachment:', attachment.filename)
          continue
        }

        console.log('📎 Processing attachment:', attachment.filename)

        // Decode base64 content
        const fileBuffer = Uint8Array.from(atob(attachment.content), c => c.charCodeAt(0))

        // Upload to storage
        const fileName = `email-${Date.now()}-${attachment.filename}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(fileName, fileBuffer, {
            contentType: attachment.contentType,
            upsert: false
          })

        if (uploadError) {
          console.error('❌ Upload error:', uploadError)
          errorCount++
          continue
        }

        console.log('✅ File uploaded:', fileName)

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('receipts')
          .getPublicUrl(fileName)

        // Insert into receipts table
        const { error: insertError } = await supabase
          .from('receipts')
          .insert({
            photo_url: publicUrl,
            file_name: attachment.filename,
            file_size: attachment.size || fileBuffer.length,
            status: 'pending',
            description: `Via email van ${emailData.from}`,
            uploaded_by: null, // Email upload (no user)
            created_at: new Date().toISOString()
          })

        if (insertError) {
          console.error('❌ Insert error:', insertError)
          errorCount++
          continue
        }

        console.log('✅ Receipt record created')
        processedCount++

      } catch (error) {
        console.error('❌ Error processing attachment:', error)
        errorCount++
      }
    }

    // Notify admins if receipts were processed
    if (processedCount > 0) {
      try {
        // Fetch admin users
        const { data: admins } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('role', 'Administrator')

        if (admins && admins.length > 0) {
          // Send notification to all admins
          for (const admin of admins) {
            if (admin.email) {
              await supabase.functions.invoke('send-email-smans', {
                body: {
                  to: admin.email,
                  subject: `📧 Nieuwe bonnetjes ontvangen via email`,
                  html: `
                    <h2>Nieuwe bonnetjes ontvangen</h2>
                    <p>Hallo ${admin.full_name || 'Administrator'},</p>
                    <p>Er zijn <strong>${processedCount}</strong> nieuwe bonnetje(s) ontvangen via email van <strong>${emailData.from}</strong>.</p>
                    <p>Log in op het CRM systeem om de bonnetjes te controleren en goed te keuren.</p>
                    <p>Met vriendelijke groet,<br>SMANS CRM Systeem</p>
                  `
                }
              })
            }
          }
          console.log('✅ Admin notifications sent')
        }
      } catch (notifyError) {
        console.warn('⚠️ Could not send admin notifications:', notifyError)
      }
    }

    console.log(`✅ Processing complete: ${processedCount} succeeded, ${errorCount} failed`)

    return new Response(
      JSON.stringify({
        success: true,
        processed: processedCount,
        errors: errorCount,
        message: `Processed ${processedCount} receipt(s) successfully`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error: any) {
    console.error('❌ Error in receipt email processor:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to process email'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

