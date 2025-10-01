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
  
  // Form visibility state
  const [showProductForm, setShowProductForm] = useState(false);
  const [showTextForm, setShowTextForm] = useState(false);
  
  // New product form state
  const [newProduct, setNewProduct] = useState({
    description: '',
    unit_price: 0,
    quantity: 1,
    vat_rate: 21
  });
  
  // Text block state
  const [textBlockContent, setTextBlockContent] = useState('');
  const [textFormatting, setTextFormatting] = useState({
    bold: false,
    italic: false,
    underline: false
  });

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

  const handleAddProduct = useCallback(() => {
    if (!newProduct.description.trim()) {
      toast({
        title: "Beschrijving vereist",
        description: "Voer een beschrijving in voor het product.",
        variant: "destructive",
      });
      return;
    }

    const newItem: Omit<QuoteItem, 'id'> = {
      type: 'product',
      description: newProduct.description.trim(),
      unit_price: newProduct.unit_price,
      quantity: newProduct.quantity,
      vat_rate: newProduct.vat_rate,
      total: newProduct.unit_price * newProduct.quantity,
      vat_amount: (newProduct.unit_price * newProduct.quantity) * (newProduct.vat_rate / 100)
    };

    handleAddItem(newItem);
    
    // Reset form
    setNewProduct({
      description: '',
      unit_price: 0,
      quantity: 1,
      vat_rate: 21
    });
    setShowProductForm(false);
  }, [newProduct]);

  const handleAddTextBlock = useCallback(() => {
    if (!textBlockContent.trim()) {
      toast({
        title: "Tekst vereist",
        description: "Voer tekst in om het tekstblok toe te voegen.",
        variant: "destructive",
      });
      return;
    }

    const newTextBlock: Omit<QuoteItem, 'id'> = {
      type: 'textblock',
      description: textBlockContent.trim(),
      vat_rate: 0,
      formatting: textFormatting
    };

    handleAddItem(newTextBlock);
    
    // Reset form
    setTextBlockContent('');
    setTextFormatting({ bold: false, italic: false, underline: false });
    setShowTextForm(false);
  }, [textBlockContent, textFormatting]);

  const handleAddItem = useCallback((itemData: Omit<QuoteItem, 'id'>) => {
    const newItem: QuoteItem = {
      ...itemData,
      id: crypto.randomUUID()
    };

    const updatedItems = [...block.items, newItem];
    const updatedBlock = {
      ...block,
      items: updatedItems,
      subtotal: calculateBlockSubtotal(updatedItems),
      vat_amount: calculateBlockVAT(updatedItems)
    };

    onUpdateBlock(updatedBlock);
  }, [block, onUpdateBlock]);

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
        {/* Product/Service Add Form - Same as Invoice */}
        {showProductForm && (
          <Card className="bg-gray-50 border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Product/Dienst toevoegen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Werkzaamheden</label>
                <Input
                  value={newProduct.description}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="bijv. sloopwerk"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Aantal</label>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setNewProduct(prev => ({ ...prev, quantity: Math.max(0, prev.quantity - 1) }))}
                      className="h-9 w-9 p-0 shrink-0"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Input
                      type="number"
                      value={newProduct.quantity}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, quantity: Number(e.target.value) || 0 }))}
                      className="text-center"
                      min="0"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setNewProduct(prev => ({ ...prev, quantity: prev.quantity + 1 }))}
                      className="h-9 w-9 p-0 shrink-0"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Prijs per stuk</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                    <Input
                      type="number"
                      value={newProduct.unit_price}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, unit_price: Number(e.target.value) || 0 }))}
                      placeholder="0.00"
                      className="pl-7"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">BTW</label>
                  <div className="relative">
                    <Select
                      value={newProduct.vat_rate.toString()}
                      onValueChange={(value) => setNewProduct(prev => ({ ...prev, vat_rate: Number(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0%</SelectItem>
                        <SelectItem value="9">9%</SelectItem>
                        <SelectItem value="21">21%</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">%</span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <div className="text-sm font-medium">
                  Totaal: <span className="text-lg">€{(newProduct.unit_price * newProduct.quantity).toFixed(2)}</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleAddProduct}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  + Product toevoegen
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowProductForm(false)}
                >
                  Annuleren
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Items List - Same layout as Invoice */}
        {block.items.map((item, index) => {
          const localItem = localItemStates[item.id] || item;
          
          return (
            <div key={item.id} className="grid grid-cols-12 gap-2 items-center py-2 border-b border-border/50 last:border-b-0">
              {item.type === 'product' ? (
                <>
                  <div className="col-span-5">
                    <Input
                      value={localItem.description}
                      onChange={(e) => handleLocalInputChange(item.id, 'description', e.target.value)}
                      onBlur={() => handleInputBlur(item.id)}
                      placeholder="Beschrijving"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, (localItem.quantity || 1) - 1)}
                        className="h-9 w-9 p-0 shrink-0"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Input
                        type="number"
                        value={localItem.quantity || ''}
                        onChange={(e) => handleLocalInputChange(item.id, 'quantity', Number(e.target.value) || 0)}
                        onBlur={() => handleInputBlur(item.id)}
                        className="h-9 text-center text-sm"
                        min="0"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, (localItem.quantity || 1) + 1)}
                        className="h-9 w-9 p-0 shrink-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">€</span>
                      <Input
                        type="number"
                        value={localItem.unit_price || ''}
                        onChange={(e) => handleLocalInputChange(item.id, 'unit_price', Number(e.target.value) || 0)}
                        onBlur={() => handleInputBlur(item.id)}
                        placeholder="0.00"
                        className="h-9 text-sm pl-7"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="relative">
                      <Input
                        type="number"
                        value={localItem.vat_rate || ''}
                        onChange={(e) => handleLocalInputChange(item.id, 'vat_rate', Number(e.target.value) || 0)}
                        onBlur={() => handleInputBlur(item.id)}
                        placeholder="21"
                        className="h-9 text-sm pr-7"
                        min="0"
                        max="100"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
                    </div>
                  </div>
                  <div className="col-span-1 text-right text-sm font-medium">
                    €{(localItem.total || 0).toFixed(2)}
                  </div>
                </>
              ) : (
                <div className="col-span-11">
                  <div className="flex gap-2 items-center">
                    <Textarea
                      value={localItem.description}
                      onChange={(e) => handleLocalInputChange(item.id, 'description', e.target.value)}
                      onBlur={() => handleInputBlur(item.id)}
                      placeholder="Tekstblok inhoud..."
                      className="flex-1 min-h-[60px] text-sm"
                    />
                  </div>
                </div>
              )}
              
              <div className="col-span-1 text-right">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteItem(item.id)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
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

        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowProductForm(true)}
            className="text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            + Product
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowTextForm(true)}
            className="text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            + Tekst
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
