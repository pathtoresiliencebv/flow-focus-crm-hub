import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ImageUpload } from '@/components/ImageUpload';
import { MobileReceiptCard } from '@/components/mobile/MobileReceiptCard';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/useAuth';
import { Upload, Check, X, Eye, Mail } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Receipt {
  id: string;
  user_id?: string;
  email_from?: string;
  subject?: string;
  amount?: number | null;
  description?: string;
  category?: string;
  receipt_file_url: string;
  receipt_file_name: string;
  receipt_file_type: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: string | null;
  approved_at?: string | null;
  rejection_reason?: string | null;
  email_message_id?: string;
  created_at: string;
  updated_at: string;
  approver_name?: string | null;
  user_name?: string | null;
}

export const Receipts = () => {
  const isMobile = useIsMobile();
  const { profile } = useAuth();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ id: string; action: 'approve' | 'reject' } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [newReceipt, setNewReceipt] = useState({
    amount: '',
    description: '',
    category: '',
    fileData: null as string | null
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReceipts();
    loadUsers();
    subscribeToReceipts();
  }, []);

  const loadReceipts = async () => {
    try {
      // First get all receipts
      const { data: receiptsData, error: receiptsError } = await supabase
        .from('receipts')
        .select('*')
        .order('created_at', { ascending: false });

      if (receiptsError) throw receiptsError;

      // Get all unique user IDs and approved_by IDs
      const allUserIds = new Set<string>();
      receiptsData?.forEach(receipt => {
        if (receipt.user_id) allUserIds.add(receipt.user_id);
        if (receipt.approved_by) allUserIds.add(receipt.approved_by);
      });

      // Get profile information for all users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', Array.from(allUserIds));

      if (profilesError) throw profilesError;

      // Create a map of user ID to profile for quick lookup
      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      // Transform the data to match our interface
      const transformedData = (receiptsData || []).map(receipt => ({
        ...receipt,
        status: receipt.status as 'pending' | 'approved' | 'rejected',
        approver_name: receipt.approved_by ? profilesMap.get(receipt.approved_by)?.full_name || null : null,
        user_name: receipt.user_id ? profilesMap.get(receipt.user_id)?.full_name || null : null
      }));
      
      setReceipts(transformedData);
    } catch (error) {
      console.error('Error loading receipts:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .order('full_name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const subscribeToReceipts = () => {
    const channel = supabase
      .channel('receipts-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'receipts' }, () => {
        loadReceipts();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  const handleFileUpload = (fileData: string | null) => {
    setNewReceipt(prev => ({ ...prev, fileData }));
  };

  const saveReceipt = async () => {
    if (!newReceipt.fileData) {
      toast({ title: "Fout", description: "Geen bestand geselecteerd", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Gebruiker niet gevonden');

      // Convert base64 to blob and upload
      const base64Data = newReceipt.fileData.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteArray = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteArray[i] = byteCharacters.charCodeAt(i);
      }
      const blob = new Blob([byteArray], { type: 'image/jpeg' });

      const fileName = `${user.id}/${Date.now()}_receipt.jpg`;
      const { error: uploadError } = await supabase.storage.from('receipts').upload(fileName, blob);
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from('receipts').insert({
        user_id: user.id,
        amount: newReceipt.amount ? parseFloat(newReceipt.amount) : null,
        description: newReceipt.description || 'Bonnetje upload',
        category: newReceipt.category,
        receipt_file_url: fileName,
        receipt_file_name: `receipt_${Date.now()}.jpg`,
        receipt_file_type: 'image/jpeg',
        status: 'pending'
      });

      if (insertError) throw insertError;

      toast({ title: "Bonnetje opgeslagen", description: "Het bonnetje is verzonden voor goedkeuring" });
      setNewReceipt({ amount: '', description: '', category: '', fileData: null });
      setShowUploadDialog(false);
    } catch (error: any) {
      toast({ title: "Fout", description: "Kon bonnetje niet opslaan: " + error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalAction = (receiptId: string, action: 'approve' | 'reject') => {
    if (!profile || !['Administrator', 'Administratie'].includes(profile.role)) {
      toast({ title: "Geen rechten", description: "U heeft geen rechten om bonnetjes goed te keuren", variant: "destructive" });
      return;
    }
    setPendingAction({ id: receiptId, action });
    setShowConfirmDialog(true);
  };

  const confirmAction = async () => {
    if (!pendingAction) return;
    setLoading(true);

    try {
      const { error } = await supabase.functions.invoke('receipt-approval', {
        body: {
          receiptId: pendingAction.id,
          action: pendingAction.action,
          reason: rejectionReason,
          userId: pendingAction.action === 'approve' ? selectedUserId : undefined
        }
      });

      if (error) throw error;

      toast({
        title: pendingAction.action === 'approve' ? "Bonnetje goedgekeurd" : "Bonnetje afgewezen",
        description: `Het bonnetje is ${pendingAction.action === 'approve' ? 'goedgekeurd' : 'afgewezen'}`
      });

      setPendingAction(null);
      setRejectionReason('');
      setSelectedUserId('');
      setShowConfirmDialog(false);
    } catch (error: any) {
      toast({ title: "Fout", description: "Kon actie niet uitvoeren: " + error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const viewReceipt = async (receipt: Receipt) => {
    try {
      const { data } = await supabase.storage.from('receipts').createSignedUrl(receipt.receipt_file_url, 3600);
      if (data?.signedUrl) window.open(data.signedUrl, '_blank');
    } catch (error) {
      toast({ title: "Fout", description: "Kon bonnetje niet openen", variant: "destructive" });
    }
  };

  const getStatusBadge = (status: Receipt['status']) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary">In behandeling</Badge>;
      case 'approved': return <Badge className="bg-green-600">Goedgekeurd</Badge>;
      case 'rejected': return <Badge variant="destructive">Afgewezen</Badge>;
      default: return <Badge variant="secondary">Onbekend</Badge>;
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('nl-NL');
  const formatAmount = (amount?: number | null) => amount ? `€${amount.toFixed(2)}` : '-';

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Bonnetjes</h2>
        <Button onClick={() => setShowUploadDialog(true)} disabled={loading}>
          <Upload className="h-4 w-4 mr-2" />
          Upload
        </Button>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">
            In behandeling ({receipts.filter(r => r.status === 'pending').length})
          </TabsTrigger>
          <TabsTrigger value="processed">
            Verwerkt ({receipts.filter(r => r.status !== 'pending').length})
          </TabsTrigger>
          <TabsTrigger value="email">Email Info</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {receipts.filter(r => r.status === 'pending').map((receipt) => (
            <Card key={receipt.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">{receipt.description}</h4>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(receipt.created_at)} • {formatAmount(receipt.amount)}
                    </p>
                    {receipt.email_from && (
                      <p className="text-xs text-muted-foreground">Via: {receipt.email_from}</p>
                    )}
                    {receipt.user_name && (
                      <p className="text-xs text-muted-foreground">Door: {receipt.user_name}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => viewReceipt(receipt)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {['Administrator', 'Administratie'].includes(profile?.role || '') && (
                      <>
                        <Button size="sm" onClick={() => handleApprovalAction(receipt.id, 'approve')} disabled={loading}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleApprovalAction(receipt.id, 'reject')} disabled={loading}>
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="processed" className="space-y-4">
          {receipts.filter(r => r.status !== 'pending').map((receipt) => (
            <Card key={receipt.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{receipt.description}</h4>
                      {getStatusBadge(receipt.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(receipt.created_at)} • {formatAmount(receipt.amount)}
                    </p>
                    {receipt.user_name && (
                      <p className="text-xs text-muted-foreground">Door: {receipt.user_name}</p>
                    )}
                    {receipt.approver_name && (
                      <p className="text-xs text-muted-foreground">Goedgekeurd door: {receipt.approver_name}</p>
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => viewReceipt(receipt)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Informatie
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Bonnetjes Email</Label>
                <p className="text-lg font-mono bg-muted p-2 rounded">bonnetjes@smanscrm.nl</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Hoe werkt het?</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Verstuur bonnetjes naar: bonnetjes@smanscrm.nl</li>
                  <li>• Voeg afbeeldingen toe als bijlage</li>
                  <li>• Bonnetjes worden automatisch verwerkt</li>
                  <li>• U ontvangt een bevestiging via email</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nieuw bonnetje uploaden</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Bestand</Label>
              <ImageUpload value={newReceipt.fileData} onChange={handleFileUpload} />
            </div>
            <div>
              <Label htmlFor="amount">Bedrag (optioneel)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={newReceipt.amount}
                onChange={(e) => setNewReceipt(prev => ({ ...prev, amount: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="description">Omschrijving</Label>
              <Input
                id="description"
                placeholder="Bijv. tankstation, kantoorbenodigdheden"
                value={newReceipt.description}
                onChange={(e) => setNewReceipt(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="category">Categorie</Label>
              <Input
                id="category"
                placeholder="Bijv. transport, materiaal, kantoor"
                value={newReceipt.category}
                onChange={(e) => setNewReceipt(prev => ({ ...prev, category: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)} disabled={loading}>
              Annuleren
            </Button>
            <Button onClick={saveReceipt} disabled={loading}>
              <Upload className="mr-2 h-4 w-4" />
              {loading ? 'Bezig...' : 'Opslaan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingAction?.action === 'approve' ? 'Bonnetje goedkeuren' : 'Bonnetje afwijzen'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Weet u zeker dat u dit bonnetje wilt {pendingAction?.action === 'approve' ? 'goedkeuren' : 'afwijzen'}?</p>
            
            {pendingAction?.action === 'approve' && (
              <div>
                <Label>Toewijzen aan gebruiker (optioneel)</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer een gebruiker..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Geen specifieke gebruiker</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name} ({user.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {pendingAction?.action === 'reject' && (
              <div>
                <Label htmlFor="rejectionReason">Reden voor afwijzing</Label>
                <Textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Geef een reden op voor de afwijzing..."
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={loading}>
              Annuleren
            </Button>
            <Button 
              onClick={confirmAction}
              variant={pendingAction?.action === 'approve' ? 'default' : 'destructive'}
              disabled={loading}
            >
              {pendingAction?.action === 'approve' ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  {loading ? 'Bezig...' : 'Goedkeuren'}
                </>
              ) : (
                <>
                  <X className="mr-2 h-4 w-4" />
                  {loading ? 'Bezig...' : 'Afwijzen'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
