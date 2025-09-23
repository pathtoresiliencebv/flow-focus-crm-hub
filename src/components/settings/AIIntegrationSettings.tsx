import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Bot, Zap, MessageSquare, FileText, Mail, Brain } from 'lucide-react';

export const AIIntegrationSettings = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Bot className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">AI Integratie</h1>
          <p className="text-muted-foreground">Configureer AI-functies en automatisering</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Chat Assistent
                <Badge variant="secondary">Actief</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                AI-assistent voor klantenservice en project ondersteuning
              </p>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="chatAssistant">Chat assistent inschakelen</Label>
                <Switch id="chatAssistant" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="autoReply">Automatische antwoorden</Label>
                <Switch id="autoReply" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="smartSuggestions">Slimme suggesties</Label>
                <Switch id="smartSuggestions" defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Document AI
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                AI-functies voor offertes en facturen
              </p>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="textEnhancement">Tekst verbetering</Label>
                <Switch id="textEnhancement" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="autoDescription">Automatische beschrijvingen</Label>
                <Switch id="autoDescription" />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="priceOptimization">Prijs optimalisatie</Label>
                <Switch id="priceOptimization" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                E-mail AI
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                AI-ondersteuning voor e-mail communicatie
              </p>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="emailTemplates">Slimme templates</Label>
                <Switch id="emailTemplates" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="languageDetection">Taalherkenning</Label>
                <Switch id="languageDetection" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="autoTranslation">Automatische vertaling</Label>
                <Switch id="autoTranslation" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Analyse
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Geavanceerde AI-analyse en inzichten
              </p>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="salesAnalysis">Verkoop analyse</Label>
                <Switch id="salesAnalysis" />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="customerInsights">Klant inzichten</Label>
                <Switch id="customerInsights" />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="predictiveAnalytics">Voorspellende analyse</Label>
                <Switch id="predictiveAnalytics" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            AI Model Configuratie
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <h4 className="font-medium">Chat Model</h4>
              <Badge variant="outline" className="mt-2">GPT-4</Badge>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <h4 className="font-medium">Tekst Model</h4>
              <Badge variant="outline" className="mt-2">Gemini Pro</Badge>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <h4 className="font-medium">Vertaal Model</h4>
              <Badge variant="outline" className="mt-2">GPT-4</Badge>
            </div>
          </div>
          
          <div className="flex justify-center">
            <Button variant="outline">
              Model Instellingen Beheren
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};