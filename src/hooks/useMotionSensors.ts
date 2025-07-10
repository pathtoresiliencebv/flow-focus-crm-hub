import { useState, useCallback, useEffect } from 'react';
import { Motion } from '@capacitor/motion';
import { useToast } from './use-toast';
import { useAuditLogger } from './useAuditLogger';

interface MotionData {
  acceleration: {
    x: number;
    y: number;
    z: number;
  };
  accelerationIncludingGravity: {
    x: number;
    y: number;
    z: number;
  };
  rotationRate: {
    alpha: number;
    beta: number;
    gamma: number;
  };
  interval: number;
}

interface OrientationData {
  alpha: number;
  beta: number;
  gamma: number;
}

interface GestureEvent {
  type: 'shake' | 'tilt' | 'flip' | 'rotation';
  intensity: number;
  timestamp: number;
  data?: any;
}

export const useMotionSensors = () => {
  const { toast } = useToast();
  const { logUserAction } = useAuditLogger();
  
  const [motionData, setMotionData] = useState<MotionData | null>(null);
  const [orientationData, setOrientationData] = useState<OrientationData | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [shakeEnabled, setShakeEnabled] = useState(false);
  const [gestureHistory, setGestureHistory] = useState<GestureEvent[]>([]);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt'>('prompt');

  // Motion thresholds
  const SHAKE_THRESHOLD = 15;
  const TILT_THRESHOLD = 30;
  const FLIP_THRESHOLD = 150;
  const GESTURE_COOLDOWN = 1000; // ms

  // Check motion permissions (simplified - no direct permission API)
  const checkPermissions = useCallback(async () => {
    try {
      // Motion API doesn't have explicit permissions, return granted for web
      setPermissionStatus('granted');
      return true;
    } catch (error) {
      console.error('Error checking motion permissions:', error);
      return false;
    }
  }, []);

  // Request motion permissions (simplified)
  const requestPermissions = useCallback(async () => {
    try {
      // Motion API doesn't require explicit permissions on web
      setPermissionStatus('granted');
      
      await logUserAction('motion_permission_granted');
      toast({
        title: "Motion Access Granted",
        description: "Motion sensors are now available"
      });
      return true;
    } catch (error) {
      console.error('Error requesting motion permissions:', error);
      toast({
        title: "Permission Error",
        description: "Failed to request motion permissions",
        variant: "destructive"
      });
      return false;
    }
  }, [logUserAction, toast]);

  // Detect shake gesture
  const detectShake = useCallback((data: MotionData) => {
    const { x, y, z } = data.accelerationIncludingGravity;
    const magnitude = Math.sqrt(x * x + y * y + z * z);
    
    if (magnitude > SHAKE_THRESHOLD) {
      const now = Date.now();
      const lastShake = gestureHistory.find(g => g.type === 'shake' && now - g.timestamp < GESTURE_COOLDOWN);
      
      if (!lastShake) {
        const gesture: GestureEvent = {
          type: 'shake',
          intensity: magnitude,
          timestamp: now,
          data: { magnitude, acceleration: { x, y, z } }
        };
        
        setGestureHistory(prev => [...prev.slice(-19), gesture]); // Keep last 20 gestures
        return gesture;
      }
    }
    return null;
  }, [gestureHistory]);

  // Detect tilt gesture
  const detectTilt = useCallback((orientation: OrientationData) => {
    const { beta, gamma } = orientation;
    const tiltIntensity = Math.max(Math.abs(beta), Math.abs(gamma));
    
    if (tiltIntensity > TILT_THRESHOLD) {
      const now = Date.now();
      const lastTilt = gestureHistory.find(g => g.type === 'tilt' && now - g.timestamp < GESTURE_COOLDOWN);
      
      if (!lastTilt) {
        const gesture: GestureEvent = {
          type: 'tilt',
          intensity: tiltIntensity,
          timestamp: now,
          data: { beta, gamma }
        };
        
        setGestureHistory(prev => [...prev.slice(-19), gesture]);
        return gesture;
      }
    }
    return null;
  }, [gestureHistory]);

  // Detect device flip
  const detectFlip = useCallback((orientation: OrientationData) => {
    const { beta } = orientation;
    
    if (Math.abs(beta) > FLIP_THRESHOLD) {
      const now = Date.now();
      const lastFlip = gestureHistory.find(g => g.type === 'flip' && now - g.timestamp < GESTURE_COOLDOWN * 2);
      
      if (!lastFlip) {
        const gesture: GestureEvent = {
          type: 'flip',
          intensity: Math.abs(beta),
          timestamp: now,
          data: { beta, direction: beta > 0 ? 'forward' : 'backward' }
        };
        
        setGestureHistory(prev => [...prev.slice(-19), gesture]);
        return gesture;
      }
    }
    return null;
  }, [gestureHistory]);

  // Start listening to motion sensors
  const startListening = useCallback(async () => {
    try {
      const hasPermission = await checkPermissions();
      if (!hasPermission) {
        const granted = await requestPermissions();
        if (!granted) return false;
      }

      // Start accelerometer
      await Motion.addListener('accel', (event: any) => {
        const data: MotionData = {
          acceleration: event.acceleration || { x: 0, y: 0, z: 0 },
          accelerationIncludingGravity: event.accelerationIncludingGravity || { x: 0, y: 0, z: 0 },
          rotationRate: event.rotationRate || { alpha: 0, beta: 0, gamma: 0 },
          interval: event.interval || 16
        };
        
        setMotionData(data);

        // Detect shake if enabled
        if (shakeEnabled) {
          const shake = detectShake(data);
          if (shake) {
            // Trigger shake action
            document.dispatchEvent(new CustomEvent('deviceShake', { detail: shake }));
          }
        }
      });

      // Start orientation
      await Motion.addListener('orientation', (event: any) => {
        const orientation: OrientationData = {
          alpha: event.alpha || 0,
          beta: event.beta || 0,
          gamma: event.gamma || 0
        };
        
        setOrientationData(orientation);

        // Detect tilt and flip gestures
        const tilt = detectTilt(orientation);
        const flip = detectFlip(orientation);
        
        if (tilt) {
          document.dispatchEvent(new CustomEvent('deviceTilt', { detail: tilt }));
        }
        if (flip) {
          document.dispatchEvent(new CustomEvent('deviceFlip', { detail: flip }));
        }
      });

      setIsListening(true);
      await logUserAction('motion_sensors_started');

      toast({
        title: "Motion Sensors Active",
        description: "Gesture recognition is now enabled"
      });

      return true;
    } catch (error) {
      console.error('Error starting motion sensors:', error);
      toast({
        title: "Motion Error",
        description: "Failed to start motion sensors",
        variant: "destructive"
      });
      return false;
    }
  }, [checkPermissions, requestPermissions, shakeEnabled, detectShake, detectTilt, detectFlip, logUserAction, toast]);

  // Stop listening to motion sensors
  const stopListening = useCallback(async () => {
    try {
      await Motion.removeAllListeners();
      setIsListening(false);
      setMotionData(null);
      setOrientationData(null);
      
      await logUserAction('motion_sensors_stopped');

      toast({
        title: "Motion Sensors Stopped",
        description: "Gesture recognition has been disabled"
      });
    } catch (error) {
      console.error('Error stopping motion sensors:', error);
      toast({
        title: "Stop Error",
        description: "Failed to stop motion sensors",
        variant: "destructive"
      });
    }
  }, [logUserAction, toast]);

  // Toggle shake detection
  const toggleShakeDetection = useCallback(async (enabled: boolean) => {
    setShakeEnabled(enabled);
    await logUserAction('shake_detection_toggled', { enabled });
    
    if (enabled && !isListening) {
      await startListening();
    }
  }, [isListening, startListening, logUserAction]);

  // Get current device orientation
  const getDeviceOrientation = useCallback(() => {
    if (!orientationData) return 'unknown';
    
    const { beta, gamma } = orientationData;
    
    if (Math.abs(beta) < 30 && Math.abs(gamma) < 30) {
      return 'flat';
    } else if (beta > 60) {
      return 'face-down';
    } else if (beta < -60) {
      return 'face-up';
    } else if (gamma > 45) {
      return 'left-side';
    } else if (gamma < -45) {
      return 'right-side';
    } else {
      return 'upright';
    }
  }, [orientationData]);

  // Get motion intensity
  const getMotionIntensity = useCallback(() => {
    if (!motionData) return 0;
    
    const { x, y, z } = motionData.accelerationIncludingGravity;
    return Math.sqrt(x * x + y * y + z * z);
  }, [motionData]);

  // Get gesture statistics
  const getGestureStats = useCallback(() => {
    const now = Date.now();
    const last24h = gestureHistory.filter(g => now - g.timestamp < 24 * 60 * 60 * 1000);
    
    return {
      total: gestureHistory.length,
      last24h: last24h.length,
      by_type: {
        shake: gestureHistory.filter(g => g.type === 'shake').length,
        tilt: gestureHistory.filter(g => g.type === 'tilt').length,
        flip: gestureHistory.filter(g => g.type === 'flip').length,
        rotation: gestureHistory.filter(g => g.type === 'rotation').length
      },
      average_intensity: gestureHistory.reduce((sum, g) => sum + g.intensity, 0) / Math.max(1, gestureHistory.length)
    };
  }, [gestureHistory]);

  // Setup gesture event listeners
  useEffect(() => {
    const handleShake = (event: CustomEvent) => {
      toast({
        title: "Device Shake Detected",
        description: `Intensity: ${event.detail.intensity.toFixed(1)}`,
        duration: 2000
      });
    };

    const handleTilt = (event: CustomEvent) => {
      console.log('Device tilted:', event.detail);
    };

    const handleFlip = (event: CustomEvent) => {
      toast({
        title: "Device Flip Detected",
        description: `Direction: ${event.detail.data.direction}`,
        duration: 2000
      });
    };

    document.addEventListener('deviceShake', handleShake);
    document.addEventListener('deviceTilt', handleTilt);
    document.addEventListener('deviceFlip', handleFlip);

    return () => {
      document.removeEventListener('deviceShake', handleShake);
      document.removeEventListener('deviceTilt', handleTilt);
      document.removeEventListener('deviceFlip', handleFlip);
    };
  }, [toast]);

  // Initialize permissions check
  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  return {
    motionData,
    orientationData,
    isListening,
    shakeEnabled,
    gestureHistory,
    permissionStatus,
    startListening,
    stopListening,
    toggleShakeDetection,
    getDeviceOrientation,
    getMotionIntensity,
    getGestureStats,
    checkPermissions,
    requestPermissions
  };
};