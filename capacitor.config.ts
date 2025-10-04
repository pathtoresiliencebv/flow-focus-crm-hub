import { CapacitorConfig } from '@capacitor/cli';

const isDev = process.env.NODE_ENV === 'development' || process.env.CAP_MODE === 'development';

const config: CapacitorConfig = {
  appId: 'com.smanscrm.ios',
  appName: 'Smans CRM',
  webDir: 'dist',
  server: {
    url: isDev ? 'https://9619b9db-de5c-4281-9df0-edb1fcb07eea.lovableproject.com?forceHideBadge=true' : 'https://smanscrm.nl',
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
    },
    LiveUpdates: {
      appId: 'com.smanscrm.ios',
      channel: 'production',
      autoUpdateMethod: 'background',
      maxVersions: 2
    }
  }
};

export default config;