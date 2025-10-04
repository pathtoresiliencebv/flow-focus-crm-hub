# 🔍 COMPLETE EMAIL SYSTEEM ANALYSE & FIX PLAN

## 📋 **HUIDIGE STATUS**

### ✅ **WAT WERKT:**
1. ✅ IMAP sync (v80 deployed) - Haalt emails op van server
2. ✅ Email account configuratie (SMTP/IMAP settings)
3. ✅ Email lijst toont LIVE messages
4. ✅ Encryption van passwords

### ❌ **KRITIEKE PROBLEMEN:**

#### **1. EMAIL DETAIL VIEW WERKT NIET** 🔴 **KRITIEK**
- **Locatie:** `src/pages/Email.tsx` regel 344-374
- **Probleem:** HARDCODED dummy content! 
  ```tsx
  <div className="prose max-w-none">
    <p className="text-gray-700">
      Email content wordt hier weergegeven wanneer je een email selecteert.
    </p>
  ```
- **Impact:** Gebruiker kan GEEN emails lezen
- **Fix nodig:** Toon ECHTE email content gebaseerd op `selectedThread`

#### **2. GEEN EMAIL SELECTIE LOGICA** 🔴 **KRITIEK**
- **Probleem:** `selectedThread` wordt gezet, maar `messages` array wordt niet gefilterd
- **Impact:** Geselecteerde email wordt niet gevonden/getoond
- **Fix nodig:** 
  - Filter messages op UID
  - Toon volledige email body
  - Parse HTML/plain text correct

#### **3. REPLY/FORWARD WERKT NIET** 🟠 **BELANGRIJK**
- **Locatie:** Email.tsx regel 377-385
- **Probleem:** Buttons zijn dummy - geen functionaliteit
- **Fix nodig:**
  - Open EmailComposer met pre-filled data
  - "Beantwoorden" → to + subject
  - "Allen beantwoorden" → to + cc
  - "Doorsturen" → subject met FW:

#### **4. EMAIL PARSING TE SIMPEL** 🟠 **BELANGRIJK**
- **Locatie:** `supabase/functions/imap-sync/index.ts` regel 117-170
- **Problemen:**
  - Envelope parsing ZEER basic (regel 132-145)
  - From/To niet correct geparsed
  - Body kan HTML zijn maar wordt niet gedetecteerd
  - Geen attachment support
- **Fix nodig:** Betere IMAP response parser

#### **5. SMTP SEND FUNCTIE BESTAAT NIET** 🔴 **KRITIEK**
- **Locatie:** `src/components/email/EmailComposer.tsx` regel 61
- **Probleem:** Roept `smtp-send` Edge Function aan die NIET BESTAAT
- **Fix nodig:** Maak `smtp-send` Edge Function

#### **6. EMAIL COMPOSER MIST ACCOUNT** 🟠 **BELANGRIJK**
- **Probleem:** `<EmailComposer account={???}/>` maar account prop ontbreekt
- **Fix nodig:** Pass `primaryAccount` door

---

## 🎯 **ACTIEPLAN - PRIORITEIT VOLGORDE:**

### **FASE 1: EMAIL LEZEN FUNCTIONALITEIT** ⚡ **NU DOEN**

#### **Stap 1.1: Fix Email Detail View**
```tsx
// src/pages/Email.tsx
const selectedMessage = messages.find(m => String(m.uid) === selectedThread);

{selectedMessage ? (
  <>
    <div className="border-b p-4 bg-white">
      <h2 className="text-xl font-semibold">{selectedMessage.subject}</h2>
      <div className="flex items-center justify-between mt-2">
        <span className="text-sm text-gray-600">{selectedMessage.from}</span>
        <span className="text-xs text-gray-400">
          {new Date(selectedMessage.date).toLocaleString('nl-NL')}
        </span>
      </div>
    </div>
    
    <div className="flex-1 overflow-y-auto p-6">
      <div className="prose max-w-none" 
           dangerouslySetInnerHTML={{ __html: selectedMessage.body }} 
      />
    </div>
  </>
) : (
  // Empty state
)}
```

#### **Stap 1.2: Verbeter IMAP Email Parsing**
- Betere envelope parser (extract From, To, Subject correct)
- Detect HTML vs Plain text
- Return full body (niet alleen 500 chars)

### **FASE 2: EMAIL VERSTUREN** ⚡ **DAARNA**

#### **Stap 2.1: Maak smtp-send Edge Function**
```typescript
// supabase/functions/smtp-send/index.ts
// Connect to SMTP
// Send email via SMTP
// Return success/error
```

#### **Stap 2.2: Fix EmailComposer Integration**
- Pass `primaryAccount` prop
- Wire up reply/forward buttons
- Test sending

### **FASE 3: REPLY/FORWARD** 

#### **Stap 3.1: Reply Functionaliteit**
```tsx
const handleReply = () => {
  setComposerOpen(true);
  setReplyToData({
    to: selectedMessage.from,
    subject: `Re: ${selectedMessage.subject}`,
    inReplyTo: selectedMessage.uid
  });
};
```

---

## 🔧 **TECHNISCHE DETAILS:**

### **Email Body Parsing:**
```typescript
// IMAP returns either:
// BODY[TEXT] - Plain text
// BODY[HTML] - HTML content

// Parser moet:
1. Detect content type (HTML vs Plain)
2. Sanitize HTML (XSS protection)
3. Convert plain text → HTML with <br> tags
4. Handle encoding (UTF-8, etc)
```

### **SMTP Sending:**
```typescript
// smtp-send Edge Function moet:
1. Decrypt SMTP password
2. Connect to SMTP server (TLS on port 587)
3. Authenticate
4. Send email with:
   - From: account email
   - To/Cc/Bcc
   - Subject
   - Body (convert to MIME format)
5. Handle errors
6. Return success
```

---

## ✅ **ACCEPTATIE CRITERIA:**

### **Minimum Viable Email System:**
1. ✅ Lijst met emails tonen (DONE)
2. ⬜ Email selecteren en VOLLEDIGE content lezen
3. ⬜ Nieuwe email versturen
4. ⬜ Reply op email
5. ⬜ Forward email

### **Nice to Have:**
- Attachments downloaden
- Attachments versturen
- HTML email editor
- Search in emails
- Folders (Sent, Drafts, Trash)
- Mark as read/unread
- Star/flag emails

---

## 🚀 **START NU MET:**

1. **FIX EMAIL DETAIL VIEW** (15 min)
2. **VERBETER IMAP PARSER** (30 min)
3. **MAAK SMTP-SEND FUNCTIE** (45 min)
4. **WIRE UP REPLY BUTTONS** (15 min)

**Totaal: ~2 uur werk voor werkend email systeem!**

