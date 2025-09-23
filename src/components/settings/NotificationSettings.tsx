import React from 'react';
import { Bell } from 'lucide-react';
import { NotificationTester } from '@/components/NotificationTester';

export const NotificationSettings = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Notificatie Instellingen</h1>
          <p className="text-muted-foreground">Configureer push notificaties en meldingen</p>
        </div>
      </div>
      
      <NotificationTester />
    </div>
  );
};