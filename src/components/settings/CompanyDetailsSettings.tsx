import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CompanySettingsForm } from '@/components/CompanySettingsForm';
import { Building2 } from 'lucide-react';

export const CompanyDetailsSettings = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Building2 className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Bedrijfsgegevens</h1>
          <p className="text-muted-foreground">Beheer uw bedrijfsinformatie en contactgegevens</p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Algemene Bedrijfsinformatie</CardTitle>
        </CardHeader>
        <CardContent>
          <CompanySettingsForm />
        </CardContent>
      </Card>
    </div>
  );
};