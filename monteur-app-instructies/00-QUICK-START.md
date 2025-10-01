# Monteur App - Quick Start Guide

## 🚀 Voor Joery - Direct Klaar voor Signing

Deze app is **volledig voorbereid** en klaar om te builden. Je hoeft alleen nog te **signen** in Android Studio en op je MacBook.

## 📱 Wat is Geïmplementeerd

### ✅ Functionaliteit
- **Dashboard** met dagelijkse opdrachten en statistieken
- **Projecten lijst** met toegewezen projecten voor monteur
- **Project details** met klantinfo en werkzaamheden
- **Tijd registratie** met start/stop functie
- **Foto uploads** bij projecten
- **Offline support** met AsyncStorage
- **Real-time updates** via Supabase

### ✅ Technical
- **Supabase integratie** compleet
- **Authentication** voor monteurs
- **React Query** voor data caching
- **Expo Router** voor navigatie
- **TypeScript** types overal
- **Error handling** en loading states

## 🔧 Build Instructies

### Android (Android Studio)

1. **Open Android Studio**
   ```bash
   cd android
   # Open dit in Android Studio
   ```

2. **Build Configuratie**
   - File → Project Structure → Modules
   - Set `minSdkVersion: 24`
   - Set `targetSdkVersion: 34`
   - Set `compileSdkVersion: 34`

3. **Signing**
   - Build → Generate Signed Bundle/APK
   - Kies **Android App Bundle** (AAB voor Play Store)
   - Of kies **APK** (voor direct installeren)
   - Selecteer je keystore
   - Vul wachtwoorden in
   - Kies **release** build variant
   - Klik **Finish**

4. **Output Locatie**
   ```
   android/app/release/app-release.aab
   android/app/release/app-release.apk
   ```

### iOS (MacBook + Xcode)

1. **Open Xcode**
   ```bash
   cd ios
   open App.xcworkspace
   ```

2. **Team & Signing**
   - Select **App** target
   - Go to **Signing & Capabilities**
   - Select your **Development Team**
   - Xcode kiest automatisch **Provisioning Profile**

3. **Build Configuratie**
   - Product → Scheme → Edit Scheme
   - Set **Build Configuration** to **Release**
   - Close

4. **Archive & Export**
   - Product → Archive
   - Wacht tot build klaar is
   - Window → Organizer opent automatisch
   - Klik **Distribute App**
   - Kies **App Store Connect** (voor App Store)
   - Of kies **Ad Hoc** (voor TestFlight)
   - Follow the wizard
   - Klik **Upload**

5. **Output Locatie**
   ```
   ~/Library/Developer/Xcode/Archives/
   ```

## ⚙️ App Configuratie

### App Naam & Bundle ID

**Android:** `android/app/build.gradle`
```gradle
defaultConfig {
    applicationId "nl.smanscrm.monteur"
    versionCode 1
    versionName "1.0.0"
}
```

**iOS:** `ios/App/App.xcodeproj/project.pbxproj`
```
PRODUCT_BUNDLE_IDENTIFIER = nl.smanscrm.monteur
```

### App Icons

Icons zijn al voorbereid in:
- `android/app/src/main/res/mipmap-*/ic_launcher.png`
- `ios/App/Assets.xcassets/AppIcon.appiconset/`

Als je custom icon wilt:
```bash
npx expo prebuild --clean
# Upload je icon.png (1024x1024) in assets/
```

### Environment Variables

Supabase credentials staan in `.env`:
```bash
EXPO_PUBLIC_SUPABASE_URL=https://pvesgvkyiaqmsudmmtkc.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🧪 Testen voor Build

### Local Test (Development)

```bash
# iOS Simulator
npx expo run:ios

# Android Emulator
npx expo run:android

# Expo Go (snellere test)
npx expo start
```

### Production Test

```bash
# iOS Release build test
npx expo run:ios --configuration Release

# Android Release build test
npx expo run:android --variant release
```

## 📦 Pre-Build Checklist

- [ ] App naam correct in `app.json`
- [ ] Bundle ID correct (Android & iOS)
- [ ] Version numbers up-to-date
- [ ] Supabase credentials in `.env`
- [ ] Icons zijn toegevoegd
- [ ] Splash screen is correct
- [ ] Permissions zijn toegevoegd (Camera, Storage)
- [ ] Test app werkt in development mode

## 🎯 Direct Signen

### Android - Snel Proces

```bash
cd android
./gradlew assembleRelease
# Vind APK in: android/app/build/outputs/apk/release/
```

Of via Android Studio GUI:
1. Build → Generate Signed Bundle/APK
2. Volg wizard
3. Done!

### iOS - Snel Proces

1. Open Xcode
2. Select Team
3. Product → Archive
4. Distribute
5. Done!

## 🐛 Troubleshooting

### Android Build Fails

**Error: SDK not found**
```bash
# In android/local.properties add:
sdk.dir=/Users/YOUR_USERNAME/Library/Android/sdk
```

**Error: Gradle version**
```bash
cd android
./gradlew wrapper --gradle-version 8.3
```

### iOS Build Fails

**Error: Provisioning Profile**
- Xcode → Preferences → Accounts
- Download Manual Profiles
- Try again

**Error: CocoaPods**
```bash
cd ios
pod install
```

## 📱 App Store Submission

### Google Play Console

1. Go to [play.google.com/console](https://play.google.com/console)
2. Create new app
3. Upload AAB file
4. Fill in store listing
5. Submit for review

### Apple App Store Connect

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. My Apps → + → New App
3. Upload via Xcode (Archive → Upload)
4. Fill in App Information
5. Submit for review

## 🔑 Signing Credentials (BEWAAR VEILIG!)

### Android Keystore

Locatie: `android/app/my-release-key.keystore`

```properties
# android/gradle.properties
MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=my-key-alias
MYAPP_RELEASE_STORE_PASSWORD=****
MYAPP_RELEASE_KEY_PASSWORD=****
```

### iOS Certificates

- Apple Developer Account: [developer.apple.com](https://developer.apple.com)
- Certificates, Identifiers & Profiles
- Download alle certificates
- Install in Keychain

## ✅ Final Check

Voordat je upload naar stores:

- [ ] App werkt op echte device (niet alleen simulator)
- [ ] Alle features functioneel (login, projecten, tijd, foto's)
- [ ] Offline mode werkt
- [ ] Performance is goed (geen crashes)
- [ ] Privacy policy URL toegevoegd
- [ ] Screenshots gemaakt voor store listing
- [ ] App description geschreven

## 🚀 Ready to Ship!

**Android:**
```bash
cd android
./gradlew bundleRelease
# Upload android/app/build/outputs/bundle/release/app-release.aab
```

**iOS:**
```bash
# Open Xcode
# Product → Archive → Distribute App
# Upload to App Store Connect
```

**Done! 🎉**

---

**Volgende documenten bevatten alle code en implementatie details.**

