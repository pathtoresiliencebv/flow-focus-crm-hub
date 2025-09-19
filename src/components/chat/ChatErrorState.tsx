import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface ChatErrorStateProps {
  error: string;
  onRetry?: () => void;
}

export const ChatErrorState: React.FC<ChatErrorStateProps> = ({
  error,
  onRetry
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="text-4xl mb-4">⚠️</div>
      <h3 className="text-lg font-semibold mb-2">Er ging iets mis</h3>
      <p className="text-muted-foreground mb-4 max-w-sm">
        {error}
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Opnieuw proberen
        </Button>
      )}
    </div>
  );
};