
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { useCrmStore, Customer } from "@/hooks/useCrmStore";
import { LocationSearch } from "./LocationSearch";
import { useToast } from "@/hooks/use-toast";

interface CustomerFormProps {
  onClose: () => void;
  existingCustomer?: Customer;
}

export const CustomerForm = ({ onClose, existingCustomer }: CustomerFormProps) => {
  const { addCustomer, updateCustomer } = useCrmStore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: existingCustomer?.name || "",
    email: existingCustomer?.email || "",
    phone: existingCustomer?.phone || "",
    address: existingCustomer?.address || "",
    city: existingCustomer?.city || "",
    postal_code: (existingCustomer as any)?.postal_code || "",
    country: (existingCustomer as any)?.country || "Nederland",
    notes: existingCustomer?.notes || "",
    status: existingCustomer?.status || "Actief" as const,
    customer_type: (existingCustomer as any)?.customer_type || "particulier" as const,
    company_name: (existingCustomer as any)?.company_name || "",
    kvk_number: (existingCustomer as any)?.kvk_number || "",
    btw_number: (existingCustomer as any)?.btw_number || "",
    contact_person: (existingCustomer as any)?.contact_person || "",
    website: (existingCustomer as any)?.website || "",
    iban: (existingCustomer as any)?.iban || "",
    additional_emails: (existingCustomer as any)?.additional_emails || [],
  });

  const [newEmail, setNewEmail] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStatusChange = (status: "Actief" | "In behandeling" | "Inactief") => {
    setFormData((prev) => ({
      ...prev,
      status,
    }));
  };

  const handleCustomerTypeChange = (customer_type: "particulier" | "zakelijk") => {
    setFormData((prev) => ({
      ...prev,
      customer_type,
    }));
  };

  const addEmail = () => {
    if (newEmail && newEmail.includes('@')) {
      setFormData((prev) => ({
        ...prev,
        additional_emails: [...prev.additional_emails, newEmail],
      }));
      setNewEmail("");
    }
  };

  const removeEmail = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      additional_emails: prev.additional_emails.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      if (existingCustomer) {
        await updateCustomer(existingCustomer.id, formData);
      } else {
        await addCustomer(formData);
      }
      
      // ✅ Close only AFTER successful save and query invalidation
      onClose();
    } catch (error: any) {
      console.error('Error saving customer:', error);
      
      // Handle duplicate email case
      if (error.message === 'CUSTOMER_EXISTS' && error.existingCustomer) {
        toast({
          title: "ℹ️ Klant bestaat al",
          description: `Een klant met email "${formData.email}" bestaat al: ${error.existingCustomer.name}. Dit email adres is al in gebruik.`,
          variant: "default"
        });
      } else {
        // Toast is already shown by useCrmStore mutation for other errors
        setIsSaving(false); // Re-enable button on error
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Tabs defaultValue="contact" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="contact" className="text-xs">Contact</TabsTrigger>
          <TabsTrigger value="business" className="text-xs">Bedrijf</TabsTrigger>
          <TabsTrigger value="extra" className="text-xs">Extra</TabsTrigger>
        </TabsList>

        {/* CONTACT TAB */}
        <TabsContent value="contact" className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="customer_type">Klant Type *</Label>
            <Select value={formData.customer_type} onValueChange={handleCustomerTypeChange}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="particulier">👤 Particulier</SelectItem>
                <SelectItem value="zakelijk">🏢 Zakelijk</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="name">Naam *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="h-9"
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
                className="h-9"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefoonnummer *</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postal_code">Postcode</Label>
              <Input
                id="postal_code"
                name="postal_code"
                value={formData.postal_code}
                onChange={handleChange}
                placeholder="1234 AB"
                className="h-9"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <LocationSearch
              initialValue={formData.address}
              onLocationSelect={(location) => {
                setFormData((prev) => ({
                  ...prev,
                  address: location.display_name,
                  city: location.address?.city || prev.city,
                  postal_code: location.address?.postcode || prev.postal_code
                }));
              }}
              placeholder="Zoek adres..."
              label="Adres"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="city">Plaats</Label>
              <Input
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Land</Label>
              <Input
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="h-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Selecteer status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Actief">✅ Actief</SelectItem>
                <SelectItem value="In behandeling">⏳ In behandeling</SelectItem>
                <SelectItem value="Inactief">❌ Inactief</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TabsContent>

        {/* BUSINESS TAB */}
        <TabsContent value="business" className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="company_name">Bedrijfsnaam</Label>
            <Input
              id="company_name"
              name="company_name"
              value={formData.company_name}
              onChange={handleChange}
              placeholder="B.V. / Eenmanszaak"
              className="h-9"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="kvk_number">KVK Nummer</Label>
              <Input
                id="kvk_number"
                name="kvk_number"
                value={formData.kvk_number}
                onChange={handleChange}
                placeholder="12345678"
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="btw_number">BTW Nummer</Label>
              <Input
                id="btw_number"
                name="btw_number"
                value={formData.btw_number}
                onChange={handleChange}
                placeholder="NL123456789B01"
                className="h-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_person">Contactpersoon</Label>
            <Input
              id="contact_person"
              name="contact_person"
              value={formData.contact_person}
              onChange={handleChange}
              placeholder="Naam contactpersoon"
              className="h-9"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              name="website"
              type="url"
              value={formData.website}
              onChange={handleChange}
              placeholder="https://www.example.com"
              className="h-9"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="iban">IBAN Rekeningnummer</Label>
            <Input
              id="iban"
              name="iban"
              value={formData.iban}
              onChange={handleChange}
              placeholder="NL00 BANK 0123 4567 89"
              className="h-9"
            />
          </div>
        </TabsContent>

        {/* EXTRA TAB */}
        <TabsContent value="extra" className="space-y-3">
          <div className="space-y-2">
            <Label>Extra Email Adressen</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="extra@email.com"
                  className="h-9"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addEmail();
                    }
                  }}
                />
                <Button 
                  type="button" 
                  size="sm" 
                  onClick={addEmail}
                  className="h-9"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Toevoegen
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.additional_emails.map((email, index) => (
                  <Badge key={index} variant="secondary" className="pl-2 pr-1">
                    {email}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEmail(index)}
                      className="h-4 w-4 p-0 ml-2 hover:bg-transparent"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              {formData.additional_emails.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Geen extra email adressen toegevoegd
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notities</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={6}
              placeholder="Voeg hier extra informatie toe..."
              className="text-sm"
            />
          </div>
        </TabsContent>
      </Tabs>
      
      <DialogFooter className="mt-4">
        <Button variant="outline" type="button" onClick={onClose} className="h-9" disabled={isSaving}>
          Annuleren
        </Button>
        <Button type="submit" className="h-9" disabled={isSaving}>
          {isSaving ? 'Opslaan...' : existingCustomer ? 'Bijwerken' : 'Toevoegen'}
        </Button>
      </DialogFooter>
    </form>
  );
};
