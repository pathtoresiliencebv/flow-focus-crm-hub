import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";

export interface PaymentTerm {
  id: string;
  percentage: number;
  description: string;
  daysAfter?: number;
}

interface PaymentTermsSelectorProps {
  value: PaymentTerm[];
  onChange: (terms: PaymentTerm[]) => void;
}

const presetTerms = [
  { value: "100", label: "100% direct", terms: [{ percentage: 100, description: "Volledige betaling" }] },
  { value: "50-50", label: "50% vooraf, 50% na afronding", terms: [
    { percentage: 50, description: "Aanbetaling" },
    { percentage: 50, description: "Na afronding", daysAfter: 0 }
  ]},
  { value: "4x25", label: "4 termijnen van 25%", terms: [
    { percentage: 25, description: "Aanbetaling" },
    { percentage: 25, description: "Na fase 1", daysAfter: 30 },
    { percentage: 25, description: "Na fase 2", daysAfter: 60 },
    { percentage: 25, description: "Na afronding", daysAfter: 90 }
  ]},
  { value: "custom", label: "Aangepast", terms: [] }
];

export const PaymentTermsSelector = ({ value, onChange }: PaymentTermsSelectorProps) => {
  const [selectedPreset, setSelectedPreset] = useState<string>("100");

  const handlePresetChange = (presetValue: string) => {
    setSelectedPreset(presetValue);
    const preset = presetTerms.find(p => p.value === presetValue);
    if (preset && presetValue !== "custom") {
      const newTerms = preset.terms.map((term, index) => ({
        id: crypto.randomUUID(),
        ...term
      }));
      onChange(newTerms);
    } else if (presetValue === "custom") {
      onChange([]);
    }
  };

  const addCustomTerm = () => {
    const newTerm: PaymentTerm = {
      id: crypto.randomUUID(),
      percentage: 0,
      description: "",
      daysAfter: 0
    };
    onChange([...value, newTerm]);
  };

  const updateTerm = (id: string, updates: Partial<PaymentTerm>) => {
    onChange(value.map(term => 
      term.id === id ? { ...term, ...updates } : term
    ));
  };

  const removeTerm = (id: string) => {
    onChange(value.filter(term => term.id !== id));
  };

  const totalPercentage = value.reduce((sum, term) => sum + term.percentage, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Betaalvoorwaarden</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Selecteer preset</Label>
          <Select value={selectedPreset} onValueChange={handlePresetChange}>
            <SelectTrigger>
              <SelectValue placeholder="Kies betaalvoorwaarden" />
            </SelectTrigger>
            <SelectContent>
              {presetTerms.map(preset => (
                <SelectItem key={preset.value} value={preset.value}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {value.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Termijnen configuratie</Label>
              <span className={`text-sm font-medium ${totalPercentage === 100 ? 'text-green-600' : 'text-red-600'}`}>
                Totaal: {totalPercentage}%
              </span>
            </div>
            
            {value.map((term, index) => (
              <div key={term.id} className="flex items-center gap-2 p-3 border rounded-lg">
                <div className="flex-1">
                  <Input
                    type="number"
                    placeholder="Percentage"
                    value={term.percentage || ''}
                    onChange={(e) => updateTerm(term.id, { percentage: parseInt(e.target.value) || 0 })}
                    className="w-20"
                    min="0"
                    max="100"
                  />
                </div>
                <div className="flex-2">
                  <Input
                    placeholder="Omschrijving"
                    value={term.description}
                    onChange={(e) => updateTerm(term.id, { description: e.target.value })}
                  />
                </div>
                <div className="flex-1">
                  <Input
                    type="number"
                    placeholder="Dagen (optioneel)"
                    value={term.daysAfter || ''}
                    onChange={(e) => updateTerm(term.id, { daysAfter: parseInt(e.target.value) || undefined })}
                    className="w-24"
                  />
                </div>
                {selectedPreset === "custom" && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTerm(term.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {selectedPreset === "custom" && (
          <Button
            type="button"
            variant="outline"
            onClick={addCustomTerm}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Termijn toevoegen
          </Button>
        )}

        {totalPercentage !== 100 && value.length > 0 && (
          <p className="text-sm text-red-600">
            Let op: Het totaal percentage moet 100% zijn voor een geldige configuratie.
          </p>
        )}
      </CardContent>
    </Card>
  );
};