
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, Settings, Mail, Download, Eye, Trash2, Check, X, Clock } from "lucide-react";
import { toast } from '@/hooks/use-toast';
import { ImageUpload } from './ImageUpload';
import { MobileReceiptCard } from './mobile/MobileReceiptCard';
import { useIsMobile } from '@/hooks/use-mobile';

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
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

// Demo receipts with different statuses
const demoReceipts: Receipt[] = [
  {
    id: 'demo1',
    fileName: 'demo_bonnetje_1',
    uploadDate: new Date().toLocaleDateString('nl-NL'),
    amount: '24.50',
    description: 'Kantoorbenodigdheden',
    category: 'kantoor',
    fileData: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
    fileType: 'image',
    status: 'pending'
  },
  {
    id: 'demo2',
    fileName: 'demo_bonnetje_2',
    uploadDate: new Date(Date.now() - 86400000).toLocaleDateString('nl-NL'),
    amount: '67.80',
    description: 'Brandstof',
    category: 'transport',
    fileData: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
    fileType: 'image',
    status: 'approved',
    approvedBy: 'Admin',
    approvedAt: new Date(Date.now() - 3600000).toLocaleDateString('nl-NL')
  },
  {
    id: 'demo3',
    fileName: 'demo_bonnetje_3',
    uploadDate: new Date(Date.now() - 172800000).toLocaleDateString('nl-NL'),
    amount: '15.20',
    description: 'Koffie vergadering',
    category: 'kantoor',
    fileData: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
    fileType: 'image',
    status: 'rejected',
    rejectionReason: 'Niet zakelijk gerelateerd'
  }
];

export const Receipts = () => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    receiptId: string;
    action: 'approve' | 'reject';
  } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [receiptEmail, setReceiptEmail] = useState('');
  const [newReceipt, setNewReceipt] = useState({
    file: null as string | null,
    amount: '',
    description: '',
    category: ''
  });
  const isMobile = useIsMobile();

  // Load settings and receipts from localStorage
  useEffect(() => {
    const savedEmail = localStorage.getItem('receipt_email');
    if (savedEmail) {
      setReceiptEmail(savedEmail);
    }

    const savedReceipts = localStorage.getItem('crm_receipts');
    if (savedReceipts) {
      const parsed = JSON.parse(savedReceipts);
      // Add demo receipts if no receipts exist
      if (parsed.length === 0) {
        setReceipts(demoReceipts);
        localStorage.setItem('crm_receipts', JSON.stringify(demoReceipts));
      } else {
        setReceipts(parsed);
      }
    } else {
      // Initialize with demo receipts
      setReceipts(demoReceipts);
      localStorage.setItem('crm_receipts', JSON.stringify(demoReceipts));
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
      fileType: newReceipt.file.includes('data:image/') ? 'image' : 'pdf',
      status: 'pending'
    };

    const updatedReceipts = [...receipts, receipt];
    setReceipts(updatedReceipts);
    localStorage.setItem('crm_receipts', JSON.stringify(updatedReceipts));

    toast({
      title: "Bonnetje toegevoegd",
      description: "Het bonnetje wacht op goedkeuring.",
    });

    setNewReceipt({
      file: null,
      amount: '',
      description: '',
      category: ''
    });
    setUploadDialogOpen(false);
  };

  const handleApprovalAction = (receiptId: string, action: 'approve' | 'reject') => {
    setPendingAction({ receiptId, action });
    setConfirmDialogOpen(true);
    if (action === 'reject') {
      setRejectionReason('');
    }
  };

  const confirmAction = () => {
    if (!pendingAction) return;

    const updatedReceipts = receipts.map(receipt => {
      if (receipt.id === pendingAction.receiptId) {
        if (pendingAction.action === 'approve') {
          return {
            ...receipt,
            status: 'approved' as const,
            approvedBy: 'Admin',
            approvedAt: new Date().toLocaleDateString('nl-NL')
          };
        } else {
          return {
            ...receipt,
            status: 'rejected' as const,
            rejectionReason: rejectionReason || 'Geen reden opgegeven'
          };
        }
      }
      return receipt;
    });

    setReceipts(updatedReceipts);
    localStorage.setItem('crm_receipts', JSON.stringify(updatedReceipts));

    toast({
      title: pendingAction.action === 'approve' ? "Bonnetje goedgekeurd" : "Bonnetje afgekeurd",
      description: pendingAction.action === 'approve' 
        ? "Het bonnetje is succesvol goedgekeurd." 
        : "Het bonnetje is afgekeurd.",
    });

    setConfirmDialogOpen(false);
    setPendingAction(null);
    setRejectionReason('');
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
    const newWindow = window.open();
    if (newWindow) {
      if (receipt.fileType === 'image') {
        newWindow.document.write(`<img src="${receipt.fileData}" style="max-width: 100%; height: auto;" />`);
      } else {
        newWindow.location.href = receipt.fileData;
      }
    }
  };

  const getStatusBadge = (status: Receipt['status']) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="inline h-3 w-3 mr-1" />
          In afwachting
        </span>;
      case 'approved':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <Check className="inline h-3 w-3 mr-1" />
          Goedgekeurd
        </span>;
      case 'rejected':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <X className="inline h-3 w-3 mr-1" />
          Afgekeurd
        </span>;
    }
  };

  const pendingReceipts = receipts.filter(r => r.status === 'pending');
  const processedReceipts = receipts.filter(r => r.status !== 'pending');

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold">Bonnetjes</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Settings Dialog */}
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

          {/* Upload Dialog */}
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-smans-primary hover:bg-smans-primary text-white">
                <Upload className="mr-2 h-4 w-4" />
                Bonnetje Uploaden
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingAction?.action === 'approve' ? 'Bonnetje goedkeuren' : 'Bonnetje afkeuren'}
            </DialogTitle>
            <DialogDescription>
              {pendingAction?.action === 'approve' 
                ? 'Weet je zeker dat je dit bonnetje wilt goedkeuren?'
                : 'Weet je zeker dat je dit bonnetje wilt afkeuren?'
              }
            </DialogDescription>
          </DialogHeader>
          {pendingAction?.action === 'reject' && (
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Reden voor afkeuring (optioneel)</Label>
              <Input
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Bijv. niet zakelijk gerelateerd"
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Annuleren
            </Button>
            <Button 
              onClick={confirmAction}
              className={pendingAction?.action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {pendingAction?.action === 'approve' ? 'Goedkeuren' : 'Afkeuren'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending">
            Te beoordelen ({pendingReceipts.length})
          </TabsTrigger>
          <TabsTrigger value="processed">
            Verwerkt ({processedReceipts.length})
          </TabsTrigger>
          <TabsTrigger value="email-info">E-mail Instructies</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Bonnetjes in afwachting van goedkeuring</CardTitle>
              <CardDescription>
                Bonnetjes die handmatig goedgekeurd of afgekeurd moeten worden.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {pendingReceipts.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>Geen bonnetjes in afwachting van goedkeuring.</p>
                </div>
              ) : isMobile ? (
                <div className="p-4 space-y-3">
                  {pendingReceipts.map((receipt) => (
                    <MobileReceiptCard
                      key={receipt.id}
                      receipt={receipt}
                      onView={viewReceipt}
                      onApprove={() => handleApprovalAction(receipt.id, 'approve')}
                      onReject={() => handleApprovalAction(receipt.id, 'reject')}
                      showActions={true}
                    />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Datum</TableHead>
                      <TableHead>Omschrijving</TableHead>
                      <TableHead>Categorie</TableHead>
                      <TableHead>Bedrag</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Acties</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingReceipts.map((receipt) => (
                      <TableRow key={receipt.id}>
                        <TableCell>{receipt.uploadDate}</TableCell>
                        <TableCell>
                          {receipt.description || receipt.fileName}
                        </TableCell>
                        <TableCell>{receipt.category || '-'}</TableCell>
                        <TableCell>
                          {receipt.amount ? `€${receipt.amount}` : '-'}
                        </TableCell>
                        <TableCell>{getStatusBadge(receipt.status)}</TableCell>
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
                              size="sm"
                              onClick={() => handleApprovalAction(receipt.id, 'approve')}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleApprovalAction(receipt.id, 'reject')}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              <X className="h-4 w-4" />
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

        <TabsContent value="processed" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Verwerkte Bonnetjes</CardTitle>
              <CardDescription>
                Bonnetjes die zijn goedgekeurd of afgekeurd.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {processedReceipts.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>Nog geen verwerkte bonnetjes.</p>
                </div>
              ) : isMobile ? (
                <div className="p-4 space-y-3">
                  {processedReceipts.map((receipt) => (
                    <MobileReceiptCard
                      key={receipt.id}
                      receipt={receipt}
                      onView={viewReceipt}
                      onDelete={deleteReceipt}
                      showActions={true}
                    />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Datum</TableHead>
                      <TableHead>Omschrijving</TableHead>
                      <TableHead>Categorie</TableHead>
                      <TableHead>Bedrag</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Acties</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedReceipts.map((receipt) => (
                      <TableRow key={receipt.id}>
                        <TableCell>{receipt.uploadDate}</TableCell>
                        <TableCell>
                          {receipt.description || receipt.fileName}
                        </TableCell>
                        <TableCell>{receipt.category || '-'}</TableCell>
                        <TableCell>
                          {receipt.amount ? `€${receipt.amount}` : '-'}
                        </TableCell>
                        <TableCell>{getStatusBadge(receipt.status)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {receipt.status === 'approved' && receipt.approvedBy && (
                            <div>Goedgekeurd door: {receipt.approvedBy}</div>
                          )}
                          {receipt.status === 'rejected' && receipt.rejectionReason && (
                            <div>Reden: {receipt.rejectionReason}</div>
                          )}
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
