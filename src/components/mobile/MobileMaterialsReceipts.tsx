import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Camera, Receipt, Package, Trash2 } from "lucide-react";
import { useProjectMaterials } from "@/hooks/useProjectMaterials";
import { useAuth } from "@/contexts/AuthContext";
import { useNativeCapabilities } from "@/hooks/useNativeCapabilities";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { compressImage } from "@/utils/imageCompression";

interface MobileMaterialsReceiptsProps {
  projectId: string;
}

export const MobileMaterialsReceipts: React.FC<MobileMaterialsReceiptsProps> = ({ projectId }) => {
  const { profile } = useAuth();
  const { takePicture } = useNativeCapabilities();
  const { toast } = useToast();
  const { 
    materials, 
    receipts, 
    totalMaterialCost, 
    totalReceiptCost, 
    totalCost,
    isLoading, 
    addMaterial, 
    addReceipt,
    deleteMaterial 
  } = useProjectMaterials(projectId);

  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  
  const [materialForm, setMaterialForm] = useState({
    material_name: "",
    quantity: 1,
    unit_price: 0,
    supplier: ""
  });

  const [receiptForm, setReceiptForm] = useState({
    supplier: "",
    total_amount: 0,
    description: "",
    category: "material",
    receipt_photo_url: ""
  });

  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const canManage = profile?.role !== 'Bekijker';

  const handleMaterialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addMaterial({
        ...materialForm,
        total_cost: materialForm.quantity * materialForm.unit_price
      });
      setMaterialForm({ material_name: "", quantity: 1, unit_price: 0, supplier: "" });
      setMaterialDialogOpen(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleTakePhoto = async () => {
    try {
      const result = await takePicture({
        allowEditing: true
      });
      
      if (result?.dataUrl) {
        setCapturedImage(result.dataUrl);
        setReceiptForm(prev => ({ ...prev, receipt_photo_url: result.dataUrl }));
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

  const handleReceiptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!capturedImage) {
      toast({
        title: "Foto vereist",
        description: "Maak eerst een foto van het bonnetje",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    
    try {
      // Upload image to storage
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Gebruiker niet gevonden');
      }

      // Convert dataUrl to blob and compress
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      const file = new File([blob], 'receipt.jpg', { type: 'image/jpeg' });
      
      // Compress image before upload
      const compressedFile = await compressImage(file, {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 0.6
      });

      const fileName = `${user.id}/${Date.now()}_receipt.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, compressedFile, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName);

      // Add receipt with photo URL
      await addReceipt({
        ...receiptForm,
        receipt_photo_url: publicUrl
      });
      
      setReceiptForm({ supplier: "", total_amount: 0, description: "", category: "material", receipt_photo_url: "" });
      setCapturedImage(null);
      setReceiptDialogOpen(false);
      
      toast({
        title: "Bonnetje toegevoegd",
        description: "Het bonnetje is succesvol opgeslagen",
      });
    } catch (error) {
      console.error('Error uploading receipt:', error);
      toast({
        title: "Upload fout",
        description: "Kon bonnetje niet uploaden",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteMaterial = async (materialId: string) => {
    if (confirm('Weet je zeker dat je dit materiaal wilt verwijderen?')) {
      try {
        await deleteMaterial(materialId);
      } catch (error) {
        // Error handled by hook
      }
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-center">Materialen laden...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Kosten Overzicht</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Materialen:</span>
            <span>€{totalMaterialCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Bonnetjes:</span>
            <span>€{totalReceiptCost.toFixed(2)}</span>
          </div>
          <hr />
          <div className="flex justify-between font-medium">
            <span>Totaal:</span>
            <span>€{totalCost.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="materials" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="materials" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span className="text-xs">Materialen</span>
          </TabsTrigger>
          <TabsTrigger value="receipts" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            <span className="text-xs">Bonnetjes</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="materials" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Gebruikte Materialen</h3>
            {canManage && (
              <Dialog open={materialDialogOpen} onOpenChange={setMaterialDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Toevoegen
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-md">
                  <DialogHeader>
                    <DialogTitle>Materiaal Toevoegen</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleMaterialSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="material_name">Materiaal</Label>
                      <Input
                        id="material_name"
                        value={materialForm.material_name}
                        onChange={(e) => setMaterialForm(prev => ({ ...prev, material_name: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="supplier">Leverancier</Label>
                      <Input
                        id="supplier"
                        value={materialForm.supplier}
                        onChange={(e) => setMaterialForm(prev => ({ ...prev, supplier: e.target.value }))}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="quantity">Aantal</Label>
                        <Input
                          id="quantity"
                          type="number"
                          step="0.01"
                          value={materialForm.quantity}
                          onChange={(e) => setMaterialForm(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="unit_price">Prijs/stuk (€)</Label>
                        <Input
                          id="unit_price"
                          type="number"
                          step="0.01"
                          value={materialForm.unit_price}
                          onChange={(e) => setMaterialForm(prev => ({ ...prev, unit_price: parseFloat(e.target.value) || 0 }))}
                          required
                        />
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Totaal: €{(materialForm.quantity * materialForm.unit_price).toFixed(2)}
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" onClick={() => setMaterialDialogOpen(false)} className="flex-1">
                        Annuleren
                      </Button>
                      <Button type="submit" className="flex-1">
                        Toevoegen
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="space-y-3">
            {materials.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nog geen materialen toegevoegd</p>
              </div>
            ) : (
              materials.map((material) => (
                <Card key={material.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium">{material.material_name}</h4>
                        {material.supplier && (
                          <p className="text-sm text-muted-foreground">{material.supplier}</p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {material.quantity} × €{material.unit_price?.toFixed(2)} = €{material.total_cost?.toFixed(2)}
                        </p>
                      </div>
                      {canManage && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteMaterial(material.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="receipts" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Bonnetjes</h3>
            {canManage && (
              <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Toevoegen
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-md">
                  <DialogHeader>
                    <DialogTitle>Bonnetje Toevoegen</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleReceiptSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="receipt_supplier">Leverancier</Label>
                      <Input
                        id="receipt_supplier"
                        value={receiptForm.supplier}
                        onChange={(e) => setReceiptForm(prev => ({ ...prev, supplier: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="receipt_amount">Bedrag (€)</Label>
                      <Input
                        id="receipt_amount"
                        type="number"
                        step="0.01"
                        value={receiptForm.total_amount}
                        onChange={(e) => setReceiptForm(prev => ({ ...prev, total_amount: parseFloat(e.target.value) || 0 }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Categorie</Label>
                      <Select value={receiptForm.category} onValueChange={(value) => setReceiptForm(prev => ({ ...prev, category: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="material">Materiaal</SelectItem>
                          <SelectItem value="tools">Gereedschap</SelectItem>
                          <SelectItem value="other">Overig</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="receipt_description">Beschrijving</Label>
                      <Input
                        id="receipt_description"
                        value={receiptForm.description}
                        onChange={(e) => setReceiptForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Wat is gekocht?"
                      />
                    </div>
                    
                    {/* Camera Section */}
                    <div>
                      <Label>Bonnetje Foto</Label>
                      <div className="space-y-2">
                        {capturedImage ? (
                          <div className="relative">
                            <img 
                              src={capturedImage} 
                              alt="Bonnetje foto" 
                              className="w-full h-32 object-cover rounded border"
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setCapturedImage(null);
                                setReceiptForm(prev => ({ ...prev, receipt_photo_url: "" }));
                              }}
                              className="absolute top-2 right-2"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleTakePhoto}
                            className="w-full h-32 flex flex-col items-center justify-center gap-2"
                          >
                            <Camera className="h-8 w-8" />
                            <span>Foto maken</span>
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" onClick={() => setReceiptDialogOpen(false)} className="flex-1">
                        Annuleren
                      </Button>
                      <Button type="submit" disabled={isUploading} className="flex-1">
                        {isUploading ? "Uploaden..." : "Toevoegen"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="space-y-3">
            {receipts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nog geen bonnetjes toegevoegd</p>
              </div>
            ) : (
              receipts.map((receipt) => (
                <Card key={receipt.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium">{receipt.supplier}</h4>
                        <p className="text-sm text-muted-foreground">
                          {receipt.category === 'material' ? 'Materiaal' : 
                           receipt.category === 'tools' ? 'Gereedschap' : 'Overig'}
                        </p>
                        {receipt.description && (
                          <p className="text-sm">{receipt.description}</p>
                        )}
                        <p className="text-sm font-medium">€{receipt.total_amount?.toFixed(2)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};