import React from 'react';
import { FileText } from 'lucide-react';
import { EmailTemplateManager } from '@/components/EmailTemplateManager';

export const EmailTemplateSettings = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">E-mail Templates</h1>
          <p className="text-muted-foreground">Beheer e-mail templates voor offertes, facturen en communicatie</p>
        </div>
      </div>
      
      <EmailTemplateManager />
    </div>
  );
};