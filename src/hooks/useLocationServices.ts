import { useState, useCallback, useEffect } from 'react';
import { Geolocation, Position } from '@capacitor/geolocation';
import { useToast } from './use-toast';
import { useAuditLogger } from './useAuditLogger';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

interface LocationSettings {
  enableHighAccuracy: boolean;
  timeout: number;
  maximumAge: number;
  trackingEnabled: boolean;
  backgroundTracking: boolean;
}

export const useLocationServices = () => {
  const { toast } = useToast();
  const { logUserAction } = useAuditLogger();
  
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [locationHistory, setLocationHistory] = useState<LocationData[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [watchId, setWatchId] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [settings, setSettings] = useState<LocationSettings>({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 60000,
    trackingEnabled: false,
    backgroundTracking: false
  });

  // Check location permissions
  const checkPermissions = useCallback(async () => {
    try {
      const permissions = await Geolocation.checkPermissions();
      const status = permissions.location === 'granted' ? 'granted' : 
                    permissions.location === 'denied' ? 'denied' : 'prompt';
      setPermissionStatus(status);
      return permissions.location === 'granted';
    } catch (error) {
      console.error('Error checking location permissions:', error);
      return false;
    }
  }, []);

  // Request location permissions
  const requestPermissions = useCallback(async () => {
    try {
      const permissions = await Geolocation.requestPermissions();
      const status = permissions.location === 'granted' ? 'granted' : 
                    permissions.location === 'denied' ? 'denied' : 'prompt';
      setPermissionStatus(status);
      
      if (permissions.location === 'granted') {
        await logUserAction('location_permission_granted');
        toast({
          title: "Location Access Granted",
          description: "Location services are now available"
        });
        return true;
      } else {
        await logUserAction('location_permission_denied');
        toast({
          title: "Location Access Denied",
          description: "Location features will be limited",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      toast({
        title: "Permission Error",
        description: "Failed to request location permissions",
        variant: "destructive"
      });
      return false;
    }
  }, [logUserAction, toast]);

  // Get current position
  const getCurrentPosition = useCallback(async (): Promise<LocationData | null> => {
    try {
      const hasPermission = await checkPermissions();
      if (!hasPermission) {
        const granted = await requestPermissions();
        if (!granted) return null;
      }

      const position: Position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: settings.enableHighAccuracy,
        timeout: settings.timeout,
        maximumAge: settings.maximumAge
      });

      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude || undefined,
        altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
        heading: position.coords.heading || undefined,
        speed: position.coords.speed || undefined,
        timestamp: position.timestamp
      };

      setCurrentLocation(locationData);
      await logUserAction('location_retrieved', { 
        accuracy: locationData.accuracy,
        method: 'getCurrentPosition' 
      });

      return locationData;
    } catch (error: any) {
      console.error('Error getting current position:', error);
      toast({
        title: "Location Error",
        description: error.message || "Failed to get current location",
        variant: "destructive"
      });
      return null;
    }
  }, [settings, checkPermissions, requestPermissions, logUserAction, toast]);

  // Start location tracking
  const startTracking = useCallback(async () => {
    try {
      const hasPermission = await checkPermissions();
      if (!hasPermission) {
        const granted = await requestPermissions();
        if (!granted) return false;
      }

      const id = await Geolocation.watchPosition({
        enableHighAccuracy: settings.enableHighAccuracy,
        timeout: settings.timeout,
        maximumAge: settings.maximumAge
      }, (position, err) => {
        if (err) {
          console.error('Location tracking error:', err);
          toast({
            title: "Tracking Error",
            description: "Location tracking encountered an error",
            variant: "destructive"
          });
          return;
        }

        if (position) {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude || undefined,
            altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
            heading: position.coords.heading || undefined,
            speed: position.coords.speed || undefined,
            timestamp: position.timestamp
          };

          setCurrentLocation(locationData);
          setLocationHistory(prev => [...prev.slice(-99), locationData]); // Keep last 100 locations
        }
      });

      setWatchId(id);
      setIsTracking(true);
      await logUserAction('location_tracking_started');

      toast({
        title: "Tracking Started",
        description: "Location tracking is now active"
      });

      return true;
    } catch (error) {
      console.error('Error starting location tracking:', error);
      toast({
        title: "Tracking Error",
        description: "Failed to start location tracking",
        variant: "destructive"
      });
      return false;
    }
  }, [settings, checkPermissions, requestPermissions, logUserAction, toast]);

  // Stop location tracking
  const stopTracking = useCallback(async () => {
    try {
      if (watchId) {
        await Geolocation.clearWatch({ id: watchId });
        setWatchId(null);
      }
      
      setIsTracking(false);
      await logUserAction('location_tracking_stopped');

      toast({
        title: "Tracking Stopped",
        description: "Location tracking has been disabled"
      });
    } catch (error) {
      console.error('Error stopping location tracking:', error);
      toast({
        title: "Stop Error",
        description: "Failed to stop location tracking",
        variant: "destructive"
      });
    }
  }, [watchId, logUserAction, toast]);

  // Calculate distance between two points
  const calculateDistance = useCallback((
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }, []);

  // Get location address (reverse geocoding)
  const getLocationAddress = useCallback(async (
    latitude: number, 
    longitude: number
  ): Promise<string | null> => {
    try {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=nl`
      );
      const data = await response.json();
      return data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    } catch (error) {
      console.error('Error getting location address:', error);
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }
  }, []);

  // Update location settings
  const updateSettings = useCallback(async (newSettings: Partial<LocationSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);

    // Restart tracking if it's active with new settings
    if (isTracking) {
      await stopTracking();
      setTimeout(() => {
        startTracking();
      }, 1000);
    }

    await logUserAction('location_settings_updated', newSettings);
  }, [settings, isTracking, stopTracking, startTracking, logUserAction]);

  // Get location statistics
  const getLocationStats = useCallback(() => {
    if (locationHistory.length < 2) return null;

    const totalDistance = locationHistory.reduce((total, location, index) => {
      if (index === 0) return 0;
      const prev = locationHistory[index - 1];
      return total + calculateDistance(
        prev.latitude, prev.longitude,
        location.latitude, location.longitude
      );
    }, 0);

    const averageAccuracy = locationHistory.reduce((sum, location) => sum + location.accuracy, 0) / locationHistory.length;
    const timeSpan = locationHistory[locationHistory.length - 1].timestamp - locationHistory[0].timestamp;
    const averageSpeed = locationHistory.reduce((sum, location) => sum + (location.speed || 0), 0) / locationHistory.length;

    return {
      totalDistance: Math.round(totalDistance),
      averageAccuracy: Math.round(averageAccuracy),
      timeSpan: Math.round(timeSpan / 1000), // seconds
      averageSpeed: Math.round(averageSpeed * 100) / 100, // m/s
      pointCount: locationHistory.length
    };
  }, [locationHistory, calculateDistance]);

  // Initialize on mount
  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId) {
        Geolocation.clearWatch({ id: watchId });
      }
    };
  }, [watchId]);

  return {
    currentLocation,
    locationHistory,
    isTracking,
    permissionStatus,
    settings,
    getCurrentPosition,
    startTracking,
    stopTracking,
    calculateDistance,
    getLocationAddress,
    updateSettings,
    getLocationStats,
    checkPermissions,
    requestPermissions
  };
};