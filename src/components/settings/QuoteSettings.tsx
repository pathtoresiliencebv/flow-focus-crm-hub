import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuoteSettingsForm } from '@/components/QuoteSettingsForm';
import { FileText } from 'lucide-react';

export const QuoteSettings = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Offerte Instellingen</h1>
          <p className="text-muted-foreground">Configureer de instellingen voor offertes</p>
        </div>
      </div>
      
      <QuoteSettingsForm />
    </div>
  );
};