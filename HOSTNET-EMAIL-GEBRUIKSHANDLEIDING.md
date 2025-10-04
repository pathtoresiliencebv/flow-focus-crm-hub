# 📧 Hostnet Email Setup - Gebruikershandleiding

**Voor:** Alle gebruikers van Flow Focus CRM  
**Doel:** Email account configureren met Hostnet SMTP/IMAP servers

---

## ✅ **GOED NIEUWS: Email systeem is WERKEND!**

Het email systeem is volledig geïmplementeerd en klaar voor gebruik. Er is al een Hostnet account geconfigureerd: **info@smansonderhoud.nl**

---

## 🎯 **WAT KAN JE NU?**

### 1. **Emails Ontvangen (IMAP)**
- ✅ Emails worden gesynchroniseerd vanuit je Hostnet mailbox
- ✅ Klik op de "Synchroniseren" knop om emails op te halen
- ✅ Emails worden lokaal opgeslagen voor snelle toegang

### 2. **Emails Versturen (SMTP)**  
- ✅ Klik op "Nieuw bericht" om een email te versturen
- ✅ Emails worden verzonden via Hostnet SMTP server
- ✅ Ondersteuning voor CC, BCC en HTML formatting

### 3. **Meerdere Accounts**
- ✅ Voeg meerdere email accounts toe per gebruiker
- ✅ Elke gebruiker kan zijn eigen Hostnet email configureren
- ✅ Ongeacht gebruikersrol (Administrator, Administratie, Monteur)

---

## 🚀 **HOE GEBRUIK JE HET SYSTEEM?**

### **Stap 1: Ga naar Email**
1. Log in op Flow Focus CRM
2. Klik op **"Postvak IN"** in de linker sidebar
3. Je ziet nu de email interface

### **Stap 2: Synchroniseer Je Emails**
1. Klik op de **Synchroniseren** knop (⟳ icoon rechtsboven)
2. Het systeem haalt de laatste emails op van Hostnet
3. Je ziet nu je emails in de lijst

### **Stap 3: Lees Een Email**
1. Klik op een email in de lijst
2. De volledige inhoud wordt getoond rechts
3. Je kunt reageren, doorsturen of archiveren

### **Stap 4: Verstuur Een Email**
1. Klik op **"Nieuw bericht"** (rechtsboven)
2. Vul in:
   - **Aan:** Ontvanger email adres
   - **Onderwerp:** Onderwerp van de email
   - **Bericht:** Je bericht (tekst wordt automatisch geformatteerd)
3. Klik **"Verzenden"**
4. De email wordt via Hostnet SMTP verzonden

---

## 🔧 **NIEUW EMAIL ACCOUNT TOEVOEGEN**

### **Voor Hostnet Accounts:**

1. Klik op het **Instellingen** icoon (⚙️) rechtsboven
2. De SMTP/IMAP Setup wizard opent
3. Klik op **"Aangepast"** (omdat Hostnet niet in de presets staat)

#### **Vul de gegevens in:**

**Email Adres:**
```
jouw-email@jouw-domein.nl
```

**Weergave Naam (optioneel):**
```
Jouw Naam
```

#### **SMTP Tab (voor VERZENDEN):**
- **Server:** `smtp.hostnet.nl`
- **Poort:** `587`
- **Gebruikersnaam:** Je volledige email adres
- **Wachtwoord:** Je Hostnet email wachtwoord
- **Versleuteling:** `TLS`

#### **IMAP Tab (voor ONTVANGEN):**
- **Server:** `imap.hostnet.nl`
- **Poort:** `993`
- **Gebruikersnaam:** Je volledige email adres
- **Wachtwoord:** Hetzelfde wachtwoord als SMTP
- **Versleuteling:** `SSL`

4. Klik **"Test Verbinding"** om te controleren of alles werkt
5. Als de test slaagt, klik **"Opslaan & Verbinden"**

---

## 💡 **BELANGRIJKE INFORMATIE**

### **Wachtwoord Beveiliging**
- ✅ Je wachtwoord wordt **veilig versleuteld** opgeslagen (AES-256 encryptie)
- ✅ Alleen jij hebt toegang tot je email account
- ✅ Wachtwoorden worden NOOIT onversleuteld opgeslagen

### **Email Synchronisatie**
- 📧 Emails worden **NIET automatisch gesynchroniseerd**
- 🔄 Klik op de Synchroniseren knop om de laatste emails op te halen
- 💾 Emails worden lokaal opgeslagen in de database voor snelle toegang
- ⏱️ Standaard worden de laatste 200 emails opgehaald

### **Compatibiliteit**
- ✅ **Hostnet email servers** (smtp.hostnet.nl / imap.hostnet.nl)
- ✅ **Gmail** (met App Password)
- ✅ **Outlook/Office 365**
- ✅ **Yahoo Mail**
- ✅ **Elke SMTP/IMAP server**

---

## 🐛 **VEELVOORKOMENDE PROBLEMEN**

### **"Email account not found"**
**Oplossing:** Je hebt nog geen email account geconfigureerd.
- Klik op het Instellingen icoon en voeg een account toe

### **"SMTP authentication failed"**
**Oplossing:** Je wachtwoord is incorrect.
- Check je Hostnet wachtwoord
- Voor Gmail: gebruik een App Password (niet je normale wachtwoord)

### **"Connection refused" / "Connection timeout"**
**Oplossing:** Firewall of netwerkprobleem.
- Check of je internet verbinding werkt
- Controleer of IMAP/SMTP enabled is in je Hostnet account
- Probeer een andere netwerk verbinding

### **"Emails worden niet weergegeven"**
**Oplossing:** 
- Klik op de Synchroniseren knop
- Check of je email account status = "connected" is
- Ga naar Instellingen → Test verbinding

### **"Verzonden email komt niet aan"**
**Oplossing:**
- Check je Sent folder in Hostnet webmail
- Controleer of de SMTP instellingen correct zijn
- Test de verbinding opnieuw

---

## 📞 **SUPPORT**

Als je problemen hebt:
1. Check eerst de FAQ hierboven
2. Test je verbinding via Instellingen → Test Verbinding
3. Neem contact op met de administrator
4. Check de Supabase Edge Function logs voor technische details

---

## 🎉 **SUCCESS!**

Je bent nu klaar om emails te verzenden en ontvangen via het CRM systeem!

**Tips:**
- 💡 Gebruik de search functie om snel emails te vinden
- ⭐ Markeer belangrijke emails met een ster
- 📁 Organiseer je emails met folders
- 🔄 Synchroniseer regelmatig om nieuwe emails binnen te halen

---

**Built with ❤️ for SMANS CRM**
*Laatste update: 4 Oktober 2025*

