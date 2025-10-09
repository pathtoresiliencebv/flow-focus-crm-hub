# Offerte & Factuur Fixes - Compleet Plan

## Huidige Problemen

### 🔴 **KRITIEK - Offerte Maken Error**
**Symptoom**: Error bij klikken op "Nieuwe offerte"
**Status**: Gedeeltelijk opgelost in commit 2b9dd60, maar gebruiker rapporteert nog steeds errors

### 🔴 **KRITIEK - Project Klikken in Kalender Error**
**Symptoom**: Foutmelding bij klikken op project in kalender weergave
**Status**: Nieuw probleem na recente wijzigingen

### 🟡 **MEDIUM - Drie-puntjes Menu Opties Werken Niet**
**Symptoom**: Sommige acties in dropdown menu van offertes/facturen werken niet
**Opties die getest moeten worden**:
1. ✅ Bekijken (Preview)
2. ✅ Bewerken (Edit)
3. ❓ Openbare Link (Public Link)
4. ❓ Dupliceren (Duplicate)
5. ❓ Goedkeuren (Approve)
6. ❓ Email Versturen (Send Email)
7. ❓ PDF Downloaden (Download PDF)
8. ❓ PDF Printen (Print PDF)
9. ❓ Archiveren/Herstellen (Archive/Restore)
10. ✅ Verwijderen (Delete)

---

## Diagnose & Root Cause Analysis

### Probleem 1: Offerte Maken Error

**Mogelijke oorzaken**:
1. ✅ **React Hooks Order** - Opgelost in 2b9dd60
2. ❓ **Database Connection** - Quote number generation faalt
3. ❓ **Supabase RPC Function** - `generate_quote_number` werkt niet
4. ❓ **Missing Permissions** - User heeft geen `quotes_create` permission
5. ❓ **CRM Data Loading** - `useCrmStore` geeft errors

**Debugging Stappen**:
```typescript
// Log in MultiBlockQuoteForm.tsx
console.log('1. Component mounted');
console.log('2. CRM Loading:', crmLoading);
console.log('3. Customers:', customers.length);
console.log('4. Projects:', projects.length);
console.log('5. Generating quote number...');
```

**Fix Strategie**:
1. Add comprehensive error logging
2. Test `generate_quote_number` RPC function
3. Add fallback quote number generation
4. Add user-friendly error messages
5. Test with different user roles

---

### Probleem 2: Project Klikken Error

**Mogelijke oorzaken**:
1. ❓ **Invalid Project ID** - Planning item heeft geen `project_id`
2. ❓ **Navigation Error** - Route `/project/:id` bestaat niet meer
3. ❓ **Permission Check** - User mag project niet bekijken
4. ❓ **Project Data Missing** - Project is verwijderd maar planning bestaat nog

**Debugging Stappen**:
```typescript
// In SimplifiedPlanningManagement.tsx
onPlanningClick={(planning) => {
  console.log('Planning clicked:', planning);
  console.log('Project ID:', planning.project_id);
  console.log('Planning title:', planning.title);
  
  if (!planning.project_id) {
    console.error('No project_id found');
    toast.error('Deze planning heeft geen project gekoppeld');
    return;
  }
  
  // Check if project exists
  const projectExists = projects.find(p => p.id === planning.project_id);
  console.log('Project exists:', projectExists);
  
  if (!projectExists) {
    toast.error('Project niet gevonden');
    return;
  }
  
  navigate(`/project/${planning.project_id}`);
}}
```

**Fix Strategie**:
1. Add null checks for `project_id`
2. Verify project route exists
3. Add loading state during navigation
4. Test with different planning items

---

### Probleem 3: Drie-puntjes Menu Opties

**Acties Status**:

#### ✅ Werkend:
- **Bekijken** (`onPreview`)
- **Bewerken** (navigate to `/quotes/edit/:id`)
- **Verwijderen** (`onDelete`)

#### ❌ Niet Werkend / Te Testen:

**A. Openbare Link** (`onViewPublic`)
```typescript
// Problem: Public token generation might fail
// Fix: Test and add error handling

const handlePublicLink = async (quote: Quote) => {
  try {
    if (!quote.public_token) {
      // Generate new public token
      const { data, error } = await supabase
        .from('quotes')
        .update({ public_token: crypto.randomUUID() })
        .eq('id', quote.id)
        .select('public_token')
        .single();
      
      if (error) throw error;
      quote.public_token = data.public_token;
    }
    
    const publicUrl = `${window.location.origin}/public/quote/${quote.public_token}`;
    window.open(publicUrl, '_blank');
  } catch (error) {
    toast.error('Kon openbare link niet genereren');
  }
};
```

**B. Dupliceren** (`onDuplicate`)
```typescript
// Problem: Not implemented or database constraints fail
// Fix: Implement proper duplication logic

const handleDuplicate = async (quoteId: string) => {
  try {
    const { data: original, error: fetchError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', quoteId)
      .single();
    
    if (fetchError) throw fetchError;
    
    // Generate new quote number
    const { data: newQuoteNumber, error: rpcError } = await supabase
      .rpc('generate_quote_number');
    
    if (rpcError) throw rpcError;
    
    // Create duplicate with new number
    const { data: duplicate, error: insertError } = await supabase
      .from('quotes')
      .insert({
        ...original,
        id: undefined, // Let DB generate new ID
        quote_number: newQuoteNumber,
        status: 'concept',
        created_at: undefined,
        updated_at: undefined,
        public_token: null, // Generate new token
      })
      .select()
      .single();
    
    if (insertError) throw insertError;
    
    toast.success(`Offerte gedupliceerd: ${newQuoteNumber}`);
    navigate(`/quotes/edit/${duplicate.id}`);
  } catch (error) {
    console.error('Duplicate error:', error);
    toast.error('Kon offerte niet dupliceren');
  }
};
```

**C. Goedkeuren** (`onApprove`)
```typescript
// Problem: Status update might not trigger related actions
// Fix: Update status + send notifications

const handleApprove = async (quote: Quote) => {
  try {
    const { error } = await supabase
      .from('quotes')
      .update({ 
        status: 'goedgekeurd',
        approved_at: new Date().toISOString(),
      })
      .eq('id', quote.id);
    
    if (error) throw error;
    
    // Send notification email (if configured)
    const { data: emailSettings } = await supabase
      .from('email_notification_rules')
      .select('*')
      .eq('trigger_type', 'quote_approved')
      .eq('is_active', true)
      .maybeSingle();
    
    if (emailSettings?.send_to_customer) {
      // Trigger email edge function
      await supabase.functions.invoke('send-quote-email', {
        body: { 
          quoteId: quote.id,
          type: 'approved'
        }
      });
    }
    
    toast.success('Offerte goedgekeurd');
  } catch (error) {
    console.error('Approve error:', error);
    toast.error('Kon offerte niet goedkeuren');
  }
};
```

**D. Email Versturen** (`onSendEmail`)
```typescript
// Problem: Edge function not deployed or email config missing
// Fix: Check edge function exists + proper error handling

const handleSendEmail = async (quote: Quote) => {
  try {
    // Validate email settings exist
    const { data: emailAccount } = await supabase
      .from('user_email_settings')
      .select('*')
      .eq('user_id', currentUserId)
      .eq('is_active', true)
      .maybeSingle();
    
    if (!emailAccount) {
      toast.error('Geen email account geconfigureerd');
      return;
    }
    
    // Send via edge function
    const { data, error } = await supabase.functions.invoke('send-quote-email', {
      body: { 
        quoteId: quote.id,
        recipientEmail: quote.customer_email,
      }
    });
    
    if (error) throw error;
    
    // Update quote status
    await supabase
      .from('quotes')
      .update({ 
        status: 'verzonden',
        sent_at: new Date().toISOString(),
      })
      .eq('id', quote.id);
    
    toast.success('Email verzonden');
  } catch (error) {
    console.error('Send email error:', error);
    toast.error('Kon email niet versturen');
  }
};
```

**E. PDF Downloaden** (`handlePDFDownload`)
```typescript
// Problem: Edge function 'generate-quote-pdf' might fail
// Current status: Partially implemented, needs testing

// Fix: Improve error handling and user feedback

const handlePDFDownload = async (quoteId: string) => {
  try {
    toast.info('PDF wordt gegenereerd...', { duration: 2000 });
    
    const { data, error } = await supabase.functions.invoke('generate-quote-pdf', {
      body: { quoteId }
    });
    
    if (error) {
      console.error('PDF Generation Error:', error);
      
      // User-friendly error messages
      if (error.message.includes('timeout')) {
        toast.error('PDF generatie duurt te lang. Probeer opnieuw.');
      } else if (error.message.includes('not found')) {
        toast.error('Offerte niet gevonden.');
      } else {
        toast.error(`PDF fout: ${error.message}`);
      }
      return;
    }
    
    if (data?.success && data?.pdfUrl) {
      // Download file
      const link = document.createElement('a');
      link.href = data.pdfUrl;
      link.download = `Offerte-${quote.quote_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('PDF gedownload');
    } else {
      throw new Error('Geen PDF URL ontvangen');
    }
  } catch (error: any) {
    console.error('PDF Download Error:', error);
    toast.error('Kon PDF niet downloaden');
  }
};
```

**F. PDF Printen** (`handlePrint`)
```typescript
// Problem: Similar to PDF download, plus browser print dialog issues
// Fix: Generate PDF, open in new tab, trigger print

const handlePrint = async (quoteId: string) => {
  try {
    toast.info('PDF wordt voorbereid voor printen...');
    
    const { data, error } = await supabase.functions.invoke('generate-quote-pdf', {
      body: { quoteId }
    });
    
    if (error) throw error;
    
    if (data?.success && data?.pdfUrl) {
      // Open in new tab
      const printWindow = window.open(data.pdfUrl, '_blank');
      
      // Trigger print dialog after load
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
      
      toast.success('Print dialog geopend');
    }
  } catch (error) {
    console.error('Print Error:', error);
    toast.error('Kon PDF niet printen');
  }
};
```

**G. Archiveren** (`onDelete` with `is_archived` flag)
```typescript
// Problem: Delete function might do hard delete instead of soft delete
// Fix: Use is_archived flag instead of DELETE

const handleArchive = async (quoteId: string) => {
  try {
    const { error } = await supabase
      .from('quotes')
      .update({ is_archived: true })
      .eq('id', quoteId);
    
    if (error) throw error;
    
    toast.success('Offerte gearchiveerd');
    // Refresh list
    queryClient.invalidateQueries(['quotes']);
  } catch (error) {
    console.error('Archive Error:', error);
    toast.error('Kon offerte niet archiveren');
  }
};
```

**H. Herstellen** (`onRestore`)
```typescript
// Problem: Might not be connected to UI
// Fix: Implement restore from archive

const handleRestore = async (quoteId: string) => {
  try {
    const { error } = await supabase
      .from('quotes')
      .update({ is_archived: false })
      .eq('id', quoteId);
    
    if (error) throw error;
    
    toast.success('Offerte hersteld');
    queryClient.invalidateQueries(['quotes']);
  } catch (error) {
    console.error('Restore Error:', error);
    toast.error('Kon offerte niet herstellen');
  }
};
```

---

## Implementatie Plan

### Fase 1: Critical Fixes (Dag 1-2, 8 uur)

**Prioriteit 1: Offerte Maken Error** (4 uur)
- [ ] Add comprehensive error logging to `MultiBlockQuoteForm`
- [ ] Test `generate_quote_number` RPC function
- [ ] Add error boundaries around quote creation
- [ ] Improve error messages for users
- [ ] Test with different user roles
- [ ] Add loading states during quote number generation

**Files to modify**:
- `src/components/quotes/MultiBlockQuoteForm.tsx`
- `supabase/functions/generate-quote-pdf/` (test)

**Prioriteit 2: Project Klikken Error** (2 uur)
- [ ] Add null checks for `project_id` in planning items
- [ ] Verify project route exists
- [ ] Add error handling for missing projects
- [ ] Test navigation from calendar view
- [ ] Add loading indicator during navigation

**Files to modify**:
- `src/components/SimplifiedPlanningManagement.tsx`
- `src/components/planning/EnhancedMonthPlanningView.tsx`

**Prioriteit 3: Quick Wins - Basic Actions** (2 uur)
- [ ] Test and fix **Openbare Link**
- [ ] Test and fix **Goedkeuren**
- [ ] Improve error messages for all actions

**Files to modify**:
- `src/components/quotes/QuotesTable.tsx`
- `src/pages/QuotesPage.tsx`

---

### Fase 2: Enhanced Actions (Dag 3-4, 10 uur)

**Dupliceren Functionaliteit** (3 uur)
- [ ] Implement complete duplication logic
- [ ] Handle quote blocks duplication
- [ ] Generate new quote number
- [ ] Test with complex quotes
- [ ] Add user confirmation dialog

**Email Functionaliteit** (4 uur)
- [ ] Check if email edge function exists
- [ ] Test email sending with real SMTP
- [ ] Add email template selection
- [ ] Add preview before sending
- [ ] Handle email errors gracefully
- [ ] Update quote status after sending

**PDF Functionaliteit** (3 uur)
- [ ] Test `generate-quote-pdf` edge function
- [ ] Fix PDF download issues
- [ ] Fix PDF print issues
- [ ] Add progress indicators
- [ ] Handle timeouts and errors
- [ ] Test with large quotes

---

### Fase 3: Archive & Polish (Dag 5, 4 uur)

**Archivering Systeem** (2 uur)
- [ ] Verify soft delete with `is_archived`
- [ ] Add archive view/filter
- [ ] Implement restore functionality
- [ ] Test cascade effects (related invoices, etc)

**Testing & QA** (2 uur)
- [ ] Test all actions with different quote statuses
- [ ] Test with different user roles/permissions
- [ ] Test error scenarios (network failures, etc)
- [ ] Cross-browser testing
- [ ] Mobile responsiveness check

---

### Fase 4: Facturen (Dag 6, 4 uur)

Apply same fixes to invoices:
- [ ] **Invoice Actions** - Similar to quotes
- [ ] **PDF Generation** - Invoice-specific template
- [ ] **Email Sending** - Invoice emails
- [ ] **Payment Tracking** - Mark as paid
- [ ] **Duplicate Invoice** - With new number
- [ ] **Archive/Restore** - Soft delete

**Files to modify**:
- `src/components/invoices/InvoicesTable.tsx` (similar to QuotesTable)
- `src/pages/InvoicesPage.tsx`

---

## Testing Checklist

### Per Actie:

**Openbare Link**:
- [ ] Token generation werkt
- [ ] Link opent in nieuwe tab
- [ ] Public page toont quote correct
- [ ] Handtekening functie werkt

**Dupliceren**:
- [ ] Nieuwe quote number gegenereerd
- [ ] Alle velden gekopieerd
- [ ] Blocks correct gedupliceerd
- [ ] Status = 'concept'
- [ ] Navigatie naar edit page

**Goedkeuren**:
- [ ] Status update naar 'goedgekeurd'
- [ ] Timestamp wordt gezet
- [ ] Email notificatie verstuurd (optioneel)
- [ ] UI update direct zichtbaar

**Email Versturen**:
- [ ] Email configuratie check
- [ ] Template selection werkt
- [ ] Email wordt verstuurd
- [ ] Status update naar 'verzonden'
- [ ] Confirmation toast

**PDF Downloaden**:
- [ ] PDF wordt gegenereerd
- [ ] Download start automatisch
- [ ] Bestandsnaam correct
- [ ] PDF inhoud correct

**PDF Printen**:
- [ ] PDF wordt gegenereerd
- [ ] Print dialog opent
- [ ] Print werkt correct

**Archiveren**:
- [ ] Soft delete (is_archived = true)
- [ ] Verdwijnt uit normale lijst
- [ ] Verschijnt in archief
- [ ] Kan hersteld worden

**Herstellen**:
- [ ] is_archived = false
- [ ] Verschijnt weer in normale lijst
- [ ] Alle data intact

---

## Error Handling Strategie

### User-Friendly Error Messages:

```typescript
const ERROR_MESSAGES = {
  // Network errors
  'Failed to fetch': 'Geen internet verbinding. Controleer uw verbinding.',
  'Network error': 'Netwerk fout. Probeer het opnieuw.',
  
  // Auth errors
  'JWT expired': 'Sessie verlopen. Log opnieuw in.',
  'Invalid token': 'Authenticatie fout. Log opnieuw in.',
  
  // Permission errors
  'permission denied': 'U heeft geen rechten voor deze actie.',
  'access denied': 'Toegang geweigerd.',
  
  // Data errors
  'not found': 'Item niet gevonden.',
  'already exists': 'Dit item bestaat al.',
  'constraint violation': 'Ongeldige data. Controleer uw invoer.',
  
  // Edge function errors
  'Function not found': 'Server functie niet beschikbaar. Neem contact op.',
  'timeout': 'Actie duurt te lang. Probeer opnieuw.',
  
  // Default
  'default': 'Er ging iets mis. Probeer het opnieuw.',
};

function getUserFriendlyError(error: any): string {
  const errorMsg = error?.message || error?.toString() || '';
  
  for (const [key, message] of Object.entries(ERROR_MESSAGES)) {
    if (errorMsg.toLowerCase().includes(key.toLowerCase())) {
      return message;
    }
  }
  
  return ERROR_MESSAGES.default;
}
```

### Logging Strategy:

```typescript
// Development
if (process.env.NODE_ENV === 'development') {
  console.error('Detailed error:', error);
  console.log('Stack trace:', error.stack);
  console.log('Context:', context);
}

// Production - Send to error tracking
if (process.env.NODE_ENV === 'production') {
  // Send to Sentry or similar
  captureException(error, { extra: context });
}

// Always show user-friendly message
toast.error(getUserFriendlyError(error));
```

---

## Database Checks

### Verify Tables:

```sql
-- Check if required tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('quotes', 'invoices', 'email_templates', 'email_notification_rules');

-- Check quote columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'quotes'
ORDER BY ordinal_position;

-- Test RPC function
SELECT generate_quote_number();
```

### Verify Edge Functions:

```bash
# List deployed edge functions
supabase functions list

# Expected functions:
# - generate-quote-pdf
# - send-quote-email
# - (others...)

# Test function locally
supabase functions serve generate-quote-pdf

# Deploy if missing
supabase functions deploy generate-quote-pdf
```

---

## Implementation Order (Priority)

### Week 1 - Critical Path:
1. ✅ **Day 1**: Offerte maken error (4h)
2. ✅ **Day 1**: Project klikken error (2h)
3. ✅ **Day 2**: Basic actions (Openbare link, Goedkeuren) (2h)
4. **Day 2**: Email functionaliteit start (2h)
5. **Day 3**: Email functionaliteit complete (2h)
6. **Day 3**: PDF functionaliteit (3h)
7. **Day 4**: Dupliceren (3h)
8. **Day 4**: Archive/Restore (2h)
9. **Day 5**: Facturen migratie (4h)
10. **Day 5**: Final testing (2h)

### Total Effort: ~26 uur

---

## Success Criteria

✅ **Functionaliteit**:
- [ ] Alle 10 dropdown acties werken
- [ ] Geen crashes bij klikken op items
- [ ] Error messages zijn duidelijk
- [ ] Loading states overal aanwezig

✅ **User Experience**:
- [ ] Acties < 3 seconden
- [ ] Feedback op elke actie
- [ ] Confirmation voor destructieve acties
- [ ] Toast notifications werken

✅ **Reliability**:
- [ ] Error handling op elk level
- [ ] Graceful degradation
- [ ] Retry mogelijkheden
- [ ] No data loss

✅ **Testing**:
- [ ] Alle acties getest met real data
- [ ] Edge cases covered
- [ ] Different user roles tested
- [ ] Mobile tested

---

## Files Lijst (voor referentie)

### Quotes:
- `src/components/quotes/QuotesTable.tsx` - Main table component
- `src/components/quotes/MultiBlockQuoteForm.tsx` - Create/Edit form
- `src/components/quotes/MultiBlockQuotePreview.tsx` - Preview component
- `src/pages/QuotesPage.tsx` - Page container
- `src/pages/NewQuote.tsx` - New quote page
- `src/pages/EditQuote.tsx` - Edit quote page

### Invoices:
- `src/components/invoices/InvoicesTable.tsx`
- `src/pages/InvoicesPage.tsx`

### Planning:
- `src/components/SimplifiedPlanningManagement.tsx`
- `src/components/planning/EnhancedMonthPlanningView.tsx`

### Edge Functions:
- `supabase/functions/generate-quote-pdf/`
- `supabase/functions/send-quote-email/` (if exists)

---

## Next Steps

1. **Review** dit plan
2. **Prioriteer** de fixes op basis van business impact
3. **Start** met Fase 1 (Critical Fixes)
4. **Test** elke fix individueel
5. **Deploy** incrementeel (niet alles tegelijk)
6. **Monitor** errors in productie

---

## Conclusie

Dit plan zorgt voor een volledig werkend offerte & factuur systeem met alle dropdown acties functioneel. Na implementatie:

✅ Geen errors meer bij offerte maken
✅ Alle menu opties werken
✅ Duidelijke error messages
✅ Betere user experience
✅ Robuuste error handling

**Status**: 📋 Plan compleet - klaar voor implementatie

**Geschatte tijd**: 26 uur over 5 dagen
**Start**: Zodra goedgekeurd
**Prioriteit**: 🔴 HIGH - Kritieke business functionaliteit
