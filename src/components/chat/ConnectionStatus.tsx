import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Wifi, WifiOff, RotateCcw } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean;
  lastConnected: Date | null;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  onReconnect: () => void;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  lastConnected,
  reconnectAttempts,
  maxReconnectAttempts,
  onReconnect
}) => {
  if (isConnected) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-success/10 border border-success/20 rounded-lg">
        <Wifi className="h-4 w-4 text-success" />
        <span className="text-sm text-success font-medium">Chat verbonden</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2 bg-destructive/10 border border-destructive/20 rounded-lg">
      <div className="flex items-center gap-2">
        <WifiOff className="h-4 w-4 text-destructive" />
        <div className="flex flex-col">
          <span className="text-sm text-destructive font-medium">
            Chat verbinding verbroken
          </span>
          {reconnectAttempts > 0 && (
            <span className="text-xs text-muted-foreground">
              Poging {reconnectAttempts}/{maxReconnectAttempts}
            </span>
          )}
        </div>
      </div>
      
      {reconnectAttempts < maxReconnectAttempts ? (
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-destructive border-t-transparent" />
          <span className="text-xs text-muted-foreground">Opnieuw verbinden...</span>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={onReconnect}
          className="text-xs h-7"
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Probeer opnieuw
        </Button>
      )}
    </div>
  );
};