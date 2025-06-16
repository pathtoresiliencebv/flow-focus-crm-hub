
import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Bold, Italic, Underline } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string, formatting?: any) => void;
  placeholder?: string;
  formatting?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
  };
  onFormattingChange?: (formatting: any) => void;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder,
  formatting = {},
  onFormattingChange
}) => {
  const toggleFormatting = (type: 'bold' | 'italic' | 'underline') => {
    const newFormatting = {
      ...formatting,
      [type]: !formatting[type]
    };
    onFormattingChange?.(newFormatting);
  };

  const getTextStyle = () => {
    let style: React.CSSProperties = {};
    if (formatting.bold) style.fontWeight = 'bold';
    if (formatting.italic) style.fontStyle = 'italic';
    if (formatting.underline) style.textDecoration = 'underline';
    return style;
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2 p-2 border rounded-t-md bg-gray-50">
        <Button
          type="button"
          variant={formatting.bold ? "default" : "outline"}
          size="sm"
          onClick={() => toggleFormatting('bold')}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={formatting.italic ? "default" : "outline"}
          size="sm"
          onClick={() => toggleFormatting('italic')}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={formatting.underline ? "default" : "outline"}
          size="sm"
          onClick={() => toggleFormatting('underline')}
        >
          <Underline className="h-4 w-4" />
        </Button>
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value, formatting)}
        placeholder={placeholder}
        style={getTextStyle()}
        className="rounded-t-none"
        rows={4}
      />
    </div>
  );
};
