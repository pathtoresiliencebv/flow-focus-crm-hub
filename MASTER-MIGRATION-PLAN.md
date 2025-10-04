# 🚀 MASTER MIGRATIE PLAN: Email + Calendar Upgrade

**Project:** Flow Focus CRM Hub  
**Datum:** 3 Oktober 2025  
**Versie:** 1.0  
**Status:** PLANNING FASE

---

## 📋 **EXECUTIVE SUMMARY**

Dit document beschrijft de complete migratie van:
1. **Email Systeem:** Gmail OAuth → SMTP/IMAP configureerbaar (Roundcube-stijl)
2. **Calendar Systeem:** Custom components → FullCalendar library (Simplex theme)

**Waarom deze wijzigingen?**
- ✅ **Flexibiliteit:** Gebruikers kunnen elk email account gebruiken (niet alleen Gmail)
- ✅ **Privacy:** Geen OAuth tokens bij derden, volledige controle
- ✅ **Professionaliteit:** FullCalendar is industry standard met enterprise features
- ✅ **Maintainability:** Minder custom code, meer bewezen libraries
- ✅ **Features:** Recurring events, iCal support, drag & drop, multi-view

---

## 🎯 **DOELSTELLINGEN**

### **Email Systeem:**
1. Vervang Gmail OAuth met SMTP/IMAP configuratie
2. Behoud alle bestaande email data
3. Ondersteun meerdere providers (Gmail, Outlook, custom)
4. Veilige password encryptie
5. GEEN impact op andere CRM functionaliteiten

### **Calendar Systeem:**
1. Integreer FullCalendar library
2. Simplex theme (rood/wit clean design)
3. Behoud bestaande planning data
4. Sync met email calendar invites (iCal)
5. Administrator view: alle gebruikers
6. Monteur view: eigen planning
7. GEEN impact op project planning workflow

---

## 📦 **DELIVERABLES**

| Deliverable | Type | Status |
|-------------|------|--------|
| Email SMTP/IMAP Migration SQL | Database | ⏳ TODO |
| Calendar Events Table SQL | Database | ⏳ TODO |
| IMAP Sync Edge Function | Backend | ⏳ TODO |
| SMTP Send Edge Function | Backend | ⏳ TODO |
| Test Connection Edge Function | Backend | ⏳ TODO |
| SMTP/IMAP Setup Component | Frontend | ⏳ TODO |
| Email Presets Library | Frontend | ⏳ TODO |
| FullCalendar View Component | Frontend | ⏳ TODO |
| Simplex Theme CSS | Frontend | ⏳ TODO |
| Calendar Events Hook | Frontend | ⏳ TODO |
| Planning Management Component | Frontend | ⏳ TODO |
| User Documentation | Docs | ⏳ TODO |
| Developer Documentation | Docs | ⏳ TODO |

---

## 📅 **TIMELINE OVERZICHT**

### **Fase 1: Email Migratie (Week 1-2)**
```
Dag 1-2:   Database migratie & Edge Functions basis
Dag 3-4:   Frontend componenten (SMTP/IMAP setup)
Dag 5-6:   Password encryptie & security
Dag 7:     Cleanup oude Gmail code
Dag 8-9:   Testing & rollout
Dag 10:    Buffer voor issues
```

### **Fase 2: Calendar Migratie (Week 3-4)**
```
Dag 11:    Database setup (calendar_events table)
Dag 12:    FullCalendar installatie & basis setup
Dag 13:    Hooks & utilities
Dag 14-15: UI componenten & Simplex theme
Dag 16:    Integration & sync logica
Dag 17:    Cleanup & archiveren oude code
Dag 18-19: Testing (admin + monteur views)
Dag 20:    Buffer voor issues
```

### **Totaal: 4 weken (20 werkdagen)**

---

## 🗂️ **GEDETAILLEERDE PLANNEN**

### **Email Migratie:**
📄 Zie: [`MIGRATION-PLAN-EMAIL-TO-SMTP-IMAP.md`](./MIGRATION-PLAN-EMAIL-TO-SMTP-IMAP.md)

**Highlights:**
- Database: Add SMTP/IMAP config kolommen
- Backend: `imap-sync`, `smtp-send`, `test-email-connection` functions
- Frontend: `SMTPIMAPSetup.tsx`, email presets
- Security: AES password encryption
- Cleanup: Remove Gmail OAuth code

### **Calendar Migratie:**
📄 Zie: [`MIGRATION-PLAN-CALENDAR-TO-FULLCALENDAR.md`](./MIGRATION-PLAN-CALENDAR-TO-FULLCALENDAR.md)

**Highlights:**
- Database: Create `calendar_events` table + sync triggers
- Frontend: FullCalendar integration met Simplex theme
- Features: Drag & drop, recurring events, multi-view
- Admin: View all users calendars
- Monteur: View own calendar only

---

## ⚙️ **TECHNISCHE STACK**

### **Email:**
```yaml
Backend:
  - Deno (Edge Functions)
  - node-imap / denomailer
  - mailparser
  - crypto-js (encryption)

Frontend:
  - React + TypeScript
  - Existing email components (updated)
  - New: SMTPIMAPSetup.tsx

Database:
  - PostgreSQL (Supabase)
  - Updated: email_accounts table
```

### **Calendar:**
```yaml
Backend:
  - PostgreSQL (Supabase)
  - New: calendar_events table
  - Triggers voor auto-sync

Frontend:
  - @fullcalendar/react v6
  - @fullcalendar/daygrid
  - @fullcalendar/timegrid
  - @fullcalendar/interaction
  - @fullcalendar/rrule (recurring events)
  - Custom Simplex theme CSS
```

---

## 🔒 **SECURITY & COMPLIANCE**

### **Email Passwords:**
- ✅ AES-256 encryption
- ✅ Secret key in Supabase Vault
- ✅ Never stored in plain text
- ✅ Decrypted only in Edge Functions
- ✅ RLS policies op email_accounts

### **Calendar Data:**
- ✅ RLS policies per user
- ✅ Admin can view all (role check)
- ✅ Monteur can only view own events
- ✅ Secure event creation/updates

---

## ⚠️ **RISKS & MITIGATIE**

| Risk | Impact | Probability | Mitigatie |
|------|--------|-------------|-----------|
| Gebruikers verliezen toegang tot Gmail emails | HOOG | MEDIUM | Duidelijke communicatie + documentatie |
| IMAP sync te langzaam | MEDIUM | MEDIUM | Pagination + background jobs |
| FullCalendar licentie issues | MEDIUM | LAAG | FullCalendar is gratis voor intern gebruik |
| Data loss tijdens migratie | HOOG | LAAG | Backups + migration testing |
| Bestaande workflows breken | HOOG | MEDIUM | Extensive testing + backwards compatibility |
| Performance issues met 1000+ events | MEDIUM | MEDIUM | Lazy loading + virtualization |

---

## 🧪 **TESTING STRATEGIE**

### **Email Testing:**
```yaml
Unit Tests:
  - Password encryption/decryption
  - Email parsing
  - SMTP/IMAP connection

Integration Tests:
  - End-to-end email sync
  - Send email met attachments
  - Multi-account support

Providers Tested:
  - Gmail (met app password)
  - Outlook
  - Yahoo
  - Custom SMTP server
```

### **Calendar Testing:**
```yaml
Unit Tests:
  - Calendar event CRUD
  - Date formatting
  - Recurrence rules

Integration Tests:
  - Planning items → calendar sync
  - Drag & drop events
  - Admin multi-user view
  - Mobile responsive

Load Testing:
  - 100+ events rendering
  - Concurrent user updates
  - Real-time sync performance
```

---

## 📊 **SUCCESS METRICS**

### **Email:**
- [ ] 100% van gebruikers kan email account configureren
- [ ] < 5% error rate bij email sync
- [ ] < 30s sync time voor 100 emails
- [ ] 0 data loss incidents
- [ ] 95% user satisfaction (survey)

### **Calendar:**
- [ ] FullCalendar rendert in < 500ms (100 events)
- [ ] 100% van planning items sync naar calendar
- [ ] Drag & drop werkt smooth (< 100ms latency)
- [ ] 0 double bookings
- [ ] 90% user satisfaction (survey)

---

## 👥 **STAKEHOLDERS & COMMUNICATIE**

### **Stakeholders:**
- **End Users (Monteurs):** Nieuwe email setup, betere calendar UX
- **Administratie:** Planning management blijft werken + verbetert
- **Developers:** Minder custom code, meer maintainable
- **Management:** Modernere tech stack, betere features

### **Communicatie Plan:**
1. **Week 0:** Announce upcoming changes (email + meeting)
2. **Week 1:** Email migratie kickoff, updates elke 2 dagen
3. **Week 2:** Email testing fase, beta testers uitnodigingen
4. **Week 3:** Calendar migratie kickoff
5. **Week 4:** Full rollout + training sessies

### **Documentatie:**
- [ ] User guide: Email account setup
- [ ] User guide: Calendar features
- [ ] Admin guide: Managing multi-user planning
- [ ] Developer guide: Architecture & code
- [ ] FAQ document
- [ ] Video tutorials (optional)

---

## 🚦 **GO/NO-GO CRITERIA**

### **Email Migratie:**
✅ **GO als:**
- Database migratie succesvol
- IMAP sync werkt voor Gmail + Outlook
- SMTP send werkt
- Passwords encrypted
- 0 critical bugs in testing

❌ **NO-GO als:**
- > 5% error rate in testing
- Performance issues (> 1min sync)
- Security vulnerabilities found
- Data loss risks

### **Calendar Migratie:**
✅ **GO als:**
- FullCalendar rendert correct
- Planning sync werkt beide kanten
- Drag & drop werkt
- Admin view werkt
- Mobile responsive
- 0 critical bugs

❌ **NO-GO als:**
- Performance issues (> 2s render)
- Planning workflow breekt
- Double booking bugs
- Data integrity issues

---

## 🔄 **ROLLBACK PLAN**

### **Email:**
```sql
-- Rollback: Restore old email_accounts structure
ALTER TABLE email_accounts 
  DROP COLUMN smtp_host,
  DROP COLUMN smtp_port,
  -- ... etc
  ADD COLUMN provider TEXT,
  ADD COLUMN access_token TEXT,
  ADD COLUMN refresh_token TEXT;

-- Restore Gmail OAuth functions via git revert
```

### **Calendar:**
```sql
-- Rollback: Drop calendar_events table
DROP TABLE calendar_events CASCADE;

-- Restore old components via git revert
git revert <commit-hash>
```

**Rollback triggers:**
- Critical bugs found in production
- > 20% user complaints
- Data loss detected
- Performance degradation > 50%

---

## 📝 **CHANGE LOG**

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-10-03 | 1.0 | Initial migration plans created | Claude |

---

## 🎯 **NEXT STEPS**

### **Immediate (Volgende 24u):**
1. Review beide migratie plannen met team
2. Approve/adjust timeline
3. Setup development branch
4. Backup production database

### **Week 1 Start:**
1. Begin email database migratie
2. Start building IMAP sync function
3. Setup testing environment

### **Weekly Reviews:**
- Elke vrijdag: Progress review
- Blockers bespreken
- Timeline aanpassingen

---

## 📞 **CONTACT & SUPPORT**

**Project Lead:** [Jouw Naam]  
**Technical Lead:** [Dev Lead]  
**Documentation:** Deze repo → `/docs` folder  
**Issues:** GitHub Issues  
**Slack Channel:** `#crm-email-calendar-migration`

---

## ✅ **APPROVAL**

| Role | Name | Approval Date | Signature |
|------|------|---------------|-----------|
| Project Manager | | | |
| Technical Lead | | | |
| Product Owner | | | |

---

**🚀 Ready to begin? Start met [`MIGRATION-PLAN-EMAIL-TO-SMTP-IMAP.md`](./MIGRATION-PLAN-EMAIL-TO-SMTP-IMAP.md)!**

