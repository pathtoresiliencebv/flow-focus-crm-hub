import React from 'react';

interface ChatLoadingStateProps {
  message?: string;
}

export const ChatLoadingState: React.FC<ChatLoadingStateProps> = ({
  message = "Berichten laden..."
}) => {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
};