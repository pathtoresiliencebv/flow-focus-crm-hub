import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WifiOff, Wifi, Sync, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { useToast } from "@/hooks/use-toast";

interface OfflineStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export const OfflineStatusIndicator: React.FC<OfflineStatusIndicatorProps> = ({
  className = "",
  showDetails = false
}) => {
  const { 
    syncStatus, 
    offlineQueue, 
    processSyncQueue, 
    retrySyncQueue, 
    clearSyncQueue 
  } = useOfflineSync();
  const { toast } = useToast();

  const handleRetrySync = async () => {
    await retrySyncQueue();
    toast({
      title: "Synchronisatie opnieuw gestart",
      description: "Mislukte acties worden opnieuw geprobeerd.",
    });
  };

  const handleClearQueue = async () => {
    if (window.confirm("Weet je zeker dat je alle niet-gesynchroniseerde wijzigingen wilt verwijderen?")) {
      await clearSyncQueue();
      toast({
        title: "Synchronisatie wachtrij gewist",
        description: "Alle offline wijzigingen zijn verwijderd.",
      });
    }
  };

  const getStatusIcon = () => {
    if (!syncStatus.isOnline) {
      return <WifiOff className="h-4 w-4 text-red-500" />;
    }
    
    if (syncStatus.isSyncing) {
      return <Sync className="h-4 w-4 text-blue-500 animate-spin" />;
    }
    
    if (syncStatus.pendingActions > 0) {
      return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    }
    
    return <Wifi className="h-4 w-4 text-green-500" />;
  };

  const getStatusText = () => {
    if (!syncStatus.isOnline) {
      return "Offline";
    }
    
    if (syncStatus.isSyncing) {
      return "Synchroniseren...";
    }
    
    if (syncStatus.pendingActions > 0) {
      return `${syncStatus.pendingActions} wachtend`;
    }
    
    return "Online";
  };

  const getStatusBadgeVariant = () => {
    if (!syncStatus.isOnline) {
      return "destructive";
    }
    
    if (syncStatus.pendingActions > 0) {
      return "secondary";
    }
    
    return "default";
  };

  const failedActions = offlineQueue.filter(action => action.status === 'failed');
  const pendingActions = offlineQueue.filter(action => action.status === 'pending');

  if (!showDetails) {
    return (
      <Badge 
        variant={getStatusBadgeVariant()}
        className={`flex items-center gap-1 ${className}`}
      >
        {getStatusIcon()}
        {getStatusText()}
      </Badge>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className="font-medium">{getStatusText()}</span>
            </div>
            <Badge variant={getStatusBadgeVariant()}>
              {syncStatus.isOnline ? "Online" : "Offline"}
            </Badge>
          </div>

          {syncStatus.pendingActions > 0 && (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                Synchronisatie status:
              </div>
              
              {pendingActions.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <span>{pendingActions.length} wijzigingen wachten op synchronisatie</span>
                </div>
              )}
              
              {failedActions.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span>{failedActions.length} wijzigingen zijn mislukt</span>
                </div>
              )}
              
              {syncStatus.isSyncing && (
                <div className="flex items-center gap-2 text-sm">
                  <Sync className="h-4 w-4 text-blue-500 animate-spin" />
                  <span>Bezig met synchroniseren...</span>
                </div>
              )}
            </div>
          )}

          {syncStatus.lastSyncTime && (
            <div className="text-xs text-muted-foreground">
              Laatste synchronisatie: {new Date(syncStatus.lastSyncTime).toLocaleString('nl-NL')}
            </div>
          )}

          {(syncStatus.pendingActions > 0 || failedActions.length > 0) && (
            <div className="flex gap-2">
              {syncStatus.isOnline && pendingActions.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => processSyncQueue()}
                  disabled={syncStatus.isSyncing}
                  className="flex items-center gap-1"
                >
                  <RefreshCw className="h-3 w-3" />
                  Nu synchroniseren
                </Button>
              )}
              
              {failedActions.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRetrySync}
                  disabled={syncStatus.isSyncing}
                  className="flex items-center gap-1"
                >
                  <RefreshCw className="h-3 w-3" />
                  Opnieuw proberen
                </Button>
              )}
              
              <Button
                size="sm"
                variant="ghost"
                onClick={handleClearQueue}
                disabled={syncStatus.isSyncing}
                className="text-red-600 hover:text-red-700"
              >
                Wis wachtrij
              </Button>
            </div>
          )}

          {syncStatus.syncError && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              Synchronisatie fout: {syncStatus.syncError}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};