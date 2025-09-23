import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InvoiceSettingsForm } from '@/components/InvoiceSettingsForm';
import { CreditCard } from 'lucide-react';

export const InvoiceSettings = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <CreditCard className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Factuur Instellingen</h1>
          <p className="text-muted-foreground">Configureer de instellingen voor facturen en betalingen</p>
        </div>
      </div>
      
      <InvoiceSettingsForm />
    </div>
  );
};