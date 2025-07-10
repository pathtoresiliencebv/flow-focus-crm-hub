import React from 'react';
import { Wifi, WifiOff, Clock, AlertCircle } from 'lucide-react';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export const RealtimeIndicator: React.FC = () => {
  const { syncStatus } = useRealtimeSync();

  const getStatusColor = () => {
    if (syncStatus.connected) {
      return syncStatus.failedEvents > 0 ? 'bg-yellow-500' : 'bg-green-500';
    }
    return 'bg-red-500';
  };

  const getStatusText = () => {
    if (!syncStatus.connected) return 'Offline';
    if (syncStatus.failedEvents > 0) return 'Problemen';
    if (syncStatus.queuedEvents > 0) return 'Synchroniseren...';
    return 'Online';
  };

  const getStatusIcon = () => {
    if (!syncStatus.connected) return <WifiOff className="h-3 w-3" />;
    if (syncStatus.failedEvents > 0) return <AlertCircle className="h-3 w-3" />;
    if (syncStatus.queuedEvents > 0) return <Clock className="h-3 w-3" />;
    return <Wifi className="h-3 w-3" />;
  };

  const formatLastSync = () => {
    if (!syncStatus.lastSyncAt) return 'Nooit';
    const lastSync = new Date(syncStatus.lastSyncAt);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - lastSync.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Zojuist';
    if (diffInMinutes < 60) return `${diffInMinutes}m geleden`;
    return lastSync.toLocaleTimeString('nl-NL', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`${getStatusColor()} text-white border-none cursor-help transition-colors duration-200`}
          >
            {getStatusIcon()}
            <span className="ml-1 text-xs">{getStatusText()}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-sm">
          <div className="space-y-1">
            <div>
              <strong>Status:</strong> {syncStatus.connected ? 'Verbonden' : 'Niet verbonden'}
            </div>
            <div>
              <strong>Laatste sync:</strong> {formatLastSync()}
            </div>
            {syncStatus.queuedEvents > 0 && (
              <div>
                <strong>Wachtende updates:</strong> {syncStatus.queuedEvents}
              </div>
            )}
            {syncStatus.failedEvents > 0 && (
              <div className="text-yellow-600">
                <strong>Mislukte updates:</strong> {syncStatus.failedEvents}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};