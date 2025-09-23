
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon, Building2, FileText, Users, Mail, Wallet, Bot, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompanyDetailsSettings } from '@/components/settings/CompanyDetailsSettings';
import { DocumentSettings } from '@/components/settings/DocumentSettings';
import { UserRoleSettings } from '@/components/settings/UserRoleSettings';
import { CommunicationSettings } from '@/components/settings/CommunicationSettings';
import { ExternalIntegrationsSettings } from '@/components/settings/ExternalIntegrationsSettings';

type SettingPage = 'overview' | 'company' | 'documents' | 'users' | 'communication' | 'integrations';

const settingsCategories = [
  {
    title: "Algemeen Beheer",
    description: "Basis configuratie van uw CRM systeem",
    items: [
      {
        id: 'company' as SettingPage,
        title: "Bedrijfsgegevens",
        description: "Beheer uw bedrijfsinformatie en contactgegevens",
        icon: Building2,
        color: "text-blue-600"
      },
      {
        id: 'documents' as SettingPage,
        title: "Document Instellingen",
        description: "Configureer offertes en factuur instellingen",
        icon: FileText,
        color: "text-green-600"
      },
      {
        id: 'users' as SettingPage,
        title: "Gebruikers & Rechten",
        description: "Beheer gebruikers en hun toegangsrechten",
        icon: Users,
        color: "text-purple-600"
      }
    ]
  },
  {
    title: "Communicatie & Automatisering",
    description: "E-mail, templates en notificatie instellingen",
    items: [
      {
        id: 'communication' as SettingPage,
        title: "E-mail & Notificaties",
        description: "Configureer e-mail accounts, templates en notificaties",
        icon: Mail,
        color: "text-orange-600"
      }
    ]
  },
  {
    title: "Externe Integraties",
    description: "Verbindingen met externe services en API's",
    items: [
      {
        id: 'integrations' as SettingPage,
        title: "Stripe Betalingen",
        description: "Beheer Stripe configuratie en betalingsinstellingen",
        icon: Wallet,
        color: "text-emerald-600"
      }
    ]
  }
];

export default function Settings() {
  const [currentPage, setCurrentPage] = useState<SettingPage>('overview');

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'company':
        return <CompanyDetailsSettings />;
      case 'documents':
        return <DocumentSettings />;
      case 'users':
        return <UserRoleSettings />;
      case 'communication':
        return <CommunicationSettings />;
      case 'integrations':
        return <ExternalIntegrationsSettings />;
      default:
        return renderOverview();
    }
  };

  const renderOverview = () => (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-8">
        <SettingsIcon className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Instellingen</h1>
          <p className="text-muted-foreground">Beheer uw CRM systeem configuratie</p>
        </div>
      </div>

      {settingsCategories.map((category, categoryIndex) => (
        <div key={categoryIndex} className="space-y-4">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">{category.title}</h2>
            <p className="text-muted-foreground text-sm">{category.description}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {category.items.map((item) => {
              const IconComponent = item.icon;
              return (
                <Card 
                  key={item.id} 
                  className="cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] group"
                  onClick={() => setCurrentPage(item.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-muted ${item.color}`}>
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base font-medium">{item.title}</CardTitle>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  if (currentPage !== 'overview') {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setCurrentPage('overview')}
            className="mb-4 hover:bg-muted"
          >
            ← Terug naar Instellingen
          </Button>
          {renderCurrentPage()}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {renderCurrentPage()}
    </div>
  );
}
