
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RefreshCw, Trash2, Archive } from 'lucide-react';

interface EmailAccount {
  id: string;
  display_name: string;
}

interface EmailToolbarProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  selectedAccountId: string | 'all';
  onSelectedAccountIdChange: (id: string | 'all') => void;
  hasEmailAccounts: boolean;
  emailAccounts: EmailAccount[];
  onRefresh: () => void;
  selectedEmailsCount: number;
  onMarkAsRead: () => void;
  onMarkAsUnread: () => void;
  onStar: () => void;
  onUnstar: () => void;
  onDelete: () => void;
  onArchive: () => void;
}

export const EmailToolbar: React.FC<EmailToolbarProps> = ({
  searchTerm,
  onSearchTermChange,
  selectedAccountId,
  onSelectedAccountIdChange,
  hasEmailAccounts,
  emailAccounts,
  onRefresh,
  selectedEmailsCount,
  onMarkAsRead,
  onMarkAsUnread,
  onStar,
  onUnstar,
  onDelete,
  onArchive,
}) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-4">
        <Input
          type="search"
          placeholder="Zoek e-mails..."
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          className="max-w-sm"
        />
        {hasEmailAccounts && (
          <Select value={selectedAccountId} onValueChange={onSelectedAccountIdChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Selecteer account" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Accounts</SelectItem>
              {emailAccounts.map(account => (
                <SelectItem key={account.id} value={account.id}>{account.display_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={onRefresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Verversen</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {selectedEmailsCount > 0 && (
          <>
            <Button variant="outline" size="sm" onClick={onMarkAsRead}>Markeer als gelezen</Button>
            <Button variant="outline" size="sm" onClick={onMarkAsUnread}>Markeer als ongelezen</Button>
            <Button variant="outline" size="sm" onClick={onStar}>Markeer als belangrijk</Button>
            <Button variant="outline" size="sm" onClick={onUnstar}>Verwijder markering</Button>
            <Button variant="destructive" size="sm" onClick={onDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Verwijderen
            </Button>
            <Button variant="secondary" size="sm" onClick={onArchive}>
              <Archive className="h-4 w-4 mr-2" />
              Archiveren
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
