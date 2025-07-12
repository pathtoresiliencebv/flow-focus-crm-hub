
import React from 'react';
import { QuoteSettingsForm } from '@/components/QuoteSettingsForm';
import { InvoiceSettingsForm } from '@/components/InvoiceSettingsForm';
import { EmailTemplateManager } from '@/components/EmailTemplateManager';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon, FileText, CreditCard, Mail, MessageSquareText, Bell, Activity } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmailSettings } from '@/components/EmailSettings';
import { NotificationTester } from '@/components/NotificationTester';
import { ChatTestingPanel } from '@/components/chat/ChatTestingPanel';

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
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="quotes" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Offerte Instellingen
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Factuur & Betaling Instellingen
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            E-mail Instellingen
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <MessageSquareText className="h-4 w-4" />
            Email Templates
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notificaties
          </TabsTrigger>
          <TabsTrigger value="chat-testing" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Chat Testing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quotes" className="space-y-6">
          <QuoteSettingsForm />
        </TabsContent>

        <TabsContent value="invoices" className="space-y-6">
          <InvoiceSettingsForm />
        </TabsContent>

        <TabsContent value="email" className="space-y-6">
          <EmailSettings />
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <EmailTemplateManager />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notificatie Systeem Tester</CardTitle>
              <p className="text-sm text-muted-foreground">
                Test het enterprise notificatie systeem met push notificaties, real-time updates en meer.
              </p>
            </CardHeader>
            <CardContent>
              <NotificationTester />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat-testing" className="space-y-6">
          <ChatTestingPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
