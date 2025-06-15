
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Folder,
  Archive,
  Trash2,
  MoreVertical,
  Inbox,
  Send,
  FileText,
  Star,
  Edit,
  Settings,
  RefreshCw,
  Clock,
  Trash
} from 'lucide-react';
import { EmailCompose } from './EmailCompose';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

interface EmailAccount {
  id: string;
  display_name: string;
}

export function Email() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeFolder, setActiveFolder] = useState('inbox');
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isComposeOpen, setComposeOpen] = useState(false);
  const [replyToEmail, setReplyToEmail] = useState<Email | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | 'all'>('all');

  // Fetch emails
  const { data: emails = [], isLoading: isLoadingEmails, refetch } = useQuery<Email[]>({
    queryKey: ['emails', user?.id, activeFolder, selectedAccountId],
    queryFn: async () => {
      if (!user?.id) return [];
      let query = supabase
        .from('emails')
        .select('*')
        .eq('user_id', user.id)
        .eq('folder', activeFolder);

      if (selectedAccountId !== 'all') {
        query = query.eq('email_settings_id', selectedAccountId);
      }
      
      const { data, error } = await query.order('received_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  // Fetch accounts to check if any exist
  const { data: emailAccounts = [] } = useQuery<EmailAccount[]>({
    queryKey: ['email-accounts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('user_email_settings')
        .select('id, display_name')
        .eq('user_id', user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  const emailMutation = useMutation({
    mutationFn: async ({ action, ids }: { action: 'archive' | 'delete' | 'read' | 'unread' | 'star' | 'unstar', ids: string[] }) => {
      if (action === 'delete') {
        const { error } = await supabase.from('emails').delete().in('id', ids);
        if (error) throw error;
        return;
      }

      let updatePayload: any = {};
      if (action === 'archive') updatePayload.folder = 'archive';
      if (action === 'read') updatePayload.is_read = true;
      if (action === 'unread') updatePayload.is_read = false;
      if (action === 'star') updatePayload.is_starred = true;
      if (action === 'unstar') updatePayload.is_starred = false;
      
      const { error } = await supabase.from('emails').update(updatePayload).in('id', ids).eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      setSelectedEmails([]);
    },
    onError: (error: any) => {
      toast({ title: 'Fout', description: error.message, variant: 'destructive' });
    }
  });

  const handleSelectEmail = (id: string) => {
    setSelectedEmails(prev => {
      if (prev.includes(id)) {
        return prev.filter(emailId => emailId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const filteredEmails = useMemo(() => {
    return emails.filter(email =>
      email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.body_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.from_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [emails, searchTerm]);

  const areAllSelected = filteredEmails.length > 0 && selectedEmails.length === filteredEmails.length;
  const handleSelectAllEmails = () => {
    if (areAllSelected) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails(filteredEmails.map(email => email.id));
    }
  };

  const selectedEmailsData = useMemo(() => {
    return emails.filter(email => selectedEmails.includes(email.id));
  }, [emails, selectedEmails]);

  const handleMoveToTrash = async () => {
    await emailMutation.mutateAsync({ action: 'delete', ids: selectedEmails });
  };

  const handleArchive = async () => {
    await emailMutation.mutateAsync({ action: 'archive', ids: selectedEmails });
  };

  const handleMarkAsRead = async () => {
    await emailMutation.mutateAsync({ action: 'read', ids: selectedEmails });
  };

  const handleMarkAsUnread = async () => {
    await emailMutation.mutateAsync({ action: 'unread', ids: selectedEmails });
  };

  const handleStar = async () => {
    await emailMutation.mutateAsync({ action: 'star', ids: selectedEmails });
  };

  const handleUnstar = async () => {
    await emailMutation.mutateAsync({ action: 'unstar', ids: selectedEmails });
  };

  const hasEmailAccounts = emailAccounts.length > 0;

  return (
    <div className="h-full flex flex-col">
      <EmailCompose open={isComposeOpen} onOpenChange={setComposeOpen} replyTo={replyToEmail} />

      <div className="border-b">
        <div className="container flex items-center h-14">
          <h1 className="text-2xl font-semibold">E-mail</h1>
        </div>
      </div>

      <div className="container h-full flex flex-col md:flex-row">
        {/* Sidebar */}
        <div className="w-full md:w-64 border-r h-full py-4">
          <div className="px-4">
            <Button onClick={() => setComposeOpen(true)} className="w-full mb-4 bg-smans-primary hover:bg-smans-primary/90">Nieuwe E-mail</Button>
          </div>
          <div className="space-y-1 px-2">
            <Button variant={activeFolder === 'inbox' ? 'secondary' : 'ghost'} className="justify-start w-full font-normal" onClick={() => setActiveFolder('inbox')}>
              <Inbox className="h-4 w-4 mr-2" />
              Postvak IN
            </Button>
            <Button variant={activeFolder === 'sent' ? 'secondary' : 'ghost'} className="justify-start w-full font-normal" onClick={() => setActiveFolder('sent')}>
              <Send className="h-4 w-4 mr-2" />
              Verzonden
            </Button>
            <Button variant={activeFolder === 'archive' ? 'secondary' : 'ghost'} className="justify-start w-full font-normal" onClick={() => setActiveFolder('archive')}>
              <Archive className="h-4 w-4 mr-2" />
              Archief
            </Button>
            <Button variant={activeFolder === 'drafts' ? 'secondary' : 'ghost'} className="justify-start w-full font-normal" onClick={() => setActiveFolder('drafts')}>
              <FileText className="h-4 w-4 mr-2" />
              Concepten
            </Button>
            <Button variant={activeFolder === 'starred' ? 'secondary' : 'ghost'} className="justify-start w-full font-normal" onClick={() => setActiveFolder('starred')}>
              <Star className="h-4 w-4 mr-2" />
              Gemarkeerd
            </Button>
            <Button variant={activeFolder === 'scheduled' ? 'secondary' : 'ghost'} className="justify-start w-full font-normal" onClick={() => setActiveFolder('scheduled')}>
              <Clock className="h-4 w-4 mr-2" />
              Gepland
            </Button>
            <Button variant={activeFolder === 'trash' ? 'secondary' : 'ghost'} className="justify-start w-full font-normal" onClick={() => setActiveFolder('trash')}>
              <Trash className="h-4 w-4 mr-2" />
              Prullenbak
            </Button>
          </div>
          {!hasEmailAccounts && (
            <div className="mt-4 px-4 text-sm text-muted-foreground">
              <p>Er zijn nog geen e-mailaccounts ingesteld.</p>
              <Button variant="link" onClick={() => { /* Navigate to settings */ }}>
                <a href="/settings">Ga naar instellingen om een account toe te voegen.</a>
              </Button>
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Input
                type="search"
                placeholder="Zoek e-mails..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              {hasEmailAccounts && (
                <Select value={selectedAccountId} onValueChange={(value) => setSelectedAccountId(value)}>
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
                    <Button variant="outline" size="icon" onClick={() => refetch()}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Verversen</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {selectedEmails.length > 0 && (
                <>
                  <Button variant="outline" size="sm" onClick={handleMarkAsRead}>Markeer als gelezen</Button>
                  <Button variant="outline" size="sm" onClick={handleMarkAsUnread}>Markeer als ongelezen</Button>
                  <Button variant="outline" size="sm" onClick={handleStar}>Markeer als belangrijk</Button>
                  <Button variant="outline" size="sm" onClick={handleUnstar}>Verwijder markering</Button>
                  <Button variant="destructive" size="sm" onClick={handleMoveToTrash}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Verwijderen
                  </Button>
                  <Button variant="secondary" size="sm" onClick={handleArchive}>
                    <Archive className="h-4 w-4 mr-2" />
                    Archiveren
                  </Button>
                </>
              )}
            </div>
          </div>

          {isLoadingEmails ? (
            <div className="text-center">E-mails laden...</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={areAllSelected}
                        onCheckedChange={handleSelectAllEmails}
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
                  {filteredEmails.map((email) => (
                    <TableRow key={email.id}>
                      <TableCell className="font-medium">
                        <Checkbox
                          checked={selectedEmails.includes(email.id)}
                          onCheckedChange={() => handleSelectEmail(email.id)}
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
                            <Star className="h-4 w-4 text-yellow-500" />
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
                            <DropdownMenuItem onClick={() => setReplyToEmail(email)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Beantwoorden
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSelectEmail(email.id)}>
                              <Star className="h-4 w-4 mr-2" />
                              Markeer als belangrijk
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSelectEmail(email.id)}>
                              <Archive className="h-4 w-4 mr-2" />
                              Archiveren
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSelectEmail(email.id)}>
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
          )}
        </div>
      </div>
    </div>
  );
}
