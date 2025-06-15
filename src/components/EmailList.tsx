
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, MoreVertical, Edit, Archive, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface Email {
  id: string;
  subject: string;
  from_name: string;
  from_address: string;
  to_addresses: string[];
  received_at: string;
  is_read: boolean;
  is_starred: boolean;
  body_text: string;
  folder: string;
}

interface EmailListProps {
  emails: Email[];
  selectedEmails: string[];
  onSelectEmail: (id: string) => void;
  areAllSelected: boolean;
  onSelectAll: () => void;
  onReply: (email: Email) => void;
  onToggleStar: (id: string, is_starred: boolean) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}

export const EmailList: React.FC<EmailListProps> = ({
  emails,
  selectedEmails,
  onSelectEmail,
  areAllSelected,
  onSelectAll,
  onReply,
  onToggleStar,
  onArchive,
  onDelete
}) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox
                checked={areAllSelected}
                onCheckedChange={onSelectAll}
                aria-label="Select all emails"
              />
            </TableHead>
            <TableHead>Afzender</TableHead>
            <TableHead>Onderwerp</TableHead>
            <TableHead>Ontvangen</TableHead>
            <TableHead className="w-[100px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {emails.map((email) => (
            <TableRow key={email.id}>
              <TableCell className="font-medium">
                <Checkbox
                  checked={selectedEmails.includes(email.id)}
                  onCheckedChange={() => onSelectEmail(email.id)}
                  aria-label={`Select email from ${email.from_address}`}
                />
              </TableCell>
              <TableCell className="font-medium">{email.from_name}</TableCell>
              <TableCell>
                <div className="flex items-center justify-between">
                  <div className="truncate">
                    {!email.is_read && <Badge variant="secondary">Nieuw</Badge>}{' '}
                    {email.subject}
                  </div>
                  {email.is_starred && (
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  )}
                </div>
              </TableCell>
              <TableCell>{format(new Date(email.received_at), 'dd-MM-yyyy HH:mm')}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Menu openen</span>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onReply(email)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Beantwoorden
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onToggleStar(email.id, email.is_starred)}>
                      <Star className="h-4 w-4 mr-2" />
                      {email.is_starred ? 'Markering verwijderen' : 'Markeer als belangrijk'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onArchive(email.id)}>
                      <Archive className="h-4 w-4 mr-2" />
                      Archiveren
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(email.id)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Verwijderen
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          {emails.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center">
                Geen e-mails gevonden.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
