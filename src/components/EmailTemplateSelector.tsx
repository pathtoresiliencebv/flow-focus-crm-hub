import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  FileText, 
  Sparkles, 
  Plus, 
  Trash2, 
  Crown,
  Loader2,
  Clock
} from 'lucide-react';
import { useEmailTemplates, EmailTemplate } from '@/hooks/useEmailTemplates';
import { cn } from '@/lib/utils';

interface EmailTemplateSelectorProps {
  onTemplateSelect: (template: { subject: string; body: string }) => void;
  disabled?: boolean;
}

export const EmailTemplateSelector: React.FC<EmailTemplateSelectorProps> = ({
  onTemplateSelect,
  disabled = false
}) => {
  const { 
    templates, 
    isLoading, 
    createTemplate, 
    deleteTemplate, 
    generateWithAI,
    useTemplate,
    getTemplatesByCategory,
    isCreating,
    isGenerating
  } = useEmailTemplates();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [aiPrompt, setAiPrompt] = useState('');
  
  // New template form state
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    subject: '',
    body_text: '',
    category: 'general',
  });

  const categories = [
    { value: 'all', label: 'Alle templates' },
    { value: 'general', label: 'Algemeen' },
    { value: 'quotes', label: 'Offertes' },
    { value: 'invoices', label: 'Facturen' },
    { value: 'projects', label: 'Projecten' },
    { value: 'customer_service', label: 'Klantenservice' },
  ];

  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : getTemplatesByCategory(selectedCategory);

  const handleTemplateClick = async (template: EmailTemplate) => {
    const templateData = await useTemplate(template);
    onTemplateSelect(templateData);
  };

  const handleCreateTemplate = async () => {
    try {
      await createTemplate({
        ...newTemplate,
        body_html: newTemplate.body_text.replace(/\n/g, '<br>'),
      });
      
      setNewTemplate({
        name: '',
        subject: '',
        body_text: '',
        category: 'general',
      });
      setShowCreateDialog(false);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return;
    
    try {
      const result = await generateWithAI(aiPrompt);
      
      if (result?.template) {
        // Auto-fill the create form with AI generated content
        setNewTemplate({
          name: result.template.name || `AI Template - ${new Date().toLocaleDateString()}`,
          subject: result.template.subject || '',
          body_text: result.template.body_text || '',
          category: 'general',
        });
        
        setShowAIDialog(false);
        setShowCreateDialog(true);
        setAiPrompt('');
      }
    } catch (error) {
      // Error handled in hook
    }
  };

  const getTemplateIcon = (template: EmailTemplate) => {
    if (template.is_system_template) {
      return <Crown className="h-3 w-3 text-yellow-600" />;
    }
    if (template.template_type === 'ai_generated') {
      return <Sparkles className="h-3 w-3 text-purple-600" />;
    }
    return <FileText className="h-3 w-3 text-blue-600" />;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Email Templates</Label>
        
        <div className="flex gap-1">
          {/* AI Generate Button */}
          <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                disabled={disabled || isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Template genereren met AI</DialogTitle>
                <DialogDescription>
                  Beschrijf het type email dat je wilt en AI maakt een template voor je.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="ai-prompt">Beschrijf je email template</Label>
                  <Textarea
                    id="ai-prompt"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Bijvoorbeeld: Een professionele email voor het versturen van offertes aan klanten"
                    rows={4}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAIDialog(false)}>
                  Annuleren
                </Button>
                <Button 
                  onClick={handleAIGenerate}
                  disabled={!aiPrompt.trim() || isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Genereren...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Genereren
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Create Template Button */}
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                disabled={disabled}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nieuwe Template Aanmaken</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="template-name">Template naam</Label>
                    <Input
                      id="template-name"
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                      placeholder="Mijn template"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="template-category">Categorie</Label>
                    <Select 
                      value={newTemplate.category}
                      onValueChange={(value) => setNewTemplate({...newTemplate, category: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.slice(1).map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="template-subject">Onderwerp</Label>
                  <Input
                    id="template-subject"
                    value={newTemplate.subject}
                    onChange={(e) => setNewTemplate({...newTemplate, subject: e.target.value})}
                    placeholder="Email onderwerp..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="template-body">Bericht inhoud</Label>
                  <Textarea
                    id="template-body"
                    value={newTemplate.body_text}
                    onChange={(e) => setNewTemplate({...newTemplate, body_text: e.target.value})}
                    placeholder="Email inhoud... (gebruik [Variabelen] voor dynamische content)"
                    rows={8}
                  />
                </div>
                
                <div className="text-xs text-muted-foreground">
                  <strong>Tip:</strong> Gebruik variabelen zoals [Naam], [Bedrijf], [Datum] voor dynamische content.
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Annuleren
                </Button>
                <Button 
                  onClick={handleCreateTemplate}
                  disabled={!newTemplate.name || !newTemplate.subject || isCreating}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Aanmaken...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Template Aanmaken
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full justify-start"
            disabled={disabled || isLoading}
          >
            <FileText className="h-4 w-4 mr-2" />
            {isLoading ? 'Templates laden...' : 'Selecteer template'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-3 border-b">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <ScrollArea className="h-60">
            <div className="p-2 space-y-1">
              {filteredTemplates.length === 0 ? (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  Geen templates beschikbaar
                </div>
              ) : (
                filteredTemplates.map((template) => (
                  <Card 
                    key={template.id} 
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => handleTemplateClick(template)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2 flex-1">
                          {getTemplateIcon(template)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-medium truncate">
                                {template.name}
                              </h4>
                              {template.is_system_template && (
                                <Badge variant="secondary" className="text-xs">
                                  Systeem
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {template.subject}
                            </p>
                            {template.usage_count > 0 && (
                              <div className="flex items-center gap-1 mt-1">
                                <Clock className="h-3 w-3" />
                                <span className="text-xs text-muted-foreground">
                                  {template.usage_count}x gebruikt
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {!template.is_system_template && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteTemplate(template.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
};