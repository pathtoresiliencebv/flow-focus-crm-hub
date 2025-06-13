
import React from 'react';
import { QuoteSettingsForm } from '@/components/QuoteSettingsForm';
import { InvoiceSettingsForm } from '@/components/InvoiceSettingsForm';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon, FileText, CreditCard } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Settings() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <SettingsIcon className="h-8 w-8 text-smans-primary" />
          <h1 className="text-3xl font-bold text-gray-900">Instellingen</h1>
        </div>
        <p className="text-gray-600">Beheer uw bedrijfsgegevens, offerte en factuur instellingen</p>
      </div>

      <Tabs defaultValue="quotes" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="quotes" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Offerte Instellingen
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Factuur & Betaling Instellingen
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quotes" className="space-y-6">
          <QuoteSettingsForm />
        </TabsContent>

        <TabsContent value="invoices" className="space-y-6">
          <InvoiceSettingsForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
