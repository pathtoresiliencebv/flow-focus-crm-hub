import React, { useState } from 'react';
import { Bot, ThumbsUp, ThumbsDown, Edit3, Zap, MessageSquare, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SmartReply } from '@/hooks/useSmartReplies';
import { cn } from '@/lib/utils';

interface SmartReplyPanelProps {
  visible: boolean;
  suggestions: SmartReply[];
  onSelectSuggestion: (suggestion: SmartReply) => void;
  onDismiss: () => void;
  onMarkUseful: (id: string, useful: boolean) => void;
  onCustomizeSuggestion: (id: string, newText: string) => void;
  isLoading?: boolean;
}

export const SmartReplyPanel: React.FC<SmartReplyPanelProps> = ({
  visible,
  suggestions,
  onSelectSuggestion,
  onDismiss,
  onMarkUseful,
  onCustomizeSuggestion,
  isLoading = false
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  if (!visible) return null;

  const categorizedSuggestions = {
    quick_response: suggestions.filter(s => s.type === 'quick_response'),
    action: suggestions.filter(s => s.type === 'action'),
    template: suggestions.filter(s => s.type === 'template'),
    ai_generated: suggestions.filter(s => s.type === 'ai_generated')
  };

  const getTypeIcon = (type: SmartReply['type']) => {
    switch (type) {
      case 'quick_response':
        return <Zap className="h-4 w-4" />;
      case 'action':
        return <Settings className="h-4 w-4" />;
      case 'template':
        return <MessageSquare className="h-4 w-4" />;
      case 'ai_generated':
        return <Bot className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: SmartReply['type']) => {
    switch (type) {
      case 'quick_response':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'action':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'template':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'ai_generated':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleEdit = (suggestion: SmartReply) => {
    setEditingId(suggestion.id);
    setEditText(suggestion.text);
  };

  const handleSaveEdit = () => {
    if (editingId && editText.trim()) {
      onCustomizeSuggestion(editingId, editText.trim());
      setEditingId(null);
      setEditText('');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const SuggestionCard: React.FC<{ suggestion: SmartReply }> = ({ suggestion }) => (
    <Card className="mb-3 transition-all duration-200 hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className={getTypeColor(suggestion.type)}>
                {getTypeIcon(suggestion.type)}
                <span className="ml-1 capitalize">{suggestion.type.replace('_', ' ')}</span>
              </Badge>
              <span className={cn("text-xs font-medium", getConfidenceColor(suggestion.confidence))}>
                {Math.round(suggestion.confidence * 100)}%
              </span>
            </div>

            {editingId === suggestion.id ? (
              <div className="space-y-2">
                <Textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="min-h-[60px] resize-none"
                  placeholder="Bewerk je antwoord..."
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveEdit}>
                    Opslaan
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                    Annuleren
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-700 mb-3">{suggestion.text}</p>
                
                {suggestion.action && (
                  <div className="bg-blue-50 p-2 rounded text-xs text-blue-700 mb-2">
                    <strong>Actie:</strong> {suggestion.action.type.replace('_', ' ')}
                  </div>
                )}

                {suggestion.metadata?.reasoning && (
                  <p className="text-xs text-gray-500 italic mb-3">
                    {suggestion.metadata.reasoning}
                  </p>
                )}

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => onSelectSuggestion(suggestion)}
                    className="h-8"
                  >
                    Gebruiken
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(suggestion)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit3 className="h-3 w-3" />
                  </Button>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onMarkUseful(suggestion.id, true)}
                      className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      <ThumbsUp className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onMarkUseful(suggestion.id, false)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <ThumbsDown className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-600" />
              Smart Replies
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              ×
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            AI-gegenereerde antwoordsuggesties op basis van je bericht
          </p>
        </CardHeader>

        <CardContent className="overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">AI analyseert je bericht...</span>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bot className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Geen suggesties beschikbaar voor dit bericht.</p>
            </div>
          ) : (
            <Tabs defaultValue="all" className="space-y-4">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all">
                  Alle ({suggestions.length})
                </TabsTrigger>
                <TabsTrigger value="quick" disabled={categorizedSuggestions.quick_response.length === 0}>
                  Snel ({categorizedSuggestions.quick_response.length})
                </TabsTrigger>
                <TabsTrigger value="action" disabled={categorizedSuggestions.action.length === 0}>
                  Acties ({categorizedSuggestions.action.length})
                </TabsTrigger>
                <TabsTrigger value="template" disabled={categorizedSuggestions.template.length === 0}>
                  Templates ({categorizedSuggestions.template.length})
                </TabsTrigger>
                <TabsTrigger value="ai" disabled={categorizedSuggestions.ai_generated.length === 0}>
                  AI ({categorizedSuggestions.ai_generated.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-3">
                {suggestions.map(suggestion => (
                  <SuggestionCard key={suggestion.id} suggestion={suggestion} />
                ))}
              </TabsContent>

              <TabsContent value="quick" className="space-y-3">
                {categorizedSuggestions.quick_response.map(suggestion => (
                  <SuggestionCard key={suggestion.id} suggestion={suggestion} />
                ))}
              </TabsContent>

              <TabsContent value="action" className="space-y-3">
                {categorizedSuggestions.action.map(suggestion => (
                  <SuggestionCard key={suggestion.id} suggestion={suggestion} />
                ))}
              </TabsContent>

              <TabsContent value="template" className="space-y-3">
                {categorizedSuggestions.template.map(suggestion => (
                  <SuggestionCard key={suggestion.id} suggestion={suggestion} />
                ))}
              </TabsContent>

              <TabsContent value="ai" className="space-y-3">
                {categorizedSuggestions.ai_generated.map(suggestion => (
                  <SuggestionCard key={suggestion.id} suggestion={suggestion} />
                ))}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
};