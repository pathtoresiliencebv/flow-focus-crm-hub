import React from 'react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QuoteTemplate } from '@/hooks/useQuoteTemplates';

interface TemplateSelectorProps {
  templates: QuoteTemplate[];
  onSelectTemplate: (template: QuoteTemplate) => void;
  loading?: boolean;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  templates,
  onSelectTemplate,
  loading
}) => {
  // Group templates by category
  const groupedTemplates = templates.reduce((acc, template) => {
    const category = template.category || 'general';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(template);
    return acc;
  }, {} as Record<string, QuoteTemplate[]>);

  const categoryLabels: Record<string, string> = {
    general: 'Algemeen',
    installation: 'Installatie',
    maintenance: 'Onderhoud',
    repair: 'Reparatie'
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      onSelectTemplate(template);
    }
  };

  return (
    <div className="w-full">
      <Select onValueChange={handleTemplateSelect} disabled={loading}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={loading ? "Templates laden..." : "Selecteer een template..."} />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
            <SelectGroup key={category}>
              <SelectLabel>{categoryLabels[category] || category}</SelectLabel>
              {categoryTemplates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  <div>
                    <div className="font-medium">{template.name}</div>
                    {template.description && (
                      <div className="text-sm text-muted-foreground">
                        {template.description}
                      </div>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
          {templates.length === 0 && !loading && (
            <SelectItem value="no-templates" disabled>
              Geen templates beschikbaar
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};