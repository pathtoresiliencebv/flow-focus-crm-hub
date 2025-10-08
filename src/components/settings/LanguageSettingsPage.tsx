import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Languages, Settings } from 'lucide-react';
import { LanguageSettings } from '@/components/LanguageSettings';
import { TranslationManager } from '@/components/admin/TranslationManager';
import { useAuth } from '@/contexts/AuthContext';

export function LanguageSettingsPage() {
  const { hasPermission } = useAuth();
  const isAdmin = hasPermission('users_edit'); // Admins can manage translations

  if (!isAdmin) {
    // Regular users only see their language preferences
    return <LanguageSettings />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Languages className="h-8 w-8 text-primary" />
          Taal & Vertaling
        </h1>
        <p className="text-muted-foreground mt-1">
          Beheer je taalvoorkeuren en platform vertalingen
        </p>
      </div>

      <Tabs defaultValue="preferences" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Languages className="h-4 w-4" />
            Mijn Voorkeuren
          </TabsTrigger>
          <TabsTrigger value="translations" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Vertalingen Beheren
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preferences">
          <LanguageSettings />
        </TabsContent>

        <TabsContent value="translations">
          <TranslationManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}

