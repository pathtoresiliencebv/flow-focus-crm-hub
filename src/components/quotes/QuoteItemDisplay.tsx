
import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { QuoteItem } from '@/types/quote';

interface QuoteItemDisplayProps {
  item: QuoteItem;
  onDelete: () => void;
}

export const QuoteItemDisplay: React.FC<QuoteItemDisplayProps> = ({ item, onDelete }) => {
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
    <div className={`p-4 border rounded-lg ${item.type === 'product' ? 'bg-background border-border' : 'bg-muted/30 border-muted-foreground/20'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          {item.type === 'product' ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
              <div className="col-span-1">
                <span className="font-semibold text-foreground">{item.description}</span>
              </div>
              <div className="text-center">
                <span className="text-muted-foreground">
                  {item.quantity} × €{item.unit_price?.toFixed(2)}
                </span>
              </div>
              <div className="text-center">
                <span className="text-muted-foreground">{item.vat_rate}% BTW</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-primary">€{item.total?.toFixed(2)}</span>
              </div>
            </div>
          ) : (
            <div className="py-2">
              <div className="text-sm text-muted-foreground italic mb-1">Tekstblok:</div>
              <div 
                className="text-foreground leading-relaxed whitespace-pre-line border-l-4 border-primary/30 pl-4" 
                style={getItemStyle(item)}
              >
                {item.description}
              </div>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="text-destructive hover:text-destructive/80"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
