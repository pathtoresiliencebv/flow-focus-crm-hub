import { useState, useEffect, useCallback } from 'react';
import { Preferences } from '@capacitor/preferences';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface DevicePreferences {
  // Theme & Appearance
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  highContrast: boolean;
  reducedMotion: boolean;
  
  // App Behavior
  autoSync: boolean;
  syncInterval: number; // minutes
  offlineMode: boolean;
  backgroundSync: boolean;
  
  // Notifications
  pushNotifications: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  
  // Language & Localization
  language: string;
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  timeFormat: '12h' | '24h';
  timezone: string;
  
  // Privacy & Security
  biometricLogin: boolean;
  autoLock: number; // minutes, 0 = disabled
  shareAnalytics: boolean;
  shareUsageData: boolean;
  
  // Advanced Settings
  developerMode: boolean;
  debugLogging: boolean;
  experimentalFeatures: boolean;
}

const DEFAULT_PREFERENCES: DevicePreferences = {
  theme: 'system',
  accentColor: 'hsl(262, 83%, 58%)',
  fontSize: 'medium',
  highContrast: false,
  reducedMotion: false,
  
  autoSync: true,
  syncInterval: 15,
  offlineMode: false,
  backgroundSync: true,
  
  pushNotifications: true,
  soundEnabled: true,
  vibrationEnabled: true,
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
  },
  
  language: 'nl-NL',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '24h',
  timezone: 'Europe/Amsterdam',
  
  biometricLogin: false,
  autoLock: 0,
  shareAnalytics: true,
  shareUsageData: true,
  
  developerMode: false,
  debugLogging: false,
  experimentalFeatures: false,
};

export const useDevicePreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<DevicePreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Load preferences from local storage
  const loadLocalPreferences = useCallback(async () => {
    try {
      const { value } = await Preferences.get({ key: 'device_preferences' });
      if (value) {
        const parsed = JSON.parse(value);
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
      }
    } catch (error) {
      console.error('Error loading local preferences:', error);
    }
  }, []);

  // Save preferences to local storage
  const saveLocalPreferences = useCallback(async (prefs: DevicePreferences) => {
    try {
      await Preferences.set({
        key: 'device_preferences',
        value: JSON.stringify(prefs),
      });
    } catch (error) {
      console.error('Error saving local preferences:', error);
    }
  }, []);

  // Sync preferences with cloud
  const syncWithCloud = useCallback(async (prefs?: DevicePreferences) => {
    if (!user) return;

    setIsSyncing(true);
    try {
      const prefsToSync = prefs || preferences;
      
      // Check if user preferences exist in cloud
      const { data: existingPrefs, error: fetchError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existingPrefs) {
        // Update existing preferences
        const { error: updateError } = await supabase
          .from('user_preferences')
          .update({
            preferences: prefsToSync as any,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        if (updateError) throw updateError;
      } else {
        // Create new preferences
        const { error: insertError } = await supabase
          .from('user_preferences')
          .insert({
            user_id: user.id,
            preferences: prefsToSync as any,
          });

        if (insertError) throw insertError;
      }

      setLastSyncTime(new Date());
    } catch (error) {
      console.error('Error syncing preferences:', error);
      toast({
        title: "Synchronisatiefout",
        description: "Instellingen konden niet worden gesynchroniseerd",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  }, [user, preferences]);

  // Load preferences from cloud
  const loadFromCloud = useCallback(async () => {
    if (!user) return;

    try {
      const { data: cloudPrefs, error } = await supabase
        .from('user_preferences')
        .select('preferences')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (cloudPrefs?.preferences) {
        const cloudPrefsData = cloudPrefs.preferences as Partial<DevicePreferences>;
        const mergedPrefs = { ...DEFAULT_PREFERENCES, ...cloudPrefsData };
        setPreferences(mergedPrefs);
        await saveLocalPreferences(mergedPrefs);
        setLastSyncTime(new Date());
      }
    } catch (error) {
      console.error('Error loading cloud preferences:', error);
    }
  }, [user, saveLocalPreferences]);

  // Update preferences
  const updatePreferences = useCallback(async (updates: Partial<DevicePreferences>) => {
    const newPreferences = { ...preferences, ...updates };
    setPreferences(newPreferences);
    
    // Save locally immediately
    await saveLocalPreferences(newPreferences);
    
    // Sync with cloud if user is logged in
    if (user) {
      await syncWithCloud(newPreferences);
    }
  }, [preferences, user, saveLocalPreferences, syncWithCloud]);

  // Reset to defaults
  const resetToDefaults = useCallback(async () => {
    setPreferences(DEFAULT_PREFERENCES);
    await saveLocalPreferences(DEFAULT_PREFERENCES);
    
    if (user) {
      await syncWithCloud(DEFAULT_PREFERENCES);
    }
    
    toast({
      title: "Instellingen gereset",
      description: "Alle instellingen zijn teruggezet naar standaardwaarden",
    });
  }, [user, saveLocalPreferences, syncWithCloud]);

  // Get preference by key
  const getPreference = useCallback(<K extends keyof DevicePreferences>(
    key: K
  ): DevicePreferences[K] => {
    return preferences[key];
  }, [preferences]);

  // Set single preference
  const setPreference = useCallback(<K extends keyof DevicePreferences>(
    key: K,
    value: DevicePreferences[K]
  ) => {
    updatePreferences({ [key]: value });
  }, [updatePreferences]);

  // Initialize preferences
  useEffect(() => {
    const initializePreferences = async () => {
      setIsLoading(true);
      
      // Load local preferences first
      await loadLocalPreferences();
      
      // If user is logged in, try to load from cloud
      if (user) {
        await loadFromCloud();
      }
      
      setIsLoading(false);
    };

    initializePreferences();
  }, [user, loadLocalPreferences, loadFromCloud]);

  // Auto-sync when user logs in
  useEffect(() => {
    if (user && !isLoading) {
      syncWithCloud();
    }
  }, [user, syncWithCloud, isLoading]);

  return {
    preferences,
    isLoading,
    isSyncing,
    lastSyncTime,
    updatePreferences,
    resetToDefaults,
    getPreference,
    setPreference,
    syncWithCloud: () => syncWithCloud(),
  };
};