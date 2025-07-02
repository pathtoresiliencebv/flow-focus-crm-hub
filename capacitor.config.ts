import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.flowfocus.crmhub',
  appName: 'flow-focus-crm-hub',
  webDir: 'dist',
  server: {
    url: 'https://9619b9db-de5c-4281-9df0-edb1fcb07eea.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    Camera: {
      permissions: ['camera', 'photos']
    },
    Geolocation: {
      permissions: ['location']
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  }
};

export default config;