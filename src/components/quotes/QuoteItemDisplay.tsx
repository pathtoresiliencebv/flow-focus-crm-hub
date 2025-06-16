
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
    <div className="p-3 border rounded-lg bg-gray-50">
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
              <div>
                <span className="text-gray-700 whitespace-pre-line" style={getItemStyle(item)}>
                  {item.description}
                </span>
              </div>
              <div>
                <span className="text-gray-400">-</span>
              </div>
              <div>
                <span className="text-gray-600">{item.vat_rate}% BTW</span>
              </div>
              <div>
                <span className="text-gray-400">-</span>
              </div>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
