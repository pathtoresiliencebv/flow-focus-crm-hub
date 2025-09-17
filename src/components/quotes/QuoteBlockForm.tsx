
import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, GripVertical, Edit3, Plus } from 'lucide-react';
import { QuoteItemForm } from './QuoteItemForm';
import { QuoteItemDisplay } from './QuoteItemDisplay';
import { QuoteItem, QuoteBlock } from '@/types/quote';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AIEnhanceButton } from '@/components/ui/ai-enhance-button';
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

  const handleContentChange = useCallback((content: string) => {
    setBlockContent(content);
    const updatedBlock: QuoteBlock = {
      ...block,
      content
    };
    onUpdateBlock(updatedBlock);
  }, [block, onUpdateBlock]);

  // Debug effect to monitor block changes
  useEffect(() => {
    console.log('QuoteBlockForm: Block updated:', block);
  }, [block]);

  // Conditional rendering: completely different UI for text blocks vs product blocks
  if (block.type === 'textblock') {
    return (
      <div className="w-full">
        <div {...dragHandleProps} className="flex items-center gap-2 mb-2">
          <GripVertical className="h-4 w-4 text-gray-400 cursor-grab hover:text-gray-600 transition-colors" />
          <span className="text-xs text-muted-foreground">Tekstblok</span>
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDeleteBlock}
              className="text-red-600 hover:text-red-700 h-6 w-6 p-0 ml-auto"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
        <div className="relative">
          <Textarea
            value={blockContent}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Voer uw tekst in..."
            className="min-h-[60px] text-sm border-dashed pr-12"
          />
          <div className="absolute top-2 right-2">
            <AIEnhanceButton
              text={blockContent}
              onEnhanced={(enhanced) => handleContentChange(enhanced)}
              context="textblock"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            <div {...dragHandleProps}>
              <GripVertical className="h-4 w-4 text-gray-400 cursor-grab hover:text-gray-600 transition-colors" />
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
                  Opslaan
                </Button>
                <Button size="sm" variant="outline" onClick={handleTitleCancel}>
                  Annuleren
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-1 cursor-pointer group" onClick={() => setIsEditingTitle(true)}>
                <CardTitle className="text-base font-bold group-hover:text-primary transition-colors">{block.title}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-50 group-hover:opacity-100 transition-opacity"
                >
                  <Edit3 className="h-3 w-3" />
                </Button>
                <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  Klik om te bewerken
                </span>
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
                className="text-red-600 hover:text-red-700 h-7 w-7 p-0"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Items List */}
        {block.items.length > 0 && (
          <div className="space-y-2">
            <h5 className="font-medium text-gray-700 text-sm">Items in dit blok:</h5>
            {block.items.map((item, index) => (
              <QuoteItemDisplay
                key={item.id || `item-${index}`}
                item={item}
                onDelete={() => handleDeleteItem(index)}
              />
            ))}
          </div>
        )}

        {/* Add Item Options */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowProductForm(!showProductForm);
              }}
              className="flex-1 h-8 text-sm"
            >
              <Plus className="h-3 w-3 mr-2" />
              Product/Dienst toevoegen
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowTextForm(!showTextForm);
              }}
              className="flex-1 h-8 text-sm"
            >
              <Plus className="h-3 w-3 mr-2" />
              Tekstblok toevoegen
            </Button>
          </div>

          {/* Product Form */}
          {showProductForm && (
            <QuoteItemForm onAddItem={handleAddItem} />
          )}

          {/* Quick Text Block Form */}
          {showTextForm && (
            <div 
              className="space-y-3 p-3 border rounded-lg bg-green-50"
              onClick={(e) => e.stopPropagation()}
            >
              <h4 className="font-medium text-gray-900 text-sm">Tekstblok toevoegen</h4>
              <div className="space-y-2">
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant={textFormatting.bold ? "default" : "outline"}
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleTextFormatting('bold');
                    }}
                    className="h-7 w-7 p-0"
                  >
                    <strong>B</strong>
                  </Button>
                  <Button
                    type="button"
                    variant={textFormatting.italic ? "default" : "outline"}
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleTextFormatting('italic');
                    }}
                    className="italic h-7 w-7 p-0"
                  >
                    I
                  </Button>
                  <Button
                    type="button"
                    variant={textFormatting.underline ? "default" : "outline"}
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleTextFormatting('underline');
                    }}
                    className="underline h-7 w-7 p-0"
                  >
                    U
                  </Button>
                </div>
                <Textarea
                  value={textBlockContent}
                  onChange={(e) => setTextBlockContent(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Voer tekst in..."
                  className="min-h-[80px] text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleAddTextBlock();
                    }}
                    className="flex-1 h-8 text-sm"
                  >
                    <Plus className="h-3 w-3 mr-2" />
                    Tekstblok toevoegen
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowTextForm(false);
                      setTextBlockContent('');
                      setTextFormatting({ bold: false, italic: false, underline: false });
                    }}
                    className="h-8 text-sm"
                  >
                    Annuleren
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Block Totals */}
        {block.items.some(item => item.type === 'product') && (
          <>
            <Separator />
            <div className="flex justify-end">
              <div className="w-64 space-y-1 text-sm">
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
