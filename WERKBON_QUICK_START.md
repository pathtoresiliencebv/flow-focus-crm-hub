# 📱 Werkbon Systeem - Quick Start Guide

## 🎯 Voor Monteurs

### Project Starten

1. **Open de app** → Login met je monteur account

2. **Ga naar Dashboard** → Zie je toegewezen projecten

3. **Selecteer project** → Klik op het project om te starten

4. **Start Project:**
   - Druk op "Project Starten"
   - GPS locatie wordt automatisch opgeslagen
   - Timer start automatisch

### Tijdens het Werk

**Foto's maken:**
- Druk op 📷 Camera icon
- Maak foto's van:
  - **Voor:** Situatie voor aanvang
  - **Tijdens:** Werk in uitvoering
  - **Na:** Eindresultaat
  - **Detail:** Close-ups van details
  - **Overzicht:** Totaal overzicht

**Tips:**
- Foto's worden automatisch gecomprimeerd
- Upload direct voor beste kwaliteit
- Minimaal 3 foto's per project

### Project Afronden

**7-Stap Wizard:**

#### Stap 1: Project Info
- Bevestig project details
- Check klantgegevens
- Druk "Volgende"

#### Stap 2: Foto's Uploaden
- Upload minimaal 3 foto's
- Categoriseer elke foto (voor/tijdens/na)
- Wacht tot alle uploads compleet zijn

#### Stap 3: Werk Details
- Vul uit "Uitgevoerd werk"
- Voeg materialen toe (optioneel)
- Noteer bijzonderheden

#### Stap 4: Klant Tevredenheid
- Vraag klant om beoordeling
- Laat klant sterren geven (1-5)
- Voeg opmerkingen toe indien nodig

#### Stap 5: Handtekeningen
- **Monteur handtekening:** Jij tekent
- **Klant handtekening:** Klant tekent voor akkoord
- Gebruik vinger of stylus

#### Stap 6: Review
- Controleer alle ingevoerde gegevens
- Check of alle foto's aanwezig zijn
- Verifieer handtekeningen

#### Stap 7: Verzenden
- Druk "Werkbon Genereren"
- PDF wordt automatisch aangemaakt
- Email wordt naar klant gestuurd
- Je krijgt bevestiging

### Troubleshooting

**Camera werkt niet?**
- Check app permissies in instellingen
- Herstart de app
- Check of camera van je device werkt

**GPS werkt niet?**
- Enable locatie services
- Ga naar buiten (GPS werkt slecht binnen)
- Herstart de app

**Foto's uploaden niet?**
- Check internet verbinding
- Probeer WiFi i.p.v. mobiel data
- Wacht even en probeer opnieuw

**Kan handtekening niet maken?**
- Gebruik vinger, niet stylus (tenzij iPad)
- Teken langzaam
- Druk "Clear" om opnieuw te beginnen

---

## 🖥️ Voor Administratie

### Werkbonnen Bekijken

1. **Dashboard** → "Projecten"

2. **Filter op status:**
   - Compleet: Project afgerond, werkbon gemaakt
   - Verzonden: Email naar klant verstuurd
   - Goedgekeurd: Klant heeft akkoord gegeven

3. **Klik op project** → Zie details:
   - Alle foto's
   - Uitgevoerd werk
   - Klant tevredenheid
   - Handtekeningen
   - Tijdsregistratie

### Werkbon PDF Downloaden

1. **Ga naar project details**

2. **Scroll naar beneden** → "Werkbon"

3. **Klik "Download PDF"**

4. PDF opent in nieuwe tab

5. Print of sla op naar computer

### Email Opnieuw Versturen

Als klant email niet heeft ontvangen:

1. **Ga naar project**

2. **Klik "Email Opnieuw Verzenden"**

3. Bevestig email adres

4. Email wordt opnieuw verstuurd

### Statistieken

**Dashboard geeft overzicht:**
- Aantal afgeronde projecten deze week/maand
- Gemiddelde klant tevredenheid
- Aantal werkbonnen gegenereerd
- Monteur performance

---

## ⚙️ Voor Developers

### Local Testing

```bash
# Start Supabase locally
supabase start

# Serve Edge Functions locally
supabase functions serve

# Test generate-work-order function
curl -X POST 'http://localhost:54321/functions/v1/generate-work-order' \
  -H "Authorization: Bearer ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"completionId": "test-id"}'

# Test send-completion-email function
curl -X POST 'http://localhost:54321/functions/v1/send-completion-email' \
  -H "Authorization: Bearer ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "completionId": "test",
    "customerEmail": "test@test.com",
    "customerName": "Test",
    "projectTitle": "Test",
    "monteurName": "Test",
    "completionDate": "2025-01-15",
    "customerSatisfaction": 5,
    "workPerformed": "Test",
    "pdfUrl": "https://test.com/test.pdf"
  }'
```

### Deploy Functions

```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy generate-work-order
supabase functions deploy send-completion-email

# Check deployment status
supabase functions list
```

### Monitor Functions

```bash
# View logs
supabase functions logs generate-work-order
supabase functions logs send-completion-email

# Follow logs (live)
supabase functions logs generate-work-order --follow
```

### Database Queries

```sql
-- View all completions
SELECT 
  pc.*,
  p.title as project_title,
  c.full_name as customer_name,
  pr.full_name as installer_name
FROM project_completions pc
LEFT JOIN projects p ON pc.project_id = p.id
LEFT JOIN customers c ON p.customer_id = c.id
LEFT JOIN profiles pr ON pc.installer_id = pr.id
ORDER BY pc.created_at DESC;

-- View completion photos
SELECT 
  cp.*,
  pc.project_id
FROM completion_photos cp
LEFT JOIN project_completions pc ON cp.completion_id = pc.id
ORDER BY cp.uploaded_at DESC;

-- Get completion statistics
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_completions,
  AVG(customer_satisfaction) as avg_satisfaction
FROM project_completions
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Find completions without PDF
SELECT * FROM project_completions 
WHERE pdf_url IS NULL 
AND status = 'completed';

-- Find completions without email sent
SELECT * FROM project_completions 
WHERE email_sent_at IS NULL 
AND status = 'completed'
AND pdf_url IS NOT NULL;
```

### Testing Checklist

**Before deploying:**
- [ ] Test camera on iOS device
- [ ] Test camera on Android device
- [ ] Test GPS location capture
- [ ] Test photo upload (check actual files in bucket)
- [ ] Test photo compression (verify file sizes reduced)
- [ ] Test signature canvas
- [ ] Test PDF generation (check actual PDF file)
- [ ] Test email delivery (receive actual email)
- [ ] Test offline scenario (airplane mode)
- [ ] Test slow network (throttle connection)
- [ ] Test with large photos (10MB+)
- [ ] Test with many photos (20+)
- [ ] Verify all steps in wizard work
- [ ] Check error messages are helpful
- [ ] Test "back" navigation in wizard
- [ ] Verify data persistence on refresh

**After deploying:**
- [ ] Monitor function invocations
- [ ] Check error rates
- [ ] Review function logs
- [ ] Monitor storage usage
- [ ] Check PDF generation success rate
- [ ] Check email delivery rate
- [ ] Monitor API costs (PDF service, SMTP)
- [ ] Get user feedback from monteurs

---

## 📞 Support Contacts

**Technical Issues:**
- Developer: [your-email@domain.com]
- Supabase Support: https://supabase.com/support

**App Issues:**
- Admin: [admin-email@domain.com]
- Phone: +31 (0)20 123 4567

**Feedback & Suggestions:**
- Create GitHub issue
- Email: feedback@smansbv.nl

---

## 🎓 Training Resources

**Voor Monteurs:**
- Video tutorial: [Link to video]
- PDF handleiding: [Link to PDF]
- FAQ: [Link to FAQ]

**Voor Administratie:**
- Dashboard walkthrough: [Link]
- Rapportage guide: [Link]
- Troubleshooting: [Link]

---

## 🚀 Tips & Tricks

**Voor Monteurs:**

1. **Maak foto's tijdens het werk**
   - Upload ze direct, niet aan het eind
   - Zo ben je sneller klaar bij afronden

2. **Check GPS locatie**
   - Doe dit buiten, niet binnen
   - Zorg dat locatie services aan staan

3. **Bereid handtekening voor**
   - Leg uit aan klant wat ze tekenen
   - Laat ze eerst oefenen op papier

4. **Vul werk details volledig in**
   - Hoe meer details, hoe beter
   - Klant waardeert goede communicatie

5. **Check data verbinding**
   - Gebruik WiFi van klant indien mogelijk
   - Mobiel data werkt ook, maar trager

**Voor Administratie:**

1. **Monitor dagelijks**
   - Check nieuwe werkbonnen elke dag
   - Reageer snel op issues

2. **Backup PDFs**
   - Download belangrijke werkbonnen
   - Bewaar ze apart voor archief

3. **Analyseer tevredenheid**
   - Track klant tevredenheid per monteur
   - Geef feedback aan monteurs

4. **Check bounced emails**
   - Controleer of emails aankomen
   - Update email adressen indien nodig

---

## ✅ Quick Reference

| Actie | Locatie | Tijd |
|-------|---------|------|
| Project starten | Mobile App → Dashboard → Project | 30s |
| Foto maken | Mobile App → Camera icon | 10s/foto |
| Foto uploaden | Automatisch na maken | 5s/foto |
| Project afronden | Mobile App → "Afronden" knop | 5-10min |
| PDF bekijken | Desktop → Project → "Werkbon" | Instant |
| Email opnieuw sturen | Desktop → Project → "Opnieuw verzenden" | 30s |

---

**Klaar om te beginnen? Start je eerste project! 🚀**

