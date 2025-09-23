import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmailSettings } from '@/components/EmailSettings';
import { EmailTemplateManager } from '@/components/EmailTemplateManager';
import { NotificationTester } from '@/components/NotificationTester';
import { Mail, MessageSquareText, Bell } from 'lucide-react';

export const CommunicationSettings = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Mail className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Communicatie & Automatisering</h1>
          <p className="text-muted-foreground">Configureer e-mail, templates en notificaties</p>
        </div>
      </div>
      
      <Tabs defaultValue="email" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            E-mail
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <MessageSquareText className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notificaties
          </TabsTrigger>
        </TabsList>

        <TabsContent value="email">
          <EmailSettings />
        </TabsContent>

        <TabsContent value="templates">
          <EmailTemplateManager />
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notificatie Systeem</CardTitle>
              <p className="text-sm text-muted-foreground">
                Test het enterprise notificatie systeem met push notificaties en real-time updates.
              </p>
            </CardHeader>
            <CardContent>
              <NotificationTester />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};