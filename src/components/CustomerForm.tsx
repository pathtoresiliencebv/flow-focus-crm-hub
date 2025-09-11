
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCrmStore, Customer } from "@/hooks/useCrmStore";

interface CustomerFormProps {
  onClose: () => void;
  existingCustomer?: Customer;
}

export const CustomerForm = ({ onClose, existingCustomer }: CustomerFormProps) => {
  const { addCustomer, updateCustomer } = useCrmStore();
  const [formData, setFormData] = useState({
    name: existingCustomer?.name || "",
    email: existingCustomer?.email || "",
    phone: existingCustomer?.phone || "",
    address: existingCustomer?.address || "",
    city: existingCustomer?.city || "",
    notes: existingCustomer?.notes || "",
    status: existingCustomer?.status || "Actief" as const,
  });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (existingCustomer) {
      updateCustomer(existingCustomer.id, formData);
    } else {
      addCustomer(formData);
    }
    
    onClose();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
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

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={handleStatusChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecteer status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Actief">Actief</SelectItem>
              <SelectItem value="In behandeling">In behandeling</SelectItem>
              <SelectItem value="Inactief">Inactief</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="notes">Notities</Label>
          <Textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
          />
        </div>
      </div>
      
      <DialogFooter>
        <Button variant="outline" type="button" onClick={onClose}>
          Annuleren
        </Button>
        <Button type="submit">
          {existingCustomer ? "Bijwerken" : "Toevoegen"}
        </Button>
      </DialogFooter>
    </form>
  );
};
