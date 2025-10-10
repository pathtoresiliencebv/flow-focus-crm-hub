import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, GripVertical, Edit3, Plus, Save, X, Minus } from 'lucide-react';
import { QuoteItem, QuoteBlock } from '@/types/quote';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { RichTextEditor } from './RichTextEditor';

interface QuoteBlockFormProps {
  block: QuoteBlock;
  onUpdateBlock: (block: QuoteBlock) => void;
  onDeleteBlock: () => void;
  canDelete: boolean;
  dragHandleProps?: any;
}

export const QuoteBlockForm: React.FC<QuoteBlockFormProps> = ({
  block,
  onUpdateBlock,
  onDeleteBlock,
  canDelete,
  dragHandleProps
}) => {
  const { toast } = useToast();
  
  // Title editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(block.title);

  // Local state for input fields to prevent re-rendering
  const [localItemStates, setLocalItemStates] = useState<{[key: string]: QuoteItem}>({});

  // Initialize local states when block changes
  useEffect(() => {
    const newLocalStates: {[key: string]: QuoteItem} = {};
    block.items.forEach(item => {
      newLocalStates[item.id] = { ...item };
    });
    setLocalItemStates(newLocalStates);
  }, [block.id]);

  const handleTitleSave = useCallback(() => {
    if (titleInput.trim()) {
      onUpdateBlock({ ...block, title: titleInput.trim() });
    }
    setIsEditingTitle(false);
  }, [titleInput, block, onUpdateBlock]);

  const handleTitleCancel = useCallback(() => {
    setTitleInput(block.title);
    setIsEditingTitle(false);
  }, [block.title]);

  const handleTitleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      handleTitleCancel();
    }
  }, [handleTitleSave, handleTitleCancel]);

  // ✅ FIX: Declare calculate functions BEFORE they are used in other callbacks
  const calculateBlockSubtotal = useCallback((items: QuoteItem[]): number => {
    return items.reduce((sum, item) => {
      if (item.type === 'product') {
        return sum + (item.unit_price * item.quantity);
      }
      return sum;
    }, 0);
  }, []);

  const calculateBlockVAT = useCallback((items: QuoteItem[]): number => {
    return items.reduce((sum, item) => {
      if (item.type === 'product') {
        return sum + ((item.unit_price * item.quantity) * (item.vat_rate / 100));
      }
      return sum;
    }, 0);
  }, []);

  // Direct add items without popup form (like invoice)
  const handleAddItem = useCallback((type: 'product' | 'textblock') => {
    const newItem: QuoteItem = {
      id: crypto.randomUUID(),
      type,
      description: '',
      vat_rate: type === 'product' ? 21 : 0,
      ...(type === 'product' && { 
        quantity: 1, 
        unit_price: 0, 
        total: 0,
        vat_amount: 0
      })
    };

    const updatedItems = [...block.items, newItem];
    const updatedBlock: QuoteBlock = {
      ...block,
      items: updatedItems,
      subtotal: calculateBlockSubtotal(updatedItems),
      vat_amount: calculateBlockVAT(updatedItems)
    };

    onUpdateBlock(updatedBlock);
  }, [block, onUpdateBlock, calculateBlockSubtotal, calculateBlockVAT]);

  const handleLocalInputChange = useCallback((itemId: string, field: keyof QuoteItem, value: any) => {
    setLocalItemStates(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value
      }
    }));
  }, []);

  const handleInputBlur = useCallback((itemId: string) => {
    const localItem = localItemStates[itemId];
    if (!localItem) return;

    // Recalculate totals
    const updatedItem = { ...localItem };
    if (updatedItem.type === 'product') {
      updatedItem.total = updatedItem.unit_price * updatedItem.quantity;
      updatedItem.vat_amount = updatedItem.total * (updatedItem.vat_rate / 100);
    }

    // Update the block
    const updatedItems = block.items.map(item => 
      item.id === itemId ? updatedItem : item
    );
    
    const updatedBlock = {
      ...block,
      items: updatedItems,
      subtotal: calculateBlockSubtotal(updatedItems),
      vat_amount: calculateBlockVAT(updatedItems)
    };

    onUpdateBlock(updatedBlock);
  }, [localItemStates, block, onUpdateBlock, calculateBlockSubtotal, calculateBlockVAT]);

  const handleDeleteItem = useCallback((itemId: string) => {
    const updatedItems = block.items.filter(item => item.id !== itemId);
    const updatedBlock = {
      ...block,
      items: updatedItems,
      subtotal: calculateBlockSubtotal(updatedItems),
      vat_amount: calculateBlockVAT(updatedItems)
    };

    onUpdateBlock(updatedBlock);
  }, [block, onUpdateBlock, calculateBlockSubtotal, calculateBlockVAT]);

  const updateQuantity = useCallback((itemId: string, newQuantity: number) => {
    if (newQuantity < 0) return;
    
    const updatedItems = block.items.map(item => {
      if (item.id === itemId && item.type === 'product') {
        const updatedItem = {
          ...item,
          quantity: newQuantity,
          total: item.unit_price * newQuantity,
          vat_amount: (item.unit_price * newQuantity) * (item.vat_rate / 100)
        };
        return updatedItem;
      }
      return item;
    });

    const updatedBlock = {
      ...block,
      items: updatedItems,
      subtotal: calculateBlockSubtotal(updatedItems),
      vat_amount: calculateBlockVAT(updatedItems)
    };

    onUpdateBlock(updatedBlock);
  }, [block, onUpdateBlock, calculateBlockSubtotal, calculateBlockVAT]);

  const handleContentChange = useCallback((content: string) => {
    const updatedBlock: QuoteBlock = {
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
    <Card className="border border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <Input
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={handleTitleKeyDown}
                  className="h-8 text-sm font-medium"
                  autoFocus
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleTitleSave}
                  className="h-8 w-8 p-0"
                >
                  <Save className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleTitleCancel}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium">{block.title}</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditingTitle(true)}
                  className="h-6 w-6 p-0"
                >
                  <Edit3 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {block.items.length} items
            </Badge>
            {canDelete && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onDeleteBlock}
                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Items List - Consistent met factuur layout */}
        {block.items.map((item, index) => {
          const localItem = localItemStates[item.id] || item;
          
          return (
            <div key={item.id} className="grid grid-cols-12 gap-3 items-center py-2 border-b border-border/50 last:border-b-0">
              {item.type === 'product' ? (
                <>
                  <div className="col-span-4">
                    <Input
                      value={localItem.description}
                      onChange={(e) => handleLocalInputChange(item.id, 'description', e.target.value)}
                      onBlur={() => handleInputBlur(item.id)}
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
                        onClick={() => updateQuantity(item.id, (localItem.quantity || 1) - 1)}
                        className="h-10 w-10 p-0 shrink-0"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        value={localItem.quantity || ''}
                        onChange={(e) => handleLocalInputChange(item.id, 'quantity', Number(e.target.value) || 0)}
                        onBlur={() => handleInputBlur(item.id)}
                        className="h-10 text-center text-base"
                        min="0"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, (localItem.quantity || 1) + 1)}
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
                        value={localItem.unit_price || ''}
                        onChange={(e) => handleLocalInputChange(item.id, 'unit_price', Number(e.target.value) || 0)}
                        onBlur={() => handleInputBlur(item.id)}
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
                        value={localItem.vat_rate?.toString() || '21'}
                        onValueChange={(value) => {
                          handleLocalInputChange(item.id, 'vat_rate', Number(value));
                          handleInputBlur(item.id);
                        }}
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
                  <div className="col-span-1 text-right text-base font-medium">
                    €{(localItem.total || 0).toFixed(2)}
                  </div>
                </>
              ) : (
                <div className="col-span-11">
                  <RichTextEditor
                    value={localItem.description}
                    onChange={(value) => {
                      handleLocalInputChange(item.id, 'description', value);
                      handleInputBlur(item.id);
                    }}
                    placeholder="Tekst invoeren..."
                  />
                </div>
              )}
              
              <div className="col-span-1 text-right">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteItem(item.id)}
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}

        {/* Block totals */}
        {block.type === 'product' && block.items.some(item => item.type === 'product') && (
          <div className="border-t pt-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span>Subtotaal:</span>
              <span className="font-medium">€{(block.subtotal || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>BTW:</span>
              <span className="font-medium">€{(block.vat_amount || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold border-t pt-1">
              <span>Totaal:</span>
              <span>€{((block.subtotal || 0) + (block.vat_amount || 0)).toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Add Item Buttons - Direct toevoegen zoals factuur */}
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
      </CardContent>
    </Card>
  );
};
