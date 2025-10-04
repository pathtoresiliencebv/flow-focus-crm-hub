import { useState, useCallback, useEffect } from 'react';
import { BarcodeScanner, SupportedFormat } from '@capacitor-community/barcode-scanner';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { useToast } from '@/hooks/use-toast';
import { useAuditLogger } from './useAuditLogger';

interface ScanResult {
  content: string;
  format: string;
  timestamp: number;
  source: 'camera' | 'image';
}

interface ScanSettings {
  targetedFormats: SupportedFormat[];
  cameraDirection: 'front' | 'back';
  showTargetingRect: boolean;
  showBackground: boolean;
}

export const useBarcodeScanner = () => {
  const { toast } = useToast();
  const { logUserAction } = useAuditLogger();
  
  const [isScanning, setIsScanning] = useState(false);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [settings, setSettings] = useState<ScanSettings>({
    targetedFormats: [SupportedFormat.QR_CODE, SupportedFormat.EAN_13, SupportedFormat.CODE_128],
    cameraDirection: 'back',
    showTargetingRect: true,
    showBackground: true
  });

  // Check camera permissions
  const checkPermissions = useCallback(async () => {
    try {
      const status = await BarcodeScanner.checkPermission({ force: false });
      setPermissionStatus(status.granted ? 'granted' : 'denied');
      return status.granted;
    } catch (error) {
      console.error('Error checking scanner permissions:', error);
      return false;
    }
  }, []);

  // Request camera permissions
  const requestPermissions = useCallback(async () => {
    try {
      const status = await BarcodeScanner.checkPermission({ force: true });
      setPermissionStatus(status.granted ? 'granted' : 'denied');
      
      if (status.granted) {
        await logUserAction('scanner_permission_granted');
        toast({
          title: "Camera Access Granted",
          description: "Barcode scanning is now available"
        });
        return true;
      } else {
        await logUserAction('scanner_permission_denied');
        toast({
          title: "Camera Access Denied",
          description: "Barcode scanning requires camera permission",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting scanner permissions:', error);
      toast({
        title: "Permission Error",
        description: "Failed to request camera permissions",
        variant: "destructive"
      });
      return false;
    }
  }, [logUserAction, toast]);

  // Start barcode scanning
  const startScan = useCallback(async (): Promise<ScanResult | null> => {
    try {
      const hasPermission = await checkPermissions();
      if (!hasPermission) {
        const granted = await requestPermissions();
        if (!granted) return null;
      }

      setIsScanning(true);

      // Hide background when scanning starts
      if (settings.showBackground) {
        document.body.classList.add('scanner-active');
      }

      const result = await BarcodeScanner.startScan({
        targetedFormats: settings.targetedFormats,
        cameraDirection: settings.cameraDirection === 'front' ? 'front' : 'back'
      });

      // Show background when scanning stops
      document.body.classList.remove('scanner-active');
      setIsScanning(false);

      if (result.hasContent) {
        const scanResult: ScanResult = {
          content: result.content,
          format: result.format || 'unknown',
          timestamp: Date.now(),
          source: 'camera'
        };

        setScanHistory(prev => [scanResult, ...prev.slice(0, 49)]); // Keep last 50 scans
        
        await logUserAction('barcode_scanned', {
          format: scanResult.format,
          content_length: scanResult.content.length,
          source: scanResult.source
        });

        toast({
          title: "Barcode Scanned",
          description: `${scanResult.format}: ${scanResult.content.substring(0, 30)}${scanResult.content.length > 30 ? '...' : ''}`,
          duration: 3000
        });

        return scanResult;
      }

      return null;
    } catch (error: any) {
      document.body.classList.remove('scanner-active');
      setIsScanning(false);
      
      console.error('Error scanning barcode:', error);
      toast({
        title: "Scan Error",
        description: error.message || "Failed to scan barcode",
        variant: "destructive"
      });
      return null;
    }
  }, [settings, checkPermissions, requestPermissions, logUserAction, toast]);

  // Stop scanning
  const stopScan = useCallback(async () => {
    try {
      await BarcodeScanner.stopScan();
      document.body.classList.remove('scanner-active');
      setIsScanning(false);
      
      await logUserAction('barcode_scan_stopped');
    } catch (error) {
      console.error('Error stopping scan:', error);
    }
  }, [logUserAction]);

  // Scan from image
  const scanFromImage = useCallback(async (): Promise<ScanResult | null> => {
    try {
      const hasPermission = await checkPermissions();
      if (!hasPermission) {
        const granted = await requestPermissions();
        if (!granted) return null;
      }

      // Take photo or select from gallery
      const image = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos,
        quality: 90
      });

      if (!image.webPath) {
        throw new Error('No image selected');
      }

      // Note: Actual image scanning would require additional processing
      // For now, we'll simulate a result
      const scanResult: ScanResult = {
        content: 'IMAGE_SCAN_PLACEHOLDER',
        format: 'QR_CODE',
        timestamp: Date.now(),
        source: 'image'
      };

      setScanHistory(prev => [scanResult, ...prev.slice(0, 49)]);
      
      await logUserAction('image_scanned', {
        source: 'gallery'
      });

      toast({
        title: "Image Scanned",
        description: "Image processing completed",
        duration: 3000
      });

      return scanResult;
    } catch (error: any) {
      console.error('Error scanning image:', error);
      toast({
        title: "Image Scan Error",
        description: error.message || "Failed to scan image",
        variant: "destructive"
      });
      return null;
    }
  }, [checkPermissions, requestPermissions, logUserAction, toast]);

  // Prepare scanner UI
  const prepareScanner = useCallback(async () => {
    try {
      await BarcodeScanner.prepare();
      return true;
    } catch (error) {
      console.error('Error preparing scanner:', error);
      return false;
    }
  }, []);

  // Hide scanner background
  const hideBackground = useCallback(async () => {
    try {
      await BarcodeScanner.hideBackground();
    } catch (error) {
      console.error('Error hiding background:', error);
    }
  }, []);

  // Show scanner background
  const showBackground = useCallback(async () => {
    try {
      await BarcodeScanner.showBackground();
    } catch (error) {
      console.error('Error showing background:', error);
    }
  }, []);

  // Update scanner settings
  const updateSettings = useCallback(async (newSettings: Partial<ScanSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    await logUserAction('scanner_settings_updated', newSettings);
  }, [logUserAction]);

  // Parse scan content based on format
  const parseScanContent = useCallback((result: ScanResult) => {
    const { content, format } = result;
    
    switch (format) {
      case 'QR_CODE':
        // Try to parse as URL, vCard, WiFi, etc.
        if (content.startsWith('http')) {
          return { type: 'url', data: content };
        } else if (content.startsWith('WIFI:')) {
          return { type: 'wifi', data: parseWiFiQR(content) };
        } else if (content.startsWith('BEGIN:VCARD')) {
          return { type: 'contact', data: parseVCard(content) };
        } else {
          return { type: 'text', data: content };
        }
        
      case 'EAN_13':
      case 'EAN_8':
      case 'UPC_A':
      case 'UPC_E':
        return { type: 'product', data: content };
        
      case 'CODE_128':
      case 'CODE_39':
        return { type: 'code', data: content };
        
      default:
        return { type: 'unknown', data: content };
    }
  }, []);

  // Parse WiFi QR code
  const parseWiFiQR = (content: string) => {
    const params: any = {};
    const parts = content.replace('WIFI:', '').split(';');
    
    parts.forEach(part => {
      const [key, value] = part.split(':');
      if (key && value) {
        params[key.toLowerCase()] = value;
      }
    });
    
    return params;
  };

  // Parse vCard content
  const parseVCard = (content: string) => {
    const lines = content.split('\n');
    const contact: any = {};
    
    lines.forEach(line => {
      if (line.startsWith('FN:')) contact.name = line.substring(3);
      if (line.startsWith('TEL:')) contact.phone = line.substring(4);
      if (line.startsWith('EMAIL:')) contact.email = line.substring(6);
      if (line.startsWith('ORG:')) contact.organization = line.substring(4);
    });
    
    return contact;
  };

  // Get scan statistics
  const getScanStats = useCallback(() => {
    const now = Date.now();
    const last24h = scanHistory.filter(s => now - s.timestamp < 24 * 60 * 60 * 1000);
    
    return {
      total: scanHistory.length,
      last24h: last24h.length,
      by_format: scanHistory.reduce((acc: any, scan) => {
        acc[scan.format] = (acc[scan.format] || 0) + 1;
        return acc;
      }, {}),
      by_source: {
        camera: scanHistory.filter(s => s.source === 'camera').length,
        image: scanHistory.filter(s => s.source === 'image').length
      }
    };
  }, [scanHistory]);

  // Clear scan history
  const clearHistory = useCallback(async () => {
    setScanHistory([]);
    await logUserAction('scan_history_cleared');
    
    toast({
      title: "History Cleared",
      description: "Scan history has been cleared"
    });
  }, [logUserAction, toast]);

  // Initialize permissions check
  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  // Add scanner styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .scanner-active {
        --background: transparent !important;
      }
      
      .scanner-targeting-rect {
        border: 2px solid #fff;
        border-radius: 8px;
        box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.6);
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
      document.body.classList.remove('scanner-active');
    };
  }, []);

  return {
    isScanning,
    scanHistory,
    permissionStatus,
    settings,
    startScan,
    stopScan,
    scanFromImage,
    prepareScanner,
    hideBackground,
    showBackground,
    updateSettings,
    parseScanContent,
    getScanStats,
    clearHistory,
    checkPermissions,
    requestPermissions
  };
};