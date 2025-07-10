import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Globe, Shield, Zap } from 'lucide-react';

interface EmailProvider {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  oauth: boolean;
  popular?: boolean;
}

const EMAIL_PROVIDERS: EmailProvider[] = [
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Google Gmail met automatische synchronisatie',
    icon: <Mail className="h-6 w-6 text-blue-600" />,
    features: ['Automatische sync', 'OAuth beveiliging', 'Real-time updates'],
    oauth: true,
    popular: true
  },
  {
    id: 'outlook',
    name: 'Outlook',
    description: 'Microsoft Outlook / Office 365',
    icon: <Globe className="h-6 w-6 text-blue-500" />,
    features: ['Office 365 integratie', 'Zakelijke accounts', 'Automatische sync'],
    oauth: true,
    popular: true
  },
  {
    id: 'yahoo',
    name: 'Yahoo Mail',
    description: 'Yahoo e-mail accounts',
    icon: <Zap className="h-6 w-6 text-purple-600" />,
    features: ['IMAP ondersteuning', 'Betrouwbare sync'],
    oauth: false
  },
  {
    id: 'imap',
    name: 'Andere Provider',
    description: 'Aangepaste IMAP/SMTP instellingen',
    icon: <Shield className="h-6 w-6 text-gray-600" />,
    features: ['Volledige controle', 'Aangepaste instellingen', 'Alle providers'],
    oauth: false
  }
];

interface EmailProviderSelectorProps {
  onProviderSelect: (provider: EmailProvider) => void;
  selectedProvider?: string;
}

export const EmailProviderSelector: React.FC<EmailProviderSelectorProps> = ({
  onProviderSelect,
  selectedProvider
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {EMAIL_PROVIDERS.map((provider) => (
        <Card 
          key={provider.id}
          className={`cursor-pointer transition-all hover:shadow-lg ${
            selectedProvider === provider.id ? 'ring-2 ring-primary' : ''
          }`}
          onClick={() => onProviderSelect(provider)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {provider.icon}
                <CardTitle className="text-lg">{provider.name}</CardTitle>
              </div>
              <div className="flex gap-2">
                {provider.popular && (
                  <Badge variant="secondary">Populair</Badge>
                )}
                {provider.oauth && (
                  <Badge variant="outline">OAuth</Badge>
                )}
              </div>
            </div>
            <CardDescription>{provider.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {provider.features.map((feature, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {feature}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};