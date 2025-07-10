import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Smartphone, 
  Battery, 
  Wifi, 
  Bell, 
  Shield,
  Database,
  Clock,
  RefreshCw
} from 'lucide-react';
import { MobilePreferencesPanel } from './MobilePreferencesPanel';
import { BackgroundSyncIndicator } from './BackgroundSyncIndicator';
import { useBackgroundSync } from '@/hooks/useBackgroundSync';
import { useBatteryOptimization } from '@/hooks/useBatteryOptimization';
import { useAppLifecycle } from '@/hooks/useAppLifecycle';

interface MobileSettingsPanelProps {
  onClose: () => void;
}

export const MobileSettingsPanel: React.FC<MobileSettingsPanelProps> = ({ onClose }) => {
  const { syncStatus, config, performSync } = useBackgroundSync();
  const { batteryState, getOptimizedSettings } = useBatteryOptimization();
  const { isActive, getAppInfo } = useAppLifecycle();
  const [activeTab, setActiveTab] = useState<'sync' | 'preferences'>('preferences');
  
  const optimizedSettings = getOptimizedSettings();

  if (activeTab === 'preferences') {
    return <MobilePreferencesPanel onClose={onClose} />;
  }

  return (
    <div className="h-full bg-background overflow-y-auto">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Instellingen</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Sync Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Synchronisatie Status
            </CardTitle>
            <CardDescription>
              Automatische synchronisatie en achtergrond sync
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <BackgroundSyncIndicator showDetails />
            
            <Separator />
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Sync interval</span>
                <Badge variant="outline">
                  {Math.round(config.syncInterval / 1000)}s
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Max herhalingen</span>
                <Badge variant="outline">{config.maxRetries}</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Sync bij app hervatting</span>
                <Switch 
                  checked={config.syncOnAppResume} 
                  disabled 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Battery Optimization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Battery className="h-4 w-4" />
              Batterij Optimalisatie
            </CardTitle>
            <CardDescription>
              Automatische aanpassingen voor batterijbesparing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Batterijniveau</span>
              <Badge variant={batteryState.isLowBattery ? 'destructive' : 'outline'}>
                {Math.round(batteryState.level * 100)}%
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Optimalisatie modus</span>
              <Badge variant={
                batteryState.optimizationMode === 'critical' ? 'destructive' :
                batteryState.optimizationMode === 'low' ? 'secondary' : 'outline'
              }>
                {batteryState.optimizationMode === 'critical' ? 'Kritiek' :
                 batteryState.optimizationMode === 'low' ? 'Laag' : 'Normaal'}
              </Badge>
            </div>
            
            {batteryState.isCharging && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-green-600">⚡ Opladen...</span>
              </div>
            )}
            
            <Separator />
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Geoptimaliseerde instellingen:</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center justify-between">
                  <span>Achtergrond sync</span>
                  <Badge variant={optimizedSettings.backgroundSync ? 'outline' : 'destructive'}>
                    {optimizedSettings.backgroundSync ? 'Aan' : 'Uit'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Animaties</span>
                  <Badge variant={optimizedSettings.animationsEnabled ? 'outline' : 'secondary'}>
                    {optimizedSettings.animationsEnabled ? 'Aan' : 'Uit'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Afbeelding optimalisatie</span>
                  <Badge variant={optimizedSettings.imageOptimization ? 'outline' : 'secondary'}>
                    {optimizedSettings.imageOptimization ? 'Aan' : 'Uit'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Voorladen</span>
                  <Badge variant={optimizedSettings.preloadContent ? 'outline' : 'secondary'}>
                    {optimizedSettings.preloadContent ? 'Aan' : 'Uit'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* App Lifecycle */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              App Status
            </CardTitle>
            <CardDescription>
              Huidige app en apparaat status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">App status</span>
              <Badge variant={isActive ? 'outline' : 'secondary'}>
                {isActive ? 'Actief' : 'Achtergrond'}
              </Badge>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={getAppInfo}
              className="w-full"
            >
              <Settings className="h-3 w-3 mr-2" />
              App informatie ophalen
            </Button>
          </CardContent>
        </Card>

        {/* Manual Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Handmatige acties
            </CardTitle>
            <CardDescription>
              Handmatige synchronisatie en onderhoud
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={performSync}
              disabled={syncStatus.isBackgroundSyncing}
              className="w-full"
            >
              <RefreshCw className={`h-3 w-3 mr-2 ${syncStatus.isBackgroundSyncing ? 'animate-spin' : ''}`} />
              Nu synchroniseren
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};