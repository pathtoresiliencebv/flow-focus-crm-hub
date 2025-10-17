import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Camera } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProjectReceiptUploadProps {
  projectId: string;
  onUploadComplete: () => void;
}

export const ProjectReceiptUpload: React.FC<ProjectReceiptUploadProps> = ({ 
  projectId, 
  onUploadComplete 
}) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [receiptData, setReceiptData] = useState({
    amount: '',
    description: '',
    category: 'material',
    supplier: '',
    fileData: null as string | null,
    fileName: null as string | null,
    fileType: null as string | null
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setReceiptData(prev => ({
        ...prev,
        fileData: reader.result as string,
        fileName: file.name,
        fileType: file.type
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!receiptData.fileData) {
      toast({
        title: "Fout",
        description: "Selecteer eerst een bestand",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Gebruiker niet gevonden');

      // Convert base64 to blob
      const base64Data = receiptData.fileData.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteArray = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteArray[i] = byteCharacters.charCodeAt(i);
      }

      const isPDF = receiptData.fileType?.includes('pdf');
      const contentType = isPDF ? 'application/pdf' : (receiptData.fileType || 'image/jpeg');
      const fileExtension = isPDF ? 'pdf' : (receiptData.fileType?.includes('png') ? 'png' : 'jpg');
      const blob = new Blob([byteArray], { type: contentType });

      // Upload to storage
      const fileName = `${user.id}/${Date.now()}_receipt.${fileExtension}`;
      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, blob, {
          contentType: contentType,
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName);

      // Insert receipt record linked to project
      const { error: insertError } = await supabase
        .from('project_receipts')
        .insert({
          project_id: projectId,
          user_id: user.id,
          supplier: receiptData.supplier || null,
          total_amount: receiptData.amount ? parseFloat(receiptData.amount) : null,
          description: receiptData.description || 'Bonnetje upload',
          category: receiptData.category,
          receipt_photo_url: publicUrl,
          status: 'pending'
        });

      if (insertError) throw insertError;

      toast({
        title: "✅ Bonnetje toegevoegd",
        description: "Het bonnetje is succesvol opgeslagen"
      });

      // Reset form
      setReceiptData({
        amount: '',
        description: '',
        category: 'material',
        supplier: '',
        fileData: null,
        fileName: null,
        fileType: null
      });
      
      setOpen(false);
      onUploadComplete();

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "❌ Upload fout",
        description: error.message || "Kon bonnetje niet uploaden",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button 
        onClick={() => setOpen(true)}
        className="w-full sm:w-auto"
      >
        <Upload className="h-4 w-4 mr-2" />
        Bonnetje Uploaden
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bonnetje Uploaden</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* File Upload */}
            <div>
              <Label>Bonnetje (Foto of PDF)</Label>
              <Input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileUpload}
                className="mt-1"
                required
              />
              {receiptData.fileName && (
                <p className="text-xs text-muted-foreground mt-1">
                  Geselecteerd: {receiptData.fileName}
                </p>
              )}
            </div>

            {/* Category */}
            <div>
              <Label>Categorie</Label>
              <Select
                value={receiptData.category}
                onValueChange={(value) => setReceiptData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="material">Materiaal</SelectItem>
                  <SelectItem value="fuel">Brandstof</SelectItem>
                  <SelectItem value="tools">Gereedschap</SelectItem>
                  <SelectItem value="other">Overig</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Supplier */}
            <div>
              <Label>Leverancier (Optioneel)</Label>
              <Input
                value={receiptData.supplier}
                onChange={(e) => setReceiptData(prev => ({ ...prev, supplier: e.target.value }))}
                placeholder="Bijv. Gamma, Praxis..."
                className="mt-1"
              />
            </div>

            {/* Amount */}
            <div>
              <Label>Bedrag (Optioneel)</Label>
              <Input
                type="number"
                step="0.01"
                value={receiptData.amount}
                onChange={(e) => setReceiptData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
                className="mt-1"
              />
            </div>

            {/* Description */}
            <div>
              <Label>Omschrijving (Optioneel)</Label>
              <Textarea
                value={receiptData.description}
                onChange={(e) => setReceiptData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Waar is dit bonnetje voor..."
                className="mt-1"
                rows={2}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1"
                disabled={loading}
              >
                Annuleren
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={loading || !receiptData.fileData}
              >
                {loading ? "Uploaden..." : "Opslaan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

