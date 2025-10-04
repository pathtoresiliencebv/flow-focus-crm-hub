# Technische Specificaties - Smans CRM Mobile App

## Technology Stack

### Frontend Framework
- **React Native**: 0.72+
- **Expo SDK**: 49.0+
- **TypeScript**: 5.0+
- **Expo Router**: Voor file-based routing
- **Expo Application Services**: Build en deployment

### State Management
- **Zustand**: Lightweight state management
- **TanStack Query**: Server state management
- **AsyncStorage**: Lokale preferences
- **SQLite**: Offline database storage

### UI Components & Styling
- **React Native Elements**: UI component library
- **React Native Vector Icons**: Icon set
- **React Native Reanimated**: Animations
- **React Native Gesture Handler**: Touch gestures
- **StyleSheet**: Native styling

### Native Capabilities
- **expo-camera**: Camera access
- **expo-location**: GPS en locatie
- **expo-local-authentication**: Biometric auth
- **expo-notifications**: Push notifications
- **expo-file-system**: File management
- **expo-sqlite**: Database operations
- **expo-image-picker**: Gallery access
- **expo-document-picker**: Document selection

## Architecture Overview

### MVVM Pattern
```
View Layer (React Native Components)
├── Screens
├── Components  
└── Navigation

ViewModel Layer (Hooks & State)
├── Custom Hooks
├── State Management (Zustand)
└── API Layer (TanStack Query)

Model Layer (Data & Services)
├── API Services
├── Database Services
├── Sync Services
└── Storage Services
```

### Data Flow
```
UI Components → Custom Hooks → API/Database Services → Supabase Backend
                ↓
         Local State (Zustand) ← → Offline Database (SQLite)
```

## Core Modules

### 1. Authentication Module
```typescript
// AuthService.ts
class AuthService {
  async login(email: string, password: string): Promise<User>
  async biometricLogin(): Promise<User>
  async logout(): Promise<void>
  async refreshToken(): Promise<string>
  async checkAuthStatus(): Promise<boolean>
}

// useBiometricAuth.ts
export const useBiometricAuth = () => {
  const authenticate = async (): Promise<boolean>
  const isAvailable = async (): Promise<boolean>
  const getSupportedTypes = async (): Promise<string[]>
}
```

### 2. Project Management Module
```typescript
// ProjectService.ts
interface Project {
  id: string;
  title: string;
  customer_name: string;
  address: string;
  status: 'pending' | 'in_progress' | 'completed';
  tasks: Task[];
  materials: Material[];
  start_date: string;
  estimated_hours: number;
}

class ProjectService {
  async getProjects(): Promise<Project[]>
  async getProjectById(id: string): Promise<Project>
  async updateProjectStatus(id: string, status: string): Promise<void>
  async startProject(id: string): Promise<void>
  async completeProject(id: string): Promise<void>
}
```

### 3. Camera & Media Module
```typescript
// useCameraCapture.ts
export const useCameraCapture = () => {
  const capturePhoto = async (category: PhotoCategory): Promise<MediaFile>
  const captureDocument = async (): Promise<MediaFile>
  const selectFromGallery = async (): Promise<MediaFile>
  const compressImage = async (uri: string): Promise<string>
}

interface MediaFile {
  id: string;
  uri: string;
  type: 'image' | 'document';
  category: PhotoCategory;
  project_id: string;
  timestamp: number;
  location?: GeolocationData;
  compressed_uri?: string;
}
```

### 4. Offline Sync Module
```typescript
// SyncService.ts
class SyncService {
  async syncProjects(): Promise<void>
  async syncMediaFiles(): Promise<void>
  async syncTimeRegistrations(): Promise<void>
  async syncMaterials(): Promise<void>
  async handleConflicts(conflicts: SyncConflict[]): Promise<void>
}

interface SyncOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  table: string;
  data: any;
  timestamp: number;
  synced: boolean;
}
```

## Database Schema (Local SQLite)

### Projects Table
```sql
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  address TEXT,
  status TEXT DEFAULT 'pending',
  start_date TEXT,
  estimated_hours INTEGER,
  actual_hours REAL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  synced INTEGER DEFAULT 0
);
```

### Tasks Table
```sql
CREATE TABLE project_tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  completed INTEGER DEFAULT 0,
  block_name TEXT,
  order_index INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  synced INTEGER DEFAULT 0,
  FOREIGN KEY (project_id) REFERENCES projects (id)
);
```

### Time Registrations Table
```sql
CREATE TABLE time_registrations (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT,
  break_duration INTEGER DEFAULT 0,
  total_hours REAL,
  notes TEXT,
  location_start TEXT,
  location_end TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  synced INTEGER DEFAULT 0,
  FOREIGN KEY (project_id) REFERENCES projects (id)
);
```

### Materials Table
```sql
CREATE TABLE project_materials (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  quantity REAL NOT NULL,
  unit TEXT,
  price REAL,
  supplier TEXT,
  receipt_photo TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  synced INTEGER DEFAULT 0,
  FOREIGN KEY (project_id) REFERENCES projects (id)
);
```

### Media Files Table
```sql
CREATE TABLE media_files (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  file_path TEXT NOT NULL,
  compressed_path TEXT,
  file_type TEXT NOT NULL,
  category TEXT,
  timestamp TEXT NOT NULL,
  location_data TEXT,
  synced INTEGER DEFAULT 0,
  uploaded_url TEXT,
  FOREIGN KEY (project_id) REFERENCES projects (id)
);
```

### Sync Queue Table
```sql
CREATE TABLE sync_queue (
  id TEXT PRIMARY KEY,
  operation_type TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  data TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  retry_count INTEGER DEFAULT 0,
  last_error TEXT
);
```

## API Integration (Supabase)

### Supabase Configuration
```typescript
// supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pvesgvkyiaqmsudmmtkc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Core API Operations
```typescript
// ProjectAPI.ts
export class ProjectAPI {
  static async fetchProjects(userId: string): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        project_tasks(*),
        project_materials(*),
        media_files(*)
      `)
      .eq('assigned_to', userId);
    
    if (error) throw error;
    return data;
  }

  static async updateProjectStatus(
    projectId: string, 
    status: string
  ): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', projectId);
    
    if (error) throw error;
  }

  static async uploadMedia(
    file: MediaFile,
    projectId: string
  ): Promise<string> {
    const fileName = `${projectId}/${Date.now()}_${file.id}`;
    const { data, error } = await supabase.storage
      .from('project-media')
      .upload(fileName, file.uri);
    
    if (error) throw error;
    return data.path;
  }
}
```

## Offline Sync Strategy

### Sync Operations
```typescript
enum SyncType {
  PROJECT_UPDATE = 'PROJECT_UPDATE',
  TASK_COMPLETION = 'TASK_COMPLETION',
  TIME_REGISTRATION = 'TIME_REGISTRATION',
  MATERIAL_ADDITION = 'MATERIAL_ADDITION',
  MEDIA_UPLOAD = 'MEDIA_UPLOAD'
}

interface SyncOperation {
  id: string;
  type: SyncType;
  data: any;
  timestamp: number;
  retryCount: number;
  lastError?: string;
}
```

### Conflict Resolution
```typescript
enum ConflictResolution {
  CLIENT_WINS = 'CLIENT_WINS',
  SERVER_WINS = 'SERVER_WINS',
  MERGE = 'MERGE',
  USER_CHOICE = 'USER_CHOICE'
}

interface ConflictResolver {
  resolveProjectConflict(
    localProject: Project,
    serverProject: Project
  ): Promise<Project>;
  
  resolveTimeConflict(
    localTime: TimeRegistration,
    serverTime: TimeRegistration
  ): Promise<TimeRegistration>;
}
```

## Security Implementation

### Authentication Flow
```typescript
// useAuthFlow.ts
export const useAuthFlow = () => {
  const biometricAuth = async (): Promise<boolean> => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticeer voor toegang',
      fallbackLabel: 'Gebruik wachtwoord',
    });
    return result.success;
  };

  const loginWithCredentials = async (
    email: string, 
    password: string
  ): Promise<User> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return data.user;
  };
};
```

### Data Encryption
```typescript
// EncryptionService.ts
import CryptoJS from 'crypto-js';

export class EncryptionService {
  private static readonly SECRET_KEY = 'your-encryption-key';

  static encrypt(data: string): string {
    return CryptoJS.AES.encrypt(data, this.SECRET_KEY).toString();
  }

  static decrypt(encryptedData: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedData, this.SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  }
}
```

## Performance Optimizations

### Image Compression
```typescript
// ImageService.ts
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export const compressImage = async (uri: string): Promise<string> => {
  const result = await manipulateAsync(
    uri,
    [{ resize: { width: 1200 } }],
    { compress: 0.7, format: SaveFormat.JPEG }
  );
  return result.uri;
};
```

### Background Sync
```typescript
// BackgroundSync.ts
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

const BACKGROUND_SYNC = 'background-sync';

TaskManager.defineTask(BACKGROUND_SYNC, async () => {
  try {
    const syncService = new SyncService();
    await syncService.performBackgroundSync();
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export const registerBackgroundSync = async () => {
  await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC, {
    minimumInterval: 15 * 60, // 15 minutes
    stopOnTerminate: false,
    startOnBoot: true,
  });
};
```

## Build Configuration

### Expo Configuration (app.json)
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
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "nl.smanscrm.app",
      "infoPlist": {
        "NSCameraUsageDescription": "Deze app gebruikt de camera voor foto's",
        "NSLocationWhenInUseUsageDescription": "Deze app gebruikt locatie voor project tracking"
      }
    },
    "android": {
      "package": "nl.smanscrm.app",
      "permissions": [
        "CAMERA",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "WRITE_EXTERNAL_STORAGE",
        "READ_EXTERNAL_STORAGE"
      ]
    },
    "plugins": [
      "expo-camera",
      "expo-location",
      "expo-local-authentication",
      "expo-sqlite",
      "expo-notifications"
    ]
  }
}
```

### EAS Build Configuration (eas.json)
```json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "aab"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

## Dependencies Package.json
```json
{
  "dependencies": {
    "expo": "~49.0.0",
    "expo-router": "^2.0.0",
    "react-native": "0.72.4",
    "@supabase/supabase-js": "^2.38.0",
    "zustand": "^4.4.0",
    "@tanstack/react-query": "^4.32.0",
    "expo-camera": "~13.4.0",
    "expo-location": "~16.1.0",
    "expo-local-authentication": "~13.4.0",
    "expo-sqlite": "~11.3.0",
    "expo-notifications": "~0.20.0",
    "expo-file-system": "~15.4.0",
    "expo-image-picker": "~14.3.0",
    "expo-document-picker": "~11.5.0",
    "react-native-reanimated": "~3.3.0",
    "react-native-gesture-handler": "~2.12.0",
    "react-native-vector-icons": "^10.0.0"
  }
}
```