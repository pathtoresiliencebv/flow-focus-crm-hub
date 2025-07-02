import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, PenTool, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SignatureCanvas } from "@/components/SignatureCanvas";

interface MobileWorkOrderProps {
  projectId: string;
}

export const MobileWorkOrder: React.FC<MobileWorkOrderProps> = ({ projectId }) => {
  const { toast } = useToast();
  const [clientName, setClientName] = useState('');
  const [summaryText, setSummaryText] = useState('');
  const [signatureData, setSignatureData] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [workOrderCreated, setWorkOrderCreated] = useState(false);

  const handleCreateWorkOrder = async () => {
    if (!clientName.trim() || !summaryText.trim() || !signatureData) {
      toast({
        title: "Incomplete gegevens",
        description: "Vul alle velden in en zet een handtekening",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      // Generate work order number
      const { data: workOrderNumber, error: numberError } = await supabase
        .rpc('generate_work_order_number');

      if (numberError) throw numberError;

      // Create work order
      const { error } = await supabase
        .from('project_work_orders')
        .insert({
          project_id: projectId,
          work_order_number: workOrderNumber,
          client_name: clientName,
          summary_text: summaryText,
          client_signature_data: signatureData,
          signed_at: new Date().toISOString(),
        });

      if (error) throw error;

      setWorkOrderCreated(true);
      toast({
        title: "Werkbon aangemaakt",
        description: `Werkbon ${workOrderNumber} is succesvol aangemaakt`,
      });

    } catch (error) {
      toast({
        title: "Fout",
        description: "Er ging iets mis bij het aanmaken van de werkbon",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setClientName('');
    setSummaryText('');
    setSignatureData('');
    setWorkOrderCreated(false);
  };

  if (workOrderCreated) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Werkbon voltooid</h3>
          <p className="text-muted-foreground mb-4">
            De werkbon is succesvol aangemaakt en ondertekend
          </p>
          <Button onClick={resetForm} variant="outline">
            Nieuwe werkbon maken
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Werkbon aanmaken
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="client-name">Naam klant</Label>
            <Input
              id="client-name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Voor- en achternaam van de klant"
            />
          </div>

          <div>
            <Label htmlFor="summary">Samenvatting werkzaamheden</Label>
            <Textarea
              id="summary"
              value={summaryText}
              onChange={(e) => setSummaryText(e.target.value)}
              placeholder="Beschrijf de uitgevoerde werkzaamheden..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PenTool className="h-5 w-5" />
            Handtekening klant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Vraag de klant om hier te tekenen ter bevestiging van de uitgevoerde werkzaamheden
            </p>
            
            <div className="border rounded-lg p-2 bg-white">
              <SignatureCanvas
                onSignature={setSignatureData}
                title="Handtekening klant"
              />
            </div>
            
            {signatureData && (
              <p className="text-sm text-green-600 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Handtekening vastgelegd
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Button 
        onClick={handleCreateWorkOrder}
        disabled={isCreating || !clientName.trim() || !summaryText.trim() || !signatureData}
        className="w-full h-12"
        size="lg"
      >
        {isCreating ? "Werkbon aanmaken..." : "Werkbon voltooien"}
      </Button>
    </div>
  );
};