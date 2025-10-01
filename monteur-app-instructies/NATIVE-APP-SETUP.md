# Native React Native App - Ready to Sign

## 🎯 Voor Joery - Direct Signen

Je hebt al **native Android en iOS folders** in je project. Ik heb ze volledig voorbereid voor signing.

## 📱 Android Signing (Android Studio)

### Stap 1: Open Project
```bash
# Open Android Studio
# File → Open → Kies: D:\PROJECTEN\LOVABE\flow-focus-crm-hub\android
```

### Stap 2: Generate Keystore (Eerste Keer)

**In Android Studio:**
1. Build → Generate Signed Bundle/APK
2. Kies **Android App Bundle**
3. Klik **Create new...**
4. Vul in:
   - Key store path: `D:\PROJECTEN\LOVABE\flow-focus-crm-hub\android\app\smans-monteur.keystore`
   - Password: `[jouw-keystore-password]`
   - Alias: `smans-monteur-key`
   - Password: `[jouw-key-password]`
   - Validity: 25 years
   - First/Last Name: Smans BV
   - Organization: Smans
   - Country: NL
5. Klik **OK**

### Stap 3: Sign & Build

1. Build → Generate Signed Bundle/APK
2. Kies **Android App Bundle** (voor Play Store)
3. Select keystore: `smans-monteur.keystore`
4. Vul wachtwoorden in
5. Build Variants: **release**
6. Klik **Create**

**Output:**
```
android/app/release/app-release.aab  ← Upload naar Play Store
```

### Optie B: Via Command Line

**Maak eerst:** `android/gradle.properties`
```properties
MYAPP_UPLOAD_STORE_FILE=smans-monteur.keystore
MYAPP_UPLOAD_KEY_ALIAS=smans-monteur-key
MYAPP_UPLOAD_STORE_PASSWORD=jouw-password
MYAPP_UPLOAD_KEY_PASSWORD=jouw-password
```

**Dan build:**
```bash
cd android
./gradlew bundleRelease

# Output: android/app/build/outputs/bundle/release/app-release.aab
```

---

## 🍎 iOS Signing (MacBook + Xcode)

### Stap 1: Open Workspace
```bash
cd ios
open App.xcworkspace
```

### Stap 2: Configure Signing

**In Xcode:**
1. Select **App** target (niet Pods!)
2. Go to **Signing & Capabilities** tab
3. **Team:** Selecteer jouw Apple Developer team
4. **Bundle Identifier:** `nl.smanscrm.monteur` (al ingesteld)
5. Xcode configureert automatisch Provisioning Profile

### Stap 3: Archive & Export

1. **Scheme:** Kies **App** (bovenin)
2. **Device:** Kies **Any iOS Device**
3. **Product → Archive**
4. Wacht tot build compleet is
5. **Organizer** opent automatisch:
   - Klik **Distribute App**
   - Kies **App Store Connect**
   - Klik **Upload**
   - Volg wizard
6. Done!

**Output:** IPA wordt direct naar App Store Connect ge-upload

### Optie B: Ad Hoc Build (Testen)

1. Product → Archive
2. Distribute App → **Ad Hoc**
3. Export IPA
4. Installeer via TestFlight

---

## 📦 App Configuratie (Al Ingesteld)

### Android: `android/app/build.gradle`
```gradle
defaultConfig {
    applicationId "nl.smanscrm.monteur"
    minSdkVersion 24
    targetSdkVersion 34
    versionCode 1
    versionName "1.0.0"
}
```

### iOS: `ios/App/App.xcodeproj/project.pbxproj`
```
PRODUCT_BUNDLE_IDENTIFIER = nl.smanscrm.monteur
MARKETING_VERSION = 1.0.0
CURRENT_PROJECT_VERSION = 1
```

---

## 🔧 Build Configuratie (Al Klaar)

### Android Signing Config

**Bestand:** `android/app/build.gradle`

```gradle
signingConfigs {
    release {
        if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {
            storeFile file(MYAPP_UPLOAD_STORE_FILE)
            storePassword MYAPP_UPLOAD_STORE_PASSWORD
            keyAlias MYAPP_UPLOAD_KEY_ALIAS
            keyPassword MYAPP_UPLOAD_KEY_PASSWORD
        }
    }
}

buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled true
        proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
    }
}
```

### iOS Release Config

**Bestand:** `ios/App/App.xcodeproj/project.pbxproj`

Al geconfigureerd voor:
- Release scheme
- Bitcode disabled (modern default)
- App Transport Security
- Background modes (location, fetch)

---

## 📋 Pre-Build Checklist

### Android
- [ ] Keystore aangemaakt (`smans-monteur.keystore`)
- [ ] Wachtwoorden in `gradle.properties`
- [ ] Bundle ID correct: `nl.smanscrm.monteur`
- [ ] Version code verhoogd bij update
- [ ] Icons toegevoegd in `res/mipmap-*/`
- [ ] Permissions in `AndroidManifest.xml`

### iOS
- [ ] Apple Developer account actief
- [ ] Development team geselecteerd
- [ ] Bundle ID: `nl.smanscrm.monteur`
- [ ] Version number correct
- [ ] Icons in `Assets.xcassets`
- [ ] Provisioning profile OK

---

## 🚀 Quick Build Commands

### Android - Release AAB
```bash
cd android
./gradlew bundleRelease
# Output: android/app/build/outputs/bundle/release/app-release.aab
```

### Android - Release APK (Direct Install)
```bash
cd android
./gradlew assembleRelease
# Output: android/app/build/outputs/apk/release/app-release.apk
```

### iOS - Archive (Command Line)
```bash
cd ios
xcodebuild -workspace App.xcworkspace \
  -scheme App \
  -configuration Release \
  -archivePath App.xcarchive \
  archive
```

---

## 📱 App Store Submission

### Google Play Console

1. Go to [play.google.com/console](https://play.google.com/console)
2. Create app:
   - Name: **Smans Monteur**
   - Language: Dutch
   - App/Game: App
   - Free/Paid: Free
3. Upload AAB:
   - Production → Create new release
   - Upload `app-release.aab`
   - Release notes: "Eerste release"
4. Store Listing:
   - Short description (80 chars max)
   - Full description
   - Screenshots (min 2)
   - Icon (512x512 PNG)
5. Submit for review

### Apple App Store Connect

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. My Apps → + → New App
3. Fill in:
   - Platform: iOS
   - Name: **Smans Monteur**
   - Language: Dutch
   - Bundle ID: nl.smanscrm.monteur
   - SKU: smans-monteur-app
4. Upload build (via Xcode Archive)
5. App Information:
   - Category: Business
   - Screenshots (min 1 per device size)
   - Description
6. Pricing: Free
7. Submit for review

---

## 🐛 Troubleshooting

### Android: Keystore Issues

**Error: Keystore not found**
```bash
# Create keystore manually:
keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore smans-monteur.keystore \
  -alias smans-monteur-key \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

**Error: Gradle version**
```bash
cd android
./gradlew wrapper --gradle-version 8.3
```

### iOS: Signing Issues

**Error: No provisioning profiles**
- Xcode → Preferences → Accounts
- Select team → Download Manual Profiles
- Try again

**Error: Certificate not found**
- Go to [developer.apple.com](https://developer.apple.com)
- Certificates → + → iOS Distribution
- Download & Install in Keychain

### iOS: Archive fails

**Error: Build fails**
```bash
cd ios
pod install
pod update
```

**Error: Scheme not found**
- Xcode → Product → Scheme → Manage Schemes
- Check **App** scheme is shared
- Try again

---

## 📝 Store Listing Content

### App Naam
```
Smans Monteur
```

### Korte Beschrijving (80 chars - Play Store)
```
Projecten, tijd registratie en foto's voor Smans monteurs
```

### Beschrijving (Beide Stores)
```
De Smans Monteur app is speciaal ontwikkeld voor monteurs van Smans BV.

Functionaliteiten:
• Bekijk toegewezen projecten en opdrachten
• Registreer gewerkte uren per project
• Upload foto's van uitgevoerd werk
• Bekijk klantinformatie en adressen
• Real-time synchronisatie met kantoor

Deze app is uitsluitend bedoeld voor medewerkers van Smans BV.
```

### Keywords (App Store)
```
monteur, crm, tijd registratie, projecten, werkuren
```

### Screenshots Nodig

**Android:**
- Min 2 screenshots
- 1080 x 1920 pixels (portrait)
- Toon: Dashboard, Projecten lijst, Tijd registratie

**iOS:**
- Min 1 screenshot per device
- 6.5" iPhone: 1242 x 2688
- 12.9" iPad: 2048 x 2732
- Toon: Zelfde als Android

---

## ✅ Final Checklist

**Voor Android:**
- [ ] Keystore aangemaakt en veilig bewaard
- [ ] AAB file gebuild
- [ ] Play Console app aangemaakt
- [ ] Store listing compleet
- [ ] Screenshots toegevoegd
- [ ] Privacy policy URL (indien nodig)
- [ ] App gesubmit voor review

**Voor iOS:**
- [ ] Apple Developer account
- [ ] Xcode signing geconfigureerd
- [ ] Archive succesvol
- [ ] App Store Connect app aangemaakt
- [ ] Build ge-upload
- [ ] Store listing compleet
- [ ] Screenshots toegevoegd
- [ ] App gesubmit voor review

---

## 🎉 Ready to Ship!

De native app folders zijn **volledig voorbereid**. Volg de stappen hierboven om:

1. **Android:** Open Android Studio → Sign → Build → Upload
2. **iOS:** Open Xcode → Archive → Distribute → Upload

**Success! 🚀**

