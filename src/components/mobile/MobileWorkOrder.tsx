import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, PenTool, CheckCircle, Camera, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SignatureCanvas } from "@/components/SignatureCanvas";
import { useNativeCapabilities } from "@/hooks/useNativeCapabilities";
import { compressImage } from "@/utils/imageCompression";

interface MobileWorkOrderProps {
  projectId: string;
}

export const MobileWorkOrder: React.FC<MobileWorkOrderProps> = ({ projectId }) => {
  const { toast } = useToast();
  const { takePicture } = useNativeCapabilities();
  const [clientName, setClientName] = useState('');
  const [summaryText, setSummaryText] = useState('');
  const [signatureData, setSignatureData] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [workOrderCreated, setWorkOrderCreated] = useState(false);
  const [workOrderPhotos, setWorkOrderPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

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
      const { data: workOrderData, error } = await supabase
        .from('project_work_orders')
        .insert({
          project_id: projectId,
          work_order_number: workOrderNumber,
          client_name: clientName,
          summary_text: summaryText,
          client_signature_data: signatureData,
          signed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Upload photos if any
      if (workOrderPhotos.length > 0) {
        const photoUrls = await uploadPhotos(workOrderData.id);
        
        // Update work order with photo URLs
        if (photoUrls.length > 0) {
          await supabase
            .from('project_work_orders')
            .update({ 
              work_order_photos: photoUrls,
              updated_at: new Date().toISOString()
            })
            .eq('id', workOrderData.id);
        }
      }

      setWorkOrderCreated(true);
      toast({
        title: "Werkbon aangemaakt",
        description: `Werkbon ${workOrderNumber} is succesvol aangemaakt${workOrderPhotos.length > 0 ? ' met foto\'s' : ''}`,
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

  const handleTakePhoto = async () => {
    try {
      const result = await takePicture({
        allowEditing: true
      });
      
      if (result?.dataUrl) {
        setWorkOrderPhotos(prev => [...prev, result.dataUrl]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      toast({
        title: "Camera fout",
        description: "Kon geen foto maken",
        variant: "destructive"
      });
    }
  };

  const removePhoto = (index: number) => {
    setWorkOrderPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const uploadPhotos = async (workOrderId: string) => {
    if (workOrderPhotos.length === 0) return [];

    setIsUploading(true);
    const uploadedUrls: string[] = [];

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Gebruiker niet gevonden');

      for (let i = 0; i < workOrderPhotos.length; i++) {
        const photo = workOrderPhotos[i];
        
        // Convert dataUrl to blob and compress
        const response = await fetch(photo);
        const blob = await response.blob();
        const file = new File([blob], `workorder_${i}.jpg`, { type: 'image/jpeg' });
        
        // Compress image
        const compressedFile = await compressImage(file, {
          maxWidth: 1920,
          maxHeight: 1920,
          quality: 0.6
        });

        const fileName = `${user.id}/workorders/${workOrderId}/${Date.now()}_${i}.jpg`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('workorder-photos')
          .upload(fileName, compressedFile, {
            contentType: 'image/jpeg',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('workorder-photos')
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      }

      return uploadedUrls;
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast({
        title: "Upload fout",
        description: "Kon foto's niet uploaden",
        variant: "destructive"
      });
      return [];
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setClientName('');
    setSummaryText('');
    setSignatureData('');
    setWorkOrderCreated(false);
    setWorkOrderPhotos([]);
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

      {/* Work Order Photos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Werkbon Foto's
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Voeg foto's toe van de uitgevoerde werkzaamheden (optioneel)
            </p>
            
            {/* Photo Grid */}
            <div className="grid grid-cols-2 gap-3">
              {workOrderPhotos.map((photo, index) => (
                <div key={index} className="relative">
                  <img 
                    src={photo} 
                    alt={`Werkbon foto ${index + 1}`} 
                    className="w-full h-24 object-cover rounded border"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => removePhoto(index)}
                    className="absolute top-1 right-1 h-6 w-6 p-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              
              {/* Add Photo Button */}
              <Button
                variant="outline"
                onClick={handleTakePhoto}
                className="h-24 flex flex-col items-center justify-center gap-2"
              >
                <Camera className="h-6 w-6" />
                <span className="text-xs">Foto toevoegen</span>
              </Button>
            </div>
            
            {workOrderPhotos.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {workOrderPhotos.length} foto{workOrderPhotos.length !== 1 ? "'s" : ""} toegevoegd
              </p>
            )}
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
        disabled={isCreating || isUploading || !clientName.trim() || !summaryText.trim() || !signatureData}
        className="w-full h-12"
        size="lg"
      >
        {isCreating ? "Werkbon aanmaken..." : 
         isUploading ? "Foto's uploaden..." : 
         "Werkbon voltooien"}
      </Button>
    </div>
  );
};