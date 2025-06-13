
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Material {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalPrice: number;
}

interface ProjectMaterialsProps {
  projectId: string;
}

export const ProjectMaterials = ({ projectId }: ProjectMaterialsProps) => {
  const [materials, setMaterials] = useState<Material[]>([
    {
      id: "1",
      name: "Kunststof kozijn 120x150cm",
      quantity: 6,
      unit: "stuks",
      pricePerUnit: 275.00,
      totalPrice: 1650.00
    },
    {
      id: "2", 
      name: "Isolatieglas HR++",
      quantity: 6,
      unit: "m²",
      pricePerUnit: 45.00,
      totalPrice: 270.00
    }
  ]);
  
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    quantity: 1,
    unit: "stuks",
    pricePerUnit: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const totalPrice = formData.quantity * formData.pricePerUnit;
    
    if (editingMaterial) {
      setMaterials(prev => prev.map(m => 
        m.id === editingMaterial.id 
          ? { ...m, ...formData, totalPrice }
          : m
      ));
    } else {
      const newMaterial: Material = {
        id: Date.now().toString(),
        ...formData,
        totalPrice
      };
      setMaterials(prev => [...prev, newMaterial]);
    }
    
    setFormData({ name: "", quantity: 1, unit: "stuks", pricePerUnit: 0 });
    setEditingMaterial(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (material: Material) => {
    setEditingMaterial(material);
    setFormData({
      name: material.name,
      quantity: material.quantity,
      unit: material.unit,
      pricePerUnit: material.pricePerUnit
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setMaterials(prev => prev.filter(m => m.id !== id));
  };

  const totalValue = materials.reduce((sum, material) => sum + material.totalPrice, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Materialen</CardTitle>
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
                <Label htmlFor="name">Materiaal naam</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
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
                <div className="space-y-2">
                  <Label htmlFor="unit">Eenheid</Label>
                  <Input
                    id="unit"
                    value={formData.unit}
                    onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                    placeholder="stuks, m², kg, etc."
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pricePerUnit">Prijs per eenheid (€)</Label>
                <Input
                  id="pricePerUnit"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.pricePerUnit}
                  onChange={(e) => setFormData(prev => ({ ...prev, pricePerUnit: parseFloat(e.target.value) || 0 }))}
                  required
                />
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
      </CardHeader>
      <CardContent>
        {materials.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nog geen materialen toegevoegd aan dit project.
          </p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Materiaal</TableHead>
                  <TableHead>Aantal</TableHead>
                  <TableHead>Eenheid</TableHead>
                  <TableHead>Prijs/eenheid</TableHead>
                  <TableHead>Totaal</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.map((material) => (
                  <TableRow key={material.id}>
                    <TableCell className="font-medium">{material.name}</TableCell>
                    <TableCell>{material.quantity}</TableCell>
                    <TableCell>{material.unit}</TableCell>
                    <TableCell>€{material.pricePerUnit.toFixed(2)}</TableCell>
                    <TableCell>€{material.totalPrice.toFixed(2)}</TableCell>
                    <TableCell>
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <div className="flex justify-between items-center font-semibold">
                <span>Totale materiaalkosten:</span>
                <span>€{totalValue.toFixed(2)}</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
