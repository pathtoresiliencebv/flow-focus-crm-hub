
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from './RichTextEditor';
import { Plus } from 'lucide-react';

interface QuoteItem {
  id: string;
  type: 'product' | 'textblock';
  description: string;
  quantity?: number;
  unit_price?: number;
  vat_rate: number;
  total?: number;
  formatting?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
  };
}

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim()) return;

    const newItem: Omit<QuoteItem, 'id'> = {
      type: itemType,
      description,
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

    onAddItem(newItem);
    
    // Reset form
    setDescription('');
    setQuantity(1);
    setUnitPrice(0);
    setVatRate(21);
    setFormatting({ bold: false, italic: false, underline: false });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-gray-50">
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
          <RichTextEditor
            value={description}
            onChange={setDescription}
            placeholder="Voer tekst in..."
            formatting={formatting}
            onFormattingChange={setFormatting}
          />
        ) : (
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Beschrijving van product of dienst"
            required
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
              required
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
              required
            />
          </div>
        </div>
      )}

      <Button type="submit" className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        {itemType === 'product' ? 'Product toevoegen' : 'Tekstblok toevoegen'}
      </Button>
    </form>
  );
};
