import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
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
    email_secondary: "",
    phone: "",
    address: "",
    city: "",
    company_name: "",
    kvk_number: "",
    btw_number: "",
  });
  const [emailAddresses, setEmailAddresses] = useState<Array<{email: string, type: "primary" | "secondary"}>>([{ email: "", type: "primary" }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Update primary email in emailAddresses array
    if (name === 'email') {
      setEmailAddresses(prev => prev.map((addr, index) => 
        index === 0 ? { ...addr, email: value } : addr
      ));
    }
  };

  const addEmailAddress = () => {
    setEmailAddresses(prev => [...prev, { email: "", type: "secondary" }]);
  };

  const removeEmailAddress = (index: number) => {
    if (index > 0) { // Don't remove primary email
      setEmailAddresses(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateEmailAddress = (index: number, email: string) => {
    setEmailAddresses(prev => prev.map((addr, i) => 
      i === index ? { ...addr, email } : addr
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return; // Prevent multiple submissions
    
    if (!formData.name || !emailAddresses[0]?.email || !formData.phone) {
      toast({
        title: "Vereiste velden",
        description: "Vul minimaal naam, email en telefoon in.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const customerData = {
        ...formData,
        notes: "",
        status: "Actief" as const,
        email_addresses: emailAddresses.filter(addr => addr.email.trim())
      };

      const newCustomer = await addCustomer(customerData);
      
      if (newCustomer) {
        // Single success toast
        toast({
          title: "Klant toegevoegd",
          description: `${formData.name} is succesvol toegevoegd en geselecteerd.`,
        });

        // Call parent callback with full customer object
        if (onCustomerAdded) {
          onCustomerAdded(newCustomer);
        }

        // Reset form
        setFormData({
          name: "",
          email: "",
          email_secondary: "",
          phone: "",
          address: "",
          city: "",
          company_name: "",
          kvk_number: "",
          btw_number: "",
        });
        setEmailAddresses([{ email: "", type: "primary" }]);
      }
    } catch (error: any) {
      console.error('Error adding customer:', error);
      // Single error toast
      toast({
        title: "Fout bij toevoegen klant",
        description: error?.message || "Er is een fout opgetreden bij het toevoegen van de klant.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
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

          {/* Email Addresses Section */}
          <div>
            <Label className="text-sm font-medium">Email Adressen</Label>
            <div className="space-y-2 mt-2">
              {emailAddresses.map((addr, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    type="email"
                    placeholder={index === 0 ? "Primaire email *" : "Extra email adres"}
                    value={addr.email}
                    onChange={(e) => updateEmailAddress(index, e.target.value)}
                    required={index === 0}
                    className="flex-1"
                  />
                  <Select 
                    value={addr.type} 
                    onValueChange={(value: "primary" | "secondary") => 
                      setEmailAddresses(prev => prev.map((a, i) => 
                        i === index ? { ...a, type: value } : a
                      ))
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary">Primair</SelectItem>
                      <SelectItem value="secondary">Secundair</SelectItem>
                    </SelectContent>
                  </Select>
                  {index > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeEmailAddress(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addEmailAddress}
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Email toevoegen
              </Button>
            </div>
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Toevoegen..." : "Klant Toevoegen"}
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