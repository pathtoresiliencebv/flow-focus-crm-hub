
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon, Building2, FileText, Users, Mail, Wallet, Bot, ChevronRight, CreditCard, Shield, Bell, FormInput, MessageSquare, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePageHeader } from "@/contexts/PageHeaderContext";
import { CompanyDetailsSettings } from '@/components/settings/CompanyDetailsSettings';
import { ExternalIntegrationsSettings } from '@/components/settings/ExternalIntegrationsSettings';
import { QuoteSettings } from '@/components/settings/QuoteSettings';
import { InvoiceSettings } from '@/components/settings/InvoiceSettings';
import { UserSettings } from '@/components/settings/UserSettings';
import { RoleSettings } from '@/components/settings/RoleSettings';
import { EmailSettings } from '@/components/settings/EmailSettings';
import { EmailTemplateSettings } from '@/components/settings/EmailTemplateSettings';
import { EmailNotificationSettings } from '@/components/settings/EmailNotificationSettings';
import { SystemNotificationSettings } from '@/components/settings/SystemNotificationSettings';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { LeadFormSettings } from '@/components/settings/LeadFormSettings';
import { AIIntegrationSettings } from '@/components/settings/AIIntegrationSettings';
import { LanguageSettingsPage } from '@/components/settings/LanguageSettingsPage';

type SettingPage = 'overview' | 'company' | 'quotes' | 'invoices' | 'users' | 'roles' | 'email' | 'email-templates' | 'email-notifications' | 'system-notifications' | 'notifications' | 'lead-forms' | 'ai-integration' | 'integrations' | 'language';

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
        id: 'language' as SettingPage,
        title: "Taal & Vertaling",
        description: "Wijzig interface taal en vertaalinstellingen",
        icon: Languages,
        color: "text-teal-600"
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
        id: 'email-notifications' as SettingPage,
        title: "E-mail Notificaties",
        description: "Automatische emails naar klanten bij planning en afronding",
        icon: Mail,
        color: "text-blue-600"
      },
      {
        id: 'system-notifications' as SettingPage,
        title: "Systeem Notificaties",
        description: "SMTP, SMS en notificatie instellingen configureren",
        icon: SettingsIcon,
        color: "text-indigo-600"
      },
      {
        id: 'notifications' as SettingPage,
        title: "Push Notificaties",
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
  const { setTitle } = usePageHeader();
  const [currentPage, setCurrentPage] = useState<SettingPage>('overview');

  React.useEffect(() => {
    setTitle("Instellingen");
  }, [setTitle]);

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'company':
        return <CompanyDetailsSettings />;
      case 'language':
        return <LanguageSettingsPage />;
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
      case 'email-notifications':
        return <EmailNotificationSettings />;
      case 'system-notifications':
        return <SystemNotificationSettings />;
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

  // Get all items from all categories in a flat array
  const allSettingsItems = settingsCategories.flatMap(category => category.items);

  const renderOverview = () => (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-8">
        <SettingsIcon className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Instellingen</h1>
          <p className="text-muted-foreground">Beheer uw CRM systeem configuratie</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {allSettingsItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <Card 
              key={item.id} 
              className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.03] group border-2 hover:border-primary/20 bg-card/50 backdrop-blur-sm"
              onClick={() => setCurrentPage(item.id)}
            >
              <CardContent className="p-6 text-center">
                <div className="flex flex-col items-center space-y-4">
                  <div className={`p-4 rounded-2xl bg-gradient-to-br from-background to-muted shadow-md group-hover:shadow-lg transition-all duration-300 ${item.color}`}>
                    <IconComponent className="h-8 w-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm leading-tight">{item.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{item.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
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
