import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Clock, User, Calendar, Euro, Tag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';

interface Receipt {
  id: string;
  user_id: string;
  project_id: string | null;
  amount: number | null;
  description: string | null;
  category: string | null;
  receipt_file_url: string;
  receipt_file_name: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
  projects?: {
    title: string;
  };
}

export const AdminReceiptApproval = () => {
  const { profile } = useAuth();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    fetchReceipts();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('receipt_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'receipts'
        },
        () => {
          fetchReceipts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('receipts')
        .select(`
          *,
          profiles:user_id(full_name, email),
          projects:project_id(title)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReceipts(data || []);
    } catch (error: any) {
      console.error('Error fetching receipts:', error);
      toast({
        title: "Fout",
        description: "Kon bonnetjes niet laden",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalAction = (receipt: Receipt, action: 'approve' | 'reject') => {
    setSelectedReceipt(receipt);
    setApprovalAction(action);
    setRejectionReason('');
    setShowApprovalDialog(true);
  };

  const confirmApprovalAction = async () => {
    if (!selectedReceipt || !approvalAction) return;

    if (approvalAction === 'reject' && !rejectionReason.trim()) {
      toast({
        title: "Reden verplicht",
        description: "Geef een reden voor afkeuring op",
        variant: "destructive"
      });
      return;
    }

    try {
      setProcessingAction(true);
      console.log('🔄 Processing approval:', {
        receiptId: selectedReceipt.id,
        action: approvalAction,
        hasRejectionReason: !!rejectionReason
      });

      const updates: any = {
        status: approvalAction === 'approve' ? 'approved' : 'rejected',
        updated_at: new Date().toISOString()
      };

      if (approvalAction === 'reject') {
        updates.rejection_reason = rejectionReason;
      }

      console.log('📝 Updating receipt with:', updates);

      const { error } = await supabase
        .from('receipts')
        .update(updates)
        .eq('id', selectedReceipt.id);

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }

      console.log('✅ Approval successful');

      toast({
        title: approvalAction === 'approve' ? "✅ Goedgekeurd" : "❌ Afgekeurd",
        description: `Bonnetje is ${approvalAction === 'approve' ? 'goedgekeurd' : 'afgekeurd'}`,
      });

      setShowApprovalDialog(false);
      setSelectedReceipt(null);
      setApprovalAction(null);
      setRejectionReason('');
      
      // Refresh list
      fetchReceipts();

    } catch (error: any) {
      console.error('Error updating receipt:', error);
      toast({
        title: "Fout",
        description: "Kon bonnetje niet bijwerken: " + error.message,
        variant: "destructive"
      });
    } finally {
      setProcessingAction(false);
    }
  };

  const filterReceipts = (status: string) => {
    if (status === 'all') return receipts;
    return receipts.filter(r => r.status === status);
  };

  const renderReceiptCard = (receipt: Receipt) => (
    <Card key={receipt.id} className="mb-4">
      <CardContent className="py-4">
        <div className="flex gap-4">
          {/* Thumbnail */}
          <div className="flex-shrink-0">
            <img
              src={receipt.receipt_file_url}
              alt="Bonnetje"
              className="w-24 h-24 object-cover rounded-md border cursor-pointer hover:opacity-80"
              onClick={() => window.open(receipt.receipt_file_url, '_blank')}
            />
          </div>

          {/* Info */}
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">
                  {receipt.description || 'Bonnetje zonder omschrijving'}
                </p>
                {receipt.amount && (
                  <p className="text-xl font-bold text-primary">
                    €{receipt.amount.toFixed(2)}
                  </p>
                )}
              </div>
              <Badge
                className={
                  receipt.status === 'approved'
                    ? 'bg-green-500'
                    : receipt.status === 'rejected'
                    ? 'bg-red-500'
                    : 'bg-yellow-500'
                }
              >
                {receipt.status === 'approved' && <CheckCircle className="w-3 h-3 mr-1" />}
                {receipt.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                {receipt.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                {receipt.status === 'approved'
                  ? 'Goedgekeurd'
                  : receipt.status === 'rejected'
                  ? 'Afgekeurd'
                  : 'In afwachting'}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <User className="w-3 h-3" />
                <span>{receipt.profiles?.full_name || 'Onbekend'}</span>
              </div>
              
              {receipt.category && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Tag className="w-3 h-3" />
                  <span>{receipt.category}</span>
                </div>
              )}

              {receipt.projects && (
                <div className="flex items-center gap-1 text-muted-foreground col-span-2">
                  <span className="font-medium">Project:</span>
                  <span>{receipt.projects.title}</span>
                </div>
              )}
              
              <div className="flex items-center gap-1 text-muted-foreground col-span-2">
                <Calendar className="w-3 h-3" />
                <span>
                  {formatDistanceToNow(new Date(receipt.created_at), {
                    addSuffix: true,
                    locale: nl
                  })}
                </span>
              </div>
            </div>

            {receipt.rejection_reason && (
              <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                <strong>Reden afkeuring:</strong> {receipt.rejection_reason}
              </div>
            )}

            {/* Actions */}
            {receipt.status === 'pending' && (
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleApprovalAction(receipt, 'approve')}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Goedkeuren
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleApprovalAction(receipt, 'reject')}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Afkeuren
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Bonnetjes laden...</p>
        </CardContent>
      </Card>
    );
  }

  const pendingCount = filterReceipts('pending').length;
  const approvedCount = filterReceipts('approved').length;
  const rejectedCount = filterReceipts('rejected').length;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Bonnetjes Goedkeuring</span>
            {pendingCount > 0 && (
              <Badge variant="destructive" className="text-base px-3 py-1">
                {pendingCount} te reviewen
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
      </Card>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending">
            In afwachting
            {pendingCount > 0 && (
              <Badge variant="secondary" className="ml-2">{pendingCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">
            Goedgekeurd
            <Badge variant="secondary" className="ml-2">{approvedCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Afgekeurd
            <Badge variant="secondary" className="ml-2">{rejectedCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="all">
            Alle
            <Badge variant="secondary" className="ml-2">{receipts.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <div className="mt-4">
            {filterReceipts('pending').length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Clock className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">Geen bonnetjes in afwachting</p>
                </CardContent>
              </Card>
            ) : (
              filterReceipts('pending').map(renderReceiptCard)
            )}
          </div>
        </TabsContent>

        <TabsContent value="approved">
          <div className="mt-4">
            {filterReceipts('approved').length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">Nog geen goedgekeurde bonnetjes</p>
                </CardContent>
              </Card>
            ) : (
              filterReceipts('approved').map(renderReceiptCard)
            )}
          </div>
        </TabsContent>

        <TabsContent value="rejected">
          <div className="mt-4">
            {filterReceipts('rejected').length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <XCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">Geen afgekeurde bonnetjes</p>
                </CardContent>
              </Card>
            ) : (
              filterReceipts('rejected').map(renderReceiptCard)
            )}
          </div>
        </TabsContent>

        <TabsContent value="all">
          <div className="mt-4">
            {receipts.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">Geen bonnetjes gevonden</p>
                </CardContent>
              </Card>
            ) : (
              receipts.map(renderReceiptCard)
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalAction === 'approve' ? 'Bonnetje goedkeuren' : 'Bonnetje afkeuren'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {selectedReceipt && (
              <>
                <div>
                  <img
                    src={selectedReceipt.receipt_file_url}
                    alt="Bonnetje"
                    className="w-full h-auto rounded-lg border"
                  />
                </div>

                <div className="space-y-2">
                  <p><strong>Monteur:</strong> {selectedReceipt.profiles?.full_name}</p>
                  {selectedReceipt.amount && (
                    <p><strong>Bedrag:</strong> €{selectedReceipt.amount.toFixed(2)}</p>
                  )}
                  {selectedReceipt.description && (
                    <p><strong>Omschrijving:</strong> {selectedReceipt.description}</p>
                  )}
                </div>

                {approvalAction === 'reject' && (
                  <div>
                    <Label htmlFor="rejection-reason">Reden voor afkeuring *</Label>
                    <Textarea
                      id="rejection-reason"
                      placeholder="bijv. Bonnetje is onleesbaar, geen bedrijfskosten, etc."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                      className="mt-2"
                    />
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApprovalDialog(false)}
              disabled={processingAction}
            >
              Annuleren
            </Button>
            <Button
              onClick={confirmApprovalAction}
              disabled={processingAction}
              className={
                approvalAction === 'approve'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }
            >
              {processingAction ? 'Bezig...' : approvalAction === 'approve' ? 'Goedkeuren' : 'Afkeuren'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

