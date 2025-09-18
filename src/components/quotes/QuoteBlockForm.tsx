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
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(block.title);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showTextForm, setShowTextForm] = useState(false);
  const [textBlockContent, setTextBlockContent] = useState('');
  const [textFormatting, setTextFormatting] = useState({
    bold: false,
    italic: false,
    underline: false
  });
  const [blockContent, setBlockContent] = useState(block.content || '');

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
        {block.items.map((item, index) => (
          <div key={item.id || `item-${index}`} className="grid grid-cols-12 gap-2 items-center py-2 border-b border-border/50 last:border-b-0">
            {item.type === 'product' ? (
              <>
                <div className="col-span-5">
                  <Input
                    value={item.description}
                    onChange={(e) => {
                      const updatedItems = [...block.items];
                      updatedItems[index] = { ...item, description: e.target.value };
                      const subtotal = calculateBlockSubtotal(updatedItems);
                      const vatAmount = calculateBlockVAT(updatedItems);
                      onUpdateBlock({
                        ...block,
                        items: updatedItems,
                        subtotal,
                        vat_amount: vatAmount
                      });
                    }}
                    placeholder="Beschrijving"
                    className="h-9 text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    value={item.quantity || ''}
                    onChange={(e) => {
                      const quantity = Number(e.target.value) || 0;
                      const total = quantity * (item.unit_price || 0);
                      const updatedItems = [...block.items];
                      updatedItems[index] = { ...item, quantity, total };
                      const subtotal = calculateBlockSubtotal(updatedItems);
                      const vatAmount = calculateBlockVAT(updatedItems);
                      onUpdateBlock({
                        ...block,
                        items: updatedItems,
                        subtotal,
                        vat_amount: vatAmount
                      });
                    }}
                    placeholder="Aantal"
                    className="h-9 text-sm"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    value={item.unit_price || ''}
                    onChange={(e) => {
                      const unit_price = Number(e.target.value) || 0;
                      const total = (item.quantity || 0) * unit_price;
                      const updatedItems = [...block.items];
                      updatedItems[index] = { ...item, unit_price, total };
                      const subtotal = calculateBlockSubtotal(updatedItems);
                      const vatAmount = calculateBlockVAT(updatedItems);
                      onUpdateBlock({
                        ...block,
                        items: updatedItems,
                        subtotal,
                        vat_amount: vatAmount
                      });
                    }}
                    placeholder="Prijs"
                    className="h-9 text-sm"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="col-span-1">
                  <Select
                    value={item.vat_rate?.toString() || '21'}
                    onValueChange={(value) => {
                      const vat_rate = Number(value);
                      const updatedItems = [...block.items];
                      updatedItems[index] = { ...item, vat_rate };
                      const subtotal = calculateBlockSubtotal(updatedItems);
                      const vatAmount = calculateBlockVAT(updatedItems);
                      onUpdateBlock({
                        ...block,
                        items: updatedItems,
                        subtotal,
                        vat_amount: vatAmount
                      });
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
                  <span className="text-sm font-medium">€{(item.total || 0).toFixed(2)}</span>
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
                        value={item.description}
                        onChange={(e) => {
                          const updatedItems = [...block.items];
                          updatedItems[index] = { ...item, description: e.target.value };
                          onUpdateBlock({ ...block, items: updatedItems });
                        }}
                        placeholder="Tekst invoeren..."
                        className="min-h-[60px] text-sm pr-12"
                      />
                      <div className="absolute top-2 right-2">
                        <AIEnhanceButton
                          text={item.description}
                          onEnhanced={(enhanced) => {
                            const updatedItems = [...block.items];
                            updatedItems[index] = { ...item, description: enhanced };
                            onUpdateBlock({ ...block, items: updatedItems });
                          }}
                          context="textblock"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-span-2 text-right">
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
        ))}

        {/* Add Item Buttons - Direct like Invoice */}
        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const newItem: QuoteItem = {
                id: crypto.randomUUID(),
                type: 'product',
                description: '',
                quantity: 1,
                unit_price: 0,
                vat_rate: 21,
                total: 0,
              };
              const updatedItems = [...block.items, newItem];
              const subtotal = calculateBlockSubtotal(updatedItems);
              const vatAmount = calculateBlockVAT(updatedItems);
              onUpdateBlock({
                ...block,
                items: updatedItems,
                subtotal,
                vat_amount: vatAmount
              });
            }}
            className="h-8 text-sm"
          >
            <Plus className="h-3 w-3 mr-1" />
            Product
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const newItem: QuoteItem = {
                id: crypto.randomUUID(),
                type: 'textblock',
                description: '',
                vat_rate: 0,
                formatting: { bold: false, italic: false, underline: false },
              };
              const updatedItems = [...block.items, newItem];
              onUpdateBlock({
                ...block,
                items: updatedItems,
              });
            }}
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