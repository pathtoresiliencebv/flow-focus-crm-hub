import React from 'react';
import { Wifi, WifiOff, Signal, SignalHigh, SignalLow, SignalMedium } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNetworkAware, NetworkQuality } from '@/hooks/useNetworkAware';

interface NetworkIndicatorProps {
  showDetails?: boolean;
  className?: string;
}

export const NetworkIndicator: React.FC<NetworkIndicatorProps> = ({ 
  showDetails = false, 
  className = "" 
}) => {
  const { 
    networkQuality, 
    networkMetrics, 
    isOnline, 
    connectionType,
    offlineQueue,
    isSyncing 
  } = useNetworkAware();

  const getNetworkIcon = () => {
    if (!isOnline) return <WifiOff className="h-4 w-4" />;
    
    switch (networkQuality) {
      case 'excellent':
        return <SignalHigh className="h-4 w-4" />;
      case 'good':
        return <SignalMedium className="h-4 w-4" />;
      case 'poor':
        return <SignalLow className="h-4 w-4" />;
      default:
        return <Wifi className="h-4 w-4" />;
    }
  };

  const getNetworkColor = (): "default" | "secondary" | "destructive" | "outline" => {
    switch (networkQuality) {
      case 'excellent':
        return 'default';
      case 'good':
        return 'secondary';
      case 'poor':
        return 'destructive';
      case 'offline':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getNetworkLabel = () => {
    if (!isOnline) return 'Offline';
    
    const labels: Record<NetworkQuality, string> = {
      excellent: 'Uitstekend',
      good: 'Goed',
      poor: 'Zwak',
      offline: 'Offline'
    };
    
    return labels[networkQuality];
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge 
        variant={getNetworkColor()} 
        className="flex items-center gap-1"
      >
        {getNetworkIcon()}
        {showDetails && (
          <>
            <span className="text-xs">{getNetworkLabel()}</span>
            {connectionType && (
              <span className="text-xs opacity-75">
                {connectionType.toUpperCase()}
              </span>
            )}
          </>
        )}
      </Badge>
      
      {showDetails && isOnline && (
        <div className="flex flex-col text-xs text-muted-foreground">
          <span>{Math.round(networkMetrics.downloadSpeed * 100) / 100} Mbps</span>
          <span>{networkMetrics.latency}ms</span>
        </div>
      )}
      
      {/* Sync status */}
      {isSyncing && (
        <Badge variant="outline" className="animate-pulse">
          <span className="text-xs">Syncing</span>
        </Badge>
      )}
      
      {/* Queue indicator */}
      {offlineQueue.length > 0 && (
        <Badge variant="secondary">
          <span className="text-xs">{offlineQueue.length} queued</span>
        </Badge>
      )}
    </div>
  );
};