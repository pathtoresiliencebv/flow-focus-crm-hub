import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Wifi } from 'lucide-react';

export const ChatPerformanceIndicator = () => {
  // Temporary placeholder component
  return (
    <Button variant="ghost" size="sm" className="flex items-center gap-2">
      <Wifi className="h-4 w-4 text-green-500" />
      <Activity className="h-4 w-4 text-green-500" />
      <Badge variant="outline" className="text-xs">
        Good
      </Badge>
    </Button>
  );
};