
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, RefreshCw, Check, X, Clock } from 'lucide-react';
import { useEmailSync } from '@/hooks/useEmailSync';

interface EmailAccount {
  id: string;
  display_name: string;
  email_address: string;
  provider_type?: string;
  sync_status?: string;
  last_sync_at?: string;
  is_syncing?: boolean;
}

interface EmailAccountsTableProps {
  accounts: EmailAccount[];
  onEdit: (account: EmailAccount) => void;
  onDelete: (id: string) => void;
}

export const EmailAccountsTable: React.FC<EmailAccountsTableProps> = ({ accounts, onEdit, onDelete }) => {
  const { syncEmails, isSyncing } = useEmailSync();

  const getSyncStatusBadge = (account: EmailAccount) => {
    if (account.is_syncing) {
      return <Badge variant="outline" className="text-blue-600"><Clock className="h-3 w-3 mr-1" />Syncing</Badge>;
    }
    
    switch (account.sync_status) {
      case 'success':
        return <Badge variant="outline" className="text-green-600"><Check className="h-3 w-3 mr-1" />Gesynchroniseerd</Badge>;
      case 'error':
        return <Badge variant="destructive"><X className="h-3 w-3 mr-1" />Fout</Badge>;
      case 'never_synced':
        return <Badge variant="secondary">Nog niet gesynchroniseerd</Badge>;
      default:
        return <Badge variant="secondary">Onbekend</Badge>;
    }
  };

  const getProviderBadge = (providerType?: string) => {
    switch (providerType) {
      case 'gmail':
        return <Badge className="bg-blue-100 text-blue-800">Gmail</Badge>;
      case 'outlook':
        return <Badge className="bg-blue-100 text-blue-800">Outlook</Badge>;
      case 'yahoo':
        return <Badge className="bg-purple-100 text-purple-800">Yahoo</Badge>;
      default:
        return <Badge variant="outline">IMAP</Badge>;
    }
  };

  const handleSync = (accountId: string) => {
    syncEmails({ emailSettingsId: accountId });
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Weergavenaam</TableHead>
            <TableHead>E-mailadres</TableHead>
            <TableHead>Provider</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Laatste sync</TableHead>
            <TableHead className="text-right">Acties</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.map((account) => (
            <TableRow key={account.id}>
              <TableCell className="font-medium">{account.display_name}</TableCell>
              <TableCell>{account.email_address}</TableCell>
              <TableCell>{getProviderBadge(account.provider_type)}</TableCell>
              <TableCell>{getSyncStatusBadge(account)}</TableCell>
              <TableCell>
                {account.last_sync_at 
                  ? new Date(account.last_sync_at).toLocaleString('nl-NL')
                  : 'Nooit'
                }
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => handleSync(account.id)}
                    disabled={account.is_syncing || isSyncing}
                  >
                    <RefreshCw className={`h-4 w-4 ${account.is_syncing ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => onEdit(account)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="icon" onClick={() => onDelete(account.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {accounts.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center">
                Geen accounts gevonden.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
