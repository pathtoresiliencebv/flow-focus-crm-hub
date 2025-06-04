
import React from 'react';
import { QuoteSettingsForm } from '@/components/QuoteSettingsForm';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon } from "lucide-react";

export default function Settings() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <SettingsIcon className="h-8 w-8 text-smans-primary" />
          <h1 className="text-3xl font-bold text-gray-900">Instellingen</h1>
        </div>
        <p className="text-gray-600">Beheer uw bedrijfsgegevens en offerte instellingen</p>
      </div>

      <QuoteSettingsForm />
    </div>
  );
}
