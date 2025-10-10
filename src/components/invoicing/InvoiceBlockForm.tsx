import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, GripVertical, Edit3, Plus, Save, X, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { RichTextEditor } from '@/components/quotes/RichTextEditor';
import { useToast } from '@/hooks/use-toast';

interface InvoiceItem {
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

interface InvoiceBlock {
  id: string;
  title: string;
  type: 'product' | 'textblock';
  items: InvoiceItem[];
  subtotal: number;
  vat_amount: number;
  order_index: number;
  content?: string;
}

interface InvoiceBlockFormProps {
  block: InvoiceBlock;
  onUpdateBlock: (block: InvoiceBlock) => void;
  onDeleteBlock: () => void;
  canDelete: boolean;
  dragHandleProps?: any;
}

export const InvoiceBlockForm: React.FC<InvoiceBlockFormProps> = ({
  block,
  onUpdateBlock,
  onDeleteBlock,
  canDelete,
  dragHandleProps
}) => {
  const { toast } = useToast();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(block.title);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleTitleSave = useCallback(() => {
    const updatedBlock: InvoiceBlock = {
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

  const handleItemUpdate = useCallback((itemId: string, updates: Partial<InvoiceItem>) => {
    const updatedItems = block.items.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, ...updates };
        if (updatedItem.type === 'product' && updatedItem.quantity && updatedItem.unit_price) {
          updatedItem.total = updatedItem.quantity * updatedItem.unit_price;
        }
        return updatedItem;
      }
      return item;
    });

    const subtotal = updatedItems.filter(item => item.type === 'product').reduce((sum, item) => sum + (item.total || 0), 0);
    const vat_amount = updatedItems.filter(item => item.type === 'product').reduce((sum, item) => {
      const itemTotal = item.total || 0;
      const vatRate = item.vat_rate || 0;
      return sum + (itemTotal * vatRate / 100);
    }, 0);

    const updatedBlock: InvoiceBlock = {
      ...block,
      items: updatedItems,
      subtotal,
      vat_amount
    };

    onUpdateBlock(updatedBlock);
  }, [block, onUpdateBlock]);

  const handleDeleteItem = useCallback((itemId: string) => {
    const updatedItems = block.items.filter(item => item.id !== itemId);
    
    const subtotal = updatedItems.filter(item => item.type === 'product').reduce((sum, item) => sum + (item.total || 0), 0);
    const vat_amount = updatedItems.filter(item => item.type === 'product').reduce((sum, item) => {
      const itemTotal = item.total || 0;
      const vatRate = item.vat_rate || 0;
      return sum + (itemTotal * vatRate / 100);
    }, 0);

    const updatedBlock: InvoiceBlock = {
      ...block,
      items: updatedItems,
      subtotal,
      vat_amount
    };

    onUpdateBlock(updatedBlock);
  }, [block, onUpdateBlock]);

  const handleAddItem = useCallback((type: 'product' | 'textblock') => {
    const newItem: InvoiceItem = {
      id: crypto.randomUUID(),
      type,
      description: '',
      vat_rate: type === 'product' ? 21 : 0,
      ...(type === 'product' && { quantity: 1, unit_price: 0, total: 0 })
    };

    const updatedItems = [...block.items, newItem];
    const updatedBlock: InvoiceBlock = {
      ...block,
      items: updatedItems
    };

    onUpdateBlock(updatedBlock);
    setShowAddForm(false);
  }, [block, onUpdateBlock]);

  const handleContentChange = useCallback((content: string) => {
    const updatedBlock: InvoiceBlock = {
      ...block,
      content
    };
    onUpdateBlock(updatedBlock);
  }, [block, onUpdateBlock]);

  // For textblock type, render simple editor
  if (block.type === 'textblock') {
    return (
      <div className="w-full">
        <div {...dragHandleProps} className="flex items-center gap-2 mb-2">
          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
          <span className="text-xs text-muted-foreground">Tekstblok</span>
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDeleteBlock}
              className="text-destructive hover:text-destructive h-6 w-6 p-0 ml-auto"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
        <RichTextEditor
          value={block.content || ''}
          onChange={(content) => handleContentChange(content)}
          placeholder="Voer uw tekst in..."
        />
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            <div {...dragHandleProps}>
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
            </div>
            
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
                  className="text-base font-semibold"
                  autoFocus
                />
                <Button size="sm" onClick={handleTitleSave}>
                  <Save className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="outline" onClick={handleTitleCancel}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-1 cursor-pointer group" onClick={() => setIsEditingTitle(true)}>
                <CardTitle className="text-base font-bold group-hover:text-primary transition-colors">{block.title}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-50 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                >
                  <Edit3 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {block.items.length} item{block.items.length !== 1 ? 's' : ''}
            </Badge>
            {canDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDeleteBlock}
                className="text-destructive hover:text-destructive h-7 w-7 p-0"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Items List - Ruimere Grid Layout voor betere zichtbaarheid */}
        {block.items.map((item) => (
          <div key={item.id} className="grid grid-cols-12 gap-3 items-center py-2 border-b border-border/50 last:border-b-0">
            {item.type === 'product' ? (
              <>
                <div className="col-span-4">
                  <Input
                    value={item.description}
                    onChange={(e) => handleItemUpdate(item.id, { description: e.target.value })}
                    onBlur={() => {}}
                    placeholder="Beschrijving"
                    className="h-10 text-base"
                  />
                </div>
                <div className="col-span-2">
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleItemUpdate(item.id, { quantity: Math.max(0, (item.quantity || 1) - 1) })}
                      className="h-10 w-10 p-0 shrink-0"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      value={item.quantity || ''}
                      onChange={(e) => handleItemUpdate(item.id, { quantity: Number(e.target.value) || 0 })}
                      onBlur={() => {}}
                      placeholder="Aantal"
                      className="h-10 text-base text-center"
                      min="0"
                      step="0.01"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleItemUpdate(item.id, { quantity: (item.quantity || 1) + 1 })}
                      className="h-10 w-10 p-0 shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-base">€</span>
                    <Input
                      type="number"
                      value={item.unit_price || ''}
                      onChange={(e) => handleItemUpdate(item.id, { unit_price: Number(e.target.value) || 0 })}
                      onBlur={() => {}}
                      placeholder="0.00"
                      className="h-10 text-base pl-8"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="relative">
                    <Select
                      value={item.vat_rate?.toString() || '21'}
                      onValueChange={(value) => handleItemUpdate(item.id, { vat_rate: Number(value) })}
                    >
                      <SelectTrigger className="h-10 text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0%</SelectItem>
                        <SelectItem value="9">9%</SelectItem>
                        <SelectItem value="21">21%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="col-span-1 text-right">
                  <span className="text-base font-medium">€{(item.total || 0).toFixed(2)}</span>
                </div>
                <div className="col-span-1 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteItem(item.id)}
                    className="text-destructive hover:text-destructive h-7 w-7 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="col-span-10">
                  <RichTextEditor
                    value={item.description}
                    onChange={(value, formatting) => handleItemUpdate(item.id, { description: value, formatting })}
                    placeholder="Tekst invoeren..."
                    formatting={item.formatting}
                    onFormattingChange={(formatting) => handleItemUpdate(item.id, { formatting })}
                  />
                </div>
                <div className="col-span-2 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteItem(item.id)}
                    className="text-destructive hover:text-destructive h-6 w-6 p-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </>
            )}
          </div>
        ))}

        {/* Add Item Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleAddItem('product')}
            className="h-8 text-sm"
          >
            <Plus className="h-3 w-3 mr-1" />
            Product
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleAddItem('textblock')}
            className="h-8 text-sm"
          >
            <Plus className="h-3 w-3 mr-1" />
            Tekst
          </Button>
        </div>

        {/* Block Totals */}
        {block.items.some(item => item.type === 'product') && (
          <div className="flex justify-end pt-2 border-t">
            <div className="w-48 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotaal:</span>
                <span className="font-medium">€{(block.subtotal || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">BTW:</span>
                <span className="font-medium">€{(block.vat_amount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-t font-semibold">
                <span>Totaal:</span>
                <span className="text-primary">€{((block.subtotal || 0) + (block.vat_amount || 0)).toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};