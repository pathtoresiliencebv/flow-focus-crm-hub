import { serve } from 'https://deno.land/std@0.190.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * SMANS CRM - CENTRALE EMAIL SENDER
 * 
 * Gebruikt ALTIJD de SMANS SMTP: info@smansonderhoud.nl
 * Alle andere Edge Functions gebruiken deze functie voor emails
 * 
 * SMTP Config:
 * - Host: smtp.hostnet.nl
 * - Port: 587 (STARTTLS)
 * - Van: info@smansonderhoud.nl
 * 
 * Secrets Required:
 * - SMANS_SMTP_EMAIL: info@smansonderhoud.nl
 * - SMANS_SMTP_PASSWORD: [password]
 * 
 * Setup: 
 * supabase secrets set SMANS_SMTP_EMAIL="info@smansonderhoud.nl"
 * supabase secrets set SMANS_SMTP_PASSWORD="2023!Welkom@"
 */

interface EmailRequest {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  cc?: string | string[]
  bcc?: string | string[]
  attachments?: Array<{
    filename: string
    content: string // Base64 encoded
    contentType?: string
  }>
  replyTo?: string
}

interface SMTPResponse {
  code: number
  message: string
}

class SMTPClient {
  private conn: Deno.Conn | null = null
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null

  async connect(host: string, port: number): Promise<void> {
    console.log(`🔌 Connecting to ${host}:${port}...`)
    this.conn = await Deno.connect({ hostname: host, port })
    this.reader = this.conn.readable.getReader()
    this.writer = this.conn.writable.getWriter()
    await this.readResponse()
    console.log('✅ Connected to SMTP server')
  }

  async ehlo(hostname: string = 'smanscrm.nl'): Promise<void> {
    await this.send(`EHLO ${hostname}`)
    await this.readResponse()
  }

  async startTLS(): Promise<void> {
    console.log('🔐 Starting TLS...')
    await this.send('STARTTLS')
    await this.readResponse()
    
    if (!this.conn) throw new Error('No connection')
    
    // Upgrade to TLS
    const tlsConn = await Deno.startTls(this.conn, { hostname: 'smtp.hostnet.nl' })
    this.conn = tlsConn
    this.reader = tlsConn.readable.getReader()
    this.writer = tlsConn.writable.getWriter()
    
    // Re-send EHLO after TLS
    await this.ehlo()
    console.log('✅ TLS established')
  }

  async auth(username: string, password: string): Promise<void> {
    console.log('🔑 Authenticating...')
    await this.send('AUTH LOGIN')
    await this.readResponse()
    
    await this.send(btoa(username))
    await this.readResponse()
    
    await this.send(btoa(password))
    await this.readResponse()
    console.log('✅ Authenticated')
  }

  async sendMail(from: string, to: string[]): Promise<void> {
    await this.send(`MAIL FROM:<${from}>`)
    await this.readResponse()
    
    for (const recipient of to) {
      await this.send(`RCPT TO:<${recipient}>`)
      await this.readResponse()
    }
  }

  async data(emailContent: string): Promise<void> {
    await this.send('DATA')
    await this.readResponse()
    
    await this.send(emailContent)
    await this.send('.')
    await this.readResponse()
  }

  async quit(): Promise<void> {
    await this.send('QUIT')
    await this.readResponse()
    this.reader?.releaseLock()
    this.writer?.releaseLock()
    this.conn?.close()
  }

  private async send(command: string): Promise<void> {
    if (!this.writer) throw new Error('Not connected')
    const encoder = new TextEncoder()
    await this.writer.write(encoder.encode(command + '\r\n'))
  }

  private async readResponse(): Promise<SMTPResponse> {
    if (!this.reader) throw new Error('Not connected')
    
    const decoder = new TextDecoder()
    const { value } = await this.reader.read()
    
    if (!value) throw new Error('No response from server')
    
    const response = decoder.decode(value)
    const code = parseInt(response.substring(0, 3))
    
    if (code >= 400) {
      throw new Error(`SMTP Error ${code}: ${response}`)
    }
    
    return { code, message: response }
  }
}

function generateMessageId(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 15)
  return `<${timestamp}.${random}@smansonderhoud.nl>`
}

function formatEmailAddresses(addresses: string | string[]): string[] {
  if (typeof addresses === 'string') {
    return addresses.split(',').map(a => a.trim())
  }
  return addresses
}

function buildEmailContent(params: {
  from: string
  to: string[]
  cc?: string[]
  bcc?: string[]
  subject: string
  html?: string
  text?: string
  replyTo?: string
  attachments?: EmailRequest['attachments']
}): string {
  const { from, to, cc, bcc, subject, html, text, replyTo, attachments } = params
  
  const messageId = generateMessageId()
  const date = new Date().toUTCString()
  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  let email = ''
  email += `From: SMANS BV <${from}>\r\n`
  email += `To: ${to.join(', ')}\r\n`
  
  if (cc && cc.length > 0) {
    email += `Cc: ${cc.join(', ')}\r\n`
  }
  
  if (replyTo) {
    email += `Reply-To: ${replyTo}\r\n`
  }
  
  email += `Subject: ${subject}\r\n`
  email += `Date: ${date}\r\n`
  email += `Message-ID: ${messageId}\r\n`
  email += `MIME-Version: 1.0\r\n`
  
  if (attachments && attachments.length > 0) {
    email += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`
    
    // Email body part
    email += `--${boundary}\r\n`
    if (html) {
      email += `Content-Type: text/html; charset=utf-8\r\n`
      email += `Content-Transfer-Encoding: quoted-printable\r\n\r\n`
      email += html + '\r\n'
    } else {
      email += `Content-Type: text/plain; charset=utf-8\r\n`
      email += `Content-Transfer-Encoding: quoted-printable\r\n\r\n`
      email += (text || '') + '\r\n'
    }
    
    // Attachments
    for (const attachment of attachments) {
      email += `--${boundary}\r\n`
      email += `Content-Type: ${attachment.contentType || 'application/octet-stream'}; name="${attachment.filename}"\r\n`
      email += `Content-Transfer-Encoding: base64\r\n`
      email += `Content-Disposition: attachment; filename="${attachment.filename}"\r\n\r\n`
      email += attachment.content + '\r\n'
    }
    
    email += `--${boundary}--\r\n`
  } else {
    // Simple email without attachments
    if (html) {
      email += `Content-Type: text/html; charset=utf-8\r\n`
      email += `Content-Transfer-Encoding: quoted-printable\r\n\r\n`
      email += html
    } else {
      email += `Content-Type: text/plain; charset=utf-8\r\n`
      email += `Content-Transfer-Encoding: quoted-printable\r\n\r\n`
      email += text || ''
    }
  }
  
  return email
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const emailRequest: EmailRequest = await req.json()
    
    // Validate
    if (!emailRequest.to || !emailRequest.subject) {
      throw new Error('Missing required fields: to, subject')
    }
    
    if (!emailRequest.html && !emailRequest.text) {
      throw new Error('Either html or text body is required')
    }
    
    // Get SMTP credentials from secrets
    const smtpEmail = Deno.env.get('SMANS_SMTP_EMAIL') || 'info@smansonderhoud.nl'
    const smtpPassword = Deno.env.get('SMANS_SMTP_PASSWORD')
    
    if (!smtpPassword) {
      throw new Error('SMANS_SMTP_PASSWORD not configured in Supabase secrets')
    }
    
    // Format recipients
    const recipients = formatEmailAddresses(emailRequest.to)
    const ccRecipients = emailRequest.cc ? formatEmailAddresses(emailRequest.cc) : []
    const bccRecipients = emailRequest.bcc ? formatEmailAddresses(emailRequest.bcc) : []
    const allRecipients = [...recipients, ...ccRecipients, ...bccRecipients]
    
    console.log('📧 Sending email from SMANS:', {
      from: smtpEmail,
      to: recipients,
      cc: ccRecipients,
      bcc: bccRecipients,
      subject: emailRequest.subject,
      hasAttachments: emailRequest.attachments?.length || 0
    })
    
    // Build email content
    const emailContent = buildEmailContent({
      from: smtpEmail,
      to: recipients,
      cc: ccRecipients,
      bcc: bccRecipients,
      subject: emailRequest.subject,
      html: emailRequest.html,
      text: emailRequest.text,
      replyTo: emailRequest.replyTo,
      attachments: emailRequest.attachments
    })
    
    // Connect and send via SMTP
    const smtp = new SMTPClient()
    
    try {
      await smtp.connect('smtp.hostnet.nl', 587)
      await smtp.ehlo()
      await smtp.startTLS()
      await smtp.auth(smtpEmail, smtpPassword)
      await smtp.sendMail(smtpEmail, allRecipients)
      await smtp.data(emailContent)
      await smtp.quit()
      
      console.log('✅ Email sent successfully via SMANS SMTP')
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Email sent successfully',
        from: smtpEmail,
        to: recipients,
        subject: emailRequest.subject
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
      
    } catch (smtpError: any) {
      console.error('❌ SMTP Error:', smtpError)
      throw new Error(`SMTP Error: ${smtpError.message}`)
    }
    
  } catch (error: any) {
    console.error('❌ Error sending email:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})

/**
 * DEPLOYMENT INSTRUCTIONS:
 * 
 * 1. Set secrets:
 *    supabase secrets set SMANS_SMTP_EMAIL="info@smansonderhoud.nl"
 *    supabase secrets set SMANS_SMTP_PASSWORD="2023!Welkom@"
 * 
 * 2. Deploy function:
 *    supabase functions deploy send-email-smans
 * 
 * 3. Test:
 *    curl -X POST https://your-project.supabase.co/functions/v1/send-email-smans \
 *      -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
 *      -H "Content-Type: application/json" \
 *      -d '{
 *        "to": "test@example.com",
 *        "subject": "Test Email",
 *        "html": "<h1>Test</h1><p>This is a test email from SMANS CRM</p>"
 *      }'
 * 
 * USAGE IN OTHER EDGE FUNCTIONS:
 * 
 * const { data, error } = await supabase.functions.invoke('send-email-smans', {
 *   body: {
 *     to: 'customer@example.com',
 *     subject: 'Uw werkbon',
 *     html: emailHtmlContent,
 *     attachments: [{
 *       filename: 'werkbon.pdf',
 *       content: base64PdfContent,
 *       contentType: 'application/pdf'
 *     }]
 *   }
 * })
 */

