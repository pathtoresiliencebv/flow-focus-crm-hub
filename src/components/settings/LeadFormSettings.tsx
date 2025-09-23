import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { FormInput, Copy, Eye, Settings } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

export const LeadFormSettings = () => {
  const { toast } = useToast();

  const handleCopyCode = () => {
    const embedCode = `<iframe src="${window.location.origin}/embed/lead-form" width="100%" height="600" frameborder="0"></iframe>`;
    navigator.clipboard.writeText(embedCode);
    toast({
      title: "Code gekopieerd",
      description: "De embed code is gekopieerd naar het klembord",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <FormInput className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Lead Formulieren</h1>
          <p className="text-muted-foreground">Configureer website formulieren voor leadgeneratie</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Formulier Instellingen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="formTitle">Formulier Titel</Label>
                <Input
                  id="formTitle"
                  defaultValue="Vraag een offerte aan"
                  placeholder="Vul de formulier titel in"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="formDescription">Beschrijving</Label>
                <Textarea
                  id="formDescription"
                  defaultValue="Vul onderstaand formulier in en ontvang binnen 24 uur een persoonlijke offerte."
                  placeholder="Beschrijving van het formulier"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="submitButtonText">Verzend Knop Tekst</Label>
                <Input
                  id="submitButtonText"
                  defaultValue="Verstuur aanvraag"
                  placeholder="Tekst voor verzend knop"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="successMessage">Succesbericht</Label>
                <Textarea
                  id="successMessage"
                  defaultValue="Bedankt voor uw aanvraag! We nemen binnen 24 uur contact met u op."
                  placeholder="Bericht na succesvol verzenden"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="formEnabled">Formulier actief</Label>
                <Switch id="formEnabled" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="emailNotifications">E-mail notificaties</Label>
                <Switch id="emailNotifications" defaultChecked />
              </div>

              <Button className="w-full">
                Instellingen Opslaan
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Embed Code</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Gebruik deze code om het formulier op uw website te plaatsen:
              </p>
              
              <div className="bg-muted p-4 rounded-lg">
                <code className="text-sm break-all">
                  {`<iframe src="${window.location.origin}/embed/lead-form" width="100%" height="600" frameborder="0"></iframe>`}
                </code>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCopyCode} className="flex-1">
                  <Copy className="mr-2 h-4 w-4" />
                  Kopieer Code
                </Button>
                <Button variant="outline" className="flex-1">
                  <Eye className="mr-2 h-4 w-4" />
                  Voorbeeld
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Verzonden Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nog geen leads ontvangen</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Leads zullen hier verschijnen zodra ze via het formulier zijn verzonden
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};