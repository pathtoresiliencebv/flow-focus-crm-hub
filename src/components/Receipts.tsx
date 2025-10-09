import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { SlidePanel } from '@/components/ui/slide-panel';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { ImageUpload } from '@/components/ImageUpload';
import { MobileReceiptCard } from '@/components/mobile/MobileReceiptCard';
import { IconBox } from '@/components/ui/icon-box';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { Clock, Check, X, Eye, Mail, Settings, CheckSquare, Inbox, Upload } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ApprovalRulesManager } from './receipts/ApprovalRulesManager';
import { EmailSettingsTab } from './receipts/EmailSettingsTab';
import { bulkApproveReceipts, bulkRejectReceipts } from '@/utils/receiptApprovalService';

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
  const [activeTab, setActiveTab] = useState('pending'); // Start with "Inkomend" tab
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ id: string; action: 'approve' | 'reject' } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedReceipts, setSelectedReceipts] = useState<Set<string>>(new Set());
  const [newReceipt, setNewReceipt] = useState({
    amount: '',
    description: '',
    category: '',
    fileData: null as string | null
  });
  const [loading, setLoading] = useState(true); // Start with loading true
  const [initialLoad, setInitialLoad] = useState(true);

  // ✅ FUNCTION DECLARATIONS FIRST (to avoid hoisting issues)
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

  // Bulk selection handlers
  const toggleReceiptSelection = (receiptId: string) => {
    const newSelection = new Set(selectedReceipts);
    if (newSelection.has(receiptId)) {
      newSelection.delete(receiptId);
    } else {
      newSelection.add(receiptId);
    }
    setSelectedReceipts(newSelection);
  };

  const toggleSelectAll = () => {
    const pendingReceipts = receipts.filter(r => r.status === 'pending');
    if (selectedReceipts.size === pendingReceipts.length) {
      // Deselect all
      setSelectedReceipts(new Set());
    } else {
      // Select all
      setSelectedReceipts(new Set(pendingReceipts.map(r => r.id)));
    }
  };

  const handleBulkApprove = async () => {
    if (selectedReceipts.size === 0) return;
    
    if (!window.confirm(`Weet je zeker dat je ${selectedReceipts.size} bonnetje(s) wilt goedkeuren?`)) {
      return;
    }

    try {
      setLoading(true);
      const count = await bulkApproveReceipts(Array.from(selectedReceipts), profile!.id);
      
      toast({
        title: 'Bonnetjes goedgekeurd',
        description: `${count} bonnetje(s) zijn goedgekeurd`,
      });
      
      setSelectedReceipts(new Set());
      loadReceipts();
    } catch (error: any) {
      console.error('Error bulk approving:', error);
      toast({
        title: 'Fout',
        description: 'Kon bonnetjes niet goedkeuren',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedReceipts.size === 0) return;
    
    const reason = window.prompt(`Geef een reden voor afwijzing van ${selectedReceipts.size} bonnetje(s):`);
    if (!reason) return;

    try {
      setLoading(true);
      const count = await bulkRejectReceipts(Array.from(selectedReceipts), reason, profile!.id);
      
      toast({
        title: 'Bonnetjes afgewezen',
        description: `${count} bonnetje(s) zijn afgewezen`,
      });
      
      setSelectedReceipts(new Set());
      loadReceipts();
    } catch (error: any) {
      console.error('Error bulk rejecting:', error);
      toast({
        title: 'Fout',
        description: 'Kon bonnetjes niet afwijzen',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('nl-NL');
  const formatAmount = (amount?: number | null) => amount ? `€${amount.toFixed(2)}` : '-';

  // ✅ EFFECTS AFTER FUNCTION DECLARATIONS
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await Promise.all([loadReceipts(), loadUsers()]);
        subscribeToReceipts();
      } catch (error) {
        console.error('Error loading receipts data:', error);
      } finally {
        setLoading(false);
        setInitialLoad(false);
      }
    };
    loadData();
  }, []);

  // ✅ EARLY RETURNS AFTER useEffect
  // Show loading state during initial load
  if (initialLoad && loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Bonnetjes laden...</p>
        </div>
      </div>
    );
  }

  // ✅ REMOVED: Always show interface, even with 0 receipts
  // Empty states are now shown within each tab

  const pendingReceipts = receipts.filter(r => r.status === 'pending');
  const allSelectedPending = selectedReceipts.size > 0 && selectedReceipts.size === pendingReceipts.length;

  return (
    <div className="p-4 space-y-6">
      {/* Icon Boxes Navigation */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-6">
        <IconBox
          icon={<Inbox className="h-6 w-6" />}
          label="Inkomend"
          active={activeTab === "pending"}
          onClick={() => setActiveTab("pending")}
          count={receipts.filter(r => r.status === 'pending').length}
        />
        <IconBox
          icon={<Check className="h-6 w-6" />}
          label="Verwerkt"
          active={activeTab === "processed"}
          onClick={() => setActiveTab("processed")}
          count={receipts.filter(r => r.status === 'approved' || r.status === 'rejected').length}
        />
        <IconBox
          icon={<Clock className="h-6 w-6" />}
          label="Alle"
          active={activeTab === "all"}
          onClick={() => setActiveTab("all")}
          count={receipts.length}
        />
        <IconBox
          icon={<Mail className="h-6 w-6" />}
          label="Mail"
          active={activeTab === "email"}
          onClick={() => setActiveTab("email")}
          count={receipts.filter(r => r.email_message_id).length}
        />
        <IconBox
          icon={<CheckSquare className="h-6 w-6" />}
          label="Regels"
          active={activeTab === "rules"}
          onClick={() => setActiveTab("rules")}
        />
        <IconBox
          icon={<Settings className="h-6 w-6" />}
          label="Instellingen"
          active={activeTab === "settings"}
          onClick={() => setActiveTab("settings")}
        />
      </div>

      {/* Bulk Actions Bar (only for all tab with pending receipts) */}
      {activeTab === "all" && ['Administrator', 'Administratie'].includes(profile?.role || '') && pendingReceipts.length > 0 && (
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={allSelectedPending}
                    onCheckedChange={toggleSelectAll}
                  />
                  <span className="text-sm font-medium">
                    {selectedReceipts.size > 0
                      ? `${selectedReceipts.size} geselecteerd`
                      : 'Selecteer alles'}
                  </span>
                </div>
              </div>
              {selectedReceipts.size > 0 && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleBulkApprove}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Goedkeuren ({selectedReceipts.size})
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleBulkReject}
                    disabled={loading}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Afwijzen ({selectedReceipts.size})
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      {/* Inkomende Bonnetjes (Pending) */}
      {activeTab === "pending" && (
        <div className="space-y-4">
          {receipts.filter(r => r.status === 'pending').length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Inbox className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Geen inkomende bonnetjes</h3>
                <p className="text-gray-600 mb-4">Er zijn momenteel geen bonnetjes die goedkeuring vereisen.</p>
                <Button onClick={() => setShowUploadDialog(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Bonnetje uploaden
                </Button>
              </CardContent>
            </Card>
          ) : (
            receipts.filter(r => r.status === 'pending').map((receipt) => (
              <Card key={receipt.id} className="border-orange-200 bg-orange-50/30">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      {['Administrator', 'Administratie'].includes(profile?.role || '') && (
                        <Checkbox
                          checked={selectedReceipts.has(receipt.id)}
                          onCheckedChange={() => {
                            const newSelected = new Set(selectedReceipts);
                            if (newSelected.has(receipt.id)) {
                              newSelected.delete(receipt.id);
                            } else {
                              newSelected.add(receipt.id);
                            }
                            setSelectedReceipts(newSelected);
                          }}
                          className="mr-3 inline-block"
                        />
                      )}
                      <div className="inline-block">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{receipt.description}</h4>
                          <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                            <Clock className="h-3 w-3 mr-1" />
                            Wacht op goedkeuring
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(receipt.created_at)} • {formatAmount(receipt.amount)}
                        </p>
                        {receipt.email_from && (
                          <p className="text-xs text-muted-foreground">Via email: {receipt.email_from}</p>
                        )}
                        {receipt.user_name && (
                          <p className="text-xs text-muted-foreground">Ingediend door: {receipt.user_name}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => viewReceipt(receipt)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {['Administrator', 'Administratie'].includes(profile?.role || '') && (
                        <>
                          <Button 
                            size="sm" 
                            onClick={() => handleApprovalAction(receipt.id, 'approve')} 
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => handleApprovalAction(receipt.id, 'reject')} 
                            disabled={loading}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Verwerkte Bonnetjes (Approved + Rejected) */}
      {activeTab === "processed" && (
        <div className="space-y-4">
          {receipts.filter(r => r.status === 'approved' || r.status === 'rejected').length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Check className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Geen verwerkte bonnetjes</h3>
                <p className="text-gray-600">Er zijn nog geen goedgekeurde of afgewezen bonnetjes.</p>
              </CardContent>
            </Card>
          ) : (
            receipts.filter(r => r.status === 'approved' || r.status === 'rejected').map((receipt) => (
              <Card key={receipt.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{receipt.description}</h4>
                        {receipt.status === 'approved' ? (
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            <Check className="h-3 w-3 mr-1" />
                            Goedgekeurd
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800 border-red-200">
                            <X className="h-3 w-3 mr-1" />
                            Afgewezen
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(receipt.created_at)} • {formatAmount(receipt.amount)}
                      </p>
                      {receipt.user_name && (
                        <p className="text-xs text-muted-foreground">Door: {receipt.user_name}</p>
                      )}
                      {receipt.approver_name && (
                        <p className="text-xs text-muted-foreground">
                          {receipt.status === 'approved' ? 'Goedgekeurd' : 'Afgewezen'} door: {receipt.approver_name}
                        </p>
                      )}
                      {receipt.rejection_reason && receipt.status === 'rejected' && (
                        <p className="text-xs text-red-600 mt-1">Reden: {receipt.rejection_reason}</p>
                      )}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => viewReceipt(receipt)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Goedgekeurde Bonnetjes */}
      {activeTab === "approved" && (
        <div className="space-y-4">
          {receipts.filter(r => r.status === 'approved').map((receipt) => (
            <Card key={receipt.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{receipt.description}</h4>
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        <Check className="h-3 w-3 mr-1" />
                        Goedgekeurd
                      </Badge>
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
        </div>
      )}

      {/* Alle Bonnetjes */}
      {activeTab === "all" && (
        <div className="space-y-4">
          {receipts.map((receipt) => (
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
                    {receipt.email_from && (
                      <p className="text-xs text-muted-foreground">Via: {receipt.email_from}</p>
                    )}
                    {receipt.user_name && (
                      <p className="text-xs text-muted-foreground">Door: {receipt.user_name}</p>
                    )}
                    {receipt.approver_name && receipt.status === 'approved' && (
                      <p className="text-xs text-muted-foreground">Goedgekeurd door: {receipt.approver_name}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => viewReceipt(receipt)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {receipt.status === 'pending' && ['Administrator', 'Administratie'].includes(profile?.role || '') && (
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
        </div>
      )}

      {/* Approval Rules Tab */}
      {activeTab === "rules" && <ApprovalRulesManager />}

      {/* Mail Bonnetjes Tab */}
      {activeTab === "email" && (
        <div className="space-y-4">
          {receipts.filter(r => r.email_message_id).length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Mail Bonnetjes
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
                    <li>• Verstuur bonnetjes naar: <strong>bonnetjes@smanscrm.nl</strong></li>
                    <li>• Voeg foto's of PDF's toe als bijlage</li>
                    <li>• Systeem verwerkt automatisch elke 5 minuten</li>
                    <li>• Bonnetjes die aan regels voldoen worden automatisch goedgekeurd</li>
                  </ul>
                </div>
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <h5 className="font-medium text-blue-900 dark:text-blue-100">📧 Geen mail bonnetjes</h5>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Er zijn nog geen bonnetjes via email ontvangen. Voor IMAP configuratie, ga naar <strong>"Instellingen"</strong>.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            receipts.filter(r => r.email_message_id).map((receipt) => (
              <Card key={receipt.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-blue-600" />
                        <h4 className="font-medium">{receipt.description}</h4>
                        {getStatusBadge(receipt.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(receipt.created_at)} • {formatAmount(receipt.amount)}
                      </p>
                      {receipt.email_from && (
                        <p className="text-xs text-muted-foreground">Van: {receipt.email_from}</p>
                      )}
                      {receipt.subject && (
                        <p className="text-xs text-muted-foreground">Onderwerp: {receipt.subject}</p>
                      )}
                      {receipt.approver_name && receipt.status === 'approved' && (
                        <p className="text-xs text-muted-foreground">Goedgekeurd door: {receipt.approver_name}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => viewReceipt(receipt)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {receipt.status === 'pending' && ['Administrator', 'Administratie'].includes(profile?.role || '') && (
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
            ))
          )}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === "settings" && <EmailSettingsTab />}

      {/* Upload SlidePanel */}
      <SlidePanel
        isOpen={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        title="Nieuw bonnetje uploaden"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <Label>Bestand *</Label>
            <ImageUpload value={newReceipt.fileData} onChange={handleFileUpload} />
            <p className="text-xs text-muted-foreground mt-1">
              Upload een foto of scan van het bonnetje
            </p>
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
          
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowUploadDialog(false)} disabled={loading} className="flex-1">
              Annuleren
            </Button>
            <Button onClick={saveReceipt} disabled={loading} className="flex-1">
              <Upload className="mr-2 h-4 w-4" />
              {loading ? 'Bezig...' : 'Opslaan'}
            </Button>
          </div>
        </div>
      </SlidePanel>

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
