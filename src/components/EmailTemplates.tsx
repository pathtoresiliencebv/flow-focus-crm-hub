
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { FileText, Plus, Edit, Trash2, Sparkles } from "lucide-react";

interface EmailTemplatesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmailTemplates({ open, onOpenChange }: EmailTemplatesProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Fetch email templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['email-templates', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && open
  });

  // Save template mutation
  const saveTemplateMutation = useMutation({
    mutationFn: async (templateData: any) => {
      if (templateData.id) {
        // Update existing template
        const { error } = await supabase
          .from('email_templates')
          .update(templateData)
          .eq('id', templateData.id)
          .eq('user_id', user?.id);
        
        if (error) throw error;
      } else {
        // Create new template
        const { error } = await supabase
          .from('email_templates')
          .insert({
            ...templateData,
            user_id: user?.id
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      setEditingTemplate(null);
      toast({
        title: "Template opgeslagen",
        description: "Uw e-mail template is succesvol opgeslagen."
      });
    },
    onError: () => {
      toast({
        title: "Fout bij opslaan",
        description: "Er is een fout opgetreden bij het opslaan van de template.",
        variant: "destructive"
      });
    }
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', templateId)
        .eq('user_id', user?.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast({
        title: "Template verwijderd",
        description: "De e-mail template is succesvol verwijderd."
      });
    }
  });

  // Generate AI template
  const generateAITemplate = async (prompt: string) => {
    setIsGeneratingAI(true);
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer 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',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-chat-v3-0324:free',
          messages: [
            {
              role: 'system',
              content: 'Je bent een professionele e-mail assistent. Schrijf professionele e-mail templates in het Nederlands. Geef alleen de e-mail inhoud terug zonder extra uitleg.'
            },
            {
              role: 'user',
              content: `Schrijf een e-mail template voor: ${prompt}`
            }
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      });

      if (!response.ok) throw new Error('AI response failed');

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (content) {
        // Update form fields
        const subjectField = document.querySelector('input[name="subject"]') as HTMLInputElement;
        const bodyField = document.querySelector('textarea[name="body_html"]') as HTMLTextAreaElement;
        
        if (bodyField) bodyField.value = content;
        if (subjectField && !subjectField.value) {
          // Try to extract subject from content
          const lines = content.split('\n');
          const subjectLine = lines.find(line => line.toLowerCase().includes('onderwerp:'));
          if (subjectLine) {
            subjectField.value = subjectLine.replace(/onderwerp:\s*/i, '').trim();
          }
        }
      }
    } catch (error) {
      toast({
        title: "AI Fout",
        description: "Er is een fout opgetreden bij het genereren van de AI template.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const templateData = {
      id: editingTemplate?.id,
      name: formData.get('name') as string,
      subject: formData.get('subject') as string,
      body_html: formData.get('body_html') as string,
      body_text: (formData.get('body_html') as string).replace(/<[^>]*>/g, ''),
      category: formData.get('category') as string,
      is_active: true
    };

    saveTemplateMutation.mutate(templateData);
  };

  const categories = [
    { value: 'general', label: 'Algemeen' },
    { value: 'sales', label: 'Verkoop' },
    { value: 'support', label: 'Ondersteuning' },
    { value: 'followup', label: 'Opvolging' },
    { value: 'meeting', label: 'Vergaderingen' },
    { value: 'quote', label: 'Offertes' },
    { value: 'invoice', label: 'Facturen' }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            E-mail Templates
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Templates List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Uw Templates</h3>
              <Button
                onClick={() => setEditingTemplate({})}
                size="sm"
                className="bg-smans-primary hover:bg-smans-primary/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nieuwe Template
              </Button>
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Laden...</p>
              </div>
            ) : templates.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 mb-4">Geen templates gevonden</p>
                  <Button
                    onClick={() => setEditingTemplate({})}
                    className="bg-smans-primary hover:bg-smans-primary/90"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Eerste Template Maken
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {templates.map((template) => (
                  <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          <p className="text-sm text-gray-600 mt-1">{template.subject}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {categories.find(c => c.value === template.category)?.label}
                            </Badge>
                            {template.is_active && (
                              <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                                Actief
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingTemplate(template)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteTemplateMutation.mutate(template.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Template Editor */}
          <div className="space-y-4">
            {editingTemplate ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {editingTemplate.id ? 'Template Bewerken' : 'Nieuwe Template'}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateAITemplate("een professionele bedanke-mail")}
                      disabled={isGeneratingAI}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      {isGeneratingAI ? 'AI genereert...' : 'AI Hulp'}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Template Naam</Label>
                      <Input
                        id="name"
                        name="name"
                        defaultValue={editingTemplate.name}
                        placeholder="Bijv. Bedank e-mail"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="category">Categorie</Label>
                      <Select name="category" defaultValue={editingTemplate.category || 'general'}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="subject">Onderwerp</Label>
                      <Input
                        id="subject"
                        name="subject"
                        defaultValue={editingTemplate.subject}
                        placeholder="E-mail onderwerp"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="body_html">E-mail Inhoud</Label>
                      <Textarea
                        id="body_html"
                        name="body_html"
                        rows={10}
                        defaultValue={editingTemplate.body_html}
                        placeholder="Typ de e-mail inhoud hier..."
                        className="resize-none"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Tip: Gebruik variabelen zoals [NAAM] en [BEDRIJF] voor personalisatie
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="submit"
                        disabled={saveTemplateMutation.isPending}
                        className="bg-smans-primary hover:bg-smans-primary/90"
                      >
                        {saveTemplateMutation.isPending ? 'Opslaan...' : 'Opslaan'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditingTemplate(null)}
                      >
                        Annuleren
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 mb-4">Selecteer een template om te bewerken</p>
                  <p className="text-sm text-gray-500">
                    Of maak een nieuwe template aan om te beginnen
                  </p>
                </CardContent>
              </Card>
            )}

            {/* AI Suggestions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  AI Template Suggesties
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    "Bedank e-mail na meeting",
                    "Opvolging na offerte",
                    "Welkom nieuwe klant",
                    "Factuur herinnering",
                    "Uitnodiging vergadering",
                    "Follow-up na project"
                  ].map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingTemplate({});
                        setTimeout(() => generateAITemplate(suggestion), 100);
                      }}
                      disabled={isGeneratingAI}
                      className="justify-start text-left h-auto p-2"
                    >
                      <Sparkles className="h-3 w-3 mr-2 flex-shrink-0" />
                      <span className="text-xs">{suggestion}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
