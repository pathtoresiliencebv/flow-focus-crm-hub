# 📧 Gmail OAuth Setup - Stap voor Stap

**Geïnspireerd door:** [Mail0/Zero Gmail Integration](https://github.com/Mail-0/Zero)

## 🔐 **GOOGLE CLOUD CONSOLE SETUP**

### **Stap 1: Project Aanmaken**
1. Ga naar [Google Cloud Console](https://console.cloud.google.com/)
2. Klik **"Create Project"** of selecteer bestaand project
3. Projectnaam: `Flow Focus CRM`

### **Stap 2: APIs Activeren**
Activeer de volgende APIs:

**Gmail API:**
1. Ga naar [Gmail API](https://console.cloud.google.com/apis/library/gmail.googleapis.com)
2. Klik **"Enable"**

**People API:**
1. Ga naar [People API](https://console.cloud.google.com/apis/library/people.googleapis.com)
2. Klik **"Enable"**

### **Stap 3: OAuth Consent Screen**
1. Ga naar **APIs & Services** → **OAuth consent screen**
2. Selecteer **"External"** (voor productie) of **"Internal"** (voor testing)
3. Vul in:
   - **App name**: Flow Focus CRM
   - **User support email**: jouw@email.com
   - **Developer contact**: jouw@email.com
4. **Scopes** toevoegen:
   ```
   https://www.googleapis.com/auth/gmail.readonly
   https://www.googleapis.com/auth/gmail.send
   https://www.googleapis.com/auth/gmail.modify
   https://www.googleapis.com/auth/gmail.labels
   https://www.googleapis.com/auth/userinfo.email
   https://www.googleapis.com/auth/userinfo.profile
   ```
5. **Test users** toevoegen (voor development):
   - Voeg je eigen email toe

### **Stap 4: OAuth 2.0 Credentials**
1. Ga naar **APIs & Services** → **Credentials**
2. Klik **"Create Credentials"** → **"OAuth client ID"**
3. Application type: **Web application**
4. Name: `Flow Focus CRM Web Client`
5. **Authorized JavaScript origins**:
   ```
   Development:
   http://localhost:3000
   
   Production:
   https://jouw-productie-url.com
   ```
6. **Authorized redirect URIs**:
   ```
   Development:
   http://localhost:3000/api/auth/gmail/callback
   
   Production:
   https://jouw-productie-url.com/api/auth/gmail/callback
   ```
7. Klik **"Create"**
8. **Kopieer** de Client ID en Client Secret

### **Stap 5: Environment Variables**
Voeg toe aan `.env` (of Supabase Secrets):

```env
# Gmail OAuth
GOOGLE_CLIENT_ID=jouw-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=jouw-client-secret

# Gmail API Scopes
GMAIL_SCOPES=https://www.googleapis.com/auth/gmail.readonly,https://www.googleapis.com/auth/gmail.send,https://www.googleapis.com/auth/gmail.modify,https://www.googleapis.com/auth/gmail.labels,https://www.googleapis.com/auth/userinfo.email
```

---

## 🔄 **OAUTH FLOW**

### **1. Authorization Request**
```
GET https://accounts.google.com/o/oauth2/v2/auth
?client_id={CLIENT_ID}
&redirect_uri={REDIRECT_URI}
&response_type=code
&scope={SCOPES}
&access_type=offline
&prompt=consent
```

### **2. Callback Handler**
User wordt teruggestuurd naar:
```
http://localhost:3000/api/auth/gmail/callback?code=AUTH_CODE
```

### **3. Token Exchange**
```typescript
POST https://oauth2.googleapis.com/token
{
  code: AUTH_CODE,
  client_id: CLIENT_ID,
  client_secret: CLIENT_SECRET,
  redirect_uri: REDIRECT_URI,
  grant_type: 'authorization_code'
}

Response:
{
  access_token: "...",
  refresh_token: "...",
  expires_in: 3600,
  token_type: "Bearer"
}
```

### **4. Token Opslaan**
```sql
INSERT INTO email_accounts (
  user_id,
  provider,
  email_address,
  access_token,
  refresh_token,
  token_expires_at
) VALUES (
  auth.uid(),
  'gmail',
  'user@gmail.com',
  encrypt_token(access_token),
  encrypt_token(refresh_token),
  NOW() + INTERVAL '1 hour'
);
```

---

## 🔄 **TOKEN REFRESH**

Tokens verlopen na 1 uur. Automatisch refreshen:

```typescript
async function refreshGmailToken(accountId: string) {
  const account = await getEmailAccount(accountId);
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: decrypt(account.refresh_token),
      grant_type: 'refresh_token'
    })
  });
  
  const { access_token, expires_in } = await response.json();
  
  // Update in database
  await updateEmailAccount(accountId, {
    access_token: encrypt(access_token),
    token_expires_at: new Date(Date.now() + expires_in * 1000)
  });
  
  return access_token;
}
```

---

## 🧪 **TESTING**

### **Test OAuth Flow**
1. Ga naar `/email/connect`
2. Klik **"Connect Gmail"**
3. Login met Google account
4. Accepteer permissions
5. Wordt doorgestuurd naar app
6. Account verschijnt in database

### **Test API Calls**
```typescript
// Test Gmail API access
const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

// Fetch inbox threads
const threads = await gmail.users.threads.list({
  userId: 'me',
  maxResults: 10
});

console.log('Threads:', threads.data.threads);
```

---

## ⚠️ **TROUBLESHOOTING**

### **Error: redirect_uri_mismatch**
**Fix:** Zorg dat redirect URI in Google Console **exact** overeenkomt met de URL in je code (inclusief http/https, port, path)

### **Error: invalid_grant**
**Fix:** Refresh token is verlopen of invalid. User moet opnieuw inloggen.

### **Error: insufficient_permissions**
**Fix:** Scopes zijn niet goed geconfigureerd in OAuth consent screen.

### **Error: access_denied**
**Fix:** User heeft permission geweigerd. Vraag opnieuw met `prompt=consent`.

---

## ✅ **CHECKLIST**

- [ ] Gmail API enabled in Google Cloud
- [ ] People API enabled
- [ ] OAuth consent screen configured
- [ ] OAuth 2.0 credentials created
- [ ] Redirect URIs correct
- [ ] Scopes configured
- [ ] Environment variables set
- [ ] Test user added (development)
- [ ] OAuth flow tested
- [ ] Token refresh working

---

**🎉 KLAAR OM EMAILS TE SYNCEN!**

