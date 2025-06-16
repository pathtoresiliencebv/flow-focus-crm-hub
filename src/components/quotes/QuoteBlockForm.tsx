
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, GripVertical, Edit3 } from 'lucide-react';
import { QuoteItemForm } from './QuoteItemForm';
import { RichTextEditor } from './RichTextEditor';
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

  const calculateBlockSubtotal = (items: QuoteItem[]): number => {
    return items.reduce((sum, item) => {
      if (item.type === 'product') {
        return sum + (item.total || 0);
      }
      return sum;
    }, 0);
  };

  const calculateBlockVAT = (items: QuoteItem[]): number => {
    return items.reduce((sum, item) => {
      if (item.type === 'product') {
        const itemTotal = item.total || 0;
        const vatRate = item.vat_rate || 0;
        return sum + (itemTotal * vatRate / 100);
      }
      return sum;
    }, 0);
  };

  const handleAddItem = (newItem: Omit<QuoteItem, 'id'>) => {
    const item: QuoteItem = {
      ...newItem,
      id: crypto.randomUUID()
    };

    const updatedItems = [...block.items, item];
    const subtotal = calculateBlockSubtotal(updatedItems);
    const vatAmount = calculateBlockVAT(updatedItems);

    onUpdateBlock({
      ...block,
      items: updatedItems,
      subtotal,
      vat_amount: vatAmount
    });
  };

  const handleUpdateItem = (index: number, updatedItem: QuoteItem) => {
    const updatedItems = [...block.items];
    updatedItems[index] = updatedItem;
    
    const subtotal = calculateBlockSubtotal(updatedItems);
    const vatAmount = calculateBlockVAT(updatedItems);

    onUpdateBlock({
      ...block,
      items: updatedItems,
      subtotal,
      vat_amount: vatAmount
    });
  };

  const handleDeleteItem = (index: number) => {
    const updatedItems = block.items.filter((_, i) => i !== index);
    const subtotal = calculateBlockSubtotal(updatedItems);
    const vatAmount = calculateBlockVAT(updatedItems);

    onUpdateBlock({
      ...block,
      items: updatedItems,
      subtotal,
      vat_amount: vatAmount
    });
  };

  const handleTitleSave = () => {
    onUpdateBlock({
      ...block,
      title: titleInput.trim() || 'Naamloos blok'
    });
    setIsEditingTitle(false);
  };

  const getItemStyle = (item: QuoteItem) => {
    if (item.type === 'textblock' && item.formatting) {
      let style: React.CSSProperties = {};
      if (item.formatting.bold) style.fontWeight = 'bold';
      if (item.formatting.italic) style.fontStyle = 'italic';
      if (item.formatting.underline) style.textDecoration = 'underline';
      return style;
    }
    return {};
  };

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
                    if (e.key === 'Escape') {
                      setTitleInput(block.title);
                      setIsEditingTitle(false);
                    }
                  }}
                  className="text-lg font-semibold"
                  autoFocus
                />
                <Button size="sm" onClick={handleTitleSave}>
                  Opslaan
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-1">
                <CardTitle className="text-lg">{block.title}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingTitle(true)}
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
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
            {block.items.map((item, index) => (
              <div key={item.id} className="p-3 border rounded-lg bg-gray-50">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    {item.type === 'product' ? (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                        <div>
                          <span className="font-medium">{item.description}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">
                            {item.quantity} × €{item.unit_price?.toFixed(2)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">{item.vat_rate}% BTW</span>
                        </div>
                        <div>
                          <span className="font-medium">€{item.total?.toFixed(2)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm" style={getItemStyle(item)}>
                        {item.description}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteItem(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
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
                  <span className="font-medium">€{block.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">BTW:</span>
                  <span className="font-medium">€{block.vat_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 border-t">
                  <span className="font-semibold">Totaal blok:</span>
                  <span className="font-semibold text-smans-primary">
                    €{(block.subtotal + block.vat_amount).toFixed(2)}
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
