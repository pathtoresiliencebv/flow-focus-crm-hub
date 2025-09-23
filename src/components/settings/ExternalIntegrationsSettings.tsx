import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StripeStatusDashboard } from '@/components/stripe/StripeStatusDashboard';
import { StripeConfigManager } from '@/components/stripe/StripeConfigManager';
import { Wallet } from 'lucide-react';

export const ExternalIntegrationsSettings = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Wallet className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Externe Integraties</h1>
          <p className="text-muted-foreground">Beheer verbindingen met externe services</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-6">
          <StripeStatusDashboard />
        </div>
        <div>
          <StripeConfigManager />
        </div>
      </div>
    </div>
  );
};