import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCrmStore } from "@/hooks/useCrmStore";
import { useToast } from "@/hooks/use-toast";

interface CustomerQuickAddProps {
  onCustomerAdded?: (customer: any) => void;
  onCancel?: () => void;
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
    company_name: "",
    kvk_number: "",
    btw_number: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.phone) {
      toast({
        title: "Vereiste velden",
        description: "Vul minimaal naam, email en telefoon in.",
        variant: "destructive"
      });
      return;
    }

    try {
      const customerData = {
        ...formData,
        notes: "",
        status: "Actief" as const,
        email_addresses: formData.email ? [{ email: formData.email, type: 'primary' }] : []
      };

      const newCustomer = await addCustomer(customerData);
      
      if (newCustomer) {
        toast({
          title: "Klant toegevoegd",
          description: `${formData.name} is succesvol toegevoegd.`,
        });

        // Call parent callback with full customer object
        if (onCustomerAdded) {
          onCustomerAdded(newCustomer);
        }

        // Reset form
        setFormData({
          name: "",
          email: "",
          phone: "",
          address: "",
          city: "",
          company_name: "",
          kvk_number: "",
          btw_number: "",
        });
      }
    } catch (error) {
      console.error('Error adding customer:', error);
      toast({
        title: "Fout bij toevoegen",
        description: "Er is een fout opgetreden bij het toevoegen van de klant.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nieuwe Klant Toevoegen</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Naam *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="company_name">Bedrijfsnaam</Label>
              <Input
                id="company_name"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
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
            <div>
              <Label htmlFor="phone">Telefoon *</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="kvk_number">KVK Nummer</Label>
              <Input
                id="kvk_number"
                name="kvk_number"
                value={formData.kvk_number}
                onChange={handleChange}
                placeholder="12345678"
              />
            </div>
            <div>
              <Label htmlFor="btw_number">BTW Nummer</Label>
              <Input
                id="btw_number"
                name="btw_number"
                value={formData.btw_number}
                onChange={handleChange}
                placeholder="NL123456789B01"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="address">Adres</Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="city">Plaats</Label>
              <Input
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit">
              Klant Toevoegen
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Annuleren
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};