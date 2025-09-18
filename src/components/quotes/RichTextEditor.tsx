import React, { useState, useCallback, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Bold, Italic, Underline, Palette } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string, formatting?: any) => void;
  placeholder?: string;
  formatting?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    color?: string;
  };
  onFormattingChange?: (formatting: any) => void;
  onBlur?: () => void;
}

const colorOptions = [
  '#000000', '#374151', '#6B7280', '#EF4444', '#F59E0B',
  '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#F97316'
];

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder,
  formatting = {},
  onFormattingChange,
  onBlur
}) => {
  const [localValue, setLocalValue] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const toggleFormatting = useCallback((type: 'bold' | 'italic' | 'underline') => {
    const newFormatting = {
      ...formatting,
      [type]: !formatting[type]
    };
    onFormattingChange?.(newFormatting);
  }, [formatting, onFormattingChange]);

  const handleColorChange = useCallback((color: string) => {
    const newFormatting = {
      ...formatting,
      color
    };
    onFormattingChange?.(newFormatting);
  }, [formatting, onFormattingChange]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    // Don't trigger onChange immediately, wait for blur
  }, []);

  const handleBlur = useCallback(() => {
    // Only save when user leaves the field
    if (localValue !== value) {
      onChange(localValue, formatting);
    }
    onBlur?.();
  }, [localValue, value, formatting, onChange, onBlur]);

  const getTextStyle = useCallback(() => {
    let style: React.CSSProperties = {};
    if (formatting.bold) style.fontWeight = 'bold';
    if (formatting.italic) style.fontStyle = 'italic';
    if (formatting.underline) style.textDecoration = 'underline';
    if (formatting.color) style.color = formatting.color;
    return style;
  }, [formatting]);

  // Sync with external value changes
  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <div className="space-y-2">
      <div className="flex gap-2 p-2 border rounded-t-md bg-muted/50">
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
        
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Palette className="h-4 w-4" />
              <div 
                className="w-4 h-4 rounded border" 
                style={{ backgroundColor: formatting.color || '#000000' }}
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
            <div className="grid grid-cols-5 gap-1">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  className="w-6 h-6 rounded border-2 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorChange(color)}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
      
      <Textarea
        ref={textareaRef}
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        style={getTextStyle()}
        className="rounded-t-none min-h-[100px]"
      />
    </div>
  );
};