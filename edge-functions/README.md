# Flow Focus CRM - Edge Functions Documentatie

Welkom bij de complete documentatie van alle Supabase Edge Functions in het Flow Focus CRM systeem.

## 📋 Overzicht

Dit CRM systeem bevat **34 edge functions** verdeeld over verschillende categorieën. Deze functies draaien op Deno en bieden serverless functionaliteit voor het CRM platform.

---

## 📚 Documentatie per Categorie

### [01. AI & Translation Functions](./01-ai-translation-functions.md)
Functies voor AI-assistentie, tekstverbetering en vertaling.

- **ai-assistant** - Context-aware AI assistent met GPT-4o-mini
- **ai-text-enhancement** - Tekstverbetering voor offertes
- **enhanced-translation** - Context-specifieke vertaling (technical/formal/casual)
- **translate-message** - Bericht vertaling met Google Translate + caching
- **voice-to-text** - Audio naar tekst conversie met Whisper

**Belangrijkste use cases:**
- Chat assistentie met project context
- Offerte teksten professionaliseren
- Multi-taal communicatie
- Voice messages transcriberen

---

### [02. Email Functions](./02-email-functions.md)
Functies voor email verzending en synchronisatie.

- **send-email** - Algemene email verzending via Resend
- **send-quote-email** - Offerte versturen met PDF + publieke link
- **send-quote-confirmation-email** - Bevestiging na goedkeuring
- **send-invoice-email** - Factuur versturen met betaallink
- **send-payment-reminder** - Betalingsherinneringen
- **send-completion-email** - Project afronding email
- **email-sync** - IMAP email synchronisatie (Gmail, Outlook, Yahoo)
- **email-receipt-sync** - Bonnetjes synchronisatie via email

**Belangrijkste use cases:**
- Professionele email communicatie
- Automatische offertes en facturen versturen
- Email inbox integratie
- Bonnetjes ontvangen via email

---

### [03. Invoice & Payment Functions](./03-invoice-payment-functions.md)
Functies voor facturen, betalingen en Stripe integratie.

- **generate-invoice-pdf** - PDF factuur generatie met Puppeteer
- **create-invoice-payment** - Stripe Checkout sessie aanmaken
- **stripe-webhook** - Webhook handler voor payment events
- **stripe-config-test** - Stripe configuratie testen
- **generate-email-template** - AI email template generatie

**Belangrijkste use cases:**
- Professionele PDF facturen genereren
- Online betalingen via Stripe
- Automatische betaalstatus updates
- Payment link generatie

**Ondersteunde betaalmethoden:**
- iDEAL (Nederland)
- Creditcards (Visa, Mastercard, Amex)
- Bancontact (België)
- SEPA Direct Debit

---

### [04. Quote Functions](./04-quote-functions.md)
Functies voor offertes en goedkeuringsautomatisering.

- **generate-quote-pdf** - PDF offerte generatie met handtekeningen
- **quote-approval-automation** - Volledige automatisering na goedkeuring
- **apply-quote-migration** - Database migratie voor quote numbering
- **generate-completion-pdf** - Werkrapport generatie

**Belangrijkste use cases:**
- Professionele offertes met digitale handtekening
- Automatische project + factuur creatie bij goedkeuring
- Termijnfacturen ondersteuning
- Project afronding documentatie

**Workflow na goedkeuring:**
1. Klant aanmaken/vinden
2. Project aanmaken met status 'te-plannen'
3. Taken genereren uit offerte items
4. Concept factuur(en) aanmaken
5. Bevestigingsemail naar klant
6. Notificatie naar admin

---

### [05. Chat & Communication Functions](./05-chat-communication-functions.md)
Functies voor chat, messaging en notificaties.

- **chat-ai-assistant** - AI chat assistent met context
- **chat-analytics** - Conversatie analytics en insights
- **message-sync** - Offline message synchronisatie
- **notification-processor** - Push notificatie verwerking
- **send-push-notification** - FCM push notificaties

**Belangrijkste use cases:**
- Intelligente chat antwoord suggesties
- Conversatie metrics en insights
- Offline-first messaging
- Cross-platform push notificaties
- Real-time communicatie

---

### [06. Other Functions](./06-other-functions.md)
Overige functies voor auth, calendar, receipts en webhooks.

**Authentication & Mobile:**
- **auth-mobile** - Mobile app authenticatie
- **customers-mobile** - RESTful CRUD API voor klanten

**Calendar Integration:**
- **google-calendar-auth** - Google Calendar OAuth2
- **google-calendar-sync** - Calendar events synchronisatie

**Receipt Management:**
- **receipt-processor** - Email bonnetjes verwerking
- **receipt-approval** - Bonnetje goedkeuring/afwijzing

**Webhooks:**
- **webhook-processor** - Externe webhook verzending

**Belangrijkste use cases:**
- Mobile app toegang
- Calendar integratie voor planning
- Bonnetjes beheer systeem
- Externe systeem integraties

---

## 🔧 Environment Variables

### Vereiste Environment Variables

```bash
# Supabase
SUPABASE_URL=https://[project].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
SUPABASE_ANON_KEY=eyJhbG...

# OpenAI (AI & Translation)
OPENAI_API_KEY=sk-...

# Resend (Email)
RESEND_API_KEY=re_...

# Stripe (Payments)
STRIPE_LIVE_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Google (Calendar & Translation)
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=...
GOOGLE_TRANSLATE_API_KEY=...

# FCM (Push Notifications)
FCM_SERVER_KEY=...

# Site Configuration
SITE_URL=https://smanscrm.nl
```

### Optionele Environment Variables

```bash
# Testing
STRIPE_TEST_KEY=sk_test_...
```

---

## 🚀 Deployment

### Supabase CLI

```bash
# Login
supabase login

# Link project
supabase link --project-ref [your-project-ref]

# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy ai-assistant

# Set environment variables
supabase secrets set OPENAI_API_KEY=sk-...
```

### Environment Setup

```bash
# Create .env.local
cp .env.example .env.local

# Edit with your keys
nano .env.local

# Deploy secrets
supabase secrets set --env-file .env.local
```

---

## 📊 Function Statistics

| Categorie | Aantal | Beschrijving |
|-----------|--------|--------------|
| AI & Translation | 5 | AI assistentie en vertalingen |
| Email | 8 | Email verzending en sync |
| Invoice & Payment | 5 | Facturen en betalingen |
| Quotes | 4 | Offertes en automatisering |
| Chat & Communication | 5 | Messaging en notificaties |
| Other | 7 | Auth, calendar, receipts, webhooks |
| **Totaal** | **34** | **Alle edge functions** |

---

## 🔐 Security Best Practices

### 1. API Keys
- ✅ Gebruik NOOIT publishable keys (pk_) in edge functions
- ✅ Gebruik altijd secret keys (sk_live_ of sk_test_)
- ✅ Roteer API keys regelmatig
- ✅ Gebruik verschillende keys voor test en productie

### 2. Authentication
- ✅ Valideer altijd JWT tokens
- ✅ Gebruik RLS (Row Level Security) waar mogelijk
- ✅ Implementeer rate limiting
- ✅ Log authentication failures

### 3. Input Validation
- ✅ Sanitize alle user input
- ✅ Valideer email formats
- ✅ Check UUID formats
- ✅ Limit string lengths

### 4. Webhooks
- ✅ Verify webhook signatures (HMAC)
- ✅ Use HTTPS endpoints only
- ✅ Implement idempotency keys
- ✅ Log all webhook events

### 5. Error Handling
- ✅ Don't expose internal errors to users
- ✅ Log errors met context
- ✅ Use try-catch blocks
- ✅ Return user-friendly messages

---

## 📈 Performance Tips

### 1. Caching
```typescript
// Cache translations
if (messageId) {
  const cached = await getCachedTranslation(messageId, targetLang);
  if (cached) return cached;
}
```

### 2. Batch Operations
```typescript
// Batch insert instead of multiple singles
await supabase.from('table').insert([item1, item2, item3]);
```

### 3. Parallel Calls
```typescript
// Execute independent calls in parallel
const [pdfResult, emailResult] = await Promise.all([
  generatePDF(quoteId),
  sendEmail(emailData)
]);
```

### 4. Pagination
```typescript
// Limit results for large datasets
const { data } = await supabase
  .from('table')
  .select('*')
  .range(0, 99)  // First 100 items
  .order('created_at', { ascending: false });
```

---

## 🧪 Testing

### Local Testing

```bash
# Start Supabase locally
supabase start

# Serve function locally
supabase functions serve ai-assistant --no-verify-jwt

# Test with curl
curl -i --location --request POST \
  'http://localhost:54321/functions/v1/ai-assistant' \
  --header 'Authorization: Bearer [token]' \
  --header 'Content-Type: application/json' \
  --data '{"prompt":"Hello world"}'
```

### Integration Testing

```typescript
// Test from client
const { data, error } = await supabase.functions.invoke('ai-assistant', {
  body: { 
    prompt: 'Test prompt',
    type: 'general'
  }
});

expect(error).toBeNull();
expect(data.response).toBeDefined();
```

---

## 📝 Common Patterns

### CORS Headers
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Handle OPTIONS
if (req.method === 'OPTIONS') {
  return new Response(null, { headers: corsHeaders });
}
```

### Authentication Check
```typescript
const authHeader = req.headers.get('authorization');
if (!authHeader) {
  throw new Error('No authorization header');
}

const token = authHeader.replace('Bearer ', '');
const { data: { user }, error } = await supabase.auth.getUser(token);

if (error || !user) {
  throw new Error('Unauthorized');
}
```

### Error Response
```typescript
try {
  // Function logic
} catch (error) {
  console.error('Function error:', error);
  return new Response(
    JSON.stringify({ error: error.message }),
    {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}
```

---

## 🔄 Workflow Diagrammen

### Quote to Project Flow
```
Offerte Aanmaken → PDF Genereren → Email Versturen → 
Klant Ondertekent → Goedkeuring Automation → 
Project + Taken + Factuur Aanmaken → Emails Versturen
```

### Payment Flow
```
Factuur Aanmaken → PDF Genereren → Email + Betaallink → 
Klant Betaalt → Stripe Webhook → Status Update → 
Bevestiging Email
```

### Receipt Processing Flow
```
Email Ontvangen → Attachments Extracten → 
Upload naar Storage → Record Aanmaken → 
Admin Notificeren → Admin Goedkeurt → 
Bevestiging naar Indiener
```

---

## 🆘 Troubleshooting

### Common Issues

**Issue: "Function not found"**
```bash
# Check deployment
supabase functions list

# Redeploy
supabase functions deploy [function-name]
```

**Issue: "Invalid JWT"**
```typescript
// Ensure token is passed correctly
const token = supabase.auth.session()?.access_token;
```

**Issue: "OpenAI API rate limit"**
```typescript
// Implement exponential backoff
const retryWithBackoff = async (fn, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
    }
  }
};
```

**Issue: "Stripe webhook signature failed"**
```bash
# Verify webhook secret matches
supabase secrets list | grep STRIPE_WEBHOOK_SECRET

# Test webhook locally
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
```

---

## 📞 Support

Voor vragen of problemen:
- Check de specifieke functie documentatie
- Review de error logs in Supabase Dashboard
- Test lokaal met `supabase functions serve`

---

## 📜 Changelog

### 2025-10-01
- ✅ Alle 34 functies gedocumenteerd
- ✅ Categorieën georganiseerd
- ✅ Code voorbeelden toegevoegd
- ✅ Best practices gedocumenteerd
- ✅ Environment variables overzicht

---

## 🎯 Quick Reference

| Functie | Endpoint | Primair Doel |
|---------|----------|--------------|
| `ai-assistant` | POST | AI chat antwoorden |
| `send-quote-email` | POST | Offerte versturen |
| `generate-invoice-pdf` | POST | PDF factuur maken |
| `create-invoice-payment` | POST | Betaallink maken |
| `stripe-webhook` | POST | Payment events |
| `quote-approval-automation` | POST | Offerte → Project |
| `chat-ai-assistant` | POST | Chat suggesties |
| `customers-mobile` | GET/POST/PUT/DELETE | Klanten CRUD |
| `google-calendar-sync` | POST | Calendar sync |
| `webhook-processor` | POST | Webhooks versturen |

---

**Laatste update:** 1 oktober 2025  
**Versie:** 1.0.0  
**Documentatie door:** AI Assistant  
**Project:** Flow Focus CRM Hub

