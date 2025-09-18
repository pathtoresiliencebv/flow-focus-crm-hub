import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  AlertCircle,
  DollarSign,
  Package,
  Webhook,
  Globe
} from "lucide-react";
import { useStripeConfig } from '@/hooks/useStripeConfig';

export const StripeStatusDashboard: React.FC = () => {
  const {
    configData,
    loading,
    lastUpdated,
    testStripeConfig,
    getConnectionStatus,
    getStatusColor,
    getStatusText,
    isConnected,
    error
  } = useStripeConfig();

  const formatCurrency = (amount: number | null | undefined, currency: string = 'eur') => {
    if (amount === null || amount === undefined) return 'N/A';
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'Nooit';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('nl-NL');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Stripe Status Dashboard</h2>
          <p className="text-gray-600">Real-time status van uw Stripe integratie</p>
        </div>
        <Button 
          onClick={testStripeConfig} 
          disabled={loading}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Testen...' : 'Test Configuratie'}
        </Button>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Verbindingsstatus
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-4">
            {getConnectionStatus() === 'connected' && (
              <CheckCircle className="h-6 w-6 text-green-600" />
            )}
            {getConnectionStatus() === 'error' && (
              <XCircle className="h-6 w-6 text-red-600" />
            )}
            {getConnectionStatus() === 'testing' && (
              <RefreshCw className="h-6 w-6 text-yellow-600 animate-spin" />
            )}
            <span className={`text-lg font-semibold ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </div>
          
          {lastUpdated && (
            <p className="text-sm text-gray-500">
              Laatst getest: {formatDate(lastUpdated)}
            </p>
          )}

          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">Fout Details:</span>
              </div>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Information */}
      {isConnected && configData?.account && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Account Informatie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Account Naam</p>
                <p className="text-lg font-semibold">{configData.account.display_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Account ID</p>
                <p className="text-sm font-mono text-gray-700">{configData.account.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Land</p>
                <p className="text-lg">{configData.account.country?.toUpperCase()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Business Type</p>
                <p className="text-lg capitalize">{configData.account.business_type}</p>
              </div>
              {configData.account.email && (
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-lg">{configData.account.email}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Balance & Financial Info */}
      {isConnected && configData?.balance && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Saldo Informatie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Beschikbaar Saldo</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(configData.balance.available, configData.balance.currency)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products & Prices */}
      {isConnected && (configData?.products || configData?.prices) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Products */}
          {configData?.products && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Producten ({configData.products.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {configData.products.map((product) => (
                    <div key={product.id} className="flex items-center justify-between">
                      <span className="text-sm">{product.name}</span>
                      <Badge variant={product.active ? "default" : "secondary"}>
                        {product.active ? 'Actief' : 'Inactief'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Prices */}
          {configData?.prices && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Prijzen ({configData.prices.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {configData.prices.map((price) => (
                    <div key={price.id} className="flex items-center justify-between">
                      <span className="text-sm">
                        {formatCurrency(price.unit_amount, price.currency)}
                      </span>
                      <Badge variant="outline">
                        {price.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Webhook Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Webhook Configuratie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            {configData?.webhookConfigured ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-600 font-medium">Webhook Secret Geconfigureerd</span>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-red-600" />
                <span className="text-red-600 font-medium">Webhook Secret Niet Geconfigureerd</span>
              </>
            )}
          </div>
          
          {!configData?.webhookConfigured && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Voor volledige functionaliteit moet het webhook secret worden geconfigureerd in de Supabase secrets.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};