import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Package, Receipt, Camera, Trash2, Lock } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Material {
  id?: string;
  material_name: string;
  quantity: number;
  unit_price: number;
  supplier: string;
  receipt_photo_url?: string;
}

interface ReceiptData {
  id?: string;
  receipt_date: string;
  supplier: string;
  total_amount: number;
  description: string;
  receipt_photo_url: string;
  category: string;
}

interface MobileMaterialsReceiptsProps {
  projectId: string;
}

export const MobileMaterialsReceipts: React.FC<MobileMaterialsReceiptsProps> = ({ projectId }) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [receipts, setReceipts] = useState<ReceiptData[]>([]);
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [showReceiptForm, setShowReceiptForm] = useState(false);

  const [newMaterial, setNewMaterial] = useState<Material>({
    material_name: '',
    quantity: 1,
    unit_price: 0,
    supplier: ''
  });

  const [newReceipt, setNewReceipt] = useState<ReceiptData>({
    receipt_date: new Date().toISOString().split('T')[0],
    supplier: '',
    total_amount: 0,
    description: '',
    receipt_photo_url: '',
    category: 'material'
  });

  const addMaterial = async () => {
    if (!newMaterial.material_name || !user?.id) return;

    try {
      const { error } = await supabase
        .from('project_materials')
        .insert({
          project_id: projectId,
          material_name: newMaterial.material_name,
          quantity: newMaterial.quantity,
          unit_price: newMaterial.unit_price,
          total_cost: newMaterial.quantity * newMaterial.unit_price,
          supplier: newMaterial.supplier,
          receipt_photo_url: newMaterial.receipt_photo_url,
          added_by: user.id
        });

      if (error) throw error;

      setMaterials([...materials, { ...newMaterial, id: Date.now().toString() }]);
      setNewMaterial({ material_name: '', quantity: 1, unit_price: 0, supplier: '' });
      setShowMaterialForm(false);
      
      toast({
        title: "Materiaal toegevoegd",
        description: "Het materiaal is succesvol toegevoegd aan het project.",
      });
    } catch (error) {
      toast({
        title: "Fout",
        description: "Kon materiaal niet toevoegen.",
        variant: "destructive",
      });
    }
  };

  const addReceipt = async () => {
    if (!newReceipt.receipt_photo_url || !user?.id) return;

    try {
      const { error } = await supabase
        .from('project_receipts')
        .insert({
          project_id: projectId,
          receipt_date: newReceipt.receipt_date,
          supplier: newReceipt.supplier,
          total_amount: newReceipt.total_amount,
          description: newReceipt.description,
          receipt_photo_url: newReceipt.receipt_photo_url,
          category: newReceipt.category,
          added_by: user.id
        });

      if (error) throw error;

      setReceipts([...receipts, { ...newReceipt, id: Date.now().toString() }]);
      setNewReceipt({
        receipt_date: new Date().toISOString().split('T')[0],
        supplier: '',
        total_amount: 0,
        description: '',
        receipt_photo_url: '',
        category: 'material'
      });
      setShowReceiptForm(false);
      
      toast({
        title: "Bonnetje toegevoegd",
        description: "Het bonnetje is succesvol toegevoegd aan het project.",
      });
    } catch (error) {
      toast({
        title: "Fout",
        description: "Kon bonnetje niet toevoegen.",
        variant: "destructive",
      });
    }
  };

  const captureReceiptPhoto = async () => {
    // Simplified for now - would integrate with camera
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const url = URL.createObjectURL(file);
        setNewReceipt({ ...newReceipt, receipt_photo_url: url });
      }
    };
    input.click();
  };

  // Check if user has permission to manage materials and receipts
  const canManageMaterials = profile?.role === 'Administrator' || profile?.role === 'Administratie';

  if (!canManageMaterials) {
    return (
      <div className="text-center py-12 space-y-4">
        <Lock className="h-12 w-12 text-muted-foreground mx-auto" />
        <div>
          <p className="text-lg font-medium text-muted-foreground">Geen toegang</p>
          <p className="text-sm text-muted-foreground">
            Materiaal beheer is alleen toegankelijk voor administrators en administratie medewerkers.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="materials" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="materials" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Materialen ({materials.length})
          </TabsTrigger>
          <TabsTrigger value="receipts" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Bonnetjes ({receipts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="materials" className="space-y-4">
          {materials.length === 0 && !showMaterialForm ? (
            <div className="text-center py-8 space-y-4">
              <p className="text-muted-foreground">
                Nog geen materialen toegevoegd aan dit project.
              </p>
              <Button
                onClick={() => setShowMaterialForm(true)}
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Eerste Materiaal Toevoegen
              </Button>
            </div>
          ) : !showMaterialForm ? (
            <Button
              onClick={() => setShowMaterialForm(true)}
              className="w-full"
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Materiaal Toevoegen
            </Button>
          ) : (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Nieuw Materiaal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="material-name">Materiaal naam *</Label>
                  <Input
                    id="material-name"
                    value={newMaterial.material_name}
                    onChange={(e) => setNewMaterial({ ...newMaterial, material_name: e.target.value })}
                    placeholder="Naam van het materiaal"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quantity">Aantal</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={newMaterial.quantity}
                      onChange={(e) => setNewMaterial({ ...newMaterial, quantity: parseFloat(e.target.value) || 1 })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="unit-price">Eenheidsprijs (€)</Label>
                    <Input
                      id="unit-price"
                      type="number"
                      step="0.01"
                      value={newMaterial.unit_price}
                      onChange={(e) => setNewMaterial({ ...newMaterial, unit_price: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="supplier">Leverancier</Label>
                  <Input
                    id="supplier"
                    value={newMaterial.supplier}
                    onChange={(e) => setNewMaterial({ ...newMaterial, supplier: e.target.value })}
                    placeholder="Naam leverancier"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={addMaterial} className="flex-1">
                    Toevoegen
                  </Button>
                  <Button variant="outline" onClick={() => setShowMaterialForm(false)}>
                    Annuleren
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {materials.map((material, index) => (
            <Card key={material.id || index}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium">{material.material_name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {material.quantity}x à €{material.unit_price.toFixed(2)} = €{(material.quantity * material.unit_price).toFixed(2)}
                    </p>
                    {material.supplier && (
                      <p className="text-sm text-muted-foreground">Leverancier: {material.supplier}</p>
                    )}
                  </div>
                  <Badge variant="outline">€{(material.quantity * material.unit_price).toFixed(2)}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="receipts" className="space-y-4">
          {receipts.length === 0 && !showReceiptForm ? (
            <div className="text-center py-8 space-y-4">
              <p className="text-muted-foreground">
                Nog geen bonnetjes toegevoegd aan dit project.
              </p>
              <Button
                onClick={() => setShowReceiptForm(true)}
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Eerste Bonnetje Toevoegen
              </Button>
            </div>
          ) : !showReceiptForm ? (
            <Button
              onClick={() => setShowReceiptForm(true)}
              className="w-full"
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Bonnetje Toevoegen
            </Button>
          ) : (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Nieuw Bonnetje</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="receipt-date">Datum</Label>
                  <Input
                    id="receipt-date"
                    type="date"
                    value={newReceipt.receipt_date}
                    onChange={(e) => setNewReceipt({ ...newReceipt, receipt_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="receipt-supplier">Leverancier</Label>
                  <Input
                    id="receipt-supplier"
                    value={newReceipt.supplier}
                    onChange={(e) => setNewReceipt({ ...newReceipt, supplier: e.target.value })}
                    placeholder="Naam leverancier"
                  />
                </div>
                <div>
                  <Label htmlFor="receipt-amount">Bedrag (€)</Label>
                  <Input
                    id="receipt-amount"
                    type="number"
                    step="0.01"
                    value={newReceipt.total_amount}
                    onChange={(e) => setNewReceipt({ ...newReceipt, total_amount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="receipt-description">Omschrijving</Label>
                  <Textarea
                    id="receipt-description"
                    value={newReceipt.description}
                    onChange={(e) => setNewReceipt({ ...newReceipt, description: e.target.value })}
                    placeholder="Wat is er gekocht?"
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Foto van bonnetje *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={captureReceiptPhoto}
                    className="w-full mt-2"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Foto Maken
                  </Button>
                  {newReceipt.receipt_photo_url && (
                    <p className="text-sm text-green-600 mt-2">✓ Foto toegevoegd</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button onClick={addReceipt} className="flex-1" disabled={!newReceipt.receipt_photo_url}>
                    Toevoegen
                  </Button>
                  <Button variant="outline" onClick={() => setShowReceiptForm(false)}>
                    Annuleren
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {receipts.map((receipt, index) => (
            <Card key={receipt.id || index}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium">{receipt.supplier}</h4>
                    <p className="text-sm text-muted-foreground">{receipt.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(receipt.receipt_date).toLocaleDateString('nl-NL')}
                    </p>
                  </div>
                  <Badge variant="outline">€{receipt.total_amount.toFixed(2)}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};