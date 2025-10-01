# Smans CRM - Expo Go Setup

Deze app is nu gereed voor Expo Go development naast de bestaande Capacitor setup.

## Quick Start

### Voor Web Development (bestaande workflow)
```bash
npm run dev
```

### Voor Expo Go Development
```bash
# Installeer Expo CLI (eenmalig)
npm install -g @expo/cli

# Start Expo development server
npx expo start

# Of start met specifieke platform
npx expo start --ios
npx expo start --android
npx expo start --web
```

## Dual Platform Support

De app ondersteunt nu zowel:
- **Web/Capacitor**: Bestaande functionaliteit blijft intact
- **Expo Go**: Native mobile development met Expo

### Platform Detection
De app detecteert automatisch het platform en gebruikt:
- **Web**: React Router + Capacitor native features
- **Native**: Expo Router + Expo native features

### File Structure
```
/app/                 # Expo Router pages (native)
/src/                 # Bestaande web components
├── hooks/
│   ├── useNativePlatform.ts    # Platform abstraction layer
│   └── ...
└── components/
    └── ...
```

## Native Features

### Camera
- **Web**: `@capacitor/camera`
- **Native**: `expo-camera`

### Location
- **Web**: `@capacitor/geolocation`
- **Native**: `expo-location`

### Storage
- **Web**: `@capacitor/preferences`
- **Native**: `@react-native-async-storage/async-storage`

## Development Workflow

1. **Web Development**: Continue using `npm run dev`
2. **Mobile Development**: Use `npx expo start` and scan QR code with Expo Go
3. **Testing**: Both platforms share the same backend (Supabase)

## Building for Production

### Expo Build
```bash
# Build for development
npx expo build:ios --type development
npx expo build:android --type development

# Build for production
eas build --platform ios --profile production
eas build --platform android --profile production
```

### Capacitor Build (bestaande)
```bash
npm run build
npx cap sync
npx cap run ios
npx cap run android
```

## Permissions

De app vraagt automatisch om de juiste permissions:
- Camera access
- Location access
- Storage access
- Microphone (voor video)

## Troubleshooting

### Expo Go
- Zorg dat phone en computer op hetzelfde netwerk zijn
- Update Expo Go app naar laatste versie
- Clear cache: `npx expo start --clear`

### Platform Issues
- TypeScript errors: Check platform-specific imports
- Native features not working: Check permissions in app.json
- Styling issues: NativeWind is configured voor consistency

## Next Steps

1. Test de app in Expo Go
2. Voeg platform-specific features toe waar nodig
3. Configure EAS Build voor app store deployment
4. Sync styling tussen web en native

De app behoudt alle bestaande functionaliteit terwijl het nu ook native development ondersteunt!