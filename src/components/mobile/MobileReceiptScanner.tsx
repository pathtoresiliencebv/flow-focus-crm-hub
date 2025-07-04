import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Camera, Upload, Check } from 'lucide-react';
import { useNativeCapabilities } from '@/hooks/useNativeCapabilities';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface Receipt {
  id: string;
  fileName: string;
  uploadDate: string;
  amount?: string;
  description?: string;
  category?: string;
  fileData: string;
  fileType: string;
  status: 'pending' | 'approved' | 'rejected';
  uploadedBy: string;
  uploaderName: string;
}

export const MobileReceiptScanner = () => {
  const { takePicture, isNativeApp } = useNativeCapabilities();
  const { profile } = useAuth();
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState({
    amount: '',
    description: '',
    category: ''
  });

  const handleTakePhoto = async () => {
    try {
      const result = await takePicture({
        allowEditing: true
      });
      
      if (result?.dataUrl) {
        setCapturedImage(result.dataUrl);
        setShowUploadDialog(true);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      toast({
        title: "Camera fout",
        description: "Kon geen foto maken",
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setCapturedImage(result);
        setShowUploadDialog(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveReceipt = () => {
    if (!capturedImage || !profile) {
      toast({
        title: "Fout",
        description: "Geen foto of gebruiker gevonden",
        variant: "destructive"
      });
      return;
    }

    const receipt: Receipt = {
      id: Date.now().toString(),
      fileName: `bonnetje_${Date.now()}`,
      uploadDate: new Date().toLocaleDateString('nl-NL'),
      amount: receiptData.amount,
      description: receiptData.description,
      category: receiptData.category,
      fileData: capturedImage,
      fileType: 'image',
      status: 'pending',
      uploadedBy: profile.full_name || 'Onbekend',
      uploaderName: profile.full_name || 'Onbekend'
    };

    // Save to localStorage (in a real app, this would go to the backend)
    const existingReceipts = JSON.parse(localStorage.getItem('crm_receipts') || '[]');
    const updatedReceipts = [...existingReceipts, receipt];
    localStorage.setItem('crm_receipts', JSON.stringify(updatedReceipts));

    toast({
      title: "Bonnetje opgeslagen",
      description: "Het bonnetje is verzonden voor goedkeuring",
    });

    // Reset form
    setCapturedImage(null);
    setReceiptData({ amount: '', description: '', category: '' });
    setShowUploadDialog(false);
  };

  return (
    <div className="p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bonnetje Scanner</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Scan een bonnetje met je camera of upload een bestaande foto.
          </p>
          
          <div className="grid grid-cols-1 gap-3">
            {isNativeApp && (
              <Button
                onClick={handleTakePhoto}
                className="h-16 text-base font-medium bg-primary hover:bg-primary/90 text-white"
                size="lg"
              >
                <Camera className="mr-3 h-6 w-6" />
                Foto maken met camera
              </Button>
            )}
            
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                id="file-upload"
              />
              <Button
                variant="outline"
                className="w-full h-16 text-base font-medium"
                size="lg"
                asChild
              >
                <label htmlFor="file-upload" className="cursor-pointer flex items-center justify-center">
                  <Upload className="mr-3 h-6 w-6" />
                  Bestand uploaden
                </label>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="mx-4 max-w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bonnetje uploaden</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {capturedImage && (
              <div className="space-y-2">
                <Label>Foto preview</Label>
                <img 
                  src={capturedImage} 
                  alt="Bonnetje preview" 
                  className="w-full h-48 object-cover rounded-lg border"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="amount">Bedrag (optioneel)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={receiptData.amount}
                onChange={(e) => setReceiptData(prev => ({ ...prev, amount: e.target.value }))}
                className="h-12"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Omschrijving (optioneel)</Label>
              <Input
                id="description"
                placeholder="Bijv. tankstation, kantoorbenodigdheden"
                value={receiptData.description}
                onChange={(e) => setReceiptData(prev => ({ ...prev, description: e.target.value }))}
                className="h-12"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Categorie (optioneel)</Label>
              <Input
                id="category"
                placeholder="Bijv. transport, materiaal, kantoor"
                value={receiptData.category}
                onChange={(e) => setReceiptData(prev => ({ ...prev, category: e.target.value }))}
                className="h-12"
              />
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowUploadDialog(false)}
              className="h-12"
            >
              Annuleren
            </Button>
            <Button 
              onClick={saveReceipt}
              className="h-12 bg-green-600 hover:bg-green-700 text-white"
            >
              <Check className="mr-2 h-4 w-4" />
              Opslaan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};