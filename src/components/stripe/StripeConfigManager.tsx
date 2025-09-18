import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Settings, 
  Key, 
  ExternalLink, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info
} from "lucide-react";
import { useStripeConfig } from '@/hooks/useStripeConfig';

export const StripeConfigManager: React.FC = () => {
  const {
    configData,
    loading,
    isConnected,
    error
  } = useStripeConfig();

  const openStripeLinks = {
    dashboard: "https://dashboard.stripe.com",
    webhooks: "https://dashboard.stripe.com/webhooks",
    apiKeys: "https://dashboard.stripe.com/apikeys",
    products: "https://dashboard.stripe.com/products"
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Stripe Configuratie Beheer
        </h2>
        <p className="text-gray-600">Beheer uw Stripe integratie en configuratie instellingen</p>
      </div>

      {/* Current Configuration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Huidige Configuratie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Live Key Status */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div>
                  <p className="font-medium">STRIPE_LIVE_KEY</p>
                  <p className="text-sm text-gray-500">Live productie key voor echte betalingen</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <Badge className="bg-green-100 text-green-800">Actief</Badge>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-600" />
                    <Badge variant="destructive">Probleem</Badge>
                  </>
                )}
              </div>
            </div>

            {/* Webhook Configuration */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div>
                  <p className="font-medium">STRIPE_WEBHOOK_SECRET</p>
                  <p className="text-sm text-gray-500">Secret voor webhook verificatie</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {configData?.webhookConfigured ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <Badge className="bg-green-100 text-green-800">Geconfigureerd</Badge>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <Badge variant="outline" className="border-yellow-300 text-yellow-700">
                      Niet Ingesteld
                    </Badge>
                  </>
                )}
              </div>
            </div>
          </div>

          {error && (
            <Alert className="mt-4" variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Configuratie Fout:</strong> {error}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Snelle Acties</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="justify-start h-auto p-4"
              onClick={() => window.open(openStripeLinks.dashboard, '_blank')}
            >
              <div className="flex items-center gap-3">
                <ExternalLink className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">Stripe Dashboard</p>
                  <p className="text-sm text-gray-500">Bekijk betalingen en transacties</p>
                </div>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="justify-start h-auto p-4"
              onClick={() => window.open(openStripeLinks.webhooks, '_blank')}
            >
              <div className="flex items-center gap-3">
                <ExternalLink className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">Webhook Instellingen</p>
                  <p className="text-sm text-gray-500">Configureer webhook endpoints</p>
                </div>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="justify-start h-auto p-4"
              onClick={() => window.open(openStripeLinks.products, '_blank')}
            >
              <div className="flex items-center gap-3">
                <ExternalLink className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">Producten Beheer</p>
                  <p className="text-sm text-gray-500">Beheer producten en prijzen</p>
                </div>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="justify-start h-auto p-4"
              onClick={() => window.open(openStripeLinks.apiKeys, '_blank')}
            >
              <div className="flex items-center gap-3">
                <ExternalLink className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">API Keys</p>
                  <p className="text-sm text-gray-500">Bekijk en beheer API keys</p>
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Configuratie Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Webhook Endpoint:</strong> Gebruik deze URL voor uw Stripe webhook: 
                <code className="ml-2 px-2 py-1 bg-gray-100 rounded">
                  https://pvesgvkyiaqmsudmmtkc.supabase.co/functions/v1/stripe-webhook
                </code>
              </AlertDescription>
            </Alert>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Aanbevolen Events:</strong> Configureer de volgende webhook events voor optimale functionaliteit:
                <ul className="mt-2 ml-4 list-disc text-sm">
                  <li>payment_intent.succeeded</li>
                  <li>payment_intent.payment_failed</li>
                  <li>payment_link.payment_succeeded</li>
                  <li>invoice.payment_succeeded</li>
                </ul>
              </AlertDescription>
            </Alert>

            {!configData?.webhookConfigured && (
              <Alert className="border-yellow-300 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription>
                  <strong>Actie Vereist:</strong> Het webhook secret moet worden toegevoegd aan de Supabase secrets 
                  onder de naam "STRIPE_WEBHOOK_SECRET" voor volledige functionaliteit.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Environment Information */}
      <Card>
        <CardHeader>
          <CardTitle>Environment Informatie</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="font-medium text-blue-900">Huidige Mode</p>
              <p className="text-sm text-blue-700">Live Productie Environment</p>
              <Badge className="mt-2 bg-blue-100 text-blue-800">LIVE</Badge>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900">API Versie</p>
              <p className="text-sm text-gray-700">2025-08-27.basil</p>
              <Badge variant="outline" className="mt-2">Nieuwste</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};