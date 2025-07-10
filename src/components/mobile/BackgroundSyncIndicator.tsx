import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  Battery, 
  BatteryLow, 
  Clock,
  AlertTriangle,
  CheckCircle 
} from 'lucide-react';
import { useBackgroundSync } from '@/hooks/useBackgroundSync';
import { useBatteryOptimization } from '@/hooks/useBatteryOptimization';
import { useAppLifecycle } from '@/hooks/useAppLifecycle';

interface BackgroundSyncIndicatorProps {
  showDetails?: boolean;
  compact?: boolean;
  className?: string;
}

export const BackgroundSyncIndicator: React.FC<BackgroundSyncIndicatorProps> = ({
  showDetails = false,
  compact = false,
  className = ""
}) => {
  const { syncStatus, performSync } = useBackgroundSync();
  const { batteryState, shouldReduceFunctionality } = useBatteryOptimization();
  const { isActive, appState } = useAppLifecycle();

  const getSyncStatusColor = () => {
    if (syncStatus.syncErrors.length > 0) return 'destructive';
    if (syncStatus.isBackgroundSyncing) return 'secondary';
    if (syncStatus.pendingOperations > 0) return 'default';
    return 'outline';
  };

  const getSyncStatusIcon = () => {
    if (syncStatus.syncErrors.length > 0) return <AlertTriangle className="h-3 w-3" />;
    if (syncStatus.isBackgroundSyncing) return <RefreshCw className="h-3 w-3 animate-spin" />;
    if (syncStatus.pendingOperations > 0) return <Clock className="h-3 w-3" />;
    return <CheckCircle className="h-3 w-3" />;
  };

  const getBatteryIcon = () => {
    if (batteryState.isLowBattery) return <BatteryLow className="h-3 w-3" />;
    return <Battery className="h-3 w-3" />;
  };

  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Nooit';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Zojuist';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m geleden`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}u geleden`;
    return `${Math.floor(diff / 86400000)}d geleden`;
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <Badge variant={getSyncStatusColor()} className="flex items-center gap-1 h-6">
          {getSyncStatusIcon()}
          {syncStatus.pendingOperations > 0 && (
            <span className="text-xs">{syncStatus.pendingOperations}</span>
          )}
        </Badge>
        
        {batteryState.isLowBattery && (
          <Badge variant="destructive" className="flex items-center gap-1 h-6">
            {getBatteryIcon()}
            <span className="text-xs">{Math.round(batteryState.level * 100)}%</span>
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Sync Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={getSyncStatusColor()} className="flex items-center gap-1">
            {getSyncStatusIcon()}
            <span className="text-xs">
              {syncStatus.isBackgroundSyncing ? 'Synchroniseren...' : 'Sync Status'}
            </span>
          </Badge>
          
          {syncStatus.pendingOperations > 0 && (
            <Badge variant="outline">
              <span className="text-xs">{syncStatus.pendingOperations} wachtend</span>
            </Badge>
          )}
        </div>

        <Button 
          variant="ghost" 
          size="sm" 
          onClick={performSync}
          disabled={syncStatus.isBackgroundSyncing}
          className="h-6 px-2"
        >
          <RefreshCw className={`h-3 w-3 ${syncStatus.isBackgroundSyncing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {showDetails && (
        <>
          {/* Battery Status */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {getBatteryIcon()}
              <span className="text-xs text-muted-foreground">
                {Math.round(batteryState.level * 100)}%
              </span>
            </div>
            
            <Progress 
              value={batteryState.level * 100} 
              className="flex-1 h-2"
            />
            
            {batteryState.isCharging && (
              <Badge variant="outline" className="text-xs">Opladen</Badge>
            )}
          </div>

          {/* Optimization Status */}
          {(batteryState.optimizationMode !== 'normal' || shouldReduceFunctionality()) && (
            <Badge variant="secondary" className="text-xs w-full justify-center">
              {batteryState.optimizationMode === 'critical' ? 'Kritieke batterij modus' :
               batteryState.optimizationMode === 'low' ? 'Batterijbesparende modus' :
               'Beperkte functionaliteit'}
            </Badge>
          )}

          {/* Last Sync Time */}
          <div className="text-xs text-muted-foreground">
            Laatste sync: {formatLastSync(syncStatus.lastSyncTime)}
          </div>

          {/* App State */}
          {!isActive && (
            <Badge variant="outline" className="text-xs w-full justify-center">
              App op achtergrond
            </Badge>
          )}

          {/* Sync Errors */}
          {syncStatus.syncErrors.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-medium text-destructive">Sync fouten:</div>
              {syncStatus.syncErrors.slice(-2).map((error, index) => (
                <div key={index} className="text-xs text-muted-foreground">
                  {error}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};