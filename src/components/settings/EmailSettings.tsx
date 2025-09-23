import React from 'react';
import { Mail } from 'lucide-react';
import { EmailSettings as EmailSettingsComponent } from '@/components/EmailSettings';

export const EmailSettings = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Mail className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">E-mail Instellingen</h1>
          <p className="text-muted-foreground">Configureer e-mail accounts en webhook instellingen</p>
        </div>
      </div>
      
      <EmailSettingsComponent />
    </div>
  );
};