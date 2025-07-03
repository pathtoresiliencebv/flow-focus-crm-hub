
import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, GripVertical, Edit3 } from 'lucide-react';
import { QuoteItemForm } from './QuoteItemForm';
import { QuoteItemDisplay } from './QuoteItemDisplay';
import { QuoteItem, QuoteBlock } from '@/types/quote';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface QuoteBlockFormProps {
  block: QuoteBlock;
  onUpdateBlock: (block: QuoteBlock) => void;
  onDeleteBlock: () => void;
  canDelete: boolean;
}

export const QuoteBlockForm: React.FC<QuoteBlockFormProps> = ({
  block,
  onUpdateBlock,
  onDeleteBlock,
  canDelete
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(block.title);

  const calculateBlockSubtotal = useCallback((items: QuoteItem[]): number => {
    const subtotal = items.reduce((sum, item) => {
      if (item.type === 'product') {
        return sum + (item.total || 0);
      }
      return sum;
    }, 0);
    console.log('QuoteBlockForm: Calculated subtotal:', subtotal, 'for items:', items);
    return subtotal;
  }, []);

  const calculateBlockVAT = useCallback((items: QuoteItem[]): number => {
    const vat = items.reduce((sum, item) => {
      if (item.type === 'product') {
        const itemTotal = item.total || 0;
        const vatRate = item.vat_rate || 0;
        return sum + (itemTotal * vatRate / 100);
      }
      return sum;
    }, 0);
    console.log('QuoteBlockForm: Calculated VAT:', vat, 'for items:', items);
    return vat;
  }, []);

  const handleAddItem = useCallback((newItem: Omit<QuoteItem, 'id'>) => {
    console.log('QuoteBlockForm: Adding item to block:', block.id, newItem);
    
    const item: QuoteItem = {
      ...newItem,
      id: crypto.randomUUID()
    };

    const updatedItems = [...block.items, item];
    console.log('QuoteBlockForm: Updated items array:', updatedItems);
    
    const subtotal = calculateBlockSubtotal(updatedItems);
    const vatAmount = calculateBlockVAT(updatedItems);

    const updatedBlock: QuoteBlock = {
      ...block,
      items: updatedItems,
      subtotal,
      vat_amount: vatAmount
    };

    console.log('QuoteBlockForm: Updating block with new item:', updatedBlock);
    onUpdateBlock(updatedBlock);
  }, [block, calculateBlockSubtotal, calculateBlockVAT, onUpdateBlock]);

  const handleDeleteItem = useCallback((index: number) => {
    console.log('QuoteBlockForm: Deleting item at index:', index);
    const updatedItems = block.items.filter((_, i) => i !== index);
    
    const subtotal = calculateBlockSubtotal(updatedItems);
    const vatAmount = calculateBlockVAT(updatedItems);

    const updatedBlock: QuoteBlock = {
      ...block,
      items: updatedItems,
      subtotal,
      vat_amount: vatAmount
    };

    onUpdateBlock(updatedBlock);
  }, [block, calculateBlockSubtotal, calculateBlockVAT, onUpdateBlock]);

  const handleTitleSave = useCallback(() => {
    const updatedBlock: QuoteBlock = {
      ...block,
      title: titleInput.trim() || 'Naamloos blok'
    };
    onUpdateBlock(updatedBlock);
    setIsEditingTitle(false);
  }, [block, titleInput, onUpdateBlock]);

  const handleTitleCancel = useCallback(() => {
    setTitleInput(block.title);
    setIsEditingTitle(false);
  }, [block.title]);

  // Debug effect to monitor block changes
  useEffect(() => {
    console.log('QuoteBlockForm: Block updated:', block);
  }, [block]);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <GripVertical className="h-5 w-5 text-gray-400 cursor-grab" />
            
            {isEditingTitle ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleTitleSave();
                    if (e.key === 'Escape') handleTitleCancel();
                  }}
                  onBlur={handleTitleSave}
                  className="text-lg font-semibold"
                  autoFocus
                />
                <Button size="sm" onClick={handleTitleSave}>
                  Opslaan
                </Button>
                <Button size="sm" variant="outline" onClick={handleTitleCancel}>
                  Annuleren
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-1 cursor-pointer group" onClick={() => setIsEditingTitle(true)}>
                <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">{block.title}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-50 group-hover:opacity-100 transition-opacity"
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  Klik om te bewerken
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {block.items.length} item{block.items.length !== 1 ? 's' : ''}
            </Badge>
            {canDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDeleteBlock}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Items List */}
        {block.items.length > 0 && (
          <div className="space-y-3">
            <h5 className="font-medium text-gray-700">Items in dit blok:</h5>
            {block.items.map((item, index) => (
              <QuoteItemDisplay
                key={item.id || `item-${index}`}
                item={item}
                onDelete={() => handleDeleteItem(index)}
              />
            ))}
          </div>
        )}

        {/* Add Item Form */}
        <QuoteItemForm onAddItem={handleAddItem} />

        {/* Block Totals */}
        {block.items.some(item => item.type === 'product') && (
          <>
            <Separator />
            <div className="flex justify-end">
              <div className="w-64 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotaal blok:</span>
                  <span className="font-medium">€{(block.subtotal || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">BTW:</span>
                  <span className="font-medium">€{(block.vat_amount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 border-t">
                  <span className="font-semibold">Totaal blok:</span>
                  <span className="font-semibold text-smans-primary">
                    €{((block.subtotal || 0) + (block.vat_amount || 0)).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
