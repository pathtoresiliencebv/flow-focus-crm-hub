# 📱 COMPLEET iOS APP STORE PUBLISHING PLAN
## SMANS CRM - Van Development tot Live in App Store

**Datum:** 7 Oktober 2025  
**Versie:** 4.0.0 (Build 11)  
**Bundle ID:** com.smanscrm.ios  
**Status:** Pre-Production Checklist

---

## 🎯 OVERZICHT

Dit plan bevat ALLE stappen om de Smans CRM iOS app volledig klaar te maken voor publicatie naar de Apple App Store, inclusief testing met mobile-mcp, configuratie fixes, en deployment procedures.

---

## ⚠️ KRITIEKE ISSUES (MOET EERST GEFIXED)

### 1. Bundle ID Mismatch
**Probleem:** 
- `capacitor.config.ts` gebruikt: `com.smanscrm.ios`
- `ExportOptions.plist` verwijst naar: `nl.smanscrm.app`
- Xcode project heeft: `com.smanscrm.ios`

**Oplossing:**
We standardiseren op `com.smanscrm.ios`

### 2. App Icon Inconsistentie
**Probleem:**
- Manifest.json verwijst naar "Flow Focus CRM Hub"
- Capacitor config zegt "Smans CRM"
- Memory zegt favicon moet "Alqemist" zijn

**Oplossing:**
Bepaal definitieve app naam en update overal consistent.

### 3. Missing App Store Assets
**Probleem:**
- Geen screenshots voor App Store
- Geen app preview video's
- Mogelijk incomplete app icons

---

## 📋 FASE 1: PRE-FLIGHT CHECKLIST (2-3 uur)

### 1.1 Bundle ID & App Name Consistentie

**Stap 1:** Update Capacitor Config
```typescript
// capacitor.config.ts
const config: CapacitorConfig = {
  appId: 'com.smanscrm.ios',
  appName: 'Smans CRM', // Of 'Alqemist' - bevestig met stakeholder
  webDir: 'dist',
  // ... rest stays same
};
```

**Stap 2:** Verificeer Xcode Project
- Open `ios/App/App.xcodeproj`
- Check `PRODUCT_BUNDLE_IDENTIFIER` = `com.smanscrm.ios`
- Check `MARKETING_VERSION` = `4.0.0`
- Check `CURRENT_PROJECT_VERSION` = `11` (of hoger voor nieuwe build)

**Stap 3:** Update ExportOptions.plist
```xml
<!-- ios/App/ExportOptions.plist -->
<key>distributionBundleIdentifier</key>
<string>com.smanscrm.ios</string>

<key>provisioningProfiles</key>
<dict>
    <key>com.smanscrm.ios</key>
    <string>Smans CRM Distribution</string>
</dict>
```

**Stap 4:** Update Info.plist
```xml
<!-- ios/App/App/Info.plist -->
<key>CFBundleDisplayName</key>
<string>Smans CRM</string>

<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLName</key>
        <string>com.smanscrm.ios</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>smanscrm</string>
        </array>
    </dict>
</array>
```

### 1.2 App Icons & Assets

**Required Sizes:**
```
App Icon (all required):
- 1024x1024px (App Store)
- 180x180px (iPhone @3x)
- 120x120px (iPhone @2x)  
- 167x167px (iPad Pro @2x)
- 152x152px (iPad @2x)
- 76x76px (iPad @1x)
- 60x60px (iPhone Settings @3x)
- 40x40px (iPhone Settings @2x)
- 29x29px (iPhone Settings @1x)
- 87x87px (iPhone Notification @3x)
- 58x58px (iPhone Notification @2x)
```

**Locatie:** `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

**Checklist:**
- [ ] Alle icon sizes aanwezig
- [ ] Alpha channel verwijderd (vereist door App Store)
- [ ] RGB color space (niet CMYK)
- [ ] PNG formaat
- [ ] Geen rounded corners (iOS doet dit automatisch)

**Genereren met Tool:**
```bash
# Gebruik online tool of ImageMagick
# Van 1024x1024 master icon
for size in 180 120 167 152 76 60 40 29 87 58; do
  magick convert icon-1024.png -resize ${size}x${size} icon-${size}.png
done
```

### 1.3 Splash Screen

**Locatie:** `ios/App/App/Assets.xcassets/Splash.imageset/`

**Required:**
- `splash-2732x2732.png` (Universal)
- `splash-2732x2732-1.png` (Dark mode variant)
- `splash-2732x2732-2.png` (Extra variant)

**Design Guidelines:**
- Simpel design (logo centered)
- Snel laadtijd
- Consistent met app branding
- Werkt in light + dark mode

### 1.4 App Permissions - Usage Strings

**Verificeer in Info.plist (REEDS AANWEZIG ✅):**
```xml
✅ NSCameraUsageDescription
✅ NSPhotoLibraryUsageDescription  
✅ NSLocationWhenInUseUsageDescription
✅ NSLocationAlwaysAndWhenInUseUsageDescription
✅ NSMicrophoneUsageDescription
✅ NSContactsUsageDescription
✅ NSFaceIDUsageDescription
✅ NSDocumentsFolderUsageDescription
```

**Action:** Alle descriptions zijn user-friendly en leggen WHY uit ✅

### 1.5 URL Scheme & Deep Linking

**Verificeer:**
```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>smanscrm</string>
        </array>
    </dict>
</array>
```

**Test URLs:**
- `smanscrm://` (open app)
- `smanscrm://projects` (deep link naar projecten)
- `smanscrm://chat` (deep link naar chat)

---

## 📋 FASE 2: APPLE DEVELOPER SETUP (1-2 uur)

### 2.1 Apple Developer Account

**Verificatie:**
- [ ] Apple Developer Account actief ($99/jaar)
- [ ] Team ID: `FSRP4QVXC9` (correct in project)
- [ ] Juiste rol (Admin of App Manager)

### 2.2 App Store Connect - App Record

**Stap 1:** Login op [App Store Connect](https://appstoreconnect.apple.com)

**Stap 2:** Create App (als nog niet bestaat)
- Name: `Smans CRM`
- Bundle ID: `com.smanscrm.ios` (moet al geregistreerd zijn)
- SKU: `smanscrm-ios-v1`
- Primary Language: `Dutch (Netherlands)`

**Stap 3:** App Information
- Category: **Business** (Primary)
- Category: **Productivity** (Secondary)
- Content Rights: Bevat geen ads
- Age Rating: 4+ (Business app zonder sensitive content)

### 2.3 Certificates & Provisioning Profiles

**Required Certificates:**

1. **Development Certificate** (voor testing)
   ```
   Type: Apple Development
   Status: Valid
   Team: FSRP4QVXC9
   ```

2. **Distribution Certificate** (voor App Store)
   ```
   Type: Apple Distribution
   Status: Valid
   Team: FSRP4QVXC9
   Expires: Check in 1 jaar
   ```

**Provisioning Profiles:**

1. **Development Profile**
   ```
   Name: Smans CRM Development
   Bundle ID: com.smanscrm.ios
   Type: iOS App Development
   Devices: Test devices toegevoegd
   ```

2. **Distribution Profile**
   ```
   Name: Smans CRM Distribution
   Bundle ID: com.smanscrm.ios
   Type: App Store
   ```

**Setup Commands:**
```bash
# Download en installeer certificates
# Via Xcode:
# Xcode > Preferences > Accounts > [Team] > Download Manual Profiles
```

### 2.4 Capabilities in Xcode

**Enable in Xcode:**
- [ ] Push Notifications
- [ ] Background Modes (Remote notifications)
- [ ] Associated Domains (optional voor web deep links)
- [ ] iCloud (optional voor sync)
- [ ] In-App Purchase (alleen als je betaalde features hebt)

**Verificatie:**
```
Xcode > Target > Signing & Capabilities
- Automatically manage signing: OFF (voor distribution)
- Provisioning Profile: Smans CRM Distribution
- Signing Certificate: Apple Distribution
```

---

## 📋 FASE 3: BUILD & CODE SIGNING (2-3 uur)

### 3.1 Clean Build Environment

```bash
cd flow-focus-crm-hub

# Clean everything
rm -rf node_modules
rm -rf ios/App/Pods
rm -rf ios/App/build
rm -rf dist

# Fresh install
npm install

# Update Capacitor
npx cap sync ios
```

### 3.2 Production Build van Web App

```bash
# Build voor productie
npm run build:production

# Verificatie
ls -lh dist/
# Moet compiled HTML/CSS/JS tonen
```

### 3.3 Sync naar iOS

```bash
# Copy web assets naar iOS
npx cap sync ios

# Open in Xcode
npx cap open ios
```

### 3.4 Xcode Configuration voor Release

**In Xcode:**

1. **Select Scheme:** `App` > `Edit Scheme`
   - Run: Debug
   - Archive: Release ✅

2. **Select Target:** `Any iOS Device` (niet simulator!)

3. **Signing & Capabilities:**
   - [ ] Uncheck "Automatically manage signing"
   - [ ] Provisioning Profile: `Smans CRM Distribution`
   - [ ] Signing Certificate: `Apple Distribution`

4. **Build Settings:**
   ```
   Code Signing Identity: Apple Distribution
   Code Signing Style: Manual
   Development Team: FSRP4QVXC9
   Provisioning Profile: Smans CRM Distribution
   ```

5. **Info Tab:**
   - [ ] Version: `4.0.0`
   - [ ] Build: `11` (increment voor elke nieuwe upload!)

### 3.5 Create Archive

**Stap 1:** Product > Clean Build Folder (⇧⌘K)

**Stap 2:** Product > Archive (⌘B eerst voor build check)

**Wacht tijd:** 5-10 minuten voor eerste archive

**Mogelijke Errors:**

**Error: "Code signing failed"**
```
Oplossing:
- Check certificates in Keychain Access
- Download provisioning profiles opnieuw
- Restart Xcode
```

**Error: "Build input file cannot be found"**
```
Oplossing:
cd ios/App
pod deintegrate
pod install
cd ../..
npx cap sync ios
```

**Error: "Missing compliance"**
```
Oplossing:
Info.plist toevoegen:
<key>ITSAppUsesNonExemptEncryption</key>
<false/>
```

### 3.6 Validate Archive

**In Organizer Window:**

1. Select archive
2. Click "Validate App"
3. Distribution method: **App Store Connect**
4. Upload symbols: **YES**
5. Manage Version and Build Number: **NO** (we doen dit handmatig)

**Validation Checks:**
- [ ] Code signing correct
- [ ] Entitlements correct
- [ ] Binary size < 4GB
- [ ] No embedded frameworks issues
- [ ] Asset validation passed

---

## 📋 FASE 4: TESTING MET MOBILE-MCP (3-4 uur)

### 4.1 Install Build op Test Device

**Via Xcode:**
```bash
# Connect iPhone via USB
# Xcode > Window > Devices and Simulators
# Select device
# Install .app bundle
```

**Via TestFlight (recommended):**
- Upload naar App Store Connect
- Internal Testing groep
- Install via TestFlight app

### 4.2 Mobile-MCP Testing Script

**Setup:**
```bash
# List devices
mobile_list_available_devices

# Expected output: iPhone connected
```

**Critical Test Flows:**

#### Test 1: App Launch & Authentication
```bash
# Launch app
mobile_launch_app --device="iPhone" --packageName="com.smanscrm.ios"

# Take screenshot of launch screen
mobile_take_screenshot --device="iPhone"

# Wait for load
mobile_wait_for --device="iPhone" --text="Welkom bij SMANS CRM"

# Fill login form
mobile_list_elements_on_screen --device="iPhone"
# Find email input UID
mobile_click_on_screen_at_coordinates --device="iPhone" --x=200 --y=300
mobile_type_keys --device="iPhone" --text="test@smans.nl" --submit=false

# Find password input UID  
mobile_click_on_screen_at_coordinates --device="iPhone" --x=200 --y=400
mobile_type_keys --device="iPhone" --text="password123" --submit=false

# Click login button
mobile_click_on_screen_at_coordinates --device="iPhone" --x=200 --y=500

# Verify navigation
mobile_wait_for --device="iPhone" --text="Projecten"
mobile_take_screenshot --device="iPhone"
```

#### Test 2: Navigation Flow
```bash
# Test bottom navigation
mobile_list_elements_on_screen --device="iPhone"

# Tap Chat tab
mobile_click_on_screen_at_coordinates --device="iPhone" --x=100 --y=750

# Screenshot
mobile_take_screenshot --device="iPhone"

# Tap Projecten tab
mobile_click_on_screen_at_coordinates --device="iPhone" --x=200 --y=750

# Tap Agenda tab  
mobile_click_on_screen_at_coordinates --device="iPhone" --x=300 --y=750

# Tap Bonnetjes tab
mobile_click_on_screen_at_coordinates --device="iPhone" --x=400 --y=750
```

#### Test 3: Camera Permission
```bash
# Navigate to bonnetjes
mobile_click_on_screen_at_coordinates --device="iPhone" --x=400 --y=750

# Tap "Nieuw Bonnetje" button
mobile_list_elements_on_screen --device="iPhone"
mobile_click_on_screen_at_coordinates --device="iPhone" --x=350 --y=100

# Tap "Maak Foto"
mobile_click_on_screen_at_coordinates --device="iPhone" --x=200 --y=300

# Permission dialog should appear
mobile_take_screenshot --device="iPhone"

# Accept permission (manual)
# Verify camera opens
```

#### Test 4: Deep Link Testing
```bash
# Test URL scheme
mobile_open_url --device="iPhone" --url="smanscrm://projects"

# Verify deep link works
mobile_wait_for --device="iPhone" --text="Projecten"
mobile_take_screenshot --device="iPhone"

# Test other deep links
mobile_open_url --device="iPhone" --url="smanscrm://chat"
mobile_take_screenshot --device="iPhone"
```

#### Test 5: Performance Testing
```bash
# Get screen size
mobile_get_screen_size --device="iPhone"

# Test scrolling performance
mobile_swipe_on_screen --device="iPhone" --direction="down" --distance=400
mobile_take_screenshot --device="iPhone"

mobile_swipe_on_screen --device="iPhone" --direction="up" --distance=400
mobile_take_screenshot --device="iPhone"

# Test rapid navigation
for i in {1..10}; do
  mobile_click_on_screen_at_coordinates --device="iPhone" --x=100 --y=750
  sleep 0.5
  mobile_click_on_screen_at_coordinates --device="iPhone" --x=300 --y=750
  sleep 0.5
done
```

#### Test 6: Offline Mode
```bash
# Enable airplane mode (manual)
# Or use iOS settings

# Test app functionality offline
mobile_launch_app --device="iPhone" --packageName="com.smanscrm.ios"

# Try to load projects
mobile_click_on_screen_at_coordinates --device="iPhone" --x=200 --y=750

# Take screenshots of offline indicators
mobile_take_screenshot --device="iPhone"

# Re-enable network
# Verify sync
```

### 4.3 Automated Test Script

Create: `scripts/ios-test-suite.sh`

```bash
#!/bin/bash

echo "🧪 Starting iOS App Test Suite"

DEVICE="iPhone"
APP_ID="com.smanscrm.ios"

# Test 1: Launch
echo "Test 1: App Launch"
mobile_launch_app --device="$DEVICE" --packageName="$APP_ID"
sleep 3
mobile_save_screenshot --device="$DEVICE" --saveTo="./test-results/01-launch.png"

# Test 2: Login Screen
echo "Test 2: Login Screen Elements"
mobile_list_elements_on_screen --device="$DEVICE" > ./test-results/login-elements.txt
mobile_save_screenshot --device="$DEVICE" --saveTo="./test-results/02-login.png"

# Test 3: Navigation  
echo "Test 3: Bottom Navigation"
# Add coordinates based on list_elements output
mobile_click_on_screen_at_coordinates --device="$DEVICE" --x=100 --y=750
sleep 1
mobile_save_screenshot --device="$DEVICE" --saveTo="./test-results/03-chat.png"

mobile_click_on_screen_at_coordinates --device="$DEVICE" --x=200 --y=750
sleep 1
mobile_save_screenshot --device="$DEVICE" --saveTo="./test-results/04-projects.png"

mobile_click_on_screen_at_coordinates --device="$DEVICE" --x=300 --y=750
sleep 1
mobile_save_screenshot --device="$DEVICE" --saveTo="./test-results/05-agenda.png"

mobile_click_on_screen_at_coordinates --device="$DEVICE" --x=400 --y=750
sleep 1
mobile_save_screenshot --device="$DEVICE" --saveTo="./test-results/06-receipts.png"

# Test 4: Back to home
echo "Test 4: Back Navigation"
mobile_press_button --device="$DEVICE" --button="HOME"
sleep 1

echo "✅ Test Suite Completed"
echo "📸 Screenshots saved to ./test-results/"
```

**Run:**
```bash
chmod +x scripts/ios-test-suite.sh
./scripts/ios-test-suite.sh
```

### 4.4 Manual Testing Checklist

**Functionaliteit:**
- [ ] App launch < 3 seconden
- [ ] Login werkt met valide credentials
- [ ] Alle tabs navigeren correct
- [ ] Chat berichten laden
- [ ] Projecten lijst toont (met rol filtering)
- [ ] Agenda toont planning
- [ ] Bonnetjes upload werkt
- [ ] Camera permission werkt
- [ ] Location permission werkt
- [ ] Push notifications werken
- [ ] Deep links werken
- [ ] Offline mode werkt (cached data)
- [ ] Sync werkt bij reconnect

**UI/UX:**
- [ ] Geen layout issues op iPhone SE (klein scherm)
- [ ] Geen layout issues op iPhone 15 Pro Max (groot scherm)
- [ ] Geen layout issues op iPad
- [ ] Dark mode werkt (if implemented)
- [ ] Keyboard gedrag correct
- [ ] Pull-to-refresh werkt
- [ ] Loading states tonen
- [ ] Error states tonen
- [ ] Success feedback (toasts/alerts)

**Performance:**
- [ ] Smooth scrolling (60fps)
- [ ] Geen memory leaks
- [ ] Geen crashes bij rapid tapping
- [ ] Network errors worden gracefully handled
- [ ] Images laden snel
- [ ] Geen ANR (App Not Responding)

**Security:**
- [ ] Session blijft na app restart
- [ ] Logout werkt correct
- [ ] Sensitive data niet in logs
- [ ] SSL pinning werkt (indien geïmplementeerd)

---

## 📋 FASE 5: APP STORE ASSETS (2-3 uur)

### 5.1 Screenshots voor App Store

**Required Sizes:**
```
iPhone 6.7" (iPhone 15 Pro Max):
- 1290 x 2796 pixels (portrait)
- 2796 x 1290 pixels (landscape - optional)

iPhone 6.5" (iPhone 14 Plus):
- 1284 x 2778 pixels

iPhone 5.5" (iPhone 8 Plus):
- 1242 x 2208 pixels (optional maar recommended)

iPad Pro 12.9" (if support iPad):
- 2048 x 2732 pixels
```

**Aantal:** Minimum 3, maximum 10 screenshots per device size

**Content Suggestions:**
```
Screenshot 1: Dashboard/Home (eerste indruk)
Screenshot 2: Projecten lijst (core functie)
Screenshot 3: Project detail met taken (functionaliteit)
Screenshot 4: Chat interface (communicatie)
Screenshot 5: Bonnetjes upload (USP feature)
Screenshot 6: Agenda/Planning (productiviteit)
```

**Tool voor Screenshots:**
```bash
# Via Xcode Simulator
# 1. Open simulator met juiste device
xcrun simctl list devices

# 2. Run app
# 3. Navigate naar scherm
# 4. Cmd+S voor screenshot
# Saved to: ~/Desktop/

# Via fysiek device met mobile-mcp:
mobile_save_screenshot --device="iPhone" --saveTo="./app-store-assets/screenshot-1.png"
```

**Framing Tool:**
- Use https://screenshots.pro/ (gratis)
- Of https://www.mockuphone.com/
- Voeg marketing text toe aan screenshots

### 5.2 App Preview Video (Optional maar Recommended)

**Specs:**
```
Duration: 15-30 seconden
Resolution: 1080p of 4K
Format: .mov of .m4v
Codec: H.264 of HEVC
File size: < 500MB
```

**Content:**
1. Open app (2s)
2. Toon dashboard (3s)
3. Navigate naar projecten (3s)
4. Open project detail (3s)
5. Show chat (3s)
6. Show bonnetje upload (3s)
7. Outro met logo (2s)

**Tools:**
- iMovie (Mac)
- QuickTime Screen Recording
- Final Cut Pro

### 5.3 App Icon voor App Store

**Size:** 1024x1024px

**Requirements:**
- No alpha channel
- No rounded corners
- RGB color space
- PNG format
- No marketing text on icon

**Location:** Upload directly in App Store Connect

### 5.4 Marketing Assets

**App Name:**
```
Primary: Smans CRM
Subtitle: Professional CRM & Project Management
```

**Keywords (max 100 characters):**
```
crm,project,management,installateur,monteur,planning,chat,bonnetjes,agenda,business
```

**Description (max 4000 characters):**

```markdown
# Smans CRM - Professioneel CRM & Projectbeheer

Smans CRM is de ultieme mobiele oplossing voor installateurs, monteurs en service bedrijven om projecten efficiënt te beheren, te communiceren met het team en administratie bij te houden - overal en altijd.

## 🎯 Kernfunctionaliteiten

**📁 Projectbeheer**
- Overzicht van al je toegewezen projecten
- Gedetailleerde taakinformatie en checklists
- Status updates en real-time synchronisatie
- Foto's maken voor project documentatie

**💬 Team Communicatie**
- Directe chat met collega's en kantoor
- Real-time berichten en notificaties
- Bestandsdeling en foto's delen

**📅 Planning & Agenda**
- Overzicht van jouw dagelijkse planning
- Wekelijkse en maandelijkse views
- Navigatie naar projectlocaties
- Tijdregistratie per project

**🧾 Bonnetjes Management**
- Foto's maken van bonnetjes en facturen
- Automatische categorisering
- Status tracking (in behandeling/goedgekeurd)
- Direct uploaden naar administratie

**🔒 Offline-First**
- Werkt zonder internetverbinding
- Automatische synchronisatie bij verbinding
- Veilige data opslag

**✨ Extra Features**
- Project afronden met digitale handtekening
- Camera en locatie integratie
- Push notificaties voor updates
- Veilige authenticatie

## 👥 Voor wie?

- **Installateurs** - Werk projecten af met alle info binnen handbereik
- **Monteurs** - Registreer uren en materialen direct op locatie
- **Service Engineers** - Communiceer real-time met het team
- **Project Managers** - Overzicht van alle projecten en status

## 🚀 Waarom Smans CRM?

✅ Speciaal ontworpen voor field workers
✅ Intuïtieve interface
✅ Werkt offline
✅ Real-time updates
✅ Nederlandse support
✅ GDPR compliant

## 📞 Support

Vragen of hulp nodig? Neem contact op via:
- Email: support@smanscrm.nl
- Website: https://smanscrm.nl
- Telefoon: [nummer]

## 🔐 Privacy & Veiligheid

Jouw data is veilig bij ons:
- End-to-end encryptie
- GDPR compliant
- Veilige cloud opslag
- Geen data verkoop

Download nu en ervaar de meest complete CRM oplossing voor installatie bedrijven!

---

Voor gebruik van deze app is een Smans CRM account vereist.
Neem contact op voor meer informatie over licenties.
```

**What's New (voor updates):**
```markdown
Versie 4.0.0

🎉 Nieuwe Features:
- Vernieuwd project dashboard
- Verbeterde chat functionaliteit
- Snellere foto uploads
- Offline modus verbeteringen

🐛 Bug Fixes:
- Performance verbeteringen
- UI/UX optimalisaties
- Crash fixes

💬 We horen graag je feedback!
```

**Support URL:** `https://smanscrm.nl/support`

**Marketing URL:** `https://smanscrm.nl`

**Privacy Policy URL:** `https://smanscrm.nl/privacy`

### 5.5 Age Rating

**Questionnaire Answers:**
```
Violence: No
Sexual Content: No
Horror/Fear: No
Profanity: No
Drugs/Alcohol/Tobacco: No
Mature/Suggestive Themes: No
Simulated Gambling: No
Unrestricted Web Access: No
Medical/Treatment Info: No

Rating: 4+ (All Ages)
```

---

## 📋 FASE 6: APP STORE CONNECT SUBMISSION (1-2 uur)

### 6.1 Upload Archive naar App Store

**Via Xcode Organizer:**

1. Window > Organizer
2. Select Archive
3. Click "Distribute App"
4. Distribution method: **App Store Connect**
5. Destination: **Upload**
6. Options:
   - [ ] Upload symbols: **YES**
   - [ ] Manage version and build: **NO**
7. Re-sign: **Smans CRM Distribution**
8. Review summary
9. Click **Upload**

**Upload tijd:** 5-15 minuten afhankelijk van internet

**Verificatie:**
- Check email voor "App Store Connect: Build Processing Completed"
- Meestal binnen 10-30 minuten

### 6.2 App Store Connect Configuration

**Login:** https://appstoreconnect.apple.com

**Navigate:** My Apps > Smans CRM > [+] Version > iOS

**Version Information:**

```
Version: 4.0.0
Copyright: 2025 Smans CRM B.V.
Category: Business (Primary), Productivity (Secondary)
```

**Pricing and Availability:**

```
Price: Free (or paid - determine)
Availability: Netherlands (or worldwide)
Pre-order: No
```

**App Information:**

1. **General App Information**
   - [ ] Subtitle: "Professional CRM & Project Management"
   - [ ] Privacy Policy URL: https://smanscrm.nl/privacy
   - [ ] Category: Business, Productivity

2. **App Review Information**
   ```
   Contact Information:
   - First Name: [Naam]
   - Last Name: [Achternaam]
   - Phone: [Telefoonnummer met landcode]
   - Email: support@smanscrm.nl
   
   Sign-in required: YES
   
   Demo Account:
   - Username: demo@smanscrm.nl
   - Password: [Veilig demo wachtwoord]
   
   Notes:
   "Dit is een business app voor CRM en project management.
   Gebruik de demo account om in te loggen.
   Alle features zijn beschikbaar voor review."
   ```

3. **Version Information**
   - [ ] What's New: [Zie marketing copy boven]
   - [ ] Promotional Text: [Optional, updatable zonder review]

4. **Screenshots & Media**
   - [ ] Upload 6.7" screenshots (minimum 3)
   - [ ] Upload 6.5" screenshots (minimum 3)
   - [ ] Upload iPad screenshots (if applicable)
   - [ ] Upload App Preview video (optional)

5. **Build**
   - [ ] Select build 4.0.0 (11) from list
   - [ ] Wait for "Processing" to complete

6. **Export Compliance**
   ```
   Question: Does your app use encryption?
   Answer: NO (unless je HTTPS API calls doet met custom crypto)
   
   If YES:
   - Uses standard encryption: YES
   - Qualifies for exemption: YES
   ```

7. **Content Rights**
   - [ ] Contains no ads: [Select appropriate]
   - [ ] No third-party ads: [Select appropriate]

8. **Age Rating**
   - [ ] Complete questionnaire (see 5.5)
   - [ ] Confirm 4+ rating

### 6.3 Submit for Review

**Pre-submission Checklist:**
- [x] All required screenshots uploaded
- [x] App description complete
- [x] Keywords entered
- [x] Support URL working
- [x] Privacy Policy URL working
- [x] Demo account credentials provided
- [x] Build selected and processed
- [x] Export compliance answered
- [x] Age rating confirmed
- [x] Contact info correct

**Submit:**
1. Click "Add for Review"
2. Review summary page
3. Click "Submit for Review"

**Status changes:**
```
Waiting for Review → 24-48 hours
In Review → 12-24 hours
Pending Developer Release → Approved! (manual release)
or
Ready for Sale → Live! (automatic release)
```

---

## 📋 FASE 7: REVIEW PROCESS & LAUNCH (1-7 dagen)

### 7.1 App Review Timeline

**Gemiddelde tijdlijn:**
```
Day 1-2: Waiting for Review
Day 2-3: In Review
Day 3: Approved/Rejected
```

**Status tracking:**
- Check App Store Connect daily
- Email notifications enabled
- Respond binnen 24u bij vragen

### 7.2 Mogelijke Rejection Reasons & Fixes

#### Rejection 1: "App Crashes on Launch"
**Reden:** Review team kan app niet starten

**Oplossing:**
- Check demo credentials werken
- Test build op clean device
- Check network dependencies
- Provide better test instructions

#### Rejection 2: "Incomplete Functionality"
**Reden:** Functies werken niet of zijn leeg

**Oplossing:**
- Zorg dat demo account data heeft
- Pre-populate test projecten
- Add sample chats
- Include example receipts

#### Rejection 3: "Misleading Metadata"
**Reden:** Screenshots/description klopt niet

**Oplossing:**
- Screenshots exact zoals app eruit ziet
- No marketing fluff in screenshots
- Descriptions accurate

#### Rejection 4: "Privacy Issues"
**Reden:** Privacy policy mist info

**Oplossing:**
- Update privacy policy URL
- Add data collection disclosure
- Explain why permissions needed

#### Rejection 5: "Design Spam"
**Reden:** App lijkt op spam/low quality

**Oplossing:**
- Polish UI
- Remove placeholders
- Professional design
- Complete all features

### 7.3 Metadata-Only Updates

**After approval, you can update WITHOUT review:**
- Description
- Keywords
- Screenshots (sometimes)
- What's New
- Promotional text
- App preview video

**Requires new review:**
- New app version/build
- Price changes
- Availability changes
- Category changes

### 7.4 Phased Release

**Option:** Release to percentage of users first

**Setup:**
```
App Store Connect > Version > Phased Release
- Day 1: 1% of users
- Day 2: 2% of users
- Day 3: 5% of users
- Day 4: 10% of users
- Day 5: 20% of users
- Day 6: 50% of users
- Day 7: 100% of users
```

**Benefits:**
- Catch critical bugs early
- Gradual server load
- Easy rollback if issues

**How to enable:**
- Before "Release this Version"
- Toggle "Phased Release" ON

### 7.5 Launch Day Checklist

**When status = "Pending Developer Release":**

1. **Final Testing:**
   - [ ] Download from TestFlight
   - [ ] Test all critical flows
   - [ ] Check analytics setup
   - [ ] Verify crash reporting

2. **Marketing Prep:**
   - [ ] Social media posts ready
   - [ ] Email announcement ready
   - [ ] Website updated
   - [ ] Press release (if applicable)

3. **Support Prep:**
   - [ ] Support team briefed
   - [ ] FAQ updated
   - [ ] Support email monitored

4. **Release:**
   - [ ] Click "Release This Version"
   - [ ] App goes live in 2-4 hours
   - [ ] Verify in App Store
   - [ ] Send announcements

---

## 📋 FASE 8: POST-LAUNCH MONITORING (Ongoing)

### 8.1 App Store Connect Metrics

**Daily Check:**
```
- Downloads/Installs
- Crashes (should be < 1%)
- Active devices
- Sessions per user
- App Store page views
- Conversion rate
```

**Access:** App Store Connect > Analytics

### 8.2 Crash Reporting

**Xcode Organizer:**
```
Window > Organizer > Crashes
- Review crash logs
- Symbolicate crashes
- Identify patterns
- Fix in next version
```

**Crash Priorities:**
```
Critical: > 5% users affected
High: 1-5% users affected
Medium: 0.1-1% users affected
Low: < 0.1% users affected
```

### 8.3 User Reviews & Ratings

**Monitor:**
- App Store reviews (all countries)
- Respond to reviews when needed
- Track rating over time
- Identify common complaints

**Response Strategy:**
- Respond binnen 48 hours
- Be professional and helpful
- Offer support email for issues
- Thank users for positive reviews

### 8.4 Update Strategy

**Cadence:**
```
Hotfix: Critical bugs (ASAP)
Minor update: Bug fixes + small features (2-4 weeks)
Major update: New features (2-3 months)
```

**Version Numbering:**
```
4.0.0 = Current
4.0.1 = Hotfix
4.1.0 = Minor update
5.0.0 = Major update
```

**Each update requires:**
- New build number (increment!)
- Updated "What's New"
- Full review process again

---

## 📋 FASE 9: MAINTENANCE & UPDATES

### 9.1 Regular Maintenance Tasks

**Weekly:**
- [ ] Check crash reports
- [ ] Review user feedback
- [ ] Monitor performance metrics
- [ ] Test critical flows

**Monthly:**
- [ ] Review analytics trends
- [ ] Plan feature updates
- [ ] Update dependencies
- [ ] Security audit

**Quarterly:**
- [ ] Major feature releases
- [ ] Design refresh (if needed)
- [ ] User satisfaction survey
- [ ] Competitor analysis

### 9.2 iOS Version Updates

**When new iOS releases:**

1. **Beta Testing:**
   ```bash
   # Install Xcode beta
   # Test app on new iOS
   # Fix deprecation warnings
   # Test new features
   ```

2. **Compatibility:**
   - Update deployment target if needed
   - Test on new devices
   - Update Capacitor plugins
   - Fix UI issues

3. **Release:**
   - Submit updated build
   - Update app description (supports iOS X)
   - Market new OS features

### 9.3 Dependency Updates

**Monthly check:**
```bash
cd flow-focus-crm-hub

# Check outdated packages
npm outdated

# Update Capacitor
npm update @capacitor/core @capacitor/ios @capacitor/cli

# Update plugins
npm update @capacitor/camera @capacitor/geolocation
# ... etc

# Sync
npx cap sync ios

# Test thoroughly!
```

### 9.4 Certificate Renewal

**Certificate expires in 1 year!**

**90 days before expiry:**
1. Create new distribution certificate
2. Update provisioning profile
3. Test archive with new certificate
4. Update in Xcode

**Set calendar reminder!**

---

## 🚨 TROUBLESHOOTING

### Common Issues & Solutions

#### Issue 1: "Archive button greyed out"
**Solution:**
```
- Select "Any iOS Device" (not simulator)
- Check scheme is set to Release
- Clean build folder
- Restart Xcode
```

#### Issue 2: "No profiles found"
**Solution:**
```
Xcode > Preferences > Accounts > Download Manual Profiles
Or regenerate in Apple Developer Portal
```

#### Issue 3: "App stuck in Processing"
**Solution:**
```
Wait 24-48 hours
If still stuck, contact Apple Support
Check for email from Apple
```

#### Issue 4: "Build uploaded but not appearing"
**Solution:**
```
Check email for "invalid binary" message
Common causes:
- Missing icons
- Wrong deployment target
- Missing entitlements
Re-archive and upload
```

#### Issue 5: "Stuck in 'Waiting for Review'"
**Solution:**
```
Typical wait: 1-3 days
Expedited review: Contact Apple (only for critical)
Check App Store Connect for messages
```

---

## 📞 SUPPORT & RESOURCES

### Apple Resources

**Documentation:**
- App Store Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- App Store Connect Help: https://developer.apple.com/help/app-store-connect/
- Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/

**Support:**
- Developer Forum: https://developer.apple.com/forums/
- Apple Developer Support: https://developer.apple.com/contact/
- App Review: Use "Contact Us" in App Store Connect

### Internal Resources

**Key Contacts:**
- iOS Developer: [Naam + email]
- Product Manager: [Naam + email]
- Designer: [Naam + email]
- QA Lead: [Naam + email]

**Documentation:**
- This plan: `/IOS_APP_STORE_PUBLISHING_PLAN.md`
- iOS Setup: `/workflow/08-deployment/README_IOS_SETUP.md`
- Mobile Specs: `/MOBIELE_APP_SPECIFICATIES.md`

---

## ✅ FINAL CHECKLIST

### Pre-Submission (Must Complete All)

**Configuration:**
- [ ] Bundle ID consistent overal (com.smanscrm.ios)
- [ ] App name consistent (Smans CRM)
- [ ] Version number correct (4.0.0)
- [ ] Build number incremented (11+)
- [ ] Certificates valid en geïnstalleerd
- [ ] Provisioning profiles updated

**Assets:**
- [ ] All app icons present (alle sizes)
- [ ] Splash screens present
- [ ] Screenshots gemaakt (minimum 3 per size)
- [ ] App preview video (optional)
- [ ] Marketing assets compleet

**Testing:**
- [ ] App launch < 3 seconden
- [ ] Login werkt
- [ ] Alle features werken
- [ ] No crashes bij testing
- [ ] Permissions werken
- [ ] Deep links werken
- [ ] Offline mode werkt
- [ ] Mobile-MCP tests passed

**App Store Connect:**
- [ ] App record aangemaakt
- [ ] Description compleet
- [ ] Keywords entered
- [ ] Screenshots uploaded
- [ ] Privacy policy URL werkt
- [ ] Support URL werkt
- [ ] Demo account credentials klaar
- [ ] Age rating compleet
- [ ] Export compliance answered

**Team:**
- [ ] Stakeholders informed
- [ ] Support team ready
- [ ] Marketing team ready
- [ ] Emergency contact available

### Post-Approval

- [ ] Final build tested via TestFlight
- [ ] Analytics verified
- [ ] Crash reporting verified
- [ ] Release button ready
- [ ] Announcements ready
- [ ] Monitor first 24 hours closely

---

## 🎯 SUCCESS METRICS

### App Store KPIs

**Target Metrics:**
```
Downloads: [Target number in first week/month]
Conversion Rate: > 20% (page views → downloads)
Crash Rate: < 1%
Rating: > 4.0 stars
Review response time: < 48 hours
Update adoption: > 50% in 2 weeks
```

**Track via:**
- App Store Connect Analytics
- Xcode Organizer
- Third-party analytics (if implemented)

---

## 📝 NOTES & RECOMMENDATIONS

### Best Practices

1. **Always increment build number** for new uploads
2. **Test on physical devices** before submission
3. **Provide detailed test instructions** for reviewers
4. **Respond quickly** to review team questions
5. **Monitor first 24 hours** after launch closely
6. **Have rollback plan** ready
7. **Keep demo account** always working
8. **Update regularly** (every 2-3 months minimum)

### Time Investment

**Total estimated time:**
```
Phase 1: Pre-flight Checklist - 2-3 hours
Phase 2: Apple Developer Setup - 1-2 hours
Phase 3: Build & Code Signing - 2-3 hours
Phase 4: Testing with Mobile-MCP - 3-4 hours
Phase 5: App Store Assets - 2-3 hours
Phase 6: Submission - 1-2 hours
Phase 7: Review & Launch - 1-7 days (mostly waiting)
Phase 8: Post-Launch - Ongoing

Total Active Work: ~15-20 hours
Total Calendar Time: 7-14 days (including review)
```

### Budget Considerations

**Costs:**
```
Apple Developer Account: $99/year
Design assets (if outsourced): $500-2000
Testing devices: Already have
Marketing: Variable
Support infrastructure: Existing
```

---

## 🚀 READY TO LAUNCH?

**If alle checkboxen hierboven ✅ zijn:**

1. Run mobile-MCP test suite one more time
2. Create final archive in Xcode
3. Upload to App Store Connect
4. Complete all metadata
5. Click "Submit for Review"
6. Wait for approval (1-3 dagen)
7. Release to App Store
8. 🎉 **CELEBRATE!** 🎉

**Questions or issues?**
- Review troubleshooting section
- Check Apple documentation
- Contact team lead
- Apple Developer Support

---

**Document Version:** 1.0  
**Last Updated:** 7 Oktober 2025  
**Next Review:** Before each major release  
**Owner:** iOS Development Team

**SUCCES MET DE iOS APP STORE LAUNCH! 🚀📱**
