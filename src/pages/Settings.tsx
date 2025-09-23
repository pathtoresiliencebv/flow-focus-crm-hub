
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon, Building2, FileText, Users, Mail, Wallet, Bot, ChevronRight, CreditCard, Shield, Bell, FormInput, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompanyDetailsSettings } from '@/components/settings/CompanyDetailsSettings';
import { ExternalIntegrationsSettings } from '@/components/settings/ExternalIntegrationsSettings';
import { QuoteSettings } from '@/components/settings/QuoteSettings';
import { InvoiceSettings } from '@/components/settings/InvoiceSettings';
import { UserSettings } from '@/components/settings/UserSettings';
import { RoleSettings } from '@/components/settings/RoleSettings';
import { EmailSettings } from '@/components/settings/EmailSettings';
import { EmailTemplateSettings } from '@/components/settings/EmailTemplateSettings';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { LeadFormSettings } from '@/components/settings/LeadFormSettings';
import { AIIntegrationSettings } from '@/components/settings/AIIntegrationSettings';

type SettingPage = 'overview' | 'company' | 'quotes' | 'invoices' | 'users' | 'roles' | 'email' | 'email-templates' | 'notifications' | 'lead-forms' | 'ai-integration' | 'integrations';

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
        id: 'quotes' as SettingPage,
        title: "Offerte Instellingen",
        description: "Configureer instellingen voor offertes",
        icon: FileText,
        color: "text-green-600"
      },
      {
        id: 'invoices' as SettingPage,
        title: "Factuur Instellingen",
        description: "Configureer factuur en betalingsinstellingen",
        icon: CreditCard,
        color: "text-indigo-600"
      }
    ]
  },
  {
    title: "Gebruikers & Toegang",
    description: "Beheer gebruikers en hun toegangsrechten",
    items: [
      {
        id: 'users' as SettingPage,
        title: "Gebruikersbeheer",
        description: "Beheer gebruikers van het systeem",
        icon: Users,
        color: "text-purple-600"
      },
      {
        id: 'roles' as SettingPage,
        title: "Rollen & Rechten",
        description: "Configureer gebruikersrollen en toegangsrechten",
        icon: Shield,
        color: "text-red-600"
      }
    ]
  },
  {
    title: "Communicatie",
    description: "E-mail, templates en notificatie instellingen",
    items: [
      {
        id: 'email' as SettingPage,
        title: "E-mail Accounts",
        description: "Configureer e-mail accounts en webhooks",
        icon: Mail,
        color: "text-orange-600"
      },
      {
        id: 'email-templates' as SettingPage,
        title: "E-mail Templates",
        description: "Beheer e-mail templates en automatisering",
        icon: MessageSquare,
        color: "text-cyan-600"
      },
      {
        id: 'notifications' as SettingPage,
        title: "Notificaties",
        description: "Configureer push notificaties en meldingen",
        icon: Bell,
        color: "text-yellow-600"
      }
    ]
  },
  {
    title: "Marketing & AI",
    description: "Lead generatie en AI-functies",
    items: [
      {
        id: 'lead-forms' as SettingPage,
        title: "Lead Formulieren",
        description: "Configureer website formulieren voor leadgeneratie",
        icon: FormInput,
        color: "text-pink-600"
      },
      {
        id: 'ai-integration' as SettingPage,
        title: "AI Integratie",
        description: "Configureer AI-functies en automatisering",
        icon: Bot,
        color: "text-violet-600"
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
      case 'quotes':
        return <QuoteSettings />;
      case 'invoices':
        return <InvoiceSettings />;
      case 'users':
        return <UserSettings />;
      case 'roles':
        return <RoleSettings />;
      case 'email':
        return <EmailSettings />;
      case 'email-templates':
        return <EmailTemplateSettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'lead-forms':
        return <LeadFormSettings />;
      case 'ai-integration':
        return <AIIntegrationSettings />;
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
