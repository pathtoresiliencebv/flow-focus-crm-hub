
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';
import { QuoteItem } from '@/types/quote';
import { AIEnhanceButton } from '@/components/ui/ai-enhance-button';
import { useToast } from '@/hooks/use-toast';

interface QuoteItemFormProps {
  onAddItem: (item: Omit<QuoteItem, 'id'>) => void;
}

export const QuoteItemForm: React.FC<QuoteItemFormProps> = ({ onAddItem }) => {
  const { toast } = useToast();
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [vatRate, setVatRate] = useState<number>(21);

  const resetForm = useCallback(() => {
    console.log('QuoteItemForm: Resetting form');
    setDescription('');
    setQuantity(1);
    setUnitPrice(0);
    setVatRate(21);
  }, []);

  const handleAddItem = useCallback((e?: React.MouseEvent) => {
    // Prevent any event propagation that could cause navigation
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log('QuoteItemForm: Add product button clicked with:', {
      description,
      quantity,
      unitPrice,
      vatRate
    });
    
    if (!description.trim()) {
      console.error('QuoteItemForm: Description is required');
      toast({
        title: "Beschrijving vereist",
        description: "Voer een beschrijving in om het product toe te voegen.",
        variant: "destructive",
      });
      return;
    }

    const newItem: Omit<QuoteItem, 'id'> = {
      type: 'product',
      description: description.trim(),
      quantity,
      unit_price: unitPrice,
      total: quantity * unitPrice,
      vat_rate: vatRate
    };

    console.log('QuoteItemForm: Creating new product:', newItem);
    
    try {
      onAddItem(newItem);
      resetForm();
      console.log('QuoteItemForm: Product added successfully, form reset');
    } catch (error) {
      console.error('QuoteItemForm: Error adding product:', error);
    }
  }, [description, quantity, unitPrice, vatRate, onAddItem, resetForm]);

  return (
    <div className="space-y-2 p-2 border rounded-lg bg-blue-50/50">
      <h4 className="font-medium text-gray-900 text-xs">Product/Dienst toevoegen</h4>
      
      <div className="space-y-2">
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="description" className="text-xs">Werkzaamheden</Label>
            <AIEnhanceButton 
              text={description}
              onEnhanced={setDescription}
              context="product"
              size="sm"
              variant="ghost"
            />
          </div>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="bijv. sloopwerk"
            className="h-7 text-xs"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div>
            <Label htmlFor="unitPrice" className="text-xs">Prijs per stuk (€)</Label>
            <Input
              type="number"
              value={unitPrice}
              onChange={(e) => setUnitPrice(Number(e.target.value))}
              min="0"
              step="0.01"
              className="h-7 text-xs"
            />
          </div>
          <div>
            <Label htmlFor="quantity" className="text-xs">Aantal</Label>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setQuantity(Math.max(0, quantity - 1))}
              >
                -
              </Button>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                min="0"
                step="0.01"
                className="h-7 text-xs text-center"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setQuantity(quantity + 1)}
              >
                +
              </Button>
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="vatRate" className="text-xs">BTW %</Label>
          <Select value={vatRate.toString()} onValueChange={(value) => setVatRate(Number(value))}>
            <SelectTrigger className="h-7">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">0% BTW</SelectItem>
              <SelectItem value="9">9% BTW</SelectItem>
              <SelectItem value="21">21% BTW</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          type="button" 
          onClick={handleAddItem} 
          className="w-full h-7 text-xs"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <Plus className="h-3 w-3 mr-1" />
          Product toevoegen
        </Button>
      </div>
    </div>
  );
};
