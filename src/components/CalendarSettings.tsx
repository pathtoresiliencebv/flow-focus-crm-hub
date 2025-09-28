import React, { useEffect } from 'react';
import { CalendarIntegration } from '@/components/CalendarIntegration';
import { PlanningDemo } from '@/components/PlanningDemo';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export const CalendarSettings: React.FC = () => {
  const { handleOAuthCallback } = useGoogleCalendar();

  useEffect(() => {
    // Handle OAuth callback if code is present in URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      handleOAuthCallback(code).then(() => {
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }).catch(console.error);
    }
  }, [handleOAuthCallback]);

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Google Calendar Team Integratie</strong><br />
          Synchroniseer automatisch planning items met Google Calendar. Installateurs krijgen toegang tot de "Monteurs Agenda" 
          terwijl administrators alle team agenda's kunnen beheren.
        </AlertDescription>
      </Alert>
      
      <CalendarIntegration />
      
      <PlanningDemo />
    </div>
  );
};