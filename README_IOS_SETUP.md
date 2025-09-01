# iOS Setup Instructies voor Smans CRM

## Overzicht
De iOS configuratie is nu klaar voor Xcode signing op MacBook. Alle bundle identifiers zijn consistent ingesteld op `nl.smanscrm.app`.

## Voorbereiding

### 1. Export naar GitHub en clone project
```bash
# Clone het project vanuit je GitHub repository
git clone [your-github-repo-url]
cd [project-name]
npm install
```

### 2. Capacitor iOS platform toevoegen
```bash
# Voeg iOS platform toe (eerste keer)
npx cap add ios

# Update iOS platform dependencies
npx cap update ios
```

## Development Setup

### Voor Development (met hot-reload)
```bash
# Development build met sandbox URL
npm run ios:dev
```
Dit opent automatisch Xcode met development configuratie die verbindt naar de Lovable sandbox.

### Voor Production Build
```bash
# Production build met productie URL
npm run ios:prod
```

## Xcode Configuratie

### 1. Open project in Xcode
Na het runnen van `npm run ios:dev` of `npm run ios:prod` opent Xcode automatisch.

### 2. Team en Bundle Identifier instellen
1. Selecteer `App` project in navigator
2. Ga naar `Targets` > `App`
3. In `Signing & Capabilities`:
   - Selecteer je Development Team
   - Bundle Identifier is al ingesteld op: `nl.smanscrm.app`
   - Zorg dat "Automatically manage signing" aan staat

### 3. Provisioning Profile
Zorg dat je een geldige provisioning profile hebt voor `nl.smanscrm.app` in je Apple Developer account.

## Build en Run

### Simulator
```bash
# Run in iOS Simulator
npx cap run ios
```

### Physical Device
1. Verbind iPhone/iPad via USB
2. Trust de developer certificate op device
3. Run via Xcode of `npx cap run ios`

## App Store Deployment

### 1. Archive in Xcode
1. Selecteer "Any iOS Device" als target
2. Product > Archive
3. Wacht tot archive compleet is

### 2. Upload naar App Store Connect
1. In Organizer window, selecteer de archive
2. Klik "Distribute App"
3. Kies "App Store Connect"
4. Upload naar Apple

## Belangrijke Bestanden

- `capacitor.config.ts` - Capacitor configuratie met dynamic server URL
- `ios/App/App/Info.plist` - iOS app configuratie en permissions
- `ios/App/Podfile` - CocoaPods dependencies
- `ios/App/ExportOptions.plist` - Export configuratie voor CI/CD

## Troubleshooting

### Bundle Identifier Conflicts
Alle bundle identifiers zijn nu consistent ingesteld op `nl.smanscrm.app`. Als je nog oude references ziet:
```bash
npx cap sync ios
```

### CocoaPods Issues
```bash
cd ios/App
pod install --repo-update
cd ../..
npx cap sync ios
```

### Development Server Connection
Voor development builds, zorg dat de Lovable sandbox toegankelijk is via de URL in `capacitor.config.ts`.

## Development vs Production

De configuratie detecteert automatisch development vs production:
- **Development**: Verbindt met Lovable sandbox voor hot-reload
- **Production**: Verbindt met `https://smanscrm.nl`

Environment wordt bepaald door `CAP_MODE=development` of `NODE_ENV=development`.