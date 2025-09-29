# Mobile Development Guide - Flow Focus CRM Hub

This guide covers mobile-specific development patterns, best practices, and iOS/Android considerations for the Flow Focus CRM Hub application.

## 📱 Mobile Architecture Overview

### Technology Stack
- **Framework**: React + TypeScript
- **Mobile Bridge**: Capacitor 5+
- **UI Components**: Custom iOS/Android native-feeling components
- **State Management**: React hooks + Supabase real-time
- **Navigation**: Native-style navigation patterns
- **Storage**: Capacitor Storage + IndexedDB
- **Offline Support**: Service Workers + Background Sync

### Project Structure
```
src/
├── components/
│   ├── mobile/
│   │   ├── ios/                 # iOS-specific components
│   │   ├── android/            # Android-specific components
│   │   └── shared/             # Cross-platform mobile components
├── hooks/
│   ├── mobile/                 # Mobile-specific hooks
├── styles/
│   ├── ios.css                 # iOS native styling
│   ├── android.css             # Material Design styling
└── utils/
    ├── mobile/                 # Mobile utilities

ios/                            # iOS native configuration
android/                        # Android native configuration
capacitor.config.ts            # Capacitor configuration
```

## 🍎 iOS Development

### Design Principles
The iOS app follows Apple's Human Interface Guidelines with:
- **Navigation**: Native iOS navigation patterns
- **Typography**: SF Pro font system
- **Colors**: iOS system colors
- **Components**: Native iOS component behavior
- **Gestures**: iOS-standard touch interactions

### Key iOS Components

#### IOSNavigationBar
```tsx
import { IOSNavigationBar, IOSNavigationBarConfigs } from '@/components/mobile/ios/IOSNavigationBar';

// Usage examples
<IOSNavigationBar
  {...IOSNavigationBarConfigs.back('Projects', () => router.back())}
/>

<IOSNavigationBar
  {...IOSNavigationBarConfigs.settings('Dashboard', () => openSettings())}
/>
```

#### IOSTabBar
```tsx
import { IOSTabBar } from '@/components/mobile/ios/IOSTabBar';

<IOSTabBar
  activeTab={activeTab}
  onTabChange={setActiveTab}
  unreadCount={messageCount}
/>
```

#### IOSActionSheet
```tsx
import { IOSActionSheet, useIOSActionSheet } from '@/components/mobile/ios/IOSActionSheet';

const actionSheet = useIOSActionSheet();

// Show action sheet
actionSheet.showActionSheet({
  title: 'Project Actions',
  options: [
    {
      label: 'Edit Project',
      icon: <Edit className="h-5 w-5" />,
      onClick: () => editProject(),
    },
    {
      label: 'Delete Project',
      icon: <Trash className="h-5 w-5" />,
      onClick: () => deleteProject(),
      destructive: true,
    },
  ],
});
```

### iOS-Specific Styling
```css
/* Safe Area Support */
.safe-area-pt { padding-top: env(safe-area-inset-top); }
.safe-area-pb { padding-bottom: env(safe-area-inset-bottom); }

/* iOS Native Colors */
.ios-button-primary {
  background: #007AFF;
  color: white;
  border-radius: 8px;
  font-weight: 600;
}

/* iOS Typography */
.ios-title {
  font-size: 22px;
  font-weight: 600;
  line-height: 28px;
  letter-spacing: 0.35px;
}
```

### iOS Permissions Configuration
In `ios/App/App/Info.plist`:
```xml
<!-- Camera Permission -->
<key>NSCameraUsageDescription</key>
<string>This app needs camera access to take photos of completed work.</string>

<!-- Location Permission -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>This app uses location for project location tracking.</string>

<!-- Face ID Permission -->
<key>NSFaceIDUsageDescription</key>
<string>This app uses Face ID for secure authentication.</string>
```

## 🤖 Android Development

### Design Principles
The Android app follows Material Design 3 guidelines:
- **Navigation**: Material Design navigation patterns
- **Typography**: Roboto font system
- **Colors**: Material Design color system
- **Components**: Material Design components
- **Gestures**: Android-standard touch interactions

### Android Permissions
In `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.USE_FINGERPRINT" />
<uses-permission android:name="android.permission.USE_BIOMETRIC" />
```

## 📸 Camera & Photo Management

### Camera Hook Implementation
```tsx
import { useCamera } from '@/hooks/mobile/useCamera';

const { takePhoto, selectFromGallery, photos, uploading } = useCamera();

// Take a photo
const handleTakePhoto = async () => {
  const photo = await takePhoto({
    quality: 90,
    allowEditing: true,
    resultType: CameraResultType.DataUrl,
  });
  
  if (photo) {
    // Upload to Supabase Storage
    uploadPhoto(photo);
  }
};
```

### Photo Upload Component
```tsx
export const PhotoUploadComponent: React.FC = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  
  const handlePhotoCapture = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });
      
      const photo: Photo = {
        id: generateId(),
        dataUrl: image.dataUrl!,
        description: '',
        category: 'after',
      };
      
      setPhotos(prev => [...prev, photo]);
    } catch (error) {
      console.error('Camera error:', error);
    }
  };
  
  return (
    <div className="space-y-4">
      <Button onClick={handlePhotoCapture} className="w-full">
        <Camera className="h-5 w-5 mr-2" />
        Take Photo
      </Button>
      
      <div className="grid grid-cols-2 gap-3">
        {photos.map(photo => (
          <PhotoCard key={photo.id} photo={photo} />
        ))}
      </div>
    </div>
  );
};
```

## ✍️ Signature Capture

### Canvas-Based Signature Component
```tsx
import { SignatureCapture } from '@/components/mobile/SignatureCapture';

<SignatureCapture
  title="Customer Signature"
  placeholder="Customer signs here"
  onSignatureChange={(signature) => setCustomerSignature(signature)}
  initialSignature={customerSignature}
/>
```

### Implementation Details
```tsx
export const SignatureCapture: React.FC<SignatureCaptureProps> = ({
  title,
  onSignatureChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  const startDrawing = (event: React.TouchEvent | React.MouseEvent) => {
    event.preventDefault();
    setIsDrawing(true);
    
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const point = getCoordinates(event);
    
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  };
  
  // Touch and mouse event handling for cross-platform support
  return (
    <canvas
      ref={canvasRef}
      onMouseDown={startDrawing}
      onTouchStart={startDrawing}
      className="border-2 border-dashed border-gray-300 touch-none"
      style={{ touchAction: 'none' }}
    />
  );
};
```

## 🔄 Offline Support

### Offline Data Strategy
```tsx
export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queuedActions, setQueuedActions] = useState<OfflineAction[]>([]);
  
  // Queue actions when offline
  const queueAction = (action: OfflineAction) => {
    setQueuedActions(prev => [...prev, action]);
    // Store in local storage
    Storage.set({ key: 'offline_queue', value: JSON.stringify([...queuedActions, action]) });
  };
  
  // Sync when back online
  useEffect(() => {
    if (isOnline && queuedActions.length > 0) {
      syncQueuedActions();
    }
  }, [isOnline, queuedActions]);
  
  return { isOnline, queueAction, queuedActions };
};
```

### Local Storage Management
```tsx
import { Storage } from '@capacitor/storage';

export const StorageService = {
  async set(key: string, value: any) {
    await Storage.set({
      key,
      value: JSON.stringify(value),
    });
  },
  
  async get<T>(key: string): Promise<T | null> {
    const result = await Storage.get({ key });
    return result.value ? JSON.parse(result.value) : null;
  },
  
  async remove(key: string) {
    await Storage.remove({ key });
  },
  
  async clear() {
    await Storage.clear();
  },
};
```

## 📱 Push Notifications

### Setup Push Notifications
```tsx
import { PushNotifications } from '@capacitor/push-notifications';

export const usePushNotifications = () => {
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('prompt');
  
  const initializePushNotifications = async () => {
    // Request permission
    const permission = await PushNotifications.requestPermissions();
    setPermissionStatus(permission.receive);
    
    if (permission.receive === 'granted') {
      // Register for push notifications
      await PushNotifications.register();
    }
  };
  
  // Listen for registration token
  PushNotifications.addListener('registration', (token) => {
    console.log('Push registration success, token: ', token.value);
    // Send token to your backend
    sendTokenToBackend(token.value);
  });
  
  // Listen for incoming notifications
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('Push notification received: ', notification);
    // Handle incoming notification
  });
  
  return { initializePushNotifications, permissionStatus };
};
```

## 🔐 Biometric Authentication

### Biometric Auth Hook
```tsx
import { BiometricAuth } from '@capacitor-community/biometric-auth';

export const useBiometricAuth = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<BiometricType>();
  
  const checkAvailability = async () => {
    try {
      const result = await BiometricAuth.checkBiometry();
      setIsAvailable(result.isAvailable);
      setBiometricType(result.biometryType);
    } catch (error) {
      setIsAvailable(false);
    }
  };
  
  const authenticate = async (): Promise<boolean> => {
    try {
      await BiometricAuth.verifyIdentity({
        reason: 'Please verify your identity to access the app',
        title: 'Biometric Authentication',
        subtitle: 'Use your fingerprint or face to authenticate',
        description: 'Place your finger on the sensor or look at the camera',
      });
      return true;
    } catch (error) {
      return false;
    }
  };
  
  return { isAvailable, biometricType, checkAvailability, authenticate };
};
```

## 🗺️ Location Services

### Location Hook
```tsx
import { Geolocation } from '@capacitor/geolocation';

export const useLocation = () => {
  const [currentPosition, setCurrentPosition] = useState<Position | null>(null);
  const [watchId, setWatchId] = useState<string | null>(null);
  
  const getCurrentPosition = async () => {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });
      setCurrentPosition(position);
      return position;
    } catch (error) {
      console.error('Location error:', error);
      throw error;
    }
  };
  
  const startWatching = async () => {
    const id = await Geolocation.watchPosition(
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
      (position) => {
        setCurrentPosition(position);
      }
    );
    setWatchId(id);
  };
  
  const stopWatching = () => {
    if (watchId) {
      Geolocation.clearWatch({ id: watchId });
      setWatchId(null);
    }
  };
  
  return { currentPosition, getCurrentPosition, startWatching, stopWatching };
};
```

## 🎨 Platform-Specific Styling

### Responsive Design for Mobile
```tsx
export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkDevice = async () => {
      const info = await Device.getInfo();
      setIsMobile(info.platform !== 'web');
    };
    
    checkDevice();
  }, []);
  
  return isMobile;
};

// Usage in components
const Component = () => {
  const isMobile = useIsMobile();
  
  return (
    <div className={isMobile ? 'mobile-layout' : 'desktop-layout'}>
      {/* Content */}
    </div>
  );
};
```

### CSS Media Queries for Mobile
```css
/* Mobile-first approach */
.component {
  padding: 1rem;
}

/* Tablet and up */
@media (min-width: 768px) {
  .component {
    padding: 2rem;
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .component {
    padding: 3rem;
  }
}

/* iOS specific */
@supports (-webkit-appearance: none) {
  .ios-specific {
    -webkit-appearance: none;
  }
}
```

## ⚡ Performance Optimization

### Image Optimization
```tsx
export const OptimizedImage: React.FC<{
  src: string;
  alt: string;
  width?: number;
  height?: number;
}> = ({ src, alt, width, height }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
      )}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
        className={`transition-opacity duration-300 ${
          loading ? 'opacity-0' : 'opacity-100'
        }`}
      />
      {error && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <span className="text-gray-400">Failed to load</span>
        </div>
      )}
    </div>
  );
};
```

### Virtual Scrolling for Large Lists
```tsx
import { FixedSizeList as List } from 'react-window';

export const VirtualizedProjectList: React.FC<{
  projects: Project[];
}> = ({ projects }) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <ProjectCard project={projects[index]} />
    </div>
  );
  
  return (
    <List
      height={400}
      itemCount={projects.length}
      itemSize={100}
      className="scrollbar-hide"
    >
      {Row}
    </List>
  );
};
```

## 🧪 Testing Mobile Features

### Testing with Capacitor
```bash
# Run in browser with mobile simulation
npm run dev

# Run on iOS simulator
npm run mobile:run:ios

# Run on Android emulator
npm run mobile:run:android

# Run on physical device
npm run mobile:run:ios --target="Your iPhone"
npm run mobile:run:android --target="device_id"
```

### E2E Testing with Capacitor
```typescript
// tests/mobile/project-completion.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Mobile Project Completion', () => {
  test('should complete project with photos and signatures', async ({ page }) => {
    await page.goto('/projects/123/complete');
    
    // Test photo capture simulation
    await page.click('[data-testid="take-photo"]');
    await expect(page.locator('[data-testid="photo-preview"]')).toBeVisible();
    
    // Test signature capture
    await page.click('[data-testid="signature-canvas"]');
    // Simulate drawing
    await page.mouse.move(100, 100);
    await page.mouse.down();
    await page.mouse.move(200, 150);
    await page.mouse.up();
    
    // Submit completion
    await page.click('[data-testid="complete-project"]');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });
});
```

## 📱 App Store Guidelines

### iOS App Store
- **App Review Guidelines**: Follow Apple's guidelines strictly
- **Metadata**: Provide clear app description and keywords
- **Screenshots**: High-quality screenshots for all device sizes
- **Privacy Policy**: Required for apps collecting user data
- **Age Rating**: Set appropriate age rating

### Google Play Store
- **Content Policy**: Follow Google Play policies
- **Target API Level**: Use latest Android API level
- **App Bundle**: Use Android App Bundle (AAB) format
- **Privacy Policy**: Required for apps accessing sensitive data
- **Content Rating**: Set appropriate content rating

## 🔧 Debugging Mobile Issues

### iOS Debugging
```bash
# View iOS simulator logs
xcrun simctl spawn booted log stream --level debug

# Debug in Safari Web Inspector
# 1. Enable Web Inspector in iOS Settings > Safari > Advanced
# 2. Connect device to Mac
# 3. Open Safari > Develop > [Your Device] > [App]
```

### Android Debugging
```bash
# View Android logs
adb logcat

# Debug with Chrome DevTools
# 1. Enable USB Debugging on Android device
# 2. Open Chrome > chrome://inspect
# 3. Select your app from the list
```

### Common Issues & Solutions

**White Screen on App Launch**
```bash
# Clear Capacitor cache
npx cap clean
npx cap sync
```

**Plugin Not Working**
```bash
# Verify plugin installation
npm ls @capacitor/camera

# Reinstall plugin
npm uninstall @capacitor/camera
npm install @capacitor/camera
npx cap sync
```

**Build Errors**
```bash
# iOS build issues
cd ios && pod install && cd ..

# Android build issues
cd android && ./gradlew clean && cd ..
```

## 📋 Mobile Checklist

### Pre-Release Checklist
- [ ] Test on multiple device sizes
- [ ] Test offline functionality
- [ ] Verify push notifications
- [ ] Test biometric authentication
- [ ] Check camera and photo upload
- [ ] Verify signature capture
- [ ] Test location services
- [ ] Check app permissions
- [ ] Verify deep linking
- [ ] Test app store compliance
- [ ] Performance testing
- [ ] Battery usage optimization
- [ ] Memory leak testing
- [ ] Accessibility testing

### Performance Checklist
- [ ] Image optimization
- [ ] Bundle size optimization
- [ ] Lazy loading implemented
- [ ] Virtual scrolling for long lists
- [ ] Debounced API calls
- [ ] Proper caching strategy
- [ ] Minimized re-renders
- [ ] Optimized database queries

---

This mobile development guide provides comprehensive coverage of building native-feeling mobile applications with Capacitor and React. Follow these patterns and best practices to create high-quality mobile experiences for both iOS and Android platforms.