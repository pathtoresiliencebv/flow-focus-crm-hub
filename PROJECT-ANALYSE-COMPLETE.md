# 🏢 Flow Focus CRM Hub - Complete Project Analyse

**Project**: Flow Focus CRM Hub voor Kozijnenbedrijven  
**Versie**: 1.0  
**Datum**: 1 Oktober 2025  
**Auteur**: AI Architect  

---

## 📋 INHOUDSOPGAVE

1. [Project Overzicht](#project-overzicht)
2. [Gebruikersrollen & Permissies](#gebruikersrollen--permissies)
3. [CRM Functionaliteiten](#crm-functionaliteiten)
4. [Workflow: Offerte → Project → Factuur](#workflow-offerte--project--factuur)
5. [Admin Functionaliteiten](#admin-functionaliteiten)
6. [Mobiele App (Monteurs)](#mobiele-app-monteurs)
7. [Database Architectuur](#database-architectuur)
8. [Technische Stack](#technische-stack)
9. [Integraties & Services](#integraties--services)
10. [Security & Compliance](#security--compliance)

---

## 🎯 PROJECT OVERZICHT

### Doel
Een complete CRM oplossing specifiek voor kozijnenbedrijven (raaminstallatie) met:
- **Multi-language ondersteuning** (NL, EN, PL)
- **Mobiele apps** voor monteurs (iOS/Android)
- **Geautomatiseerde workflows** van offerte tot oplevering
- **Digitale documentatie** met handtekeningen
- **Real-time communicatie** tussen kantoor en monteurs

### Doelgroepen
1. **Kantoorpersoneel** (Administratie/Verkoper) - Offerte & factuurbeheer
2. **Monteurs** (Installateur) - Projectuitvoering via mobiele app
3. **Management** (Administrator) - Volledige systeemcontrole
4. **Klanten** - Offerte goedkeuring en projectvolging

---

## 👥 GEBRUIKERSROLLEN & PERMISSIES

### 1. **Administrator** 🔑
**Beschrijving**: Volledige toegang tot alle functies

#### Permissies:
- ✅ **Klanten**: View, Edit, Delete
- ✅ **Projecten**: View, Edit, Delete, Create
- ✅ **Facturen**: View, Edit, Delete
- ✅ **Gebruikers**: View, Edit, Delete
- ✅ **Planning**: Create, Manage
- ✅ **Rapporten**: View all
- ✅ **Instellingen**: Edit system settings
- ✅ **Chat**: Toegang tot alle conversaties

#### Dashboard Features:
- Complete statistieken (omzet, projecten, klanten)
- Alle projecten (ongeacht toewijzing)
- User management interface
- System configuration access
- Complete audit logs

---

### 2. **Administratie** 📋
**Beschrijving**: Kan facturen beheren en rapporten bekijken

#### Permissies:
- ✅ **Klanten**: View, Edit
- ✅ **Projecten**: View
- ✅ **Facturen**: View, Edit, Delete
- ✅ **Offertes**: Create, Edit, Send
- ✅ **Rapporten**: View financial reports
- ✅ **Chat**: Met alle gebruikers

#### Primaire Taken:
- Offertes aanmaken en versturen
- Klantcommunicatie beheren
- Facturen verwerken
- Betalingen tracken
- Projectoverzicht bijhouden

#### Dashboard Features:
- Financiële statistieken
- Openstaande facturen
- Pending offertes
- Klantoverzicht

---

### 3. **Verkoper** 💼
**Beschrijving**: Kan klanten en projecten beheren, facturen bekijken

#### Permissies:
- ✅ **Klanten**: View, Edit, Delete
- ✅ **Projecten**: View, Edit, Create
- ✅ **Offertes**: Create, Edit, Send
- ✅ **Facturen**: View only
- ✅ **Chat**: Met alle gebruikers

#### Primaire Taken:
- Nieuwe klanten acquisitie
- Offertes voorbereiden
- Projecten aanmaken
- Klantrelaties onderhouden
- Sales tracking

---

### 4. **Installateur** 🔧
**Beschrijving**: Kan projecten bekijken en bijwerken (mobile-first)

#### Permissies:
- ✅ **Projecten**: View (alleen toegewezen), Update status
- ✅ **Taken**: Complete, Update progress
- ✅ **Foto's**: Upload, Document work
- ✅ **Materialen**: Track usage, Scan receipts
- ✅ **Tijd**: Register hours
- ✅ **Chat**: Alleen met Administratie/Admins
- ❌ **Financiële data**: Geen inzage in prijzen/omzet

#### Primaire Taken:
- Projecten uitvoeren via mobile app
- Taken afvinken
- Foto's uploaden van werk
- Bonnetjes scannen
- Uren registreren
- Handtekeningen verzamelen
- Project opleveren

#### Dashboard Features (Mobile):
- **Toegewezen projecten** (alleen eigen werk)
- **Vandaag te doen** taken
- **Locaties** met navigatie
- **Materiaallijsten**
- **Communicatie** met kantoor

---

### 5. **Bekijker** 👁️
**Beschrijving**: Alleen lezen toegang

#### Permissies:
- ✅ **View only**: Klanten, Projecten, Facturen
- ❌ **Geen edit/delete** rechten
- ❌ **Geen creation** rechten

#### Use Cases:
- Stagiairs
- Externe consultants
- Temporary access

---

### 🔐 Permission Matrix

| Functionaliteit | Administrator | Administratie | Verkoper | Installateur | Bekijker |
|----------------|---------------|---------------|----------|--------------|----------|
| **Klanten Beheer** | ✅ Full | ✅ Edit | ✅ Full | ❌ | 👁️ View |
| **Offertes Maken** | ✅ | ✅ | ✅ | ❌ | 👁️ View |
| **Projecten Aanmaken** | ✅ | ❌ | ✅ | ❌ | 👁️ View |
| **Projecten Uitvoeren** | ✅ | 👁️ View | 👁️ View | ✅ Assigned | 👁️ View |
| **Facturen Beheren** | ✅ Full | ✅ Full | 👁️ View | ❌ | 👁️ View |
| **Planning Maken** | ✅ | ✅ | ✅ | 👁️ View | 👁️ View |
| **Gebruikersbeheer** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Systeeminstellingen** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Rapporten** | ✅ All | ✅ Financial | ✅ Sales | ❌ | 👁️ View |
| **Chat Alle Users** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Chat met Admins** | ✅ | ✅ | ✅ | ✅ | ❌ |

---

## 💼 CRM FUNCTIONALITEITEN

### 1. **Klantenbeheer** 👥

#### Features:
- ✅ **Klantprofielen** met complete contactgegevens
- ✅ **Bedrijfsinformatie** (BTW, KvK, adres)
- ✅ **Status tracking** (Actief, In behandeling, Inactief)
- ✅ **Project historie** per klant
- ✅ **Offerte geschiedenis**
- ✅ **Factuur overzicht**
- ✅ **Quick Add** functionaliteit

#### Componenten:
- `src/components/Customers.tsx` - Hoofdcomponent
- `src/components/CustomerForm.tsx` - Create/Edit formulier
- `src/components/CustomerDetail.tsx` - Detailweergave
- `src/components/CustomerQuickAdd.tsx` - Snelle toevoeging
- `src/components/customers/MobileCustomerCard.tsx` - Mobile view

#### Database:
- Tabel: `customers`
- Velden: name, email, phone, address, company_name, vat_number, status
- RLS: Role-based access control

---

### 2. **Offerte Systeem** 📄

#### Features:
- ✅ **Multi-block offertes** met verschillende secties
- ✅ **Automatische nummering** (OFF-YYYY-XXXXXX format)
- ✅ **BTW berekening** (21%, 9%, 0%)
- ✅ **PDF generatie** met bedrijfslogo
- ✅ **Email verzending** naar klant
- ✅ **Digitale handtekening** voor goedkeuring
- ✅ **Status tracking** (Concept, Verzonden, Goedgekeurd, Afgewezen)
- ✅ **Template systeem** voor hergebruik
- ✅ **AI text enhancement** voor professionele teksten
- ✅ **Duplicate detection** voorkomt fouten
- ✅ **Archivering** van oude offertes
- ✅ **Bijlagen** (PDF attachments)

#### Workflow Statussen:
1. **Concept** - In bewerking
2. **Verzonden** - Naar klant gestuurd
3. **Goedgekeurd** - Klant heeft getekend
4. **Afgewezen** - Klant heeft afgewezen
5. **Verlopen** - Vervaldatum bereikt
6. **Gearchiveerd** - Out of active view

#### Componenten:
- `src/components/Quotes.tsx` - Hoofdcomponent
- `src/components/quotes/MultiBlockQuoteForm.tsx` - Create/Edit form
- `src/components/quotes/MultiBlockQuotePreview.tsx` - PDF preview
- `src/components/quotes/QuotesTable.tsx` - Tabel weergave
- `src/components/quotes/SendQuoteDialog.tsx` - Verstuur dialog
- `src/components/quotes/ApproveQuoteDialog.tsx` - Goedkeuring flow
- `src/components/quotes/QuoteDuplicateChecker.tsx` - Duplicate detectie
- `src/components/quotes/FileAttachmentsManager.tsx` - Bijlagen

#### Database:
- Tabel: `quotes`
- Tabel: `quote_items` - Individuele items
- Tabel: `quote_blocks` - Multi-block structuur
- Function: `generate_quote_number()` - Met advisory lock
- RLS: Create/Edit by Administratie+, View by role

#### Edge Functions:
- `send-quote-email` - Email verzending
- `generate-quote-pdf` - PDF generatie

---

### 3. **Projectenbeheer** 🏗️

#### Features:
- ✅ **Project statussen** (Te plannen, Gepland, In uitvoering, Herkeuring, Afgerond)
- ✅ **Takenbeheer** per project
- ✅ **Monteur toewijzing**
- ✅ **Materiaal tracking**
- ✅ **Foto documentatie**
- ✅ **Tijd registratie**
- ✅ **Bonnetjes scannen**
- ✅ **Digitale oplevering** met handtekening
- ✅ **Project board** (Kanban view)
- ✅ **Koppeling met offerte**
- ✅ **Koppeling met factuur**

#### Project Statussen:
1. **Te plannen** - Aangemaakt, wacht op planning
2. **Gepland** - Monteur toegewezen + datum
3. **In uitvoering** - Monteur bezig
4. **Herkeuring** - Controle nodig
5. **Afgerond** - Voltooid en opgeleverd

#### Componenten:
- `src/components/Dashboard.tsx` - Project overzicht
- `src/components/ProjectForm.tsx` - Create/Edit
- `src/components/ProjectDetail.tsx` - Detailweergave
- `src/components/ProjectsBoard.tsx` - Kanban board
- `src/components/ProjectTasks.tsx` - Takenbeheer
- `src/components/ProjectMaterials.tsx` - Materialen
- `src/components/ProjectPersonnel.tsx` - Monteur toewijzing
- `src/components/InstallateurProjectList.tsx` - Monteur view

#### Mobile Componenten:
- `src/components/mobile/MobileProjectView.tsx`
- `src/components/mobile/MobileWorkOrder.tsx`
- `src/components/mobile/MobileProjectDelivery.tsx`
- `src/components/mobile/MobilePhotoUpload.tsx`

#### Hooks:
- `src/hooks/useProjectTasks.ts` - Takenbeheer
- `src/hooks/useProjectMaterials.ts` - Materialen
- `src/hooks/useProjectPersonnel.ts` - Personnel
- `src/hooks/useProjectDelivery.ts` - Oplevering

#### Database:
- Tabel: `projects`
- Tabel: `project_tasks`
- Tabel: `project_materials`
- Tabel: `project_photos`
- Tabel: `project_deliveries`
- RLS: Installers see only assigned projects

---

### 4. **Facturatie Systeem** 💰

#### Features:
- ✅ **Multi-block facturen** (identiek aan offerte structuur)
- ✅ **Automatische nummering** (FACT-YYYY-XXXXXX)
- ✅ **Termijn facturen** ondersteuning
- ✅ **PDF generatie** met QR code
- ✅ **Email verzending**
- ✅ **Betalingsstatus tracking** (Onbetaald, Betaald, Gedeeltelijk)
- ✅ **Stripe integratie** voor online betaling
- ✅ **Vervaldatum tracking**
- ✅ **Herinnering emails**
- ✅ **Credit nota's**
- ✅ **Archivering**

#### Invoice Statussen:
1. **Concept** - In bewerking
2. **Sent** - Verstuurd naar klant
3. **Paid** - Volledig betaald
4. **Partially Paid** - Deels betaald
5. **Overdue** - Vervallen
6. **Cancelled** - Geannuleerd

#### Componenten:
- `src/components/Invoicing.tsx` - Hoofdcomponent
- `src/components/invoicing/MultiBlockInvoiceForm.tsx` - Create/Edit
- `src/components/invoicing/MultiBlockInvoicePreview.tsx` - Preview
- `src/components/invoicing/InvoicesTable.tsx` - Tabel
- `src/components/invoicing/InvoiceFinalizationDialog.tsx` - Finalisatie
- `src/components/invoicing/SendInvoiceDialog.tsx` - Verstuur
- `src/components/invoicing/InvoicePaymentStatus.tsx` - Status
- `src/components/invoicing/ArchivedInvoicesView.tsx` - Archief

#### Services:
- `src/services/quoteToInvoiceService.ts` - Quote → Invoice conversie
- `src/services/enhancedQuoteToInvoiceService.ts` - Enhanced met termijnen
- `src/services/termInvoiceService.ts` - Termijn facturen

#### Database:
- Tabel: `invoices`
- Tabel: `invoice_items`
- Tabel: `invoice_blocks`
- Function: `generate_invoice_number()`
- RLS: Based on user role

#### Edge Functions:
- `send-invoice-email` - Email verzending
- `generate-invoice-pdf` - PDF generatie
- `process-stripe-payment` - Payment processing

---

### 5. **Planning Systeem** 📅

#### Features:
- ✅ **Week kalender** overzicht
- ✅ **Maand kalender** overzicht
- ✅ **Dag overzicht**
- ✅ **Monteur toewijzing**
- ✅ **Project koppeling**
- ✅ **Locatie informatie**
- ✅ **Status tracking** (Gepland, Bevestigd, Afgerond, Geannuleerd)
- ✅ **Google Calendar integratie**
- ✅ **Recurring events**
- ✅ **Notificaties**

#### Componenten:
- `src/components/PlanningManagement.tsx` - Hoofdcomponent
- `src/components/calendar/CalendarWeekView.tsx` - Week view
- `src/components/calendar/CalendarMonthView.tsx` - Maand view
- `src/components/calendar/CalendarDayView.tsx` - Dag view
- `src/components/WeekCalendar.tsx` - Simplified week
- `src/components/MonthCalendar.tsx` - Simplified month

#### Hooks:
- `src/hooks/usePlanningStore.ts` - Planning state
- `src/hooks/useCalendarEvents.ts` - Events
- `src/hooks/useCalendarSettings.ts` - Settings
- `src/hooks/useGoogleCalendar.ts` - Google sync

#### Database:
- Tabel: `planning_items`
- Tabel: `calendar_events`
- RLS: Users see relevant events

---

### 6. **Tijd & Materiaal Registratie** ⏱️

#### Features:
- ✅ **Uren registratie** per project
- ✅ **Pauze tracking**
- ✅ **Bonnetjes scannen** (OCR)
- ✅ **Materiaal tracking**
- ✅ **Foto's van bonnetjes**
- ✅ **Kostenoverzicht**
- ✅ **Export functionaliteit**

#### Componenten:
- `src/components/TimeRegistration.tsx` - Web interface
- `src/components/mobile/MobileTimeRegistration.tsx` - Mobile
- `src/components/Receipts.tsx` - Bonnetjes overzicht
- `src/components/mobile/MobileReceiptScanner.tsx` - Scanner
- `src/components/mobile/MobileReceiptCard.tsx` - Receipt card
- `src/components/mobile/MobileMaterialsReceipts.tsx` - Materials

#### Hooks:
- `src/hooks/useTimeRegistrations.ts` - Time tracking

#### Database:
- Tabel: `time_registrations`
- Tabel: `receipts`
- Tabel: `project_materials`

---

### 7. **Communicatie & Chat** 💬

#### Features:
- ✅ **Real-time messaging**
- ✅ **Role-based access** (Monteurs ↔ Admins only)
- ✅ **Multi-language support** met automatische vertaling
- ✅ **Taaldetectie**
- ✅ **Media uploads** (foto's, bestanden)
- ✅ **Voice messages** (toekomstig)
- ✅ **Read receipts**
- ✅ **Online status**
- ✅ **Notification system**

#### Chat Access Matrix:
| Van / Naar | Administrator | Administratie | Verkoper | Installateur |
|-----------|---------------|---------------|----------|--------------|
| **Administrator** | ✅ | ✅ | ✅ | ✅ |
| **Administratie** | ✅ | ✅ | ✅ | ✅ |
| **Verkoper** | ✅ | ✅ | ✅ | ❌ |
| **Installateur** | ✅ | ✅ | ❌ | ❌ |

#### Componenten:
- `src/components/SimpleChatPage.tsx` - Hoofdcomponent
- `src/components/chat/ChatArea.tsx` - Chat interface
- `src/components/chat/ConversationList.tsx` - Conversatie lijst
- `src/components/chat/MessageBubble.tsx` - Berichten
- `src/components/mobile/MobileChatMessages.tsx` - Mobile chat

#### Hooks:
- `src/hooks/useSimpleChat.ts` - Chat logica
- `src/hooks/useChat.ts` - Alternative chat hook

#### Services:
- `src/services/translationService.ts` - Vertaling
- `src/services/languageDetectionService.ts` - Taaldetectie
- `src/services/chatNotificationService.ts` - Notificaties

#### Database:
- Tabel: `direct_messages` (from_user_id, to_user_id, content)
- RLS: Users see only their conversations

#### Edge Functions:
- `translate-message` - Real-time vertaling
- `detect-language` - Taaldetectie

---

### 8. **Rapportages** 📊

#### Features:
- ✅ **Financiële rapporten** (omzet, kosten, winst)
- ✅ **Sales rapporten** (conversie, pipeline)
- ✅ **Project rapporten** (status, performance)
- ✅ **Monteur prestaties**
- ✅ **Klant analyses**
- ✅ **Export naar Excel/PDF**

#### Componenten:
- `src/components/Reports.tsx` - Hoofdcomponent
- `src/components/reports/FinancialReports.tsx` - Financieel
- `src/components/reports/SalesReports.tsx` - Sales
- `src/components/reports/ProjectReports.tsx` - Projecten

#### Hooks:
- `src/hooks/useReportsData.ts` - Data aggregatie

---

### 9. **Email Integratie** 📧

#### Features:
- ✅ **IMAP/SMTP sync** met email accounts
- ✅ **Email templates** voor offertes/facturen
- ✅ **Automatische emails** bij statuswijzigingen
- ✅ **Reply-to tracking**
- ✅ **Attachments** ondersteuning
- ✅ **Multi-account** support

#### Componenten:
- `src/components/Email.tsx` - Email client
- `src/components/EmailCompose.tsx` - Nieuwe email
- `src/components/EmailList.tsx` - Inbox
- `src/components/EmailDetailView.tsx` - Email view
- `src/components/EmailSettings.tsx` - Email accounts
- `src/components/EmailTemplates.tsx` - Templates

#### Hooks:
- `src/hooks/useEmailSync.ts` - Email sync
- `src/hooks/useEmailAccounts.ts` - Accounts
- `src/hooks/useEmailTemplates.ts` - Templates

#### Edge Functions:
- `sync-emails` - Email synchronisatie
- `send-email` - Email versturen

---

## 🔄 WORKFLOW: OFFERTE → PROJECT → FACTUUR

### Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    OFFERTE AANMAKEN                              │
│  📋 Administratie/Verkoper maakt offerte in systeem             │
│  • Klant selecteren/toevoegen                                   │
│  • Multi-block structuur opbouwen                               │
│  • Items toevoegen met BTW                                      │
│  • Voorwaarden & conditions                                     │
│  • AI text enhancement (optioneel)                              │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                 OFFERTE VERSTUREN                                │
│  📤 Status: Concept → Verzonden                                 │
│  • PDF genereren met logo                                       │
│  • Email naar klant met publieke link                           │
│  • Token-based access (geen login nodig)                        │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│              KLANT BEKIJKT OFFERTE                               │
│  👤 Publieke offerte pagina (/public-quote/:token)             │
│  • Responsive PDF viewer                                        │
│  • Bedrijfsinfo zichtbaar                                       │
│  • Goedkeuren/Afwijzen opties                                   │
└────────────────────┬────────────────────────────────────────────┘
                     │
           ┌─────────┴─────────┐
           │                   │
           ▼                   ▼
┌──────────────────┐   ┌──────────────────┐
│   AFWIJZEN ❌    │   │  GOEDKEUREN ✅   │
│  Status:         │   │  • Digitale      │
│  Afgewezen       │   │    handtekening  │
│  • Notificatie   │   │  • Naam invullen │
│  • Email naar    │   │  • Status:       │
│    admin         │   │    Goedgekeurd   │
└──────────────────┘   └────────┬─────────┘
                                │
                                ▼
                 ┌──────────────────────────────┐
                 │  AUTOMATISCHE CONVERSIES      │
                 │  🤖 Systeem start workflows  │
                 └──────────┬───────────────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             ▼             ▼
┌─────────────────┐  ┌─────────────┐  ┌──────────────────┐
│  PROJECT        │  │  FACTUUR    │  │  NOTIFICATIES   │
│  AANMAKEN 🏗️   │  │  CONCEPT 💰 │  │  📧 📱          │
│                 │  │             │  │                  │
│  • Kopieer data │  │  • Identieke│  │  • Email admin  │
│  • Status:      │  │    structuur│  │  • Push notify  │
│    Te plannen   │  │  • Blocks & │  │  • Dashboard    │
│  • Koppel quote │  │    items    │  │    update       │
│    ID           │  │  • Status:  │  │                  │
│                 │  │    Concept  │  │                  │
└────────┬────────┘  └──────┬──────┘  └──────────────────┘
         │                  │
         ▼                  │
┌─────────────────────────┐│
│  PROJECT TAKEN          ││
│  📝 Auto-generatie      ││
│                         ││
│  • Quote items →        ││
│    Project tasks        ││
│  • Per block een sectie ││
│  • Checkboxes voor     ││
│    monteur              ││
└────────┬────────────────┘│
         │                 │
         ▼                 │
┌─────────────────────────┐│
│  MONTEUR TOEWIJZEN      ││
│  👷 Planning            ││
│                         ││
│  • Installateur kiezen  ││
│  • Datum & tijd         ││
│  • Locatie info         ││
│  • Status: Gepland      ││
└────────┬────────────────┘│
         │                 │
         ▼                 │
┌─────────────────────────┐│
│  MOBIELE APP            ││
│  📱 Monteur interface   ││
│                         ││
│  • Project details      ││
│  • Takenlijst           ││
│  • Materiaallijst       ││
│  • Navigatie naar loc   ││
└────────┬────────────────┘│
         │                 │
         ▼                 │
┌─────────────────────────┐│
│  PROJECT UITVOERING     ││
│  🔧 In uitvoering       ││
│                         ││
│  • Taken afvinken       ││
│  • Foto's uploaden      ││
│  • Uren registreren     ││
│  • Bonnetjes scannen    ││
│  • Chat met kantoor     ││
│  • Real-time sync       ││
└────────┬────────────────┘│
         │                 │
         ▼                 │
┌─────────────────────────┐│
│  PROJECT OPLEVERING     ││
│  ✅ Herkeuring/Afgerond ││
│                         ││
│  • Alle taken checked   ││
│  • Opleverfoto's        ││
│  • Klant handtekening   ││
│  • Opmerkingen          ││
│  • Status: Afgerond     ││
└────────┬────────────────┘│
         │                 │
         │  ┌──────────────┘
         │  │
         ▼  ▼
┌─────────────────────────────────┐
│  FACTUUR FINALISATIE            │
│  💰 Administratie voltooit      │
│                                  │
│  • Project kosten toevoegen     │
│  • Extra materialen (optional)  │
│  • Meerwerk items (optional)    │
│  • Status: Concept → Sent       │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│  FACTUUR VERSTUREN              │
│  📤 Email naar klant            │
│                                  │
│  • PDF met QR code              │
│  • Payment link (Stripe)        │
│  • Vervaldatum (30 dagen)       │
│  • Status: Sent                 │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│  BETALING ONTVANGEN             │
│  ✅ Status: Paid                │
│                                  │
│  • Manual update of             │
│  • Stripe webhook               │
│  • Notificatie naar admin       │
│  • Workflow compleet!           │
└─────────────────────────────────┘
```

### Belangrijke Flow Details

#### 1. **Quote Approval → Automatic Conversions**

```typescript
// src/components/quotes/ApproveQuoteDialog.tsx
const handleApprove = async () => {
  // 1. Update quote status
  await updateQuoteStatus(quote.id, 'approved');
  
  // 2. Convert to invoice
  const invoiceId = await convertQuoteToInvoice(quote);
  
  // 3. Create project (optional)
  if (createProject) {
    await createProjectFromQuote(quote, invoiceId);
  }
  
  // 4. Send notifications
  await sendNotifications('quote_approved', quote.id);
};
```

#### 2. **Quote → Invoice Conversion**

```typescript
// src/services/quoteToInvoiceService.ts
export async function convertQuoteToInvoice(quote: Quote): Promise<string> {
  // Generate invoice number
  const invoiceNumber = await supabase.rpc('generate_invoice_number');
  
  // Create invoice
  const invoice = await supabase.from('invoices').insert({
    invoice_number: invoiceNumber,
    customer_name: quote.customer_name,
    customer_email: quote.customer_email,
    project_title: quote.project_title,
    subtotal: quote.total_amount,
    vat_amount: quote.total_vat_amount,
    total_amount: quote.total_amount + quote.total_vat_amount,
    status: 'concept',
    source_quote_id: quote.id
  });
  
  // Copy blocks structure
  for (const block of quote.blocks) {
    await supabase.from('invoice_blocks').insert({
      invoice_id: invoice.id,
      title: block.title,
      type: block.type,
      order_index: block.order_index
    });
    
    // Copy items per block
    for (const item of block.items) {
      await supabase.from('invoice_items').insert({
        invoice_id: invoice.id,
        block_id: invoiceBlock.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        vat_rate: item.vat_rate,
        total: item.total
      });
    }
  }
  
  return invoice.id;
}
```

#### 3. **Quote → Project Tasks**

```typescript
// Auto-generate tasks from quote blocks
const createProjectTasks = async (quote: Quote, projectId: string) => {
  for (const block of quote.blocks) {
    // Create section header
    await supabase.from('project_tasks').insert({
      project_id: projectId,
      title: block.title,
      type: 'section_header',
      order_index: block.order_index
    });
    
    // Create tasks from items
    for (const item of block.items) {
      await supabase.from('project_tasks').insert({
        project_id: projectId,
        title: item.description,
        quantity: item.quantity,
        completed: false,
        order_index: item.order_index
      });
    }
  }
};
```

---

## 🔧 ADMIN FUNCTIONALITEITEN

### 1. **Gebruikersbeheer** 👥

#### Features:
- ✅ **Create/Edit/Delete** gebruikers
- ✅ **Rol toewijzing** (5 rollen)
- ✅ **Permissie beheer** per rol
- ✅ **Status management** (Actief/Inactief)
- ✅ **Password reset** functionaliteit
- ✅ **Audit logging** van user actions

#### Componenten:
- `src/components/UserManagement.tsx` - Hoofdcomponent
- `src/components/CreateUserDialog.tsx` - User creation
- `src/components/RoleManagement.tsx` - Rol beheer
- `src/components/users/UserTable.tsx` - User lijst

---

### 2. **Systeem Instellingen** ⚙️

#### Features:
- ✅ **Bedrijfsinformatie** (naam, logo, adres, BTW)
- ✅ **Email configuratie** (SMTP settings)
- ✅ **Payment gateways** (Stripe)
- ✅ **Template management** (quotes, invoices, emails)
- ✅ **Notificatie voorkeuren**
- ✅ **Taal instellingen** per gebruiker
- ✅ **Calendar sync** (Google Calendar)

#### Componenten:
- `src/components/settings/SettingsPage.tsx` - Hoofdpagina
- `src/components/CompanySettingsForm.tsx` - Bedrijfsinfo
- `src/components/QuoteSettingsForm.tsx` - Quote settings
- `src/components/InvoiceSettingsForm.tsx` - Invoice settings
- `src/components/EmailSettings.tsx` - Email configuratie
- `src/components/stripe/StripeConfigManager.tsx` - Stripe setup

---

### 3. **Database Migraties** 🗄️

#### Features:
- ✅ **Migration panel** voor admin
- ✅ **Schema updates** uitvoeren
- ✅ **Rollback functionaliteit**
- ✅ **Backup before migrate**
- ✅ **Migration history**

#### Componenten:
- `src/components/admin/MigrationPanel.tsx` - Admin tool

---

### 4. **Audit Logging** 📝

#### Features:
- ✅ **All user actions** logged
- ✅ **Data changes** tracking
- ✅ **Login attempts**
- ✅ **Security events**
- ✅ **Export logs**

#### Hooks:
- `src/hooks/useAuditLogger.ts`

---

### 5. **Notificatie Systeem** 🔔

#### Features:
- ✅ **Push notifications** (web + mobile)
- ✅ **Email notifications**
- ✅ **In-app notifications**
- ✅ **Notification center**
- ✅ **Voorkeuren per user**

#### Componenten:
- `src/components/NotificationCenter.tsx`
- `src/components/NotificationsMenu.tsx`
- `src/components/PushNotificationSettings.tsx`

#### Hooks:
- `src/hooks/useNotifications.ts`
- `src/hooks/usePushSubscription.ts`

---

## 📱 MOBIELE APP (MONTEURS)

### Platform
- **Capacitor** voor native iOS/Android
- **React** frontend (gedeelde codebase met web)
- **Ionic** components voor native feel

### Hoofdfuncties

#### 1. **Project Overzicht** 🏗️

Features:
- ✅ **Toegewezen projecten** (alleen eigen werk)
- ✅ **Vandaag te doen**
- ✅ **Deze week planning**
- ✅ **Project status** visueel
- ✅ **Navigatie** naar locatie
- ✅ **Contact info** klant

Component: `src/components/mobile/MobileDashboard.tsx`

---

#### 2. **Werk Orders** 📋

Features:
- ✅ **Takenlijst** per project
- ✅ **Checkboxes** voor completion
- ✅ **Materiaallijst**
- ✅ **Instructies** van kantoor
- ✅ **Real-time sync**
- ✅ **Offline support**

Component: `src/components/mobile/MobileWorkOrder.tsx`

---

#### 3. **Camera & Foto's** 📷

Features:
- ✅ **Native camera** integratie
- ✅ **Photo annotations**
- ✅ **Before/After** foto's
- ✅ **Auto-upload** met metadata
- ✅ **Compression** voor data
- ✅ **Gallery view**

Componenten:
- `src/components/mobile/CameraCapture.tsx`
- `src/components/mobile/EnhancedCameraCapture.tsx`
- `src/components/mobile/MobilePhotoUpload.tsx`

---

#### 4. **Tijd Registratie** ⏱️

Features:
- ✅ **Start/Stop timer**
- ✅ **Pauze tracking**
- ✅ **Automatische berekening**
- ✅ **Dag overzicht**
- ✅ **Week totalen**
- ✅ **Export**

Component: `src/components/mobile/MobileTimeRegistration.tsx`

---

#### 5. **Bonnetjes Scannen** 🧾

Features:
- ✅ **Camera scan**
- ✅ **OCR text extractie** (toekomstig)
- ✅ **Categorie selectie**
- ✅ **Bedrag invoer**
- ✅ **Project koppeling**
- ✅ **Photo attachment**

Componenten:
- `src/components/mobile/MobileReceiptScanner.tsx`
- `src/components/mobile/MobileReceiptCard.tsx`
- `src/components/mobile/MobileMaterialsReceipts.tsx`

---

#### 6. **Project Oplevering** ✅

Features:
- ✅ **Completion checklist**
- ✅ **Delivery photo's**
- ✅ **Klant handtekening** (signature pad)
- ✅ **Opmerkingen veld**
- ✅ **Status update** naar afgerond
- ✅ **Notificatie** naar kantoor

Component: `src/components/mobile/MobileProjectDelivery.tsx`

---

#### 7. **Chat met Kantoor** 💬

Features:
- ✅ **Real-time messaging**
- ✅ **Alleen met admins** (security)
- ✅ **Automatische vertaling**
- ✅ **Photo sharing**
- ✅ **Push notifications**

Component: `src/components/mobile/MobileChatMessages.tsx`

---

#### 8. **Offline Functionaliteit** 📡

Features:
- ✅ **Offline storage** (IndexedDB)
- ✅ **Background sync** wanneer online
- ✅ **Conflict resolution**
- ✅ **Sync indicator**
- ✅ **Queue management**

Hooks:
- `src/hooks/useOfflineStorage.ts`
- `src/hooks/useBackgroundSync.ts`
- `src/hooks/useNetworkAware.ts`

Componenten:
- `src/components/mobile/NetworkIndicator.tsx`
- `src/components/mobile/BackgroundSyncIndicator.tsx`

---

#### 9. **Native Features** 📲

Features:
- ✅ **Biometric auth** (FaceID/TouchID)
- ✅ **GPS location** tracking
- ✅ **Push notifications**
- ✅ **Camera** native API
- ✅ **File system** access
- ✅ **Battery optimization**
- ✅ **App lifecycle** management

Hooks:
- `src/hooks/useBiometricAuth.ts`
- `src/hooks/useLocationServices.ts`
- `src/hooks/useEnhancedCamera.ts`
- `src/hooks/useBatteryOptimization.ts`
- `src/hooks/useAppLifecycle.ts`

---

#### 10. **Settings & Privacy** 🔐

Features:
- ✅ **Language preferences**
- ✅ **Notification settings**
- ✅ **Privacy controls**
- ✅ **Data retention**
- ✅ **Biometric setup**
- ✅ **Device management**

Componenten:
- `src/components/mobile/MobileSettingsPanel.tsx`
- `src/components/mobile/MobileLanguageSettings.tsx`
- `src/components/mobile/MobileSecuritySettings.tsx`
- `src/components/mobile/PrivacyDashboard.tsx`

---

## 🗄️ DATABASE ARCHITECTUUR

### Belangrijkste Tabellen

#### **profiles** (Users)
```sql
- id: UUID (PK, FK to auth.users)
- email: TEXT
- full_name: TEXT
- role: user_role ENUM
- status: user_status ENUM
- phone: TEXT
- avatar_url: TEXT
- language_preference: TEXT
- created_at: TIMESTAMP
```

#### **customers**
```sql
- id: UUID (PK)
- name: TEXT
- email: TEXT
- phone: TEXT
- address: TEXT
- company_name: TEXT
- vat_number: TEXT
- status: customer_status ENUM
- created_by: UUID (FK profiles)
- created_at: TIMESTAMP
```

#### **quotes**
```sql
- id: UUID (PK)
- quote_number: TEXT UNIQUE
- customer_name: TEXT
- customer_email: TEXT
- customer_id: UUID (FK customers)
- project_title: TEXT
- message: TEXT
- total_amount: DECIMAL
- total_vat_amount: DECIMAL
- status: TEXT (concept, sent, approved, rejected)
- valid_until: DATE
- signature_data: TEXT
- signed_at: TIMESTAMP
- created_by: UUID (FK profiles)
- created_at: TIMESTAMP
- archived: BOOLEAN
```

#### **quote_blocks**
```sql
- id: UUID (PK)
- quote_id: UUID (FK quotes)
- title: TEXT
- type: TEXT (section, optional, included)
- order_index: INTEGER
```

#### **quote_items**
```sql
- id: UUID (PK)
- quote_id: UUID (FK quotes)
- block_id: UUID (FK quote_blocks)
- description: TEXT
- quantity: DECIMAL
- unit_price: DECIMAL
- vat_rate: DECIMAL
- total: DECIMAL
- order_index: INTEGER
- type: TEXT (product, labor, heading)
```

#### **projects**
```sql
- id: UUID (PK)
- title: TEXT
- description: TEXT
- customer_id: UUID (FK customers)
- quote_id: UUID (FK quotes)
- status: project_status ENUM
- date: DATE
- value: DECIMAL
- assigned_user_id: UUID (FK profiles)
- created_by: UUID (FK profiles)
- created_at: TIMESTAMP
- completed_at: TIMESTAMP
```

#### **project_tasks**
```sql
- id: UUID (PK)
- project_id: UUID (FK projects)
- title: TEXT
- description: TEXT
- completed: BOOLEAN
- completed_at: TIMESTAMP
- completed_by: UUID (FK profiles)
- order_index: INTEGER
- type: TEXT (task, section_header)
```

#### **project_materials**
```sql
- id: UUID (PK)
- project_id: UUID (FK projects)
- name: TEXT
- quantity: DECIMAL
- unit: TEXT
- unit_price: DECIMAL
- total_cost: DECIMAL
- supplied_by: TEXT (company, customer)
- receipt_photo_url: TEXT
- added_by: UUID (FK profiles)
```

#### **invoices**
```sql
- id: UUID (PK)
- invoice_number: TEXT UNIQUE
- customer_name: TEXT
- customer_email: TEXT
- customer_id: UUID (FK customers)
- project_id: UUID (FK projects)
- source_quote_id: UUID (FK quotes)
- project_title: TEXT
- message: TEXT
- subtotal: DECIMAL
- vat_amount: DECIMAL
- total_amount: DECIMAL
- status: TEXT (concept, sent, paid, partially_paid, overdue)
- invoice_date: DATE
- due_date: DATE
- payment_term_sequence: INTEGER
- total_payment_terms: INTEGER
- created_by: UUID (FK profiles)
- created_at: TIMESTAMP
```

#### **invoice_blocks** & **invoice_items**
```sql
-- Identieke structuur als quote_blocks/quote_items
-- Voor behoud van multi-block layout
```

#### **planning_items**
```sql
- id: UUID (PK)
- project_id: UUID (FK projects)
- assigned_user_id: UUID (FK profiles)
- title: TEXT
- description: TEXT
- start_date: DATE
- end_date: DATE
- start_time: TIME
- end_time: TIME
- location: TEXT
- status: TEXT (gepland, bevestigd, afgerond, geannuleerd)
- created_by: UUID (FK profiles)
```

#### **direct_messages**
```sql
- id: UUID (PK)
- from_user_id: UUID (FK profiles)
- to_user_id: UUID (FK profiles)
- content: TEXT
- translated_content: TEXT
- original_language: TEXT
- is_translated: BOOLEAN
- read: BOOLEAN
- read_at: TIMESTAMP
- created_at: TIMESTAMP
```

#### **time_registrations**
```sql
- id: UUID (PK)
- project_id: UUID (FK projects)
- user_id: UUID (FK profiles)
- date: DATE
- start_time: TIME
- end_time: TIME
- break_minutes: INTEGER
- total_hours: DECIMAL
- description: TEXT
```

#### **receipts**
```sql
- id: UUID (PK)
- project_id: UUID (FK projects)
- user_id: UUID (FK profiles)
- amount: DECIMAL
- category: TEXT
- description: TEXT
- receipt_date: DATE
- photo_url: TEXT
- created_at: TIMESTAMP
```

### Row Level Security (RLS)

Alle tabellen hebben RLS policies gebaseerd op user role:

```sql
-- Example voor projects tabel
CREATE POLICY "Administrators see all projects"
ON projects FOR ALL
TO authenticated
USING (public.get_user_role(auth.uid()) = 'Administrator');

CREATE POLICY "Installers see assigned projects"
ON projects FOR SELECT
TO authenticated
USING (
  assigned_user_id = auth.uid() 
  AND public.get_user_role(auth.uid()) = 'Installateur'
);

CREATE POLICY "Users can edit their assigned projects"
ON projects FOR UPDATE
TO authenticated
USING (assigned_user_id = auth.uid());
```

---

## 🛠️ TECHNISCHE STACK

### Frontend
- **React 18** met TypeScript
- **Vite** build tool
- **Tailwind CSS** + **Shadcn/ui** components
- **React Router** voor routing
- **Tanstack Query** voor data fetching (optional)
- **Zustand** voor state management (optional)

### Backend
- **Supabase** (PostgreSQL + Auth + Storage + Realtime)
- **Row Level Security** voor data access
- **Database Functions** (generate_quote_number, etc)
- **Database Triggers** voor automation

### Mobile
- **Capacitor** voor native iOS/Android
- **Ionic** components
- **Native APIs**: Camera, Geolocation, Biometric, Push

### Edge Functions (Serverless)
- **Deno** runtime
- **TypeScript**
- 34 edge functions voor:
  - Email verzending
  - PDF generatie
  - Payment processing
  - Translation services
  - Webhook handling

### Storage
- **Supabase Storage** voor files/photos
- **IndexedDB** voor offline mobile storage
- **LocalStorage** voor user preferences

### Real-time
- **Supabase Realtime** voor:
  - Chat messages
  - Project updates
  - Notification delivery
  - Planning changes

---

## 🔌 INTEGRATIES & SERVICES

### 1. **Email Services**
- **Resend** voor transactional emails
- **IMAP/SMTP** sync met email accounts
- **Email templates** systeem

### 2. **Payment Processing**
- **Stripe** voor online betalingen
- **Webhook** integratie voor payment confirmations
- **QR codes** op facturen

### 3. **Translation**
- **Google Translate API** voor automatische vertaling
- **Language detection** in chat
- **Multi-language UI** (i18n)

### 4. **Calendar**
- **Google Calendar** sync
- **iCal export**
- **Recurring events** support

### 5. **AI Services**
- **OpenAI GPT-4o-mini** voor text enhancement
- **Smart replies** in chat (toekomstig)
- **OCR** voor bonnetjes (toekomstig)

### 6. **Push Notifications**
- **Firebase Cloud Messaging** (FCM)
- **Web Push API** voor web
- **Native notifications** voor mobile

### 7. **Analytics** (optioneel)
- User behavior tracking
- Performance monitoring
- Error reporting

---

## 🔐 SECURITY & COMPLIANCE

### Authenticatie
- ✅ **Supabase Auth** met email/password
- ✅ **Biometric auth** op mobile (FaceID/TouchID)
- ✅ **Multi-factor auth** (optioneel)
- ✅ **Password reset** flow
- ✅ **Session management**

### Autorisatie
- ✅ **Row Level Security** (RLS) in database
- ✅ **Role-based permissions** (5 rollen)
- ✅ **API-level checks** in Edge Functions
- ✅ **Frontend route guards**

### Data Protection
- ✅ **Encryption at rest** (Supabase)
- ✅ **Encryption in transit** (HTTPS)
- ✅ **Secure file uploads**
- ✅ **Data retention policies**
- ✅ **GDPR compliance** features
- ✅ **Privacy controls** per user

### Audit & Compliance
- ✅ **Audit logging** van alle actions
- ✅ **Data export** functionaliteit
- ✅ **Compliance reporting**
- ✅ **Security monitoring**

---

## 📊 KEY METRICS & KPIs

### Business Metrics
- **Quote Conversion Rate**: Goedgekeurd / Verzonden
- **Average Project Value**: Totale waarde / Aantal projecten
- **Time to Completion**: Start → Oplevering
- **Customer Satisfaction**: Rating na oplevering
- **Revenue per Monteur**: Omzet / FTE

### Operational Metrics
- **Quote Response Time**: Aanvraag → Verzending
- **Project Lead Time**: Goedkeuring → Start
- **On-time Delivery**: Afgerond binnen deadline
- **Material Cost Accuracy**: Geplanned vs Werkelijk
- **Overtime Hours**: Extra uren buiten planning

### System Metrics
- **Mobile App Adoption**: Actieve monteurs / Totaal
- **Offline Sync Success**: Successful syncs / Total
- **Email Delivery Rate**: Delivered / Sent
- **API Response Time**: Average latency
- **Error Rate**: Errors / Total requests

---

## 🎯 SUCCESS FACTORS

### ✅ **Geautomatiseerde Workflows**
Quote goedkeuring triggert automatisch project + factuur aanmaak → **Zero manual steps**

### ✅ **Mobile-First voor Monteurs**
Monteurs werken volledig via app → **No paper, real-time updates**

### ✅ **Consistente Data Structuur**
Identieke block structure in Quote → Invoice → Tasks → **No transcription errors**

### ✅ **Multi-Language Support**
Automatische vertaling in chat → **Werk met internationale monteurs**

### ✅ **Digital Documentation**
Foto's, handtekeningen, bonnetjes → **Complete audit trail**

### ✅ **Offline Capability**
Monteurs werken zonder internet → **Sync wanneer online**

### ✅ **Role-Based Security**
Monteurs zien geen financiële data → **Data protection**

### ✅ **Real-Time Communication**
Chat tussen kantoor en monteurs → **Direct problem solving**

---

## 🚀 TOEKOMSTIGE UITBREIDINGEN

### Phase 1 (Q4 2025)
- [ ] **OCR voor bonnetjes** - Automatische data extractie
- [ ] **Voice messages** in chat
- [ ] **Advanced analytics** dashboard
- [ ] **Customer portal** voor projectvolging

### Phase 2 (Q1 2026)
- [ ] **AI-powered scheduling** - Smart planning algoritme
- [ ] **Inventory management** - Materiaal voorraad tracking
- [ ] **Subcontractor management** - Externe partijen
- [ ] **Advanced reporting** - Custom rapportage builder

### Phase 3 (Q2 2026)
- [ ] **IoT integration** - Smart devices in projecten
- [ ] **Predictive maintenance** - Nazorg planning
- [ ] **CRM automation** - Marketing automation
- [ ] **API voor third-party** - Externe integraties

---

## 📝 CONCLUSIE

**Flow Focus CRM Hub** is een **complete, moderne CRM oplossing** specifiek ontworpen voor kozijnenbedrijven met:

✅ **Volledige workflow automatisering** van offerte tot oplevering  
✅ **Mobile-first approach** voor monteurs in het veld  
✅ **Multi-language support** voor internationale teams  
✅ **Role-based security** met granulaire permissies  
✅ **Real-time synchronisatie** tussen kantoor en veld  
✅ **Offline capabilities** voor werk zonder internet  
✅ **Digital documentation** met handtekeningen en foto's  
✅ **Professional communication** via geautomatiseerde emails  

### Sterke Punten:
1. **Zero Manual Data Entry** - Automatische conversies voorkomen fouten
2. **Real-Time Visibility** - Management ziet altijd project status
3. **Mobile Efficiency** - Monteurs werken sneller zonder papier
4. **Professional Image** - Digitale processen verhogen klantvertrouwen
5. **Scalable Architecture** - Groei mee met bedrijf

### Uitdagingen:
1. **User Adoption** - Training nodig voor monteurs
2. **Data Migration** - Bestaande data overzetten
3. **Internet Dependency** - Offline sync moet robuust zijn
4. **Complexity** - Veel features vereisen goede UX

### Aanbevelingen:
1. **Phased Rollout** - Start met kernfuncties
2. **User Training** - Investeer in goede onboarding
3. **Feedback Loops** - Regelmatige user feedback sessions
4. **Performance Monitoring** - Track system metrics
5. **Continuous Improvement** - Iteratieve development

---

**Documentatie gegenereerd op**: 1 Oktober 2025  
**Versie**: 1.0  
**Status**: ✅ Complete Analyse  
**Contact**: AI Architect

