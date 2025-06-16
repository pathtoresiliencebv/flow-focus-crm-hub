
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';
import { QuoteItem } from '@/types/quote';

interface QuoteItemFormProps {
  onAddItem: (item: Omit<QuoteItem, 'id'>) => void;
}

export const QuoteItemForm: React.FC<QuoteItemFormProps> = ({ onAddItem }) => {
  const [itemType, setItemType] = useState<'product' | 'textblock'>('product');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [vatRate, setVatRate] = useState<number>(21);
  const [formatting, setFormatting] = useState({
    bold: false,
    italic: false,
    underline: false
  });

  const resetForm = useCallback(() => {
    console.log('QuoteItemForm: Resetting form');
    setDescription('');
    setQuantity(1);
    setUnitPrice(0);
    setVatRate(21);
    setFormatting({ bold: false, italic: false, underline: false });
  }, []);

  const handleAddItem = useCallback((e?: React.MouseEvent) => {
    // Prevent any event propagation that could cause navigation
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log('QuoteItemForm: Add item button clicked with:', {
      itemType,
      description,
      quantity,
      unitPrice,
      vatRate,
      formatting
    });
    
    if (!description.trim()) {
      console.error('QuoteItemForm: Description is required');
      alert('Beschrijving is verplicht');
      return;
    }

    const newItem: Omit<QuoteItem, 'id'> = {
      type: itemType,
      description: description.trim(),
      vat_rate: vatRate,
      ...(itemType === 'product' && {
        quantity,
        unit_price: unitPrice,
        total: quantity * unitPrice
      }),
      ...(itemType === 'textblock' && {
        formatting
      })
    };

    console.log('QuoteItemForm: Creating new item:', newItem);
    
    try {
      onAddItem(newItem);
      resetForm();
      console.log('QuoteItemForm: Item added successfully, form reset');
    } catch (error) {
      console.error('QuoteItemForm: Error adding item:', error);
    }
  }, [itemType, description, quantity, unitPrice, vatRate, formatting, onAddItem, resetForm]);

  const toggleFormatting = useCallback((type: 'bold' | 'italic' | 'underline') => {
    setFormatting(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  }, []);

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
      <h4 className="font-medium text-gray-900">Nieuw item toevoegen</h4>
      
      {/* Remove form wrapper entirely to prevent form submissions */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="itemType">Type</Label>
            <Select value={itemType} onValueChange={(value: 'product' | 'textblock') => setItemType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="product">Product/Dienst</SelectItem>
                <SelectItem value="textblock">Tekstblok</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="vatRate">BTW %</Label>
            <Select value={vatRate.toString()} onValueChange={(value) => setVatRate(Number(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0% BTW</SelectItem>
                <SelectItem value="9">9% BTW</SelectItem>
                <SelectItem value="21">21% BTW</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="description">
            {itemType === 'product' ? 'Beschrijving' : 'Tekst'}
          </Label>
          {itemType === 'textblock' ? (
            <div className="space-y-2">
              <div className="flex gap-2 mb-2">
                <Button
                  type="button"
                  variant={formatting.bold ? "default" : "outline"}
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleFormatting('bold');
                  }}
                >
                  <strong>B</strong>
                </Button>
                <Button
                  type="button"
                  variant={formatting.italic ? "default" : "outline"}
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleFormatting('italic');
                  }}
                  className="italic"
                >
                  I
                </Button>
                <Button
                  type="button"
                  variant={formatting.underline ? "default" : "outline"}
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleFormatting('underline');
                  }}
                  className="underline"
                >
                  U
                </Button>
              </div>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Voer tekst in..."
                className="min-h-[100px]"
              />
            </div>
          ) : (
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beschrijving van product of dienst"
            />
          )}
        </div>

        {itemType === 'product' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">Aantal</Label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <Label htmlFor="unitPrice">Prijs per stuk (€)</Label>
              <Input
                type="number"
                value={unitPrice}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
                min="0"
                step="0.01"
              />
            </div>
          </div>
        )}

        <Button 
          type="button" 
          onClick={handleAddItem} 
          className="w-full"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          {itemType === 'product' ? 'Product toevoegen' : 'Tekstblok toevoegen'}
        </Button>
      </div>
    </div>
  );
};
