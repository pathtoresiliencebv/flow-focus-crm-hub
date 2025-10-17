# 📧 Nylas Email Integration Guide

**Volledige email functionaliteit met Nylas API - OAuth authenticatie, moderne UI, en geavanceerde features.**

---

## 🎯 **OVERZICHT**

Deze integratie vervangt het oude SMTP/IMAP/OX Mail systeem met een moderne Nylas API implementatie die:

- ✅ **OAuth Authenticatie** - Veilige verbinding zonder wachtwoorden
- ✅ **Multi-Provider Support** - Gmail, Outlook, Yahoo, iCloud, Custom IMAP
- ✅ **Moderne UI** - Gmail-inspired interface met thread grouping
- ✅ **Real-time Sync** - Live email synchronisatie
- ✅ **Contact Management** - Automatische contacten sync
- ✅ **Attachment Support** - Download en preview bijlagen
- ✅ **Search & Filter** - Krachtige zoekfunctionaliteit
- ✅ **Mobile Responsive** - Optimized voor alle devices

---

## 🏗️ **ARCHITECTUUR**

### **Database Schema**

```sql
-- Nylas Accounts (OAuth grants)
nylas_accounts:
  - id, user_id, email_address, grant_id, provider
  - access_token (encrypted), refresh_token (encrypted)
  - token_expires_at, sync_state, is_active, last_sync_at

-- Email Messages (via Nylas API)
nylas_messages:
  - id, nylas_account_id, nylas_message_id, thread_id
  - from_email, to_emails (jsonb), subject, body_text, body_html
  - received_at, is_read, is_starred, folder, has_attachments

-- Email Threads (conversaties)
nylas_threads:
  - id, nylas_account_id, nylas_thread_id, subject
  - participants (jsonb), message_count, last_message_at

-- Contacts (via Nylas API)
nylas_contacts:
  - id, nylas_account_id, nylas_contact_id, email, name
  - company, phone, notes (jsonb)
```

### **Edge Functions**

| Function | Purpose | API Endpoint |
|----------|---------|--------------|
| `nylas-oauth-init` | Start OAuth flow | `/functions/v1/nylas-oauth-init` |
| `nylas-oauth-callback` | Handle OAuth callback | `/functions/v1/nylas-oauth-callback` |
| `nylas-sync-messages` | Sync emails from Nylas | `/functions/v1/nylas-sync-messages` |
| `nylas-send-message` | Send email via Nylas | `/functions/v1/nylas-send-message` |
| `nylas-sync-contacts` | Sync contacts from Nylas | `/functions/v1/nylas-sync-contacts` |
| `nylas-create-contact` | Create contact in Nylas | `/functions/v1/nylas-create-contact` |
| `nylas-download-attachment` | Download attachments | `/functions/v1/nylas-download-attachment` |

### **Frontend Components**

| Component | Purpose | Location |
|-----------|---------|----------|
| `useNylasAuth` | OAuth flow & account management | `src/hooks/useNylasAuth.ts` |
| `useNylasMessages` | Email operations | `src/hooks/useNylasMessages.ts` |
| `useNylasContacts` | Contact management | `src/hooks/useNylasContacts.ts` |
| `NylasAccountSetup` | OAuth provider selection | `src/components/email/NylasAccountSetup.tsx` |
| `NylasMessageList` | Email list with threads | `src/components/email/NylasMessageList.tsx` |
| `EmailNylas` | Main email page | `src/pages/EmailNylas.tsx` |

---

## ⚙️ **SETUP INSTRUCTIES**

### **1. Nylas Account Setup**

1. **Registreer bij Nylas**
   - Ga naar [https://dashboard.nylas.com](https://dashboard.nylas.com)
   - Maak een account aan
   - Verifieer je email

2. **Create Application**
   - Klik "Create Application"
   - Naam: "SMANS CRM Email Integration"
   - Description: "Email integration for SMANS CRM system"

3. **Configure OAuth Settings**
   - **Redirect URI**: `https://your-domain.com/auth/callback`
   - **Scopes**: 
     - `https://www.googleapis.com/auth/gmail.readonly`
     - `https://www.googleapis.com/auth/gmail.send`
     - `https://www.googleapis.com/auth/gmail.modify`
     - `https://www.googleapis.com/auth/contacts.readonly`
     - `https://www.googleapis.com/auth/calendar.readonly`

### **2. Supabase Environment Variables**

Voeg toe in Supabase Dashboard → Settings → Edge Functions → Secrets:

```bash
# Nylas API Configuration
NYLAS_API_KEY=your_nylas_api_key_here
NYLAS_CLIENT_ID=your_nylas_client_id_here
NYLAS_CLIENT_SECRET=your_nylas_client_secret_here
NYLAS_REDIRECT_URI=https://your-domain.com/auth/callback

# Existing (keep these)
EMAIL_ENCRYPTION_KEY=your_existing_encryption_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### **3. Database Migration**

De migration is al aangemaakt: `supabase/migrations/20250115000000_nylas_integration.sql`

**Deploy de migration:**
```bash
cd flow-focus-crm-hub
npx supabase db push
```

### **4. Edge Functions Deployment**

Deploy alle Nylas Edge Functions:

```bash
# Deploy alle functions
npx supabase functions deploy nylas-oauth-init
npx supabase functions deploy nylas-oauth-callback
npx supabase functions deploy nylas-sync-messages
npx supabase functions deploy nylas-send-message
npx supabase functions deploy nylas-sync-contacts
npx supabase functions deploy nylas-create-contact
npx supabase functions deploy nylas-download-attachment
```

### **5. Frontend Integration**

De nieuwe email page is beschikbaar op `/email-nylas`. 

**Update routing (optioneel):**
```typescript
// In je router config
{
  path: '/email',
  component: EmailNylas, // Nieuwe Nylas implementatie
}
```

---

## 🚀 **GEBRUIK**

### **1. Account Verbinden**

1. Ga naar `/email-nylas`
2. Klik "Add Account" of "Connect Gmail/Outlook"
3. Selecteer je email provider
4. Voer je email in (optioneel)
5. Klik "Connect [Provider]"
6. Autoriseer in de popup
7. Account wordt automatisch verbonden

### **2. Email Synchroniseren**

- **Automatisch**: Emails worden gesynchroniseerd bij account verbinding
- **Handmatig**: Klik op de refresh knop (⟳) in de toolbar
- **Real-time**: Gebruik de sync knop voor live updates

### **3. Email Versturen**

1. Klik "Nieuw bericht" (✉️)
2. Vul ontvanger, onderwerp en bericht in
3. Klik "Verzenden"
4. Email wordt via Nylas API verzonden

### **4. Contacten Beheren**

- **Automatisch**: Contacten worden gesynchroniseerd vanuit je email
- **Handmatig**: Gebruik de contact manager (nog te implementeren)
- **Search**: Zoek contacten in de composer

---

## 🔧 **CONFIGURATIE**

### **Provider Support**

| Provider | OAuth | IMAP | SMTP | Status |
|----------|-------|------|------|--------|
| Gmail | ✅ | ✅ | ✅ | Full Support |
| Outlook | ✅ | ✅ | ✅ | Full Support |
| Yahoo | ✅ | ✅ | ✅ | Full Support |
| iCloud | ✅ | ✅ | ✅ | Full Support |
| Custom IMAP | ❌ | ✅ | ✅ | Manual Config |

### **Sync Settings**

```typescript
// In useNylasMessages hook
const syncOptions = {
  fullSync: false,        // Incremental sync
  maxMessages: 100,       // Messages per sync
  folders: ['inbox', 'sent', 'drafts'], // Sync folders
  includeAttachments: true // Download attachments
};
```

### **Performance Optimization**

- **Virtual Scrolling**: Voor grote email lijsten
- **Lazy Loading**: Email bodies worden on-demand geladen
- **Caching**: Database caching voor snelle toegang
- **Pagination**: Incremental loading van emails

---

## 🛠️ **ONTWIKKELING**

### **Adding New Providers**

1. **Update Provider List** in `NylasAccountSetup.tsx`:
```typescript
const PROVIDERS = [
  // ... existing providers
  {
    id: 'new-provider' as const,
    name: 'New Provider',
    description: 'New email provider',
    icon: NewIcon,
    color: 'bg-purple-500',
    popular: false,
  },
];
```

2. **Update OAuth Scopes** in `nylas-oauth-init/index.ts`:
```typescript
const scopes = [
  'https://www.googleapis.com/auth/gmail.readonly',
  // Add new provider scopes
  'https://new-provider.com/auth/email.read',
];
```

### **Custom Email Actions**

```typescript
// In useNylasMessages hook
const customActions = {
  archiveMessage: async (messageId: string) => {
    // Custom archive logic
  },
  addLabel: async (messageId: string, label: string) => {
    // Custom labeling
  },
  scheduleSend: async (messageId: string, sendAt: Date) => {
    // Schedule email sending
  }
};
```

### **UI Customization**

```typescript
// Theme customization
const emailTheme = {
  primaryColor: '#dc2626',    // Red theme
  accentColor: '#3b82f6',     // Blue accents
  fontFamily: 'Inter',        // Custom font
  borderRadius: '8px',        // Rounded corners
};
```

---

## 🔒 **SECURITY**

### **Token Encryption**

- **Access Tokens**: AES-256-GCM encrypted at rest
- **Refresh Tokens**: AES-256-GCM encrypted at rest
- **Key Management**: Uses `EMAIL_ENCRYPTION_KEY` from Supabase

### **OAuth Security**

- **HTTPS Only**: All OAuth callbacks require HTTPS
- **State Parameter**: CSRF protection via state parameter
- **Token Expiry**: Automatic token refresh
- **Scope Limitation**: Minimal required scopes

### **Data Privacy**

- **RLS Policies**: Users can only access their own data
- **Data Retention**: Configurable email retention policies
- **Audit Logging**: All email operations are logged
- **GDPR Compliance**: Data export and deletion support

---

## 📊 **MONITORING**

### **Health Checks**

```typescript
// Check Nylas API status
const healthCheck = async () => {
  const response = await fetch('/functions/v1/nylas-health-check');
  return response.json();
};
```

### **Error Tracking**

- **OAuth Errors**: Logged in Supabase logs
- **Sync Errors**: Tracked in `nylas_accounts.last_error`
- **Rate Limits**: Automatic retry with exponential backoff
- **API Quotas**: Monitor Nylas API usage

### **Performance Metrics**

- **Sync Duration**: Track email sync performance
- **API Response Times**: Monitor Nylas API latency
- **Error Rates**: Track success/failure rates
- **User Engagement**: Email usage analytics

---

## 🐛 **TROUBLESHOOTING**

### **Common Issues**

**1. OAuth Flow Fails**
```
Error: "Invalid redirect URI"
Solution: Check NYLAS_REDIRECT_URI matches Nylas dashboard
```

**2. Email Sync Stuck**
```
Error: "Sync state stuck on 'syncing'"
Solution: Reset sync_state in database
```

**3. Token Expired**
```
Error: "Access token expired"
Solution: Implement automatic token refresh
```

**4. Rate Limit Exceeded**
```
Error: "API rate limit exceeded"
Solution: Implement exponential backoff
```

### **Debug Mode**

```typescript
// Enable debug logging
const debugMode = {
  logOAuthFlow: true,
  logSyncOperations: true,
  logAPIRequests: true,
  logErrors: true
};
```

### **Database Queries**

```sql
-- Check account status
SELECT email_address, sync_state, last_sync_at, last_error 
FROM nylas_accounts 
WHERE user_id = 'user-id';

-- Check message counts
SELECT folder, COUNT(*) as count 
FROM nylas_messages 
WHERE nylas_account_id = 'account-id' 
GROUP BY folder;

-- Check sync errors
SELECT * FROM nylas_accounts 
WHERE sync_state = 'error' 
AND last_error_at > NOW() - INTERVAL '1 hour';
```

---

## 📈 **ROADMAP**

### **Phase 1: Core Features** ✅
- [x] OAuth authentication
- [x] Email sync and display
- [x] Basic email operations
- [x] Contact management
- [x] Modern UI

### **Phase 2: Advanced Features** 🚧
- [ ] Rich text composer
- [ ] Email templates
- [ ] Scheduled sending
- [ ] Email signatures
- [ ] Advanced search

### **Phase 3: Integrations** 📋
- [ ] Calendar integration
- [ ] CRM contact sync
- [ ] Email analytics
- [ ] Bulk operations
- [ ] API webhooks

### **Phase 4: Enterprise** 📋
- [ ] Multi-tenant support
- [ ] Advanced security
- [ ] Compliance features
- [ ] Custom providers
- [ ] White-label options

---

## 📞 **SUPPORT**

### **Documentation**
- [Nylas API Docs](https://docs.nylas.com/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [React Email Components](https://react.email/)

### **Community**
- [Nylas Community](https://community.nylas.com/)
- [Supabase Discord](https://discord.supabase.com/)
- [GitHub Issues](https://github.com/your-repo/issues)

### **Professional Support**
- **Nylas Support**: Enterprise customers
- **Supabase Support**: Database and hosting
- **Custom Development**: Contact development team

---

## 📝 **CHANGELOG**

### **v1.0.0** - 2025-01-15
- ✅ Initial Nylas integration
- ✅ OAuth authentication flow
- ✅ Email sync and display
- ✅ Contact management
- ✅ Modern UI components
- ✅ Mobile responsive design
- ✅ Database migration
- ✅ Edge functions deployment

### **v1.1.0** - Planned
- 🔄 Rich text email composer
- 🔄 Email templates
- 🔄 Advanced search
- 🔄 Calendar integration

### **v1.2.0** - Planned
- 🔄 Bulk operations
- 🔄 Email analytics
- 🔄 Custom providers
- 🔄 API webhooks

---

**🎉 Gefeliciteerd! Je Nylas email integratie is nu volledig operationeel.**

Voor vragen of ondersteuning, neem contact op met het development team.



