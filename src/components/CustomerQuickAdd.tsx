
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCrmStore } from "@/hooks/useCrmStore";
import { useToast } from "@/hooks/use-toast";

interface CustomerQuickAddProps {
  onCustomerAdded: (customerId: number) => void;
  onCancel: () => void;
}

export const CustomerQuickAdd = ({ onCustomerAdded, onCancel }: CustomerQuickAddProps) => {
  const { addCustomer } = useCrmStore();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.phone) {
      toast({
        title: "Vereiste velden",
        description: "Vul minimaal naam, email en telefoon in.",
        variant: "destructive"
      });
      return;
    }

    const newCustomer = addCustomer({
      ...formData,
      notes: "",
      status: "Actief"
    });
    
    onCustomerAdded(newCustomer.id);
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg">Nieuwe klant toevoegen</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Naam *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefoonnummer *</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Plaats</Label>
              <Input
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="address">Adres</Label>
            <Input
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
            />
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuleren
            </Button>
            <Button type="submit">
              Klant toevoegen
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
