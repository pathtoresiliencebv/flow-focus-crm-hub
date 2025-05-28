
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, Settings, Mail, Download, Eye, Trash2 } from "lucide-react";
import { toast } from '@/hooks/use-toast';
import { ImageUpload } from './ImageUpload';

interface Receipt {
  id: string;
  fileName: string;
  uploadDate: string;
  amount?: string;
  description?: string;
  category?: string;
  fileData: string;
  fileType: string;
}

export const Receipts = () => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [receiptEmail, setReceiptEmail] = useState('');
  const [newReceipt, setNewReceipt] = useState({
    file: null as string | null,
    amount: '',
    description: '',
    category: ''
  });

  // Load settings from localStorage
  useEffect(() => {
    const savedEmail = localStorage.getItem('receipt_email');
    if (savedEmail) {
      setReceiptEmail(savedEmail);
    }

    const savedReceipts = localStorage.getItem('crm_receipts');
    if (savedReceipts) {
      setReceipts(JSON.parse(savedReceipts));
    }
  }, []);

  const handleFileUpload = (fileData: string | null) => {
    setNewReceipt(prev => ({ ...prev, file: fileData }));
  };

  const saveReceipt = () => {
    if (!newReceipt.file) {
      toast({
        title: "Fout",
        description: "Selecteer eerst een bestand.",
        variant: "destructive"
      });
      return;
    }

    const receipt: Receipt = {
      id: Date.now().toString(),
      fileName: `bonnetje_${Date.now()}`,
      uploadDate: new Date().toLocaleDateString('nl-NL'),
      amount: newReceipt.amount,
      description: newReceipt.description,
      category: newReceipt.category,
      fileData: newReceipt.file,
      fileType: newReceipt.file.includes('data:image/') ? 'image' : 'pdf'
    };

    const updatedReceipts = [...receipts, receipt];
    setReceipts(updatedReceipts);
    localStorage.setItem('crm_receipts', JSON.stringify(updatedReceipts));

    toast({
      title: "Bonnetje toegevoegd",
      description: "Het bonnetje is succesvol opgeslagen.",
    });

    setNewReceipt({
      file: null,
      amount: '',
      description: '',
      category: ''
    });
    setUploadDialogOpen(false);
  };

  const saveEmailSettings = () => {
    localStorage.setItem('receipt_email', receiptEmail);
    toast({
      title: "Instellingen opgeslagen",
      description: "E-mailadres voor bonnetjes is bijgewerkt.",
    });
    setSettingsDialogOpen(false);
  };

  const deleteReceipt = (id: string) => {
    const updatedReceipts = receipts.filter(receipt => receipt.id !== id);
    setReceipts(updatedReceipts);
    localStorage.setItem('crm_receipts', JSON.stringify(updatedReceipts));
    
    toast({
      title: "Bonnetje verwijderd",
      description: "Het bonnetje is succesvol verwijderd.",
    });
  };

  const viewReceipt = (receipt: Receipt) => {
    // Open file in new tab
    const newWindow = window.open();
    if (newWindow) {
      if (receipt.fileType === 'image') {
        newWindow.document.write(`<img src="${receipt.fileData}" style="max-width: 100%; height: auto;" />`);
      } else {
        newWindow.location.href = receipt.fileData;
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Bonnetjes</h2>
        <div className="flex gap-2">
          <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Instellingen
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Bonnetjes Instellingen</DialogTitle>
                <DialogDescription>
                  Configureer het e-mailadres waar bonnetjes naartoe gestuurd kunnen worden.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="receipt-email">E-mailadres voor bonnetjes</Label>
                  <Input
                    id="receipt-email"
                    type="email"
                    value={receiptEmail}
                    onChange={(e) => setReceiptEmail(e.target.value)}
                    placeholder="bonnetjes@smans.nl"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Stuur bonnetjes naar dit adres en ze worden automatisch verwerkt in het systeem.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={saveEmailSettings}>Opslaan</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-smans-primary hover:bg-smans-primary text-white">
                <Upload className="mr-2 h-4 w-4" />
                Bonnetje Uploaden
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Nieuw bonnetje uploaden</DialogTitle>
                <DialogDescription>
                  Upload een foto of scan van het bonnetje en vul de details in.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Bonnetje bestand</Label>
                  <ImageUpload
                    value={newReceipt.file}
                    onChange={handleFileUpload}
                    className="h-32"
                  />
                </div>
                <div>
                  <Label htmlFor="amount">Bedrag (optioneel)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={newReceipt.amount}
                    onChange={(e) => setNewReceipt(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Omschrijving (optioneel)</Label>
                  <Input
                    id="description"
                    value={newReceipt.description}
                    onChange={(e) => setNewReceipt(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Bijv. kantoorbenodigdheden"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Categorie (optioneel)</Label>
                  <Input
                    id="category"
                    value={newReceipt.category}
                    onChange={(e) => setNewReceipt(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="Bijv. kantoor, transport, materiaal"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                  Annuleren
                </Button>
                <Button onClick={saveReceipt}>Opslaan</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overzicht</TabsTrigger>
          <TabsTrigger value="email-info">E-mail Instructies</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Geüploade Bonnetjes</CardTitle>
              <CardDescription>
                Beheer en bekijk alle geüploade bonnetjes.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {receipts.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <FileText className="mx-auto h-12 w-12 mb-4 text-gray-300" />
                  <p>Nog geen bonnetjes geüpload.</p>
                  <p className="text-sm">Upload je eerste bonnetje om te beginnen.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Datum</TableHead>
                      <TableHead>Omschrijving</TableHead>
                      <TableHead>Categorie</TableHead>
                      <TableHead>Bedrag</TableHead>
                      <TableHead>Acties</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receipts.map((receipt) => (
                      <TableRow key={receipt.id}>
                        <TableCell>{receipt.uploadDate}</TableCell>
                        <TableCell>
                          {receipt.description || receipt.fileName}
                        </TableCell>
                        <TableCell>{receipt.category || '-'}</TableCell>
                        <TableCell>
                          {receipt.amount ? `€${receipt.amount}` : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => viewReceipt(receipt)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteReceipt(receipt.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email-info" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>
                <Mail className="inline mr-2 h-5 w-5" />
                Bonnetjes per E-mail
              </CardTitle>
              <CardDescription>
                Stuur bonnetjes direct naar het systeem via e-mail.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Hoe werkt het?</h4>
                  <ol className="text-sm space-y-1 text-gray-600">
                    <li>1. Configureer het e-mailadres in de instellingen</li>
                    <li>2. Stuur bonnetjes als bijlage naar: <strong>{receiptEmail || 'bonnetjes@smans.nl'}</strong></li>
                    <li>3. Bonnetjes worden automatisch verwerkt in het systeem</li>
                  </ol>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Tips voor het e-mailen van bonnetjes:</h4>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>• Gebruik heldere foto's of scans</li>
                    <li>• Voeg een omschrijving toe in de e-mail onderwerp</li>
                    <li>• Ondersteunde formaten: JPG, PNG, PDF</li>
                    <li>• Maximum bestandsgrootte: 10MB</li>
                  </ul>
                </div>

                {!receiptEmail && (
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-sm text-red-700">
                      <strong>Let op:</strong> Configureer eerst het e-mailadres in de instellingen om bonnetjes per e-mail te kunnen ontvangen.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Receipts;
