# ✅ IMPLEMENTATIE CHECKLIST

**Project:** Email + Calendar Migratie  
**Use this checklist to track progress during implementation**

---

## 📧 **EMAIL MIGRATIE (Week 1-2)**

### **Database (Dag 1)**
- [ ] Backup production `email_accounts` table
- [ ] Run migration SQL: `20251003_email_smtp_imap_migration.sql`
  ```sql
  -- Add SMTP/IMAP columns
  -- Drop OAuth columns
  -- Add encryption columns
  -- Create indexes
  ```
- [ ] Verify migration success
- [ ] Test RLS policies
- [ ] Document any issues

### **Edge Functions (Dag 2-3)**
- [ ] Create `supabase/functions/imap-sync/index.ts`
  - [ ] IMAP connection logic
  - [ ] Email fetching (pagination)
  - [ ] Email parsing (mailparser)
  - [ ] Store in `email_threads` & `email_messages`
  - [ ] Handle attachments
  - [ ] Error handling
- [ ] Create `supabase/functions/smtp-send/index.ts`
  - [ ] SMTP connection logic
  - [ ] Email sending
  - [ ] Attachment support
  - [ ] Save to Sent folder
- [ ] Create `supabase/functions/test-email-connection/index.ts`
  - [ ] Test SMTP connection
  - [ ] Test IMAP connection
  - [ ] Return detailed errors
- [ ] Deploy all functions
- [ ] Test with test account

### **Security (Dag 4)**
- [ ] Setup encryption key in Supabase Secrets
  ```bash
  supabase secrets set EMAIL_ENCRYPTION_KEY="your-secure-key"
  ```
- [ ] Create `src/lib/emailEncryption.ts`
  - [ ] `encryptPassword()` function
  - [ ] `decryptPassword()` function
- [ ] Update Edge Functions to use decryption
- [ ] Test encryption end-to-end

### **Frontend Components (Dag 5-6)**
- [ ] Create `src/lib/emailPresets.ts`
  - [ ] Gmail preset
  - [ ] Outlook preset
  - [ ] Yahoo preset
  - [ ] Custom preset
- [ ] Create `src/components/email/SMTPIMAPSetup.tsx`
  - [ ] Preset selector dropdown
  - [ ] SMTP settings form
  - [ ] IMAP settings form
  - [ ] Password visibility toggle
  - [ ] Test Connection button
  - [ ] Save button
  - [ ] Validation
- [ ] Update `src/pages/Email.tsx`
  - [ ] Remove Gmail OAuth button
  - [ ] Add "Add Email Account" button
  - [ ] Show setup wizard on first visit
  - [ ] Update sync button logic
- [ ] Update `src/hooks/useEmailAccounts.ts`
  - [ ] Remove OAuth logic
  - [ ] Add `testConnection()` function
  - [ ] Add `syncAccount()` function
  - [ ] Handle SMTP/IMAP credentials

### **Cleanup (Dag 7)**
- [ ] Delete old Edge Functions from Supabase:
  - [ ] `gmail-sync`
  - [ ] `gmail-oauth-init`
  - [ ] `gmail-oauth-callback`
- [ ] Delete old frontend files:
  - [ ] `src/components/email/GmailCallbackHandler.tsx`
- [ ] Archive old docs:
  - [ ] Move `email-system/02-GMAIL-OAUTH-SETUP.md` → `_archive/`
- [ ] Update `README.md`
- [ ] Update navigation/routes

### **Testing (Dag 8-9)**
- [ ] Test Gmail setup (with app password)
- [ ] Test Outlook setup
- [ ] Test custom SMTP server
- [ ] Test email sync (IMAP)
- [ ] Test email sending (SMTP)
- [ ] Test attachments (send + receive)
- [ ] Test multi-account
- [ ] Test error handling
- [ ] Test on mobile
- [ ] Performance test (100+ emails)
- [ ] User acceptance testing

### **Documentation**
- [ ] Create `EMAIL-SMTP-IMAP-SETUP.md` (user guide)
- [ ] Create `EMAIL-DEVELOPER-GUIDE.md` (technical docs)
- [ ] Update main `README.md`
- [ ] Create FAQ document

---

## 📅 **CALENDAR MIGRATIE (Week 3-4)**

### **Database (Dag 11)**
- [ ] Backup production `planning_items` table
- [ ] Run migration SQL: `20251003_calendar_events_table.sql`
  ```sql
  -- Create calendar_events table
  -- Add RLS policies
  -- Create sync triggers
  -- Create helper functions
  ```
- [ ] Initial data migration:
  ```sql
  -- Sync existing planning_items to calendar_events
  INSERT INTO calendar_events (...)
  SELECT ... FROM planning_items ...
  ```
- [ ] Verify migration success
- [ ] Test sync triggers
- [ ] Test RLS policies

### **FullCalendar Setup (Dag 12)**
- [ ] Install packages:
  ```bash
  pnpm add @fullcalendar/core
  pnpm add @fullcalendar/react
  pnpm add @fullcalendar/daygrid
  pnpm add @fullcalendar/timegrid
  pnpm add @fullcalendar/interaction
  pnpm add @fullcalendar/list
  pnpm add @fullcalendar/rrule
  pnpm add rrule
  ```
- [ ] Create `src/components/calendar/FullCalendarView.tsx`
  - [ ] Basic setup
  - [ ] Plugin configuration
  - [ ] Event rendering
  - [ ] View switcher (month/week/day/list)
- [ ] Test basic rendering
- [ ] Create `src/components/calendar/fullcalendar-simplex-theme.css`
  - [ ] Red (#d9230f) primary color
  - [ ] Clean white backgrounds
  - [ ] Button styling
  - [ ] Event styling
  - [ ] Today highlight

### **Hooks & Utilities (Dag 13)**
- [ ] Create `src/hooks/useCalendarEvents.ts`
  - [ ] `fetchEvents()` function
  - [ ] `createEvent()` function
  - [ ] `updateEvent()` function
  - [ ] `deleteEvent()` function
  - [ ] Real-time subscription
- [ ] Test CRUD operations
- [ ] Test real-time updates
- [ ] Create event formatters
- [ ] Create event validators

### **UI Components (Dag 14-15)**
- [ ] Create `src/components/planning/PlanningManagement.tsx`
  - [ ] Header with title + actions
  - [ ] User filter (admin only)
  - [ ] FullCalendar integration
  - [ ] Event dialog trigger
- [ ] Create `src/components/planning/PlanningEventDialog.tsx`
  - [ ] Form for event details
  - [ ] Project selector
  - [ ] User/installer selector
  - [ ] Date/time pickers
  - [ ] Recurrence options
  - [ ] Save/Cancel buttons
- [ ] Update `src/pages/Index.tsx`
  - [ ] Replace old planning component
  - [ ] Use new `PlanningManagement`
- [ ] Apply Simplex theme
- [ ] Test responsiveness

### **Integration (Dag 16)**
- [ ] Update project planning views
- [ ] Update mobile planning views
- [ ] Test event creation
- [ ] Test event editing
- [ ] Test event deletion
- [ ] Test drag & drop
- [ ] Test event resize
- [ ] Test recurring events
- [ ] Test multi-user view (admin)
- [ ] Test sync with `planning_items`

### **Cleanup (Dag 17)**
- [ ] Archive old components:
  - [ ] `SimplifiedPlanningManagement.tsx` → `_LegacyPlanningManagement.tsx`
  - [ ] `EnhancedPlanningAgenda.tsx` → `_archive/`
  - [ ] `WeekCalendar.tsx` → `_archive/`
  - [ ] `MonthCalendar.tsx` → `_archive/`
- [ ] Update imports across codebase
- [ ] Remove unused dependencies
- [ ] Update documentation
- [ ] Clean up dead code

### **Testing (Dag 18-19)**
- [ ] Test as Administrator
  - [ ] View all users calendars
  - [ ] Create events for users
  - [ ] Edit events
  - [ ] Delete events
  - [ ] Filter by user
- [ ] Test as Monteur
  - [ ] View own calendar only
  - [ ] Cannot see other users
  - [ ] Can create own events
  - [ ] Can edit own events
- [ ] Test event operations:
  - [ ] Create event via date select
  - [ ] Create event via button
  - [ ] Edit event via click
  - [ ] Delete event
  - [ ] Drag to move event
  - [ ] Resize event duration
- [ ] Test views:
  - [ ] Month view
  - [ ] Week view
  - [ ] Day view
  - [ ] List view
- [ ] Test recurring events:
  - [ ] Daily recurrence
  - [ ] Weekly recurrence
  - [ ] Monthly recurrence
  - [ ] Exception dates
- [ ] Test mobile:
  - [ ] Responsive layout
  - [ ] Touch interactions
  - [ ] Event creation on mobile
- [ ] Performance testing:
  - [ ] 100+ events
  - [ ] Multiple users
  - [ ] Real-time sync
  - [ ] Measure render time
- [ ] Integration testing:
  - [ ] Planning items → calendar sync
  - [ ] Calendar events → planning items sync
  - [ ] Project assignment
  - [ ] User assignment

### **Documentation**
- [ ] Create `FULLCALENDAR-SETUP.md` (setup guide)
- [ ] Create `PLANNING-USER-GUIDE.md` (user manual)
- [ ] Update `README.md`
- [ ] Document Simplex theme customization
- [ ] Document recurring events usage

---

## 🎯 **FINAL CHECKS**

### **Pre-Production**
- [ ] All tests passing
- [ ] No critical bugs
- [ ] Performance acceptable
- [ ] Documentation complete
- [ ] Stakeholder approval
- [ ] Rollback plan ready

### **Production Deployment**
- [ ] Schedule downtime (if needed)
- [ ] Backup all data
- [ ] Deploy database migrations
- [ ] Deploy Edge Functions
- [ ] Deploy frontend code
- [ ] Verify deployment
- [ ] Monitor for errors
- [ ] Notify users

### **Post-Deployment**
- [ ] Monitor error logs (24h)
- [ ] Check performance metrics
- [ ] User feedback survey
- [ ] Fix any issues
- [ ] Document lessons learned
- [ ] Celebrate! 🎉

---

## 📊 **PROGRESS TRACKING**

| Phase | Total Tasks | Completed | Progress |
|-------|-------------|-----------|----------|
| Email Database | 5 | 0 | 0% |
| Email Backend | 3 | 0 | 0% |
| Email Security | 3 | 0 | 0% |
| Email Frontend | 4 | 0 | 0% |
| Email Cleanup | 4 | 0 | 0% |
| Email Testing | 10 | 0 | 0% |
| Calendar Database | 6 | 0 | 0% |
| Calendar Setup | 6 | 0 | 0% |
| Calendar Hooks | 5 | 0 | 0% |
| Calendar UI | 4 | 0 | 0% |
| Calendar Integration | 9 | 0 | 0% |
| Calendar Cleanup | 5 | 0 | 0% |
| Calendar Testing | 18 | 0 | 0% |
| Final Checks | 13 | 0 | 0% |
| **TOTAL** | **95** | **0** | **0%** |

---

## 🐛 **ISSUES LOG**

| Issue # | Description | Priority | Status | Assigned To | Resolution |
|---------|-------------|----------|--------|-------------|------------|
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |

---

## 📝 **NOTES & DECISIONS**

| Date | Decision | Reason | Impact |
|------|----------|--------|--------|
| 2025-10-03 | Use FullCalendar over custom | Industry standard, feature-rich | +2 days dev time |
| | | | |
| | | | |

---

**Last Updated:** 2025-10-03  
**Next Review:** Daily during implementation

