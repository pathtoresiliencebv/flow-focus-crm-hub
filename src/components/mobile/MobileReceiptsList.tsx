import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
}

export const MobileReceiptsList = () => {
  const { profile } = useAuth();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      fetchReceipts();
    }
  }, [profile]);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .eq('user_id', profile?.id)
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-500 text-white">
            <CheckCircle className="w-3 h-3 mr-1" />
            Goedgekeurd
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-500 text-white">
            <XCircle className="w-3 h-3 mr-1" />
            Afgekeurd
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-500 text-white">
            <Clock className="w-3 h-3 mr-1" />
            In afwachting
          </Badge>
        );
    }
  };

  const handleViewDetails = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setShowDetailDialog(true);
  };

  if (loading) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Bonnetjes laden...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (receipts.length === 0) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="py-8 text-center">
            <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">Nog geen bonnetjes ingediend</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Mijn Bonnetjes</span>
            <Badge variant="secondary">{receipts.length}</Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="space-y-3">
        {receipts.map((receipt) => (
          <Card key={receipt.id} className="cursor-pointer hover:bg-accent/5 transition-colors">
            <CardContent className="py-4">
              <div className="flex gap-3">
                {/* Thumbnail */}
                <div className="flex-shrink-0">
                  <img
                    src={receipt.receipt_file_url}
                    alt="Bonnetje"
                    className="w-16 h-16 object-cover rounded-md border"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex-1">
                      <p className="font-medium text-sm truncate">
                        {receipt.description || 'Bonnetje zonder omschrijving'}
                      </p>
                      {receipt.amount && (
                        <p className="text-lg font-bold text-primary">
                          €{receipt.amount.toFixed(2)}
                        </p>
                      )}
                    </div>
                    {getStatusBadge(receipt.status)}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                    {receipt.category && (
                      <span className="px-2 py-0.5 bg-secondary rounded-full">
                        {receipt.category}
                      </span>
                    )}
                    <span>
                      {formatDistanceToNow(new Date(receipt.created_at), {
                        addSuffix: true,
                        locale: nl
                      })}
                    </span>
                  </div>

                  {receipt.rejection_reason && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                      <strong>Reden afkeuring:</strong> {receipt.rejection_reason}
                    </div>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-8 text-xs"
                    onClick={() => handleViewDetails(receipt)}
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="mx-4 max-w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bonnetje Details</DialogTitle>
          </DialogHeader>

          {selectedReceipt && (
            <div className="space-y-4">
              {/* Full Image */}
              <div className="w-full">
                <img
                  src={selectedReceipt.receipt_file_url}
                  alt="Bonnetje"
                  className="w-full h-auto rounded-lg border"
                />
              </div>

              {/* Details */}
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedReceipt.status)}</div>
                </div>

                {selectedReceipt.amount && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Bedrag</label>
                    <p className="text-2xl font-bold text-primary">
                      €{selectedReceipt.amount.toFixed(2)}
                    </p>
                  </div>
                )}

                {selectedReceipt.description && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Omschrijving</label>
                    <p className="mt-1">{selectedReceipt.description}</p>
                  </div>
                )}

                {selectedReceipt.category && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Categorie</label>
                    <p className="mt-1">
                      <Badge variant="secondary">{selectedReceipt.category}</Badge>
                    </p>
                  </div>
                )}

                {selectedReceipt.rejection_reason && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Reden afkeuring</label>
                    <div className="mt-1 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      {selectedReceipt.rejection_reason}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Ingediend op</label>
                  <p className="mt-1">
                    {new Date(selectedReceipt.created_at).toLocaleString('nl-NL', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              <Button
                onClick={() => setShowDetailDialog(false)}
                className="w-full h-12"
              >
                Sluiten
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

