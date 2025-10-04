# 📧 EMAIL ACCOUNT SETUP - GEBRUIKERSHANDLEIDING

**Voor:** Eindgebruikers van Flow Focus CRM  
**Doel:** Email account configureren met SMTP/IMAP

---

## 🎯 **WAT IS ER NIEUW?**

Je CRM heeft een nieuw email systeem! Je kan nu:
- ✅ **Elk email account gebruiken** (Gmail, Outlook, Yahoo, etc.)
- ✅ **Meerdere accounts beheren** in één interface
- ✅ **Volledige controle** over je email instellingen
- ✅ **Betere privacy** - geen OAuth tokens bij derden

---

## 📋 **STAP-VOOR-STAP: EMAIL ACCOUNT TOEVOEGEN**

### **STAP 1: Open Email Setup**

1. Log in op Flow Focus CRM
2. Klik op **"Postvak IN"** in de linker sidebar
3. Als je nog geen email account hebt, zie je automatisch de setup wizard

OF:

Als je al accounts hebt:
1. Klik op **"+ Email Account Toevoegen"** (rechts boven)

---

### **STAP 2: Selecteer Je Provider**

Kies je email provider uit de lijst:

<kbd>Gmail</kbd> <kbd>Outlook</kbd> <kbd>Yahoo</kbd> <kbd>iCloud</kbd> <kbd>Zoho</kbd> <kbd>Aangepast</kbd>

**💡 TIP:** Als je Gmail kiest, worden alle instellingen automatisch ingevuld!

---

### **STAP 3: Voer Je Gegevens In**

#### **Email Adres:**
Voer je volledige email adres in:
```
bijvoorbeeld: naam@bedrijf.nl
```

#### **Weergave Naam (optioneel):**
Hoe je naam getoond moet worden bij verzonden emails:
```
bijvoorbeeld: Jan Smans
```

---

### **STAP 4: Server Instellingen**

Er zijn twee tabs: **SMTP** (verzenden) en **IMAP** (ontvangen)

#### **SMTP Tab (Voor verzenden):**
- **Server:** Wordt automatisch ingevuld als je provider hebt geselecteerd
- **Poort:** Meestal 587 (TLS) of 465 (SSL)
- **Gebruikersnaam:** Meestal je email adres
- **Wachtwoord:** Zie hieronder 👇
- **Versleuteling:** TLS (aanbevolen)

#### **IMAP Tab (Voor ontvangen):**
- **Server:** Wordt automatisch ingevuld
- **Poort:** Meestal 993 (SSL) of 143 (TLS)
- **Gebruikersnaam:** Meestal je email adres
- **Wachtwoord:** Hetzelfde als SMTP
- **Versleuteling:** SSL (aanbevolen)

---

## 🔐 **WACHTWOORDEN: BELANGRIJK!**

### **Voor Gmail gebruikers: 📧**

**Je MOET een App-specifiek wachtwoord gebruiken, NIET je normale Gmail wachtwoord!**

#### **Hoe maak je een App-wachtwoord aan:**

1. Ga naar https://myaccount.google.com
2. Klik op **"Beveiliging"** in het linkermenu
3. Zorg dat **"Verificatie in twee stappen"** is ingeschakeld
   - Niet ingeschakeld? Doe dit eerst!
4. Scroll naar **"App-wachtwoorden"**
5. Klik op **"App-wachtwoorden"**
6. Selecteer **"Mail"** en **"Ander (Aangepaste naam)"**
7. Voer in: **"Flow Focus CRM"**
8. Klik **"Genereren"**
9. Kopieer het 16-cijferige wachtwoord (zonder spaties!)
10. Plak dit in het CRM (SMTP én IMAP wachtwoord)

**Voorbeeld App-wachtwoord:**
```
abcd efgh ijkl mnop
```
Voer in als: `abcdefghijklmnop` (zonder spaties)

📹 **Video tutorial:** [Link naar video]

---

### **Voor Outlook/Office365 gebruikers: 📧**

Je kan je **normale Outlook wachtwoord** gebruiken.

**Als je 2-factor authenticatie hebt:**
1. Ga naar https://account.microsoft.com
2. Klik op **"Beveiliging"**
3. Ga naar **"Geavanceerde beveiligingsopties"**
4. Onder **"App-wachtwoorden"** klik **"Nieuw app-wachtwoord maken"**
5. Kopieer het wachtwoord en gebruik in CRM

---

### **Voor Yahoo Mail gebruikers: 📧**

Yahoo vereist ook een App-wachtwoord:

1. Ga naar https://login.yahoo.com/account/security
2. Klik op **"App-wachtwoorden genereren"**
3. Selecteer **"Andere app"**
4. Voer in: **"Flow Focus CRM"**
5. Klik **"Genereren"**
6. Kopieer en gebruik in CRM

---

### **Voor iCloud Mail gebruikers: 📧**

iCloud vereist een App-specifiek wachtwoord:

1. Ga naar https://appleid.apple.com
2. Log in met je Apple ID
3. Ga naar **"Beveiliging"**
4. Onder **"App-specifieke wachtwoorden"** klik **"Genereer wachtwoord"**
5. Voer label in: **"Flow Focus CRM"**
6. Klik **"Aanmaken"**
7. Kopieer en gebruik in CRM

---

### **Voor Aangepaste Providers: 📧**

Vraag je email provider naar:
- SMTP server adres en poort
- IMAP server adres en poort
- Gebruikersnaam
- Wachtwoord
- Of SSL/TLS encryptie vereist is

Deze info vind je meestal in de helpdesk/documentatie van je provider.

---

## 🧪 **STAP 5: Test Je Verbinding**

**BELANGRIJK:** Test altijd je verbinding voordat je opslaat!

1. Klik op **"Test Verbinding"** knop
2. Wacht 5-10 seconden
3. Zie je een **groen vinkje** ✅? Perfect!
4. Zie je een **rood kruis** ❌? Check je instellingen

**Bij een groene test:**
- ✅ SMTP verbinding werkt (je kan emails verzenden)
- ✅ IMAP verbinding werkt (je kan emails ontvangen)
- ✅ Je ontvangt een test email in je inbox

**Bij een rode test:**
- ❌ Check je wachtwoord (gebruik App-wachtwoord voor Gmail!)
- ❌ Check je server instellingen (kloppen ze?)
- ❌ Check je internet verbinding

---

## 💾 **STAP 6: Opslaan & Activeren**

1. Klik op **"Opslaan & Activeren"**
2. Je account wordt opgeslagen
3. Je wordt doorgestuurd naar je email inbox
4. Je kan nu emails synchroniseren en verzenden!

---

## 📬 **JE EMAIL GEBRUIKEN**

### **Emails Synchroniseren:**

1. Klik op de **"Sync"** knop (🔄) rechts boven
2. Wacht een paar seconden
3. Je emails verschijnen in de lijst

**💡 TIP:** Sync regelmatig om nieuwe emails op te halen!

---

### **Email Verzenden:**

1. Klik op **"Nieuw Bericht"** knop (✉️)
2. Voer **Aan:** adres in
3. Voer **Onderwerp:** in
4. Schrijf je bericht
5. Optioneel: Voeg bijlagen toe
6. Klik **"Verzenden"**
7. Klaar! Je email is verzonden

**💡 TIP:** Check de "Verzonden" folder om te zien of je email er in staat.

---

### **Meerdere Accounts Beheren:**

Als je meerdere email accounts hebt:

1. Klik op je account naam (rechts boven)
2. Selecteer een ander account uit de lijst
3. Alle emails en folders switchen naar dat account

---

## ❓ **VEELGESTELDE VRAGEN (FAQ)**

### **Q: Mijn Gmail login werkt niet, wat nu?**
**A:** Zorg dat je een **App-wachtwoord** gebruikt, niet je normale Gmail wachtwoord!

### **Q: Ik zie geen "App-wachtwoorden" optie in Google?**
**A:** Je moet eerst **"Verificatie in twee stappen"** inschakelen in je Google Account.

### **Q: Kan ik mijn werk email (Office365) toevoegen?**
**A:** Ja! Selecteer "Outlook / Office365" en gebruik je werk email + wachtwoord.

### **Q: Hoeveel accounts kan ik toevoegen?**
**A:** Onbeperkt! Je kan zoveel accounts toevoegen als je wilt.

### **Q: Worden mijn wachtwoorden veilig opgeslagen?**
**A:** Ja, alle wachtwoorden worden encrypted opgeslagen in de database.

### **Q: Kan ik mijn oude emails zien?**
**A:** Ja, alle emails in je mailbox worden gesynchroniseerd (standaard laatste 50).

### **Q: Hoe vaak wordt mijn email gesynchroniseerd?**
**A:** Je moet handmatig op "Sync" klikken. Automatische sync komt in een latere update.

### **Q: Kan ik attachments verzenden?**
**A:** Ja, attachments tot 20MB worden ondersteund.

### **Q: Wat als ik mijn wachtwoord verander?**
**A:** Update je account instellingen en voer het nieuwe wachtwoord in.

### **Q: Kan ik een account verwijderen?**
**A:** Ja, ga naar Account instellingen → Verwijder account.

---

## 🆘 **HULP NODIG?**

### **Problemen?**

1. Check deze handleiding nogmaals
2. Bekijk de FAQ hierboven
3. Klik op de **(i)** info icon bij elke provider voor specifieke instructies
4. Contact support: support@flowfocuscrm.nl
5. Bel: 06-12345678 (tijdens kantooruren)

### **Error Messages:**

| Error | Betekenis | Oplossing |
|-------|-----------|-----------|
| "Authentication failed" | Verkeerd wachtwoord | Gebruik App-wachtwoord voor Gmail |
| "Could not connect" | Server onbereikbaar | Check server adres & poort |
| "Timeout" | Te lang gewacht | Check internet verbinding |
| "SSL Error" | Verkeerde encryptie | Check TLS/SSL instelling |

---

## 📚 **EXTRA RESOURCES**

- **Gmail App-wachtwoorden:** https://support.google.com/accounts/answer/185833
- **Outlook IMAP settings:** https://support.microsoft.com/nl-nl/office/pop-imap-en-smtp-instellingen
- **Yahoo Mail settings:** https://help.yahoo.com/kb/mail-for-desktop
- **iCloud Mail settings:** https://support.apple.com/nl-nl/HT202304

---

## 🎉 **KLAAR!**

Je bent nu klaar om emails te verzenden en ontvangen in je CRM!

**Veel succes!** 🚀

---

*Laatste update: 3 Oktober 2025*  
*Versie: 1.0*

