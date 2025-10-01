# Email Edge Functions

Deze functies beheren het versturen van emails via Resend en email synchronisatie.

---

## 1. send-email

**Bestand:** `supabase/functions/send-email/index.ts`

### Beschrijving
Algemene email verzend functie via Resend met automatische signature toevoeging.

### Kenmerken
- Resend email service integratie
- Automatische handtekening toevoeging
- CC en BCC support
- Bijlagen ondersteuning
- Reply-to header support
- Email opslag in database

### Request Parameters
```typescript
{
  to: string[];                      // Ontvangers
  cc?: string[];                     // CC ontvangers
  bcc?: string[];                    // BCC ontvangers
  subject: string;                   // Onderwerp
  body_text: string;                 // Plain text body
  body_html: string;                 // HTML body
  attachments?: Array<{
    filename: string;
    content: string;                 // Base64
    contentType: string;
  }>;
  email_settings_id: string;         // User email settings ID
  in_reply_to?: string;              // Reply message ID
}
```

### Response
```typescript
{
  success: boolean;
  messageId: string;                 // Resend message ID
}
```

### Environment Variables
- `RESEND_API_KEY` - Resend API sleutel
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

---

## 2. send-quote-email

**Bestand:** `supabase/functions/send-quote-email/index.ts`

### Beschrijving
Verstuurt offerte emails met PDF bijlage en publieke link voor digitale goedkeuring.

### Kenmerken
- Automatische PDF generatie en bijlage
- Publieke offerte link met token
- Digitale handtekening support
- Responsive email design
- Ondertekende versie bijlage (indien van toepassing)

### Request Parameters
```typescript
{
  quoteId: string;                   // UUID van offerte
  recipientEmail: string;            // Ontvanger email
  recipientName: string;             // Ontvanger naam
  subject?: string;                  // Custom onderwerp
  message?: string;                  // Custom bericht
}
```

### Response
```typescript
{
  success: boolean;
  emailId: string;                   // Resend email ID
  publicUrl: string;                 // Publieke offerte URL
}
```

### Environment Variables
- `RESEND_API_KEY` - Resend API sleutel
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

---

## 3. send-quote-confirmation-email

**Bestand:** `supabase/functions/send-quote-confirmation-email/index.ts`

### Beschrijving
Verstuurt bevestigingsemail naar klant na goedkeuring van offerte.

### Kenmerken
- Automatisch verzonden bij offerte goedkeuring
- Bevat handtekeningdetails
- Link naar goedgekeurde offerte
- Informatie over vervolgstappen

### Request Parameters
```typescript
{
  quoteId: string;                   // UUID van goedgekeurde offerte
}
```

### Response
```typescript
{
  success: boolean;
  emailId: string;                   // Resend email ID
  publicUrl: string;                 // Publieke offerte URL
}
```

### Environment Variables
- `RESEND_API_KEY` - Resend API sleutel
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

---

## 4. send-invoice-email

**Bestand:** `supabase/functions/send-invoice-email/index.ts`

### Beschrijving
Verstuurt factuur emails met PDF bijlage en optionele betaallink.

### Kenmerken
- Automatische PDF generatie
- Stripe betaallink generatie
- Responsive email design met betaalknop
- Automatische factuurnummer tracking
- Status update naar 'verzonden'

### Request Parameters
```typescript
{
  invoiceId: string;                 // UUID van factuur
  recipientEmail: string;            // Ontvanger email
  recipientName: string;             // Ontvanger naam
  subject?: string;                  // Custom onderwerp
  message?: string;                  // Custom bericht
  includePaymentLink?: boolean;      // Genereer betaallink (default: true)
}
```

### Response
```typescript
{
  success: boolean;
  emailId: string;                   // Resend email ID
}
```

### Environment Variables
- `RESEND_API_KEY` - Resend API sleutel
- `STRIPE_LIVE_KEY` - Stripe API sleutel
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

---

## 5. send-payment-reminder

**Bestand:** `supabase/functions/send-payment-reminder/index.ts`

### Beschrijving
Verstuurt betalingsherinneringen voor openstaande facturen.

### Kenmerken
- Automatische betaallink inclusie
- Factuurdetails in email
- Status update naar 'herinnering'
- Reminder count tracking
- Friendly reminder toon

### Request Parameters
```typescript
{
  invoiceNumber: string;             // Factuurnummer
  customerEmail: string;             // Klant email
}
```

### Response
```typescript
{
  success: boolean;
  message: string;
  paymentUrl: string;                // Betaallink
}
```

### Environment Variables
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

---

## 6. send-completion-email

**Bestand:** `supabase/functions/send-completion-email/index.ts`

### Beschrijving
Verstuurt project afronding emails met werkrapport naar klant.

### Kenmerken
- Werkrapport PDF link
- Klanttevredenheid weergave
- Uitgevoerde werkzaamheden overzicht
- Responsive email design
- Aanbevelingen inclusie

### Request Parameters
```typescript
{
  to: string;                        // Klant email
  customer_name: string;             // Klant naam
  project_title: string;             // Project titel
  project_address: string;           // Project adres
  installer_name: string;            // Monteur naam
  completion_date: string;           // Afronding datum
  customer_satisfaction: number;     // Tevredenheid (1-5)
  work_performed: string;            // Uitgevoerde werk
  recommendations?: string;          // Aanbevelingen
  pdf_url: string;                   // Werkrapport PDF URL
}
```

### Response
```typescript
{
  success: boolean;
  email_id: string;                  // Email ID
  message: string;
  email_preview: {
    to: string;
    subject: string;
    stored_in_db: boolean;
  }
}
```

### Environment Variables
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

---

## Email Sync Functions

### 7. email-sync

**Bestand:** `supabase/functions/email-sync/index.ts`

### Beschrijving
Synchroniseert emails via IMAP voor Gmail, Outlook, Yahoo en custom IMAP servers.

### Kenmerken
- Multi-provider ondersteuning (Gmail, Outlook, Yahoo)
- IMAP protocol
- OAuth support framework
- Attachment processing
- Duplicate prevention via sync_hash
- Sync logging

### Request Parameters
```typescript
{
  action: 'sync' | 'oauth-callback';  // Actie type
  emailSettingsId: string;            // Email settings ID
  code?: string;                      // OAuth code (voor callback)
}
```

### Response
```typescript
{
  success: boolean;
  emailsProcessed: number;
  emailsAdded: number;
}
```

### Environment Variables
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `GOOGLE_CLIENT_ID` - Google OAuth client ID (optioneel)

---

## 8. email-receipt-sync

**Bestand:** `supabase/functions/email-receipt-sync/index.ts`

### Beschrijving
Synchroniseert bonnetjes van een specifieke email account (bonnetjes@smanscrm.nl).

### Kenmerken
- IMAP synchronisatie
- Automatische bestand upload naar storage
- Image en PDF filtering
- Admin notificaties
- Bonnetje record aanmaak

### Request Parameters
```typescript
{
  email?: string;                     // Email adres (default: bonnetjes@smanscrm.nl)
}
```

### Response
```typescript
{
  success: boolean;
  emailsProcessed: number;
  attachmentsProcessed: number;
}
```

### Environment Variables
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

---

## Gebruik Voorbeelden

### Offerte Versturen
```typescript
const { data } = await supabase.functions.invoke('send-quote-email', {
  body: {
    quoteId: 'uuid-here',
    recipientEmail: 'klant@email.com',
    recipientName: 'Jan Jansen',
    subject: 'Offerte kozijnen vervangen',
    message: 'Beste Jan, hierbij de offerte.'
  }
});
```

### Factuur met Betaallink
```typescript
const { data } = await supabase.functions.invoke('send-invoice-email', {
  body: {
    invoiceId: 'uuid-here',
    recipientEmail: 'klant@email.com',
    recipientName: 'Jan Jansen',
    includePaymentLink: true
  }
});
```

### Email Synchronisatie
```typescript
const { data } = await supabase.functions.invoke('email-sync', {
  body: {
    action: 'sync',
    emailSettingsId: 'settings-uuid'
  }
});
```

---

## Best Practices

1. **Rate Limiting**: Resend heeft rate limits, implementeer queuing voor bulk emails
2. **Templates**: Gebruik consistente email templates voor professionaliteit
3. **Testing**: Test emails in development met testmodus
4. **Error Handling**: Log email fouten voor debugging
5. **Personalization**: Gebruik altijd recipient naam en custom messages waar mogelijk
6. **Tracking**: Monitor email delivery rates en open rates

