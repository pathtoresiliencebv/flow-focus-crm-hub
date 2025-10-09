# Settings Database Synchronisatie Plan

## Overzicht

Dit document beschrijft het plan om alle instellingen in de CRM applicatie volledig synchroon te maken met de database, zodat alle wijzigingen permanent worden opgeslagen.

## Huidige Status

### ✅ Reeds Gesynchroniseerd
1. **Stripe Betalingen** - Volledig werkend
2. **Company Settings** - Heeft `company_settings` tabel
3. **Quote Settings** - Heeft `quote_settings` tabel
4. **System Notification Settings** - Heeft `system_notification_settings` tabel
5. **User Email Settings** - Heeft `user_email_settings` tabel
6. **Google Calendar Settings** - Heeft `google_calendar_settings` tabel
7. **User Calendar Settings** - Heeft `user_calendar_settings` tabel
8. **Privacy Settings** - Heeft `privacy_settings` tabel

### ❌ Nog Niet Gesynchroniseerd
Deze instellingen gebruiken waarschijnlijk alleen local state zonder database persistentie:

1. **Bedrijfsgegevens** (CompanyDetailsSettings)
2. **Taal & Vertaling** (LanguageSettingsPage)
3. **Factuur Instellingen** (InvoiceSettings)
4. **Gebruikersbeheer** (UserSettings)
5. **Rollen & Rechten** (RoleSettings)
6. **E-mail Accounts** (EmailSettings)
7. **E-mail Templates** (EmailTemplateSettings)
8. **E-mail Notificaties** (EmailNotificationSettings)
9. **Push Notificaties** (NotificationSettings)
10. **Lead Formulieren** (LeadFormSettings)
11. **AI Integratie** (AIIntegrationSettings)

---

## Database Schema Ontwerp

### Benodigde Nieuwe Tabellen

#### 1. `invoice_settings`
```sql
CREATE TABLE invoice_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  
  -- Factuur nummering
  invoice_prefix TEXT DEFAULT 'INV',
  invoice_start_number INTEGER DEFAULT 1000,
  
  -- Betalingsvoorwaarden
  default_payment_term_days INTEGER DEFAULT 30,
  late_payment_fee_percentage DECIMAL(5,2) DEFAULT 0,
  
  -- BTW
  default_vat_rate DECIMAL(5,2) DEFAULT 21.00,
  vat_number TEXT,
  
  -- Bank gegevens
  bank_name TEXT,
  iban TEXT,
  bic_swift TEXT,
  
  -- Footer tekst
  invoice_footer_text TEXT,
  
  -- Email instellingen
  send_invoice_email_automatically BOOLEAN DEFAULT false,
  invoice_email_template_id UUID,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. `email_account_settings`
```sql
CREATE TABLE email_account_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  
  -- SMTP
  smtp_host TEXT,
  smtp_port INTEGER,
  smtp_username TEXT,
  smtp_password_encrypted TEXT, -- Encrypted
  smtp_use_ssl BOOLEAN DEFAULT true,
  
  -- IMAP
  imap_host TEXT,
  imap_port INTEGER,
  imap_username TEXT,
  imap_password_encrypted TEXT, -- Encrypted
  imap_use_ssl BOOLEAN DEFAULT true,
  
  -- Email verzenden
  from_name TEXT,
  from_email TEXT,
  signature TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3. `email_templates`
```sql
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Template info
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'quote', 'invoice', 'planning', 'general'
  
  -- Template content
  subject TEXT NOT NULL,
  body_html TEXT,
  body_text TEXT,
  
  -- Variabelen die gebruikt kunnen worden
  available_variables JSONB, -- ['{{customer_name}}', '{{quote_number}}', etc]
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 4. `email_notification_rules`
```sql
CREATE TABLE email_notification_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Trigger
  trigger_type TEXT NOT NULL, -- 'planning_created', 'project_completed', 'invoice_sent', etc
  
  -- Email settings
  send_to_customer BOOLEAN DEFAULT false,
  send_to_assigned_user BOOLEAN DEFAULT false,
  send_to_custom_emails TEXT[], -- Array of email addresses
  
  -- Template
  email_template_id UUID REFERENCES email_templates(id),
  
  -- Timing
  send_immediately BOOLEAN DEFAULT true,
  send_delay_minutes INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 5. `push_notification_settings`
```sql
CREATE TABLE push_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  
  -- Per event type instellingen
  notify_planning_assigned BOOLEAN DEFAULT true,
  notify_project_status_change BOOLEAN DEFAULT true,
  notify_new_message BOOLEAN DEFAULT true,
  notify_new_quote BOOLEAN DEFAULT false,
  notify_invoice_paid BOOLEAN DEFAULT true,
  
  -- Global settings
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  
  -- Device tokens
  fcm_tokens JSONB, -- Firebase Cloud Messaging tokens
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 6. `lead_form_settings`
```sql
CREATE TABLE lead_form_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Form info
  form_name TEXT NOT NULL,
  form_url_slug TEXT UNIQUE,
  
  -- Fields configuration
  fields_config JSONB, -- Dynamic field configuration
  
  -- Behavior
  redirect_url TEXT,
  success_message TEXT,
  send_confirmation_email BOOLEAN DEFAULT true,
  confirmation_email_template_id UUID REFERENCES email_templates(id),
  
  -- Assignment
  assign_to_user_id UUID REFERENCES profiles(id),
  auto_create_project BOOLEAN DEFAULT false,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 7. `ai_integration_settings`
```sql
CREATE TABLE ai_integration_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  
  -- Provider
  ai_provider TEXT, -- 'openai', 'anthropic', 'custom'
  api_key_encrypted TEXT, -- Encrypted
  
  -- Features
  enable_chat_assistance BOOLEAN DEFAULT false,
  enable_email_suggestions BOOLEAN DEFAULT false,
  enable_quote_generation BOOLEAN DEFAULT false,
  enable_document_summarization BOOLEAN DEFAULT false,
  
  -- Model settings
  model_name TEXT,
  temperature DECIMAL(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 1000,
  
  -- Usage limits
  monthly_request_limit INTEGER,
  current_month_requests INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 8. `language_settings`
```sql
CREATE TABLE language_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Default language
  default_language TEXT DEFAULT 'nl',
  
  -- Available languages
  enabled_languages TEXT[] DEFAULT ARRAY['nl', 'en'],
  
  -- Translation settings
  auto_translate_enabled BOOLEAN DEFAULT false,
  translation_provider TEXT, -- 'google', 'deepl', 'manual'
  translation_api_key_encrypted TEXT,
  
  -- UI settings
  show_language_selector BOOLEAN DEFAULT true,
  detect_browser_language BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Implementatie Plan

### Fase 1: Database Setup (2-3 uur)
1. **Migraties aanmaken** voor alle nieuwe tabellen
2. **RLS policies** toevoegen voor beveiliging
3. **Indexes** aanmaken voor performance
4. **Default data** inserteren (bijv. standaard email templates)

### Fase 2: React Hooks & Services (3-4 uur)
Voor elke settings categorie:

1. **Custom Hook maken** (bijv. `useInvoiceSettings`)
   ```typescript
   export function useInvoiceSettings() {
     const queryClient = useQueryClient();
     
     const { data: settings, isLoading } = useQuery({
       queryKey: ['invoice-settings'],
       queryFn: async () => {
         const { data, error } = await supabase
           .from('invoice_settings')
           .select('*')
           .single();
         if (error) throw error;
         return data;
       }
     });
     
     const updateSettings = useMutation({
       mutationFn: async (updates) => {
         const { data, error } = await supabase
           .from('invoice_settings')
           .update(updates)
           .eq('id', settings?.id)
           .select()
           .single();
         if (error) throw error;
         return data;
       },
       onSuccess: () => {
         queryClient.invalidateQueries(['invoice-settings']);
         toast.success('Instellingen opgeslagen');
       }
     });
     
     return { settings, isLoading, updateSettings };
   }
   ```

2. **Settings Component updaten**
   - Replace local state met database data
   - Add loading states
   - Add error handling
   - Add success notifications

### Fase 3: Component Refactoring (4-5 uur)

#### Prioriteits Volgorde:

1. **HIGH PRIORITY** (Direct impact op business):
   - ✅ Stripe (al werkend)
   - 📧 Email Accounts
   - 📧 Email Templates
   - 📧 Email Notificaties
   - 💰 Factuur Instellingen
   - 📄 Offerte Instellingen (controleren)

2. **MEDIUM PRIORITY** (Verbetert UX):
   - 🏢 Bedrijfsgegevens
   - 🔔 Push Notificaties
   - 🌐 Taal & Vertaling
   - 📋 Lead Formulieren

3. **LOW PRIORITY** (Nice to have):
   - 🤖 AI Integratie
   - 👥 Gebruikersbeheer (kan lokaal blijven)
   - 🔐 Rollen & Rechten (kan lokaal blijven)

### Fase 4: Testing & Validatie (2 uur)
1. **Unit tests** voor hooks
2. **Integration tests** voor database operaties
3. **Manual testing** van alle settings pagina's
4. **Performance testing** (load times, mutation times)

### Fase 5: Documentation & Deployment (1 uur)
1. **README update** met nieuwe settings structuur
2. **Migration guide** voor bestaande data
3. **Deployment checklist**

---

## Technische Implementatie Details

### Security Best Practices

1. **Encryptie voor gevoelige data**:
   ```typescript
   // Gebruik pgcrypto voor database-level encryptie
   CREATE EXTENSION IF NOT EXISTS pgcrypto;
   
   -- Voorbeeld: Encryptie van API keys
   UPDATE email_account_settings
   SET smtp_password_encrypted = pgp_sym_encrypt(
     'plaintext_password',
     current_setting('app.encryption_key')
   );
   ```

2. **Row Level Security (RLS)**:
   ```sql
   -- Voorbeeld voor email_account_settings
   CREATE POLICY "Users can view own email settings"
   ON email_account_settings
   FOR SELECT
   USING (auth.uid() = user_id);
   
   CREATE POLICY "Users can update own email settings"
   ON email_account_settings
   FOR UPDATE
   USING (auth.uid() = user_id);
   ```

### Performance Optimizations

1. **Caching Strategy**:
   - Use React Query with `staleTime: 5 * 60 * 1000` (5 minuten)
   - Invalidate cache only on successful mutations
   - Use `optimisticUpdates` voor instant UI feedback

2. **Lazy Loading**:
   - Load settings only when settings page is opened
   - Use `Suspense` boundaries voor loading states

3. **Batching**:
   - Batch multiple setting updates in single transaction

---

## Migration Strategy

### Stap 1: Database Migratie
```bash
# Nieuwe migratie aanmaken
supabase migration new settings_sync_complete

# Run migratie lokaal voor testing
supabase db reset

# Deploy naar productie
supabase db push
```

### Stap 2: Data Migratie
Voor bestaande installaties met local state data:

```typescript
// migrations/migrate_local_to_db.ts
async function migrateLocalSettingsToDatabase() {
  // Check if settings exist in localStorage
  const localSettings = localStorage.getItem('app_settings');
  
  if (localSettings) {
    const parsed = JSON.parse(localSettings);
    
    // Insert into database
    await supabase.from('invoice_settings').upsert({
      ...parsed.invoice,
      organization_id: getCurrentOrganizationId()
    });
    
    // Clear localStorage after successful migration
    localStorage.removeItem('app_settings');
  }
}
```

---

## Component Refactoring Voorbeeld

### Voor: InvoiceSettings.tsx (Local State)
```typescript
// ❌ BEFORE - Local state only
export function InvoiceSettings() {
  const [prefix, setPrefix] = useState('INV');
  const [startNumber, setStartNumber] = useState(1000);
  
  const handleSave = () => {
    localStorage.setItem('invoice_settings', JSON.stringify({
      prefix,
      startNumber
    }));
    toast.success('Saved locally');
  };
  
  return (
    <form onSubmit={handleSave}>
      <Input value={prefix} onChange={(e) => setPrefix(e.target.value)} />
      <Button type="submit">Save</Button>
    </form>
  );
}
```

### Na: InvoiceSettings.tsx (Database Sync)
```typescript
// ✅ AFTER - Database synced
export function InvoiceSettings() {
  const { settings, isLoading, updateSettings } = useInvoiceSettings();
  const form = useForm({
    defaultValues: settings,
  });
  
  useEffect(() => {
    if (settings) {
      form.reset(settings);
    }
  }, [settings]);
  
  const onSubmit = async (data) => {
    await updateSettings.mutateAsync(data);
  };
  
  if (isLoading) return <LoadingSpinner />;
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="invoice_prefix"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Factuur Prefix</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <Button 
          type="submit" 
          disabled={updateSettings.isLoading}
        >
          {updateSettings.isLoading ? 'Opslaan...' : 'Opslaan'}
        </Button>
      </form>
    </Form>
  );
}
```

---

## Implementatie Checklist

### Per Settings Component:

- [ ] **1. Database Schema**
  - [ ] Tabel aangemaakt
  - [ ] RLS policies toegevoegd
  - [ ] Indexes aangemaakt
  - [ ] Default data geïnserteerd

- [ ] **2. React Hook**
  - [ ] Custom hook aangemaakt (useXxxSettings)
  - [ ] Query functie geïmplementeerd
  - [ ] Mutation functie geïmplementeerd
  - [ ] Error handling toegevoegd
  - [ ] Loading states toegevoegd

- [ ] **3. Component**
  - [ ] Local state verwijderd
  - [ ] Hook geïntegreerd
  - [ ] Form validatie toegevoegd
  - [ ] Loading states geïmplementeerd
  - [ ] Error messages geïmplementeerd
  - [ ] Success notifications geïmplementeerd

- [ ] **4. Testing**
  - [ ] Functionaliteit getest
  - [ ] Performance getest
  - [ ] Error scenarios getest
  - [ ] Data persistentie getest

---

## Specifieke Component Plans

### 1. Email Accounts (EmailSettings.tsx)

**Database**: `email_account_settings`

**Hook**: `useEmailAccountSettings`

**Features**:
- ✅ SMTP/IMAP configuratie
- ✅ Password encryptie
- ✅ Connection testing
- ✅ Multi-account support

**Priority**: 🔴 HIGH

**Estimated Time**: 3 uur

---

### 2. Email Templates (EmailTemplateSettings.tsx)

**Database**: `email_templates`

**Hook**: `useEmailTemplates`

**Features**:
- ✅ Template CRUD operations
- ✅ Variable substitution preview
- ✅ Category filtering
- ✅ Default template marking

**Priority**: 🔴 HIGH

**Estimated Time**: 4 uur

---

### 3. Factuur Instellingen (InvoiceSettings.tsx)

**Database**: `invoice_settings`

**Hook**: `useInvoiceSettings`

**Features**:
- ✅ Nummering schema
- ✅ Betalingsvoorwaarden
- ✅ BTW instellingen
- ✅ Bank gegevens

**Priority**: 🔴 HIGH

**Estimated Time**: 2 uur

---

### 4. Bedrijfsgegevens (CompanyDetailsSettings.tsx)

**Database**: `company_settings` (already exists - check if complete)

**Hook**: `useCompanySettings` (already exists - check if complete)

**Priority**: 🟡 MEDIUM

**Estimated Time**: 1 uur (verification + updates)

---

### 5. Taal & Vertaling (LanguageSettingsPage.tsx)

**Database**: `language_settings`

**Hook**: `useLanguageSettings`

**Features**:
- ✅ Default taal instellen
- ✅ Enabled languages
- ✅ Auto-translate configuratie
- ✅ Translation provider API keys

**Priority**: 🟡 MEDIUM

**Estimated Time**: 3 uur

---

### 6. Email Notificaties (EmailNotificationSettings.tsx)

**Database**: `email_notification_rules`

**Hook**: `useEmailNotificationRules`

**Features**:
- ✅ Per event type configuratie
- ✅ Template selection
- ✅ Recipient configuration
- ✅ Timing instellingen

**Priority**: 🔴 HIGH

**Estimated Time**: 3 uur

---

### 7. Push Notificaties (NotificationSettings.tsx)

**Database**: `push_notification_settings`

**Hook**: `usePushNotificationSettings`

**Features**:
- ✅ Per event type toggle
- ✅ Quiet hours
- ✅ Device token management

**Priority**: 🟡 MEDIUM

**Estimated Time**: 2 uur

---

### 8. Lead Formulieren (LeadFormSettings.tsx)

**Database**: `lead_form_settings`

**Hook**: `useLeadFormSettings`

**Features**:
- ✅ Form builder
- ✅ Field configuration
- ✅ Auto-assignment
- ✅ Confirmation emails

**Priority**: 🟡 MEDIUM

**Estimated Time**: 4 uur

---

### 9. AI Integratie (AIIntegrationSettings.tsx)

**Database**: `ai_integration_settings`

**Hook**: `useAIIntegrationSettings`

**Features**:
- ✅ Provider selection
- ✅ API key management (encrypted)
- ✅ Feature toggles
- ✅ Usage limits

**Priority**: 🟢 LOW

**Estimated Time**: 2 uur

---

## Total Estimated Time

| Priority | Components | Time |
|----------|-----------|------|
| 🔴 HIGH | 4 components | 12 uur |
| 🟡 MEDIUM | 4 components | 10 uur |
| 🟢 LOW | 1 component | 2 uur |
| **TOTAL** | **9 components** | **24 uur** |

Plus:
- Database setup: 3 uur
- Testing: 2 uur
- Documentation: 1 uur

**Grand Total**: ~30 uur werk

---

## Implementatie Volgorde (Aanbevolen)

### Week 1: Critical Path
1. ✅ Database schema + migraties (Dag 1)
2. 📧 Email Accounts (Dag 1-2)
3. 📧 Email Templates (Dag 2-3)
4. 💰 Factuur Instellingen (Dag 3)
5. 📧 Email Notificaties (Dag 4)

### Week 2: Enhanced Features
6. 🏢 Bedrijfsgegevens verification (Dag 1)
7. 🔔 Push Notificaties (Dag 1-2)
8. 🌐 Taal & Vertaling (Dag 2-3)
9. 📋 Lead Formulieren (Dag 3-4)

### Week 3: Polish & Testing
10. 🤖 AI Integratie (Dag 1)
11. 🧪 Comprehensive testing (Dag 2-3)
12. 📄 Documentation (Dag 4)
13. 🚀 Deployment (Dag 5)

---

## Success Criteria

✅ **Functionaliteit**:
- [ ] Alle instellingen worden opgeslagen in database
- [ ] Instellingen blijven behouden na refresh
- [ ] Instellingen zijn beschikbaar op alle devices
- [ ] Real-time synchronisatie werkt

✅ **Performance**:
- [ ] Settings laden < 500ms
- [ ] Settings opslaan < 1000ms
- [ ] Geen blocking UI tijdens save

✅ **Security**:
- [ ] Gevoelige data is encrypted
- [ ] RLS policies werken correct
- [ ] Alleen authorized users kunnen wijzigen

✅ **UX**:
- [ ] Duidelijke loading states
- [ ] Informatieve error messages
- [ ] Success feedback na opslaan
- [ ] Validation errors tonen

---

## Risico's & Mitigation

| Risico | Impact | Mitigation |
|--------|--------|------------|
| Data loss tijdens migratie | 🔴 HIGH | Backup maken + rollback plan |
| Breaking changes in API | 🟡 MEDIUM | Versioning + deprecation warnings |
| Performance degradation | 🟡 MEDIUM | Indexes + caching + monitoring |
| User confusion | 🟢 LOW | Clear documentation + tooltips |

---

## Next Steps

1. **Review dit plan** met het team
2. **Prioriteer** de componenten op basis van business needs
3. **Schedule** de implementatie in sprints
4. **Assign** developers aan specifieke componenten
5. **Start** met database schema migraties

---

## Conclusie

Dit plan zorgt voor een volledige synchronisatie van alle instellingen met de database. Na implementatie:

✅ Geen data verlies meer bij refresh
✅ Consistente instellingen across devices
✅ Betere user experience
✅ Schaalbare architectuur
✅ Secure data handling

**Status**: 📋 Plan compleet - klaar voor implementatie
