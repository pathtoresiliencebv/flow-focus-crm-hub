import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Crown, 
  Sparkles,
  Clock,
  Loader2
} from 'lucide-react';
import { useEmailTemplates, EmailTemplate } from '@/hooks/useEmailTemplates';
import { cn } from '@/lib/utils';

export const EmailTemplateManager: React.FC = () => {
  const { 
    templates, 
    isLoading, 
    createTemplate, 
    deleteTemplate, 
    generateWithAI,
    isCreating,
    isGenerating
  } = useEmailTemplates();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
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
    : templates.filter(t => t.category === selectedCategory);

  const resetForm = () => {
    setFormData({
      name: '',
      subject: '',
      body_text: '',
      category: 'general',
    });
    setEditingTemplate(null);
  };

  const handleCreateTemplate = async () => {
    try {
      await createTemplate({
        ...formData,
        body_html: formData.body_text.replace(/\n/g, '<br>'),
      });
      
      resetForm();
      setShowCreateDialog(false);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setFormData({
      name: template.name,
      subject: template.subject,
      body_text: template.body_text,
      category: template.category,
    });
    setEditingTemplate(template);
    setShowCreateDialog(true);
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return;
    
    try {
      const result = await generateWithAI(aiPrompt);
      
      if (result?.template) {
        setFormData({
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
      return <Crown className="h-4 w-4 text-yellow-600" />;
    }
    if (template.template_type === 'ai_generated') {
      return <Sparkles className="h-4 w-4 text-purple-600" />;
    }
    return <FileText className="h-4 w-4 text-blue-600" />;
  };

  const getTemplateStats = () => {
    const total = templates.length;
    const system = templates.filter(t => t.is_system_template).length;
    const custom = templates.filter(t => !t.is_system_template).length;
    const aiGenerated = templates.filter(t => t.template_type === 'ai_generated').length;
    
    return { total, system, custom, aiGenerated };
  };

  const stats = getTemplateStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Email Templates</h2>
          <p className="text-muted-foreground">
            Beheer en maak email templates voor verschillende doeleinden
          </p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
            <DialogTrigger asChild>
              <Button disabled={isGenerating}>
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                AI Template
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

          <Dialog open={showCreateDialog} onOpenChange={(open) => {
            setShowCreateDialog(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nieuwe Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingTemplate ? 'Template Bewerken' : 'Nieuwe Template Aanmaken'}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="template-name">Template naam</Label>
                    <Input
                      id="template-name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Mijn template"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="template-category">Categorie</Label>
                    <Select 
                      value={formData.category}
                      onValueChange={(value) => setFormData({...formData, category: value})}
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
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    placeholder="Email onderwerp..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="template-body">Bericht inhoud</Label>
                  <Textarea
                    id="template-body"
                    value={formData.body_text}
                    onChange={(e) => setFormData({...formData, body_text: e.target.value})}
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
                  disabled={!formData.name || !formData.subject || isCreating}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {editingTemplate ? 'Bijwerken...' : 'Aanmaken...'}
                    </>
                  ) : (
                    <>
                      {editingTemplate ? (
                        <>
                          <Edit className="h-4 w-4 mr-2" />
                          Template Bijwerken
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Template Aanmaken
                        </>
                      )}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Totaal</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Crown className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
            <div className="text-2xl font-bold">{stats.system}</div>
            <div className="text-sm text-muted-foreground">Systeem</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Edit className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold">{stats.custom}</div>
            <div className="text-sm text-muted-foreground">Custom</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Sparkles className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <div className="text-2xl font-bold">{stats.aiGenerated}</div>
            <div className="text-sm text-muted-foreground">AI Generated</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Label>Filter op categorie:</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
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
        </CardContent>
      </Card>

      {/* Templates List */}
      <Card>
        <CardHeader>
          <CardTitle>Templates ({filteredTemplates.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">Templates laden...</p>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Geen templates gevonden</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTemplates.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {getTemplateIcon(template)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{template.name}</h3>
                            <Badge variant="outline" className="text-xs">
                              {categories.find(c => c.value === template.category)?.label}
                            </Badge>
                            {template.is_system_template && (
                              <Badge variant="secondary" className="text-xs">
                                Systeem
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">
                            {template.subject}
                          </p>
                          
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {template.body_text.substring(0, 150)}...
                          </p>
                          
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            {template.usage_count > 0 && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{template.usage_count}x gebruikt</span>
                              </div>
                            )}
                            <span>
                              Aangemaakt: {new Date(template.created_at).toLocaleDateString('nl-NL')}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {!template.is_system_template && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditTemplate(template)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Template verwijderen</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Weet je zeker dat je "{template.name}" wilt verwijderen? 
                                    Deze actie kan niet ongedaan gemaakt worden.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuleren</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => deleteTemplate(template.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Verwijderen
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};