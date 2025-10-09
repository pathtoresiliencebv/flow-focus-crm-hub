# Mobile Receipts Implementation TODO

## Current Status

✅ **Web version**: Fully functional via `src/components/Receipts.tsx`
✅ **Build**: Works for Lovable/web deployment
🔄 **Mobile version**: Prepared but needs Capacitor implementation

---

## Mobile Implementation Plan

### File Structure
- `app/receipts/index.tsx` - Web-safe placeholder (current)
- `app/receipts/index.mobile.tsx` - Expo/RN version (not compatible with this Capacitor project)
- **NEEDED**: `app/receipts/index.native.tsx` - Capacitor version

### Capacitor Implementation

This project uses **Capacitor**, not Expo/React Native. The mobile receipts feature should be implemented using:

#### Required Capacitor Plugins (Already Installed)
```json
"@capacitor/camera": "^7.0.1",
"@capacitor/filesystem": "^7.1.2",
```

#### Implementation Steps

1. **Replace Expo APIs with Capacitor**:
   ```typescript
   // Instead of expo-camera:
   import { Camera } from '@capacitor/camera';
   
   // Instead of expo-file-system:
   import { Filesystem } from '@capacitor/filesystem';
   
   // Instead of expo-image-picker:
   // Use Camera.pickImages()
   ```

2. **Camera Capture**:
   ```typescript
   const takePhoto = async () => {
     const image = await Camera.getPhoto({
       quality: 70,
       allowEditing: false,
       resultType: CameraResultType.Base64
     });
     return image.base64String;
   };
   ```

3. **File Upload**:
   ```typescript
   const uploadReceipt = async (base64: string) => {
     const blob = base64ToBlob(base64, 'image/jpeg');
     await supabase.storage
       .from('receipts')
       .upload(fileName, blob);
   };
   ```

4. **Platform Detection**:
   ```typescript
   import { Capacitor } from '@capacitor/core';
   
   const isMobile = Capacitor.isNativePlatform();
   ```

---

## Current Workaround

For now, mobile users can:
1. Use the web interface for full functionality
2. Access via mobile browser for receipt management
3. Use the desktop Receipts component which has all features

---

## Priority

**Low** - The web version in `src/components/Receipts.tsx` already provides:
- ✅ Upload receipts via file picker
- ✅ View all receipts
- ✅ Approval workflow
- ✅ Bulk actions
- ✅ Auto-approval rules
- ✅ Email integration settings

The mobile camera feature is a convenience enhancement, not critical functionality.

---

## Alternative: Use Web File Input

The simplest solution for mobile is to use the web's native file input which works on mobile browsers:

```tsx
<input 
  type="file" 
  accept="image/*" 
  capture="environment" // Opens camera on mobile
  onChange={handleFileSelect}
/>
```

This works without any native code and is already supported by the web interface.

---

## Recommendation

**Option 1 (Quick)**: Keep web-only, use native file input (already works on mobile browsers)

**Option 2 (Later)**: Implement Capacitor-based native camera when needed for:
- Better camera control
- Offline support
- Native UI feel

Currently, Option 1 is sufficient and already deployed.

