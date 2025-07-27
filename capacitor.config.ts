import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.flowfocus.crmhub',
  appName: 'Smans CRM',
  webDir: 'dist',
  server: {
    url: 'https://smanscrm.nl',
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
      appId: 'com.flowfocus.crmhub',
      channel: 'production',
      autoUpdateMethod: 'background',
      maxVersions: 2
    }
  }
};

export default config;