import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import {
  getApprovalRules,
  createApprovalRule,
  updateApprovalRule,
  deleteApprovalRule,
  type ApprovalRule,
} from '@/utils/receiptApprovalService';

export const ApprovalRulesManager: React.FC = () => {
  const { toast } = useToast();
  const [rules, setRules] = useState<ApprovalRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<ApprovalRule | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    max_amount: '',
    category: '',
    user_id: '',
    role: '',
    auto_approve: true,
    is_active: true,
    priority: 0,
  });

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    setLoading(true);
    try {
      const data = await getApprovalRules();
      setRules(data);
    } catch (error) {
      console.error('Error loading approval rules:', error);
      toast({
        title: 'Fout bij laden',
        description: 'Kon goedkeuringsregels niet laden',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (rule?: ApprovalRule) => {
    if (rule) {
      setEditingRule(rule);
      setFormData({
        name: rule.name,
        description: rule.description || '',
        max_amount: rule.max_amount?.toString() || '',
        category: rule.category || '',
        user_id: rule.user_id || '',
        role: rule.role || '',
        auto_approve: rule.auto_approve,
        is_active: rule.is_active,
        priority: rule.priority,
      });
    } else {
      setEditingRule(null);
      setFormData({
        name: '',
        description: '',
        max_amount: '',
        category: '',
        user_id: '',
        role: '',
        auto_approve: true,
        is_active: true,
        priority: 0,
      });
    }
    setShowDialog(true);
  };

  const handleSave = async () => {
    try {
      const ruleData = {
        name: formData.name,
        description: formData.description || undefined,
        max_amount: formData.max_amount ? parseFloat(formData.max_amount) : null,
        category: formData.category || null,
        user_id: formData.user_id || null,
        role: formData.role || null,
        auto_approve: formData.auto_approve,
        is_active: formData.is_active,
        priority: formData.priority,
      };

      if (editingRule) {
        await updateApprovalRule(editingRule.id, ruleData);
        toast({
          title: 'Regel bijgewerkt',
          description: 'Goedkeuringsregel is succesvol bijgewerkt',
        });
      } else {
        await createApprovalRule(ruleData);
        toast({
          title: 'Regel aangemaakt',
          description: 'Goedkeuringsregel is succesvol aangemaakt',
        });
      }

      setShowDialog(false);
      loadRules();
    } catch (error) {
      console.error('Error saving approval rule:', error);
      toast({
        title: 'Fout bij opslaan',
        description: 'Kon goedkeuringsregel niet opslaan',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (ruleId: string) => {
    if (!window.confirm('Weet je zeker dat je deze regel wilt verwijderen?')) {
      return;
    }

    try {
      await deleteApprovalRule(ruleId);
      toast({
        title: 'Regel verwijderd',
        description: 'Goedkeuringsregel is succesvol verwijderd',
      });
      loadRules();
    } catch (error) {
      console.error('Error deleting approval rule:', error);
      toast({
        title: 'Fout bij verwijderen',
        description: 'Kon goedkeuringsregel niet verwijderen',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (rule: ApprovalRule) => {
    try {
      await updateApprovalRule(rule.id, { is_active: !rule.is_active });
      toast({
        title: rule.is_active ? 'Regel gedeactiveerd' : 'Regel geactiveerd',
        description: `Regel is ${rule.is_active ? 'uit' : 'in'}geschakeld`,
      });
      loadRules();
    } catch (error) {
      console.error('Error toggling rule:', error);
      toast({
        title: 'Fout',
        description: 'Kon regel status niet wijzigen',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">Goedkeuringsregels</h2>
          <p className="text-gray-600 mt-1">
            Beheer automatische goedkeuringsregels voor bonnetjes
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-[hsl(0,71%,36%)] hover:bg-[hsl(0,71%,30%)]">
          <Plus className="h-4 w-4 mr-2" />
          Nieuwe Regel
        </Button>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <p className="text-sm text-blue-900">
            💡 <strong>Tip:</strong> Regels met hogere prioriteit worden eerst gecontroleerd. 
            Als meerdere regels van toepassing zijn, wordt de eerste match gebruikt.
          </p>
        </CardContent>
      </Card>

      {/* Rules Table */}
      <Card>
        <CardHeader>
          <CardTitle>Actieve Regels ({rules.filter(r => r.is_active).length})</CardTitle>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Nog geen goedkeuringsregels aangemaakt</p>
              <p className="text-sm mt-2">Klik op "Nieuwe Regel" om te beginnen</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Naam</TableHead>
                  <TableHead>Voorwaarden</TableHead>
                  <TableHead>Actie</TableHead>
                  <TableHead>Prioriteit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{rule.name}</p>
                        {rule.description && (
                          <p className="text-sm text-gray-500">{rule.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        {rule.max_amount && (
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500">Max bedrag:</span>
                            <span className="font-medium">€ {rule.max_amount.toFixed(2)}</span>
                          </div>
                        )}
                        {rule.category && (
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500">Categorie:</span>
                            <span className="font-medium">{rule.category}</span>
                          </div>
                        )}
                        {rule.role && (
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500">Rol:</span>
                            <span className="font-medium">{rule.role}</span>
                          </div>
                        )}
                        {!rule.max_amount && !rule.category && !rule.role && (
                          <span className="text-gray-400">Alle bonnetjes</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {rule.auto_approve ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Auto-goedkeuren
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="h-3 w-3 mr-1" />
                          Handmatig
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{rule.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={() => handleToggleActive(rule)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(rule)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(rule.id)}
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

      {/* Edit/Create Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? 'Regel Bewerken' : 'Nieuwe Regel Aanmaken'}
            </DialogTitle>
            <DialogDescription>
              Stel voorwaarden in voor automatische goedkeuring van bonnetjes
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Naam *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Bijv. Auto-goedkeuring kleine bedragen"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Beschrijving</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optionele uitleg over deze regel"
                rows={2}
              />
            </div>

            {/* Max Amount */}
            <div className="space-y-2">
              <Label htmlFor="max_amount">Maximaal Bedrag (€)</Label>
              <Input
                id="max_amount"
                type="number"
                step="0.01"
                value={formData.max_amount}
                onChange={(e) => setFormData({ ...formData, max_amount: e.target.value })}
                placeholder="Bijv. 50.00 (leeg = geen limiet)"
              />
              <p className="text-xs text-gray-500">
                Bonnetjes tot dit bedrag worden automatisch goedgekeurd
              </p>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Categorie</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Bijv. brandstof, materiaal (leeg = alle categorieën)"
              />
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="role">Rol</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Alle rollen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle rollen</SelectItem>
                  <SelectItem value="Installateur">Installateur</SelectItem>
                  <SelectItem value="Administratie">Administratie</SelectItem>
                  <SelectItem value="Administrator">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">Prioriteit</Label>
              <Input
                id="priority"
                type="number"
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })
                }
                placeholder="0"
              />
              <p className="text-xs text-gray-500">
                Hogere nummers = hogere prioriteit (worden eerst gecontroleerd)
              </p>
            </div>

            {/* Auto Approve */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto_approve">Automatisch Goedkeuren</Label>
                <p className="text-sm text-gray-500">
                  Bonnetjes die aan deze regel voldoen worden automatisch goedgekeurd
                </p>
              </div>
              <Switch
                id="auto_approve"
                checked={formData.auto_approve}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, auto_approve: checked })
                }
              />
            </div>

            {/* Is Active */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="is_active">Actief</Label>
                <p className="text-sm text-gray-500">Deze regel is momenteel actief</p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Annuleren
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.name}
              className="bg-[hsl(0,71%,36%)] hover:bg-[hsl(0,71%,30%)]"
            >
              {editingRule ? 'Bijwerken' : 'Aanmaken'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

