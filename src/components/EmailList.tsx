
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Star, Archive, Trash, MoreVertical, Reply, Forward } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Email {
  id: string;
  subject: string;
  from_address: string;
  from_name?: string;
  body_text?: string;
  received_at?: string;
  sent_at?: string;
  is_read: boolean;
  is_starred: boolean;
  folder: string;
}

interface EmailListProps {
  activeFolder: string;
  onEmailSelect: (email: Email) => void;
  onReply: (email: Email) => void;
  onForward: (email: Email) => void;
}

export const EmailList: React.FC<EmailListProps> = ({ 
  activeFolder, 
  onEmailSelect, 
  onReply, 
  onForward 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchEmails = async () => {
    if (!user) return;

    console.log('Fetching emails for user:', user.id, 'folder:', activeFolder);
    
    try {
      setLoading(true);
      
      let query = supabase
        .from('emails')
        .select('*')
        .eq('user_id', user.id) // Critical: filter by current user
        .order('created_at', { ascending: false });

      // Filter by folder
      if (activeFolder === 'inbox') {
        query = query.eq('folder', 'inbox');
      } else if (activeFolder === 'sent') {
        query = query.eq('folder', 'sent');
      } else if (activeFolder === 'drafts') {
        query = query.eq('is_draft', true);
      } else if (activeFolder === 'starred') {
        query = query.eq('is_starred', true);
      } else if (activeFolder === 'archive') {
        query = query.eq('folder', 'archive');
      } else if (activeFolder === 'trash') {
        query = query.eq('folder', 'trash');
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching emails:', error);
        throw error;
      }

      console.log('Fetched emails:', data?.length || 0);
      setEmails(data || []);
    } catch (error) {
      console.error('Error in fetchEmails:', error);
      toast({
        title: "Fout bij ophalen e-mails",
        description: "Er ging iets mis bij het ophalen van de e-mails.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, [user, activeFolder]);

  const handleToggleRead = async (emailId: string, isRead: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('emails')
        .update({ is_read: !isRead })
        .eq('id', emailId)
        .eq('user_id', user.id); // Security: ensure user owns the email

      if (error) throw error;

      setEmails(emails.map(email => 
        email.id === emailId ? { ...email, is_read: !isRead } : email
      ));
    } catch (error) {
      console.error('Error toggling read status:', error);
    }
  };

  const handleToggleStar = async (emailId: string, isStarred: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('emails')
        .update({ is_starred: !isStarred })
        .eq('id', emailId)
        .eq('user_id', user.id); // Security: ensure user owns the email

      if (error) throw error;

      setEmails(emails.map(email => 
        email.id === emailId ? { ...email, is_starred: !isStarred } : email
      ));
    } catch (error) {
      console.error('Error toggling star:', error);
    }
  };

  const handleMoveToFolder = async (emailIds: string[], folder: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('emails')
        .update({ folder })
        .in('id', emailIds)
        .eq('user_id', user.id); // Security: ensure user owns the emails

      if (error) throw error;

      setEmails(emails.filter(email => !emailIds.includes(email.id)));
      setSelectedEmails([]);
      
      toast({
        title: "E-mails verplaatst",
        description: `${emailIds.length} e-mail(s) verplaatst naar ${folder}.`,
      });
    } catch (error) {
      console.error('Error moving emails:', error);
    }
  };

  const filteredEmails = emails.filter(email =>
    email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.from_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (email.from_name && email.from_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getFolderTitle = () => {
    switch (activeFolder) {
      case 'inbox': return 'Postvak IN';
      case 'sent': return 'Verzonden';
      case 'drafts': return 'Concepten';
      case 'starred': return 'Gemarkeerd';
      case 'archive': return 'Archief';
      case 'trash': return 'Prullenbak';
      default: return 'E-mails';
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-smans-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">E-mails laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-4">
        <h2 className="text-xl font-semibold mb-4">{getFolderTitle()}</h2>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="E-mails zoeken..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          {selectedEmails.length > 0 && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => handleMoveToFolder(selectedEmails, 'archive')}>
                <Archive className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleMoveToFolder(selectedEmails, 'trash')}>
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Email List */}
      <div className="flex-1 overflow-y-auto">
        {filteredEmails.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Geen e-mails gevonden in {getFolderTitle().toLowerCase()}.</p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredEmails.map((email) => (
              <div
                key={email.id}
                className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                  !email.is_read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
                onClick={() => onEmailSelect(email)}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedEmails.includes(email.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedEmails([...selectedEmails, email.id]);
                      } else {
                        setSelectedEmails(selectedEmails.filter(id => id !== email.id));
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleStar(email.id, email.is_starred);
                    }}
                    className="mt-1"
                  >
                    <Star className={`h-4 w-4 ${email.is_starred ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${!email.is_read ? 'font-semibold' : 'font-medium'}`}>
                          {email.from_name || email.from_address}
                        </span>
                        {!email.is_read && <Badge variant="secondary" className="text-xs">Nieuw</Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {email.received_at ? new Date(email.received_at).toLocaleDateString('nl-NL') : 
                           email.sent_at ? new Date(email.sent_at).toLocaleDateString('nl-NL') : ''}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onReply(email)}>
                              <Reply className="h-4 w-4 mr-2" />
                              Beantwoorden
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onForward(email)}>
                              <Forward className="h-4 w-4 mr-2" />
                              Doorsturen
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleRead(email.id, email.is_read)}>
                              {email.is_read ? 'Markeren als ongelezen' : 'Markeren als gelezen'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleMoveToFolder([email.id], 'archive')}>
                              <Archive className="h-4 w-4 mr-2" />
                              Archiveren
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleMoveToFolder([email.id], 'trash')}>
                              <Trash className="h-4 w-4 mr-2" />
                              Verwijderen
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <div className={`text-sm ${!email.is_read ? 'font-semibold' : ''} mt-1`}>
                      {email.subject}
                    </div>
                    {email.body_text && (
                      <div className="text-sm text-muted-foreground mt-1 truncate">
                        {email.body_text.substring(0, 100)}...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
