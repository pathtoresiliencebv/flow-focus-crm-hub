import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, GripVertical, Edit3, Plus, Save, X } from 'lucide-react';
import { QuoteItemForm } from './QuoteItemForm';
import { QuoteItem, QuoteBlock } from '@/types/quote';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AIEnhanceButton } from '@/components/ui/ai-enhance-button';
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
  
  // Form visibility state
  const [showProductForm, setShowProductForm] = useState(false);
  const [showTextForm, setShowTextForm] = useState(false);
  
  // Text block state
  const [textBlockContent, setTextBlockContent] = useState('');
  const [textFormatting, setTextFormatting] = useState({
    bold: false,
    italic: false,
    underline: false
  });
  const [blockContent, setBlockContent] = useState(block.content || '');

  // Local state for input fields to prevent re-rendering
  const [localItemStates, setLocalItemStates] = useState<{[key: string]: QuoteItem}>({});

  // Initialize local states when block changes
  useEffect(() => {
    const newLocalStates: {[key: string]: QuoteItem} = {};
    block.items.forEach(item => {
      newLocalStates[item.id] = { ...item };
    });
    setLocalItemStates(newLocalStates);
  }, [block.id]); // Only sync when block ID changes, not on every block update

  // Synchronize blockContent with block.content prop
  useEffect(() => {
    setBlockContent(block.content || '');
  }, [block.content]);

  const toggleTextFormatting = useCallback((type: 'bold' | 'italic' | 'underline') => {
    setTextFormatting(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  }, []);

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

  const calculateBlockSubtotal = useCallback((items: QuoteItem[]): number => {
    const subtotal = items.reduce((sum, item) => {
      if (item.type === 'product') {
        return sum + (item.total || 0);
      }
      return sum;
    }, 0);
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
    return vat;
  }, []);

  const handleAddItem = useCallback((newItem: Omit<QuoteItem, 'id'>) => {
    const item: QuoteItem = {
      ...newItem,
      id: crypto.randomUUID()
    };

    const updatedItems = [...block.items, item];
    const subtotal = calculateBlockSubtotal(updatedItems);
    const vatAmount = calculateBlockVAT(updatedItems);

    const updatedBlock: QuoteBlock = {
      ...block,
      items: updatedItems,
      subtotal,
      vat_amount: vatAmount
    };

    onUpdateBlock(updatedBlock);
    setShowProductForm(false);
  }, [block, calculateBlockSubtotal, calculateBlockVAT, onUpdateBlock]);

  const handleDeleteItem = useCallback((index: number) => {
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

  const handleContentChange = useCallback((content: string) => {
    setBlockContent(content);
  }, []);

  const handleContentBlur = useCallback(() => {
    const updatedBlock: QuoteBlock = {
      ...block,
      content: blockContent
    };
    onUpdateBlock(updatedBlock);
  }, [block, blockContent, onUpdateBlock]);

  // Handle local input changes (onChange)
  const handleLocalInputChange = useCallback((itemId: string, field: keyof QuoteItem, value: any) => {
    setLocalItemStates(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
        ...(field === 'quantity' || field === 'unit_price' ? {
          total: (field === 'quantity' ? value : prev[itemId]?.quantity || 0) * 
                 (field === 'unit_price' ? value : prev[itemId]?.unit_price || 0)
        } : {})
      }
    }));
  }, []);

  // Handle blur events - update parent only on blur
  const handleInputBlur = useCallback((itemId: string) => {
    const localItem = localItemStates[itemId];
    if (!localItem) return;

    const itemIndex = block.items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return;

    const updatedItems = [...block.items];
    updatedItems[itemIndex] = localItem;

    const subtotal = calculateBlockSubtotal(updatedItems);
    const vatAmount = calculateBlockVAT(updatedItems);

    const updatedBlock: QuoteBlock = {
      ...block,
      items: updatedItems,
      subtotal,
      vat_amount: vatAmount
    };

    onUpdateBlock(updatedBlock);
  }, [localItemStates, block, calculateBlockSubtotal, calculateBlockVAT, onUpdateBlock]);

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
        <div className="relative">
          <Textarea
            value={blockContent}
            onChange={(e) => handleContentChange(e.target.value)}
            onBlur={handleContentBlur}
            placeholder="Voer uw tekst in..."
            className="min-h-[60px] text-sm border-dashed pr-12"
          />
          <div className="absolute top-2 right-2">
            <AIEnhanceButton
              text={blockContent}
              onEnhanced={(enhanced) => {
                setBlockContent(enhanced);
                handleContentBlur();
              }}
              context="textblock"
            />
          </div>
        </div>
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
        {/* Items List - Compact Grid Layout */}
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
                    <Input
                      type="number"
                      value={localItem.quantity || ''}
                      onChange={(e) => handleLocalInputChange(item.id, 'quantity', Number(e.target.value) || 0)}
                      onBlur={() => handleInputBlur(item.id)}
                      placeholder="Aantal"
                      className="h-9 text-sm"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      value={localItem.unit_price || ''}
                      onChange={(e) => handleLocalInputChange(item.id, 'unit_price', Number(e.target.value) || 0)}
                      onBlur={() => handleInputBlur(item.id)}
                      placeholder="Prijs"
                      className="h-9 text-sm"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="col-span-1">
                    <Select
                      value={localItem.vat_rate?.toString() || '21'}
                      onValueChange={(value) => {
                        handleLocalInputChange(item.id, 'vat_rate', Number(value));
                        // Trigger immediate blur for VAT rate changes
                        setTimeout(() => handleInputBlur(item.id), 0);
                      }}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0%</SelectItem>
                        <SelectItem value="9">9%</SelectItem>
                        <SelectItem value="21">21%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-1 text-right">
                    <span className="text-sm font-medium">€{(localItem.total || 0).toFixed(2)}</span>
                  </div>
                  <div className="col-span-1 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteItem(index)}
                      className="text-destructive hover:text-destructive h-6 w-6 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="col-span-10">
                    <div className="space-y-2">
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant={item.formatting?.bold ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            const updatedItems = [...block.items];
                            updatedItems[index] = {
                              ...item,
                              formatting: {
                                ...item.formatting,
                                bold: !item.formatting?.bold
                              }
                            };
                            onUpdateBlock({ ...block, items: updatedItems });
                          }}
                          className="h-7 w-7 p-0"
                        >
                          <strong>B</strong>
                        </Button>
                        <Button
                          type="button"
                          variant={item.formatting?.italic ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            const updatedItems = [...block.items];
                            updatedItems[index] = {
                              ...item,
                              formatting: {
                                ...item.formatting,
                                italic: !item.formatting?.italic
                              }
                            };
                            onUpdateBlock({ ...block, items: updatedItems });
                          }}
                          className="italic h-7 w-7 p-0"
                        >
                          I
                        </Button>
                        <Button
                          type="button"
                          variant={item.formatting?.underline ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            const updatedItems = [...block.items];
                            updatedItems[index] = {
                              ...item,
                              formatting: {
                                ...item.formatting,
                                underline: !item.formatting?.underline
                              }
                            };
                            onUpdateBlock({ ...block, items: updatedItems });
                          }}
                          className="underline h-7 w-7 p-0"
                        >
                          U
                        </Button>
                      </div>
                      <div className="relative">
                        <Textarea
                          value={localItem.description}
                          onChange={(e) => handleLocalInputChange(item.id, 'description', e.target.value)}
                          onBlur={() => handleInputBlur(item.id)}
                          placeholder="Tekst invoeren..."
                          className="min-h-[60px] text-sm pr-12"
                        />
                        <div className="absolute top-2 right-2">
                          <AIEnhanceButton
                            text={localItem.description}
                            onEnhanced={(enhanced) => {
                              handleLocalInputChange(item.id, 'description', enhanced);
                              handleInputBlur(item.id);
                            }}
                            context="textblock"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-1"></div>
                  <div className="col-span-1 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteItem(index)}
                      className="text-destructive hover:text-destructive h-6 w-6 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          );
        })}

        {/* Add item forms */}
        {showProductForm && (
          <div className="p-4 border rounded-lg bg-muted/50">
            <QuoteItemForm onAddItem={handleAddItem} />
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={() => setShowProductForm(false)} variant="outline">
                Annuleren
              </Button>
            </div>
          </div>
        )}

        {showTextForm && (
          <div className="p-4 border rounded-lg bg-muted/50 space-y-3">
            <div className="flex gap-1 mb-2">
              <Button
                type="button"
                variant={textFormatting.bold ? "default" : "outline"}
                size="sm"
                onClick={() => toggleTextFormatting('bold')}
                className="h-7 w-7 p-0"
              >
                <strong>B</strong>
              </Button>
              <Button
                type="button"
                variant={textFormatting.italic ? "default" : "outline"}
                size="sm"
                onClick={() => toggleTextFormatting('italic')}
                className="italic h-7 w-7 p-0"
              >
                I
              </Button>
              <Button
                type="button"
                variant={textFormatting.underline ? "default" : "outline"}
                size="sm"
                onClick={() => toggleTextFormatting('underline')}
                className="underline h-7 w-7 p-0"
              >
                U
              </Button>
            </div>
            <Textarea
              value={textBlockContent}
              onChange={(e) => setTextBlockContent(e.target.value)}
              placeholder="Voer tekst in..."
              className="min-h-[80px]"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddTextBlock}>
                Tekst toevoegen
              </Button>
              <Button size="sm" onClick={() => setShowTextForm(false)} variant="outline">
                Annuleren
              </Button>
            </div>
          </div>
        )}

        {/* Block totals (only for product blocks) */}
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
            Product
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowTextForm(true)}
            className="text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Tekst
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};