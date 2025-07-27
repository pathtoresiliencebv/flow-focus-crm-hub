import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Copy, ExternalLink } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function EmailWebhookSetup() {
  const webhookUrl = 'https://pvesgvkyiaqmsudmmtkc.supabase.co/functions/v1/receipt-processor';
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast({
      title: "Webhook URL gekopieerd",
      description: "De webhook URL is naar je klembord gekopieerd.",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Bonnetjes Email Setup
          </CardTitle>
          <CardDescription>
            Configureer automatische bonnetje verwerking via email forwarding
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="webhook-url">Webhook URL</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="webhook-url"
                value={webhookUrl}
                readOnly
                className="font-mono text-sm"
              />
              <Button onClick={copyToClipboard} size="sm" variant="outline">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Setup Instructies:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
              <li>
                <strong>Gmail gebruikers:</strong>
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                  <li>Ga naar Gmail → Instellingen → Doorsturen en POP/IMAP</li>
                  <li>Voeg een doorstuuradres toe: <code className="bg-blue-100 px-1 rounded">bonnetjes@smanscrm.nl</code></li>
                  <li>Maak een filter voor bonnetjes (onderwerp bevat "factuur", "bon", "receipt")</li>
                  <li>Stel in dat deze emails automatisch worden doorgestuurd</li>
                </ul>
              </li>
              <li>
                <strong>Outlook gebruikers:</strong>
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                  <li>Ga naar Outlook → Instellingen → Mail → Regels</li>
                  <li>Maak een nieuwe regel voor inkomende emails</li>
                  <li>Voorwaarde: onderwerp bevat "factuur" OF "bon" OF "receipt"</li>
                  <li>Actie: doorsturen naar <code className="bg-blue-100 px-1 rounded">bonnetjes@smanscrm.nl</code></li>
                </ul>
              </li>
              <li>
                <strong>Andere email providers:</strong>
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                  <li>Configureer email forwarding rules</li>
                  <li>Stuur bonnetjes door naar: <code className="bg-blue-100 px-1 rounded">bonnetjes@smanscrm.nl</code></li>
                </ul>
              </li>
            </ol>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-medium text-yellow-900 mb-2">⚠️ Belangrijk:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
              <li>De webhook verwerkt alleen emails met PDF bijlagen</li>
              <li>Bonnetjes worden automatisch gecategoriseerd op basis van inhoud</li>
              <li>Duplicaten worden gefilterd op basis van datum en bedrag</li>
              <li>Controleer regelmatig de verwerkte bonnetjes in het systeem</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Label>Test de webhook</Label>
            <Button variant="outline" className="w-full">
              <ExternalLink className="h-4 w-4 mr-2" />
              Test bonnetje versturen
            </Button>
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Webhook Status</span>
              <Badge variant="outline" className="text-green-600 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                Actief
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ondersteunde Bestandstypen</CardTitle>
          <CardDescription>
            De webhook verwerkt automatisch deze typen bijlagen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Bestandsformaten</h4>
              <ul className="space-y-1 text-sm">
                <li>• PDF documenten</li>
                <li>• JPEG/PNG afbeeldingen</li>
                <li>• Excel bestanden (.xlsx)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Detectie Keywords</h4>
              <ul className="space-y-1 text-sm">
                <li>• "factuur", "invoice"</li>
                <li>• "bon", "receipt"</li>
                <li>• "nota", "rekening"</li>
                <li>• "aankoopbewijs"</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}