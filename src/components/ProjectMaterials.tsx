
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Edit, Lock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useProjectMaterials } from "@/hooks/useProjectMaterials";

interface ProjectMaterialsProps {
  projectId: string;
}

export const ProjectMaterials = ({ projectId }: ProjectMaterialsProps) => {
  const { profile } = useAuth();
  const { 
    materials, 
    totalMaterialCost, 
    isLoading, 
    addMaterial, 
    updateMaterial, 
    deleteMaterial 
  } = useProjectMaterials(projectId);
  
  const [editingMaterial, setEditingMaterial] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    material_name: "",
    quantity: 1,
    unit_price: 0,
    supplier: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const materialData = {
      material_name: formData.material_name,
      quantity: formData.quantity,
      unit_price: formData.unit_price,
      total_cost: formData.quantity * formData.unit_price,
      supplier: formData.supplier || null
    };
    
    try {
      if (editingMaterial) {
        await updateMaterial({ id: editingMaterial.id, ...materialData });
      } else {
        await addMaterial(materialData);
      }
      
      setFormData({ material_name: "", quantity: 1, unit_price: 0, supplier: "" });
      setEditingMaterial(null);
      setIsDialogOpen(false);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleEdit = (material: any) => {
    setEditingMaterial(material);
    setFormData({
      material_name: material.material_name,
      quantity: material.quantity,
      unit_price: material.unit_price,
      supplier: material.supplier || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMaterial(id);
    } catch (error) {
      // Error is handled by the hook
    }
  };
  
  // Check if user has permission to manage materials
  // ✅ Installateurs CAN add materials (they need to register materials used on projects)
  const canManageMaterials = profile?.role === 'Administrator' || profile?.role === 'Administratie' || profile?.role === 'Installateur';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Materialen</CardTitle>
        {canManageMaterials ? (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Materiaal toevoegen
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingMaterial ? "Materiaal bewerken" : "Nieuw materiaal"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="material_name">Materiaal naam</Label>
                <Input
                  id="material_name"
                  value={formData.material_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, material_name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier">Leverancier</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                  placeholder="Optioneel"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Aantal</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                    required
                  />
                </div>
              {/* 🔒 Installateurs vullen GEEN prijzen in - deze worden op 0 gezet */}
              {profile?.role !== 'Installateur' && (
                <div className="space-y-2">
                  <Label htmlFor="unit_price">Prijs per eenheid (€)</Label>
                  <Input
                    id="unit_price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={(e) => setFormData(prev => ({ ...prev, unit_price: parseFloat(e.target.value) || 0 }))}
                    required
                  />
                </div>
              )}
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuleren
                </Button>
                <Button type="submit">
                  {editingMaterial ? "Bijwerken" : "Toevoegen"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Lock className="h-4 w-4" />
            <span className="text-sm">Alleen toegankelijk voor administrators</span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {!canManageMaterials ? (
          <div className="text-center py-12 space-y-4">
            <Lock className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <p className="text-lg font-medium text-muted-foreground">Geen toegang</p>
              <p className="text-sm text-muted-foreground">
                Materialen beheer is alleen toegankelijk voor administrators en administratie medewerkers.
              </p>
            </div>
          </div>
        ) : isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Materialen laden...</p>
          </div>
        ) : materials.length === 0 ? (
          <div className="text-center py-8 space-y-4">
            <p className="text-muted-foreground">
              Nog geen materialen toegevoegd aan dit project.
            </p>
            <p className="text-sm text-muted-foreground">
              Klik op "Materiaal toevoegen" om materialen voor dit project te beheren.
            </p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Materiaal</TableHead>
                  <TableHead>Leverancier</TableHead>
                  <TableHead>Aantal</TableHead>
                  {/* 🔒 Installateurs zien GEEN bedragen */}
                  {profile?.role !== 'Installateur' && (
                    <>
                      <TableHead>Prijs/eenheid</TableHead>
                      <TableHead>Totaal</TableHead>
                    </>
                  )}
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.map((material) => (
                  <TableRow key={material.id}>
                    <TableCell className="font-medium">{material.material_name}</TableCell>
                    <TableCell>{material.supplier || '-'}</TableCell>
                    <TableCell>{material.quantity}</TableCell>
                    {/* 🔒 Installateurs zien GEEN bedragen */}
                    {profile?.role !== 'Installateur' && (
                      <>
                        <TableCell>€{material.unit_price?.toFixed(2) || '0.00'}</TableCell>
                        <TableCell>€{material.total_cost?.toFixed(2) || '0.00'}</TableCell>
                      </>
                    )}
                    <TableCell>
                      {canManageMaterials && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(material)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(material.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {/* 🔒 Totale kosten NIET voor Installateurs */}
            {profile?.role !== 'Installateur' && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center font-semibold">
                  <span>Totale materiaalkosten:</span>
                  <span>€{totalMaterialCost.toFixed(2)}</span>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
