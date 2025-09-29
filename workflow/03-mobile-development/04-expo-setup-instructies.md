# Expo Setup Instructies - Smans CRM Mobile App

## Voorbereiding

### 1. Development Environment Setup
```bash
# Node.js installeren (v18 of hoger)
node --version  # Controleer versie

# Expo CLI installeren
npm install -g @expo/cli

# EAS CLI installeren voor builds
npm install -g eas-cli

# Controleer installatie
expo --version
eas --version
```

### 2. Expo Account Setup
```bash
# Login naar Expo account
expo login

# Controleer account status
expo whoami
```

## Project Initialisatie

### 1. Nieuw Expo Project Aanmaken
```bash
# Maak nieuw project aan
npx create-expo-app smans-crm-mobile --template

# Navigeer naar project folder
cd smans-crm-mobile

# Installeer dependencies
npm install
```

### 2. TypeScript Setup
```bash
# TypeScript dependencies toevoegen
npm install --save-dev typescript @types/react @types/react-native

# TypeScript config aanmaken
npx expo install --fix
```

### 3. Expo Router Setup
```bash
# Expo Router installeren
npx expo install expo-router react-native-safe-area-context react-native-screens

# Update app.json voor router
```

## Required Dependencies Installeren

### 1. Core Dependencies
```bash
# Supabase client
npm install @supabase/supabase-js

# State management
npm install zustand @tanstack/react-query

# UI Components
npm install react-native-elements react-native-vector-icons
npm install react-native-reanimated react-native-gesture-handler
```

### 2. Native Capabilities
```bash
# Camera en media
npx expo install expo-camera expo-image-picker expo-av
npx expo install expo-image-manipulator expo-media-library

# Location services
npx expo install expo-location

# Authentication
npx expo install expo-local-authentication

# Storage en database
npx expo install expo-sqlite expo-file-system expo-secure-store

# Notifications
npx expo install expo-notifications expo-device

# Other utilities
npx expo install expo-document-picker expo-sharing expo-print
```

## Project Structuur Setup

### 1. Folder Structuur Aanmaken
```
src/
├── components/
│   ├── common/
│   ├── forms/
│   ├── navigation/
│   └── ui/
├── screens/
│   ├── auth/
│   ├── dashboard/
│   ├── projects/
│   ├── camera/
│   └── profile/
├── hooks/
├── services/
│   ├── api/
│   ├── database/
│   ├── sync/
│   └── storage/
├── store/
├── types/
├── utils/
└── constants/
```

### 2. Basis Files Aanmaken
```bash
# Maak basis folders aan
mkdir -p src/{components,screens,hooks,services,store,types,utils,constants}
mkdir -p src/components/{common,forms,navigation,ui}
mkdir -p src/screens/{auth,dashboard,projects,camera,profile}
mkdir -p src/services/{api,database,sync,storage}
```

## Configuration Files

### 1. app.json Update
```json
{
  "expo": {
    "name": "Smans CRM",
    "slug": "smans-crm",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#007AFF"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "nl.smanscrm.app",
      "infoPlist": {
        "NSCameraUsageDescription": "Deze app gebruikt de camera om foto's te maken van projecten en bonnetjes",
        "NSLocationWhenInUseUsageDescription": "Deze app gebruikt locatie om projecten te tracken en aankomst te registreren",
        "NSMicrophoneUsageDescription": "Deze app kan microfoon gebruiken voor video opnames",
        "NSPhotoLibraryUsageDescription": "Deze app gebruikt de fotogalerij om bestaande foto's te selecteren"
      }
    },
    "android": {
      "package": "nl.smanscrm.app",
      "permissions": [
        "CAMERA",
        "RECORD_AUDIO",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "WRITE_EXTERNAL_STORAGE",
        "READ_EXTERNAL_STORAGE",
        "VIBRATE",
        "USE_BIOMETRIC",
        "USE_FINGERPRINT"
      ]
    },
    "plugins": [
      "expo-router",
      "expo-camera",
      "expo-location",
      "expo-local-authentication",
      "expo-sqlite",
      "expo-notifications",
      [
        "expo-image-picker",
        {
          "photosPermission": "Deze app gebruikt toegang tot foto's om bestaande afbeeldingen te selecteren"
        }
      ]
    ],
    "scheme": "smanscrm",
    "web": {
      "bundler": "metro"
    }
  }
}
```

### 2. TypeScript Configuration (tsconfig.json)
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"],
      "@/screens/*": ["src/screens/*"],
      "@/hooks/*": ["src/hooks/*"],
      "@/services/*": ["src/services/*"],
      "@/store/*": ["src/store/*"],
      "@/types/*": ["src/types/*"],
      "@/utils/*": ["src/utils/*"],
      "@/constants/*": ["src/constants/*"]
    }
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    ".expo/types/**/*.ts",
    "expo-env.d.ts"
  ]
}
```

### 3. Metro Configuration (metro.config.js)
```javascript
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for additional file extensions
config.resolver.assetExts.push('db', 'sqlite');

module.exports = config;
```

## EAS Build Setup

### 1. EAS Project Initialiseren
```bash
# EAS project initialiseren
eas init

# Build configuratie aanmaken
eas build:configure
```

### 2. EAS Configuration (eas.json)
```json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "resourceClass": "m1-medium"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "android": {
        "buildType": "aab"
      },
      "ios": {
        "resourceClass": "m1-medium"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

## Environment Variables Setup

### 1. Environment Files Aanmaken
```bash
# .env.local aanmaken
touch .env.local

# .env.example aanmaken voor documentatie
touch .env.example
```

### 2. Environment Variables (.env.local)
```bash
# Supabase configuratie
EXPO_PUBLIC_SUPABASE_URL=https://pvesgvkyiaqmsudmmtkc.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# App configuratie
EXPO_PUBLIC_APP_NAME=Smans CRM
EXPO_PUBLIC_APP_VERSION=1.0.0

# Development settings
EXPO_PUBLIC_ENABLE_DEV_TOOLS=true
EXPO_PUBLIC_LOG_LEVEL=debug
```

### 3. Constants File (src/constants/config.ts)
```typescript
export const CONFIG = {
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL!,
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  APP_NAME: process.env.EXPO_PUBLIC_APP_NAME || 'Smans CRM',
  APP_VERSION: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
  ENABLE_DEV_TOOLS: process.env.EXPO_PUBLIC_ENABLE_DEV_TOOLS === 'true',
};
```

## Development Workflow

### 1. Local Development
```bash
# Start development server
npx expo start

# Start met specific platform
npx expo start --ios
npx expo start --android

# Start met device specific
npx expo start --device

# Clear cache
npx expo start --clear
```

### 2. Testing on Device
```bash
# Installeer Expo Go app op telefoon
# Scan QR code of gebruik device selector

# Voor development builds
eas device:create
eas build --profile development --platform ios
eas build --profile development --platform android
```

### 3. Building
```bash
# Development build
eas build --profile development --platform all

# Preview build (voor testing)
eas build --profile preview --platform all

# Production build
eas build --profile production --platform all
```

## Database Setup

### 1. SQLite Initialisatie
```typescript
// src/services/database/database.ts
import * as SQLite from 'expo-sqlite';

export const initDatabase = async () => {
  const db = SQLite.openDatabase('smanscrm.db');
  
  return new Promise<SQLite.WebSQLDatabase>((resolve, reject) => {
    db.transaction(tx => {
      // Create tables here
      tx.executeSql(`
        CREATE TABLE IF NOT EXISTS projects (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          customer_name TEXT NOT NULL,
          status TEXT DEFAULT 'pending',
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          synced INTEGER DEFAULT 0
        );
      `);
    }, reject, () => resolve(db));
  });
};
```

## Debugging Setup

### 1. React Native Debugger
```bash
# Installeer React Native Debugger
# https://github.com/jhen0409/react-native-debugger

# Enable debugging
npx expo start --dev-client
```

### 2. Flipper Integration (optioneel)
```bash
# Flipper plugins installeren
npm install --save-dev react-native-flipper
```

### 3. Error Tracking Setup
```bash
# Sentry installeren voor error tracking
npx expo install @sentry/react-native

# Configureer in app.json
```

## Performance Monitoring

### 1. Bundle Analyzer
```bash
# Analyseer bundle size
npx expo export --experimental-bundle-analyzer
```

### 2. Performance Profiling
```typescript
// Performance monitoring hooks
import { useCallback } from 'react';

export const usePerformanceMonitor = () => {
  const trackScreenTime = useCallback((screenName: string) => {
    const startTime = Date.now();
    return () => {
      const endTime = Date.now();
      console.log(`Screen ${screenName}: ${endTime - startTime}ms`);
    };
  }, []);

  return { trackScreenTime };
};
```

## Deployment Checklist

### Development Phase
- [ ] Expo CLI geïnstalleerd
- [ ] EAS CLI geïnstalleerd
- [ ] Project geïnitialiseerd
- [ ] Dependencies geïnstalleerd
- [ ] TypeScript geconfigureerd
- [ ] Development server draait

### Testing Phase
- [ ] Expo Go app test geslaagd
- [ ] Development build gemaakt
- [ ] Camera functionaliteit getest
- [ ] Database operaties getest
- [ ] Offline functionaliteit getest

### Production Phase
- [ ] Environment variables geconfigureerd
- [ ] Icons en splash screen toegevoegd
- [ ] App permissions geconfigureerd
- [ ] Production build geslaagd
- [ ] Store listing voorbereid

## Troubleshooting

### Common Issues
1. **Metro bundler errors**: Clear cache met `npx expo start --clear`
2. **Native module issues**: Rebuild met `eas build`
3. **iOS simulator issues**: Reset simulator
4. **Android build failures**: Check Android SDK setup

### Performance Issues
1. **Slow startup**: Optimize app.json en remove unused dependencies
2. **Large bundle size**: Use bundle analyzer
3. **Memory leaks**: Use React DevTools Profiler
4. **Database performance**: Add proper indexes

### Platform Specific Issues
1. **iOS permissions**: Check Info.plist configuration
2. **Android permissions**: Check AndroidManifest.xml
3. **Safe area issues**: Use react-native-safe-area-context
4. **Navigation issues**: Check expo-router configuration