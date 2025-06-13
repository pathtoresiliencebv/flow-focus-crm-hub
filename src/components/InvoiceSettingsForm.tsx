
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Settings, Zap, Mail, Calendar } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";

export const InvoiceSettingsForm = () => {
  const { toast } = useToast();
  
  const [settings, setSettings] = useState({
    invoicePrefix: 'FACT-',
    bankName: 'ING Bank',
    bankAccount: 'NL91 INGB 0002 4455 88',
    vatNumber: 'NL123456789B01',
    kvkNumber: '12345678',
    invoiceNotes: 'Betaling binnen 30 dagen na factuurdatum.',
    paymentTerms: '30',
    stripeIntegration: false,
    stripePublishableKey: '',
    paymentMethods: ['ideal', 'creditcard'],
    invoiceFooterText: 'Bedankt voor uw vertrouwen in SMANS.',
    autoSendInvoices: false,
    googleCalendarIntegration: false
  });

  const handleInputChange = (field: string, value: string | boolean | string[]) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePaymentMethodChange = (method: string, checked: boolean) => {
    setSettings(prev => ({
      ...prev,
      paymentMethods: checked 
        ? [...prev.paymentMethods, method]
        : prev.paymentMethods.filter(m => m !== method)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulate saving settings
    setTimeout(() => {
      toast({
        title: "Instellingen opgeslagen",
        description: "Uw factuur en betaal instellingen zijn succesvol bijgewerkt."
      });
    }, 500);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Invoice Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Factuur Instellingen
          </CardTitle>
          <CardDescription>
            Configureer de basis instellingen voor uw facturen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="invoicePrefix">Factuur Prefix</Label>
              <Input
                id="invoicePrefix"
                value={settings.invoicePrefix}
                onChange={(e) => handleInputChange('invoicePrefix', e.target.value)}
                placeholder="FACT-"
              />
            </div>
            <div>
              <Label htmlFor="paymentTerms">Betalingstermijn (dagen)</Label>
              <Input
                id="paymentTerms"
                type="number"
                value={settings.paymentTerms}
                onChange={(e) => handleInputChange('paymentTerms', e.target.value)}
                placeholder="30"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bankName">Bank Naam</Label>
              <Input
                id="bankName"
                value={settings.bankName}
                onChange={(e) => handleInputChange('bankName', e.target.value)}
                placeholder="ING Bank"
              />
            </div>
            <div>
              <Label htmlFor="bankAccount">IBAN Rekeningnummer</Label>
              <Input
                id="bankAccount"
                value={settings.bankAccount}
                onChange={(e) => handleInputChange('bankAccount', e.target.value)}
                placeholder="NL91 INGB 0002 4455 88"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vatNumber">BTW Nummer</Label>
              <Input
                id="vatNumber"
                value={settings.vatNumber}
                onChange={(e) => handleInputChange('vatNumber', e.target.value)}
                placeholder="NL123456789B01"
              />
            </div>
            <div>
              <Label htmlFor="kvkNumber">KvK Nummer</Label>
              <Input
                id="kvkNumber"
                value={settings.kvkNumber}
                onChange={(e) => handleInputChange('kvkNumber', e.target.value)}
                placeholder="12345678"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="invoiceNotes">Standaard Factuur Notities</Label>
            <Textarea
              id="invoiceNotes"
              value={settings.invoiceNotes}
              onChange={(e) => handleInputChange('invoiceNotes', e.target.value)}
              placeholder="Betaling binnen 30 dagen na factuurdatum."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="invoiceFooterText">Factuur Footer Tekst</Label>
            <Textarea
              id="invoiceFooterText"
              value={settings.invoiceFooterText}
              onChange={(e) => handleInputChange('invoiceFooterText', e.target.value)}
              placeholder="Bedankt voor uw vertrouwen in SMANS."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Stripe Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Stripe Integratie
          </CardTitle>
          <CardDescription>
            Stel online betalingen in via Stripe
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="stripeIntegration"
              checked={settings.stripeIntegration}
              onCheckedChange={(checked) => handleInputChange('stripeIntegration', checked)}
            />
            <Label htmlFor="stripeIntegration">Stripe integratie inschakelen</Label>
          </div>

          {settings.stripeIntegration && (
            <div className="space-y-4 pt-4 border-t">
              <div>
                <Label htmlFor="stripePublishableKey">Stripe Publishable Key</Label>
                <Input
                  id="stripePublishableKey"
                  type="password"
                  value={settings.stripePublishableKey}
                  onChange={(e) => handleInputChange('stripePublishableKey', e.target.value)}
                  placeholder="pk_live_..."
                />
              </div>

              <div>
                <Label className="text-base font-medium">Beschikbare Betaalmethodes</Label>
                <div className="space-y-2 mt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="ideal"
                      checked={settings.paymentMethods.includes('ideal')}
                      onCheckedChange={(checked) => handlePaymentMethodChange('ideal', checked as boolean)}
                    />
                    <Label htmlFor="ideal">iDEAL</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="creditcard"
                      checked={settings.paymentMethods.includes('creditcard')}
                      onCheckedChange={(checked) => handlePaymentMethodChange('creditcard', checked as boolean)}
                    />
                    <Label htmlFor="creditcard">Credit Card</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="bancontact"
                      checked={settings.paymentMethods.includes('bancontact')}
                      onCheckedChange={(checked) => handlePaymentMethodChange('bancontact', checked as boolean)}
                    />
                    <Label htmlFor="bancontact">Bancontact</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="sofort"
                      checked={settings.paymentMethods.includes('sofort')}
                      onCheckedChange={(checked) => handlePaymentMethodChange('sofort', checked as boolean)}
                    />
                    <Label htmlFor="sofort">SOFORT</Label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Automation Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Automatisering
          </CardTitle>
          <CardDescription>
            Automatische acties en integraties
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="autoSendInvoices">Automatisch facturen versturen</Label>
              <p className="text-sm text-muted-foreground">
                Verstuur facturen automatisch naar klanten na goedkeuring
              </p>
            </div>
            <Switch
              id="autoSendInvoices"
              checked={settings.autoSendInvoices}
              onCheckedChange={(checked) => handleInputChange('autoSendInvoices', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="googleCalendarIntegration">Google Calendar integratie</Label>
              <p className="text-sm text-muted-foreground">
                Synchroniseer planning met Google Calendar
              </p>
            </div>
            <Switch
              id="googleCalendarIntegration"
              checked={settings.googleCalendarIntegration}
              onCheckedChange={(checked) => handleInputChange('googleCalendarIntegration', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" className="bg-smans-primary hover:bg-smans-primary/90">
          Instellingen Opslaan
        </Button>
      </div>
    </form>
  );
};
