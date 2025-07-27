import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bold, Italic, Link, Save } from 'lucide-react';

interface SignatureData {
  signatureHtml: string;
  signatureText: string;
  autoAddSignature: boolean;
}

interface SignatureEditorProps {
  initialData?: Partial<SignatureData>;
  onSave: (data: SignatureData) => void;
  onCancel: () => void;
}

export function SignatureEditor({ initialData, onSave, onCancel }: SignatureEditorProps) {
  const [signatureText, setSignatureText] = useState(initialData?.signatureText || '');
  const [signatureHtml, setSignatureHtml] = useState(initialData?.signatureHtml || '');
  const [autoAddSignature, setAutoAddSignature] = useState(initialData?.autoAddSignature ?? true);
  const [activeTab, setActiveTab] = useState('text');

  const handleSave = () => {
    onSave({
      signatureHtml,
      signatureText,
      autoAddSignature
    });
  };

  const insertHtmlTag = (tag: string, displayName?: string) => {
    const textarea = document.getElementById('html-signature') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = signatureHtml.substring(start, end);
    
    let replacement = '';
    switch (tag) {
      case 'bold':
        replacement = `<strong>${selectedText}</strong>`;
        break;
      case 'italic':
        replacement = `<em>${selectedText}</em>`;
        break;
      case 'link':
        const url = prompt('Voer de URL in:');
        if (url) {
          replacement = `<a href="${url}">${selectedText || url}</a>`;
        }
        break;
      case 'br':
        replacement = '<br>';
        break;
    }

    if (replacement) {
      const newText = signatureHtml.substring(0, start) + replacement + signatureHtml.substring(end);
      setSignatureHtml(newText);
    }
  };

  const generateHtmlFromText = () => {
    const htmlVersion = signatureText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('<br>');
    setSignatureHtml(htmlVersion);
  };

  const defaultSignatureTemplate = `Met vriendelijke groet,

[Uw naam]
[Uw functie]
[Bedrijfsnaam]
[Telefoonnummer]
[E-mailadres]`;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>E-mail Handtekening</CardTitle>
        <div className="flex items-center space-x-2">
          <Switch
            id="auto-signature"
            checked={autoAddSignature}
            onCheckedChange={setAutoAddSignature}
          />
          <Label htmlFor="auto-signature">
            Automatisch toevoegen aan e-mails
          </Label>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="text">Tekst</TabsTrigger>
            <TabsTrigger value="html">HTML</TabsTrigger>
          </TabsList>
          
          <TabsContent value="text" className="space-y-4">
            <div>
              <Label htmlFor="text-signature">Handtekening (Platte tekst)</Label>
              <Textarea
                id="text-signature"
                value={signatureText}
                onChange={(e) => setSignatureText(e.target.value)}
                placeholder={defaultSignatureTemplate}
                rows={8}
                className="mt-2"
              />
            </div>
            <Button 
              type="button" 
              variant="outline" 
              onClick={generateHtmlFromText}
              className="w-full"
            >
              Genereer HTML versie
            </Button>
          </TabsContent>
          
          <TabsContent value="html" className="space-y-4">
            <div>
              <Label htmlFor="html-signature">Handtekening (HTML)</Label>
              <div className="flex gap-2 mt-2 mb-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => insertHtmlTag('bold')}
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => insertHtmlTag('italic')}
                >
                  <Italic className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => insertHtmlTag('link')}
                >
                  <Link className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => insertHtmlTag('br')}
                >
                  BR
                </Button>
              </div>
              <Textarea
                id="html-signature"
                value={signatureHtml}
                onChange={(e) => setSignatureHtml(e.target.value)}
                placeholder="<strong>Met vriendelijke groet,</strong><br><br>[Uw naam]<br>[Functie]"
                rows={8}
                className="font-mono text-sm"
              />
            </div>
            
            {signatureHtml && (
              <div>
                <Label>Voorbeeld:</Label>
                <Card className="p-4 mt-2 bg-muted">
                  <div 
                    dangerouslySetInnerHTML={{ __html: signatureHtml }}
                    className="text-sm"
                  />
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <div className="flex gap-2 pt-4">
          <Button onClick={handleSave} className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            Opslaan
          </Button>
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Annuleren
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}