
import React from 'react';
import { Card, CardContent } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Button } from './ui/button';
import { Star, Reply, Archive, Trash2, Paperclip } from 'lucide-react';
import { Badge } from './ui/badge';

interface Email {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  date: string;
  isRead: boolean;
  isStarred: boolean;
  folder: string;
  attachments?: string[];
}

interface EmailListProps {
  folder: string;
  filteredEmails: Email[];
  selectedEmails: string[];
  onSelectEmail: (id: string) => void;
  onViewEmail: (email: Email) => void;
  areAllSelected: boolean;
  onSelectAll: () => void;
  onReply: (email: Email) => void;
  onToggleStar: (id: string, isStarred: boolean) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}

export function EmailList({
  folder,
  filteredEmails,
  selectedEmails,
  onSelectEmail,
  onViewEmail,
  areAllSelected,
  onSelectAll,
  onReply,
  onToggleStar,
  onArchive,
  onDelete
}: EmailListProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Gisteren';
    } else {
      return date.toLocaleDateString('nl-NL');
    }
  };

  const getFolderDisplayName = (folder: string) => {
    const folderNames: { [key: string]: string } = {
      'inbox': 'Postvak IN',
      'sent': 'Verzonden',
      'drafts': 'Concepten',
      'archive': 'Archief',
      'trash': 'Prullenbak',
      'starred': 'Favorieten'
    };
    return folderNames[folder] || folder;
  };

  return (
    <Card className="h-full">
      <CardContent className="p-0 h-full flex flex-col">
        <div className="p-4 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={areAllSelected}
                onCheckedChange={onSelectAll}
              />
              <h3 className="font-semibold">{getFolderDisplayName(folder)}</h3>
              <Badge variant="secondary">{filteredEmails.length}</Badge>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredEmails.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              <div className="text-center">
                <p className="text-lg mb-2">Geen e-mails gevonden</p>
                <p className="text-sm">Deze map is leeg of je zoekopdracht heeft geen resultaten.</p>
              </div>
            </div>
          ) : (
            <div className="divide-y">
              {filteredEmails.map((email) => (
                <div
                  key={email.id}
                  className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer group ${
                    selectedEmails.includes(email.id) ? 'bg-primary/10 border-l-4 border-l-primary' : ''
                  } ${!email.isRead ? 'bg-blue-50/50 dark:bg-blue-950/20 border-l-4 border-l-blue-500' : ''}`}
                  onClick={() => onViewEmail(email)}
                >
                  <div className="flex items-start gap-3">
                    <div onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedEmails.includes(email.id)}
                        onCheckedChange={() => onSelectEmail(email.id)}
                      />
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleStar(email.id, !email.isStarred);
                      }}
                      className="p-1 h-auto"
                    >
                      <Star
                        className={`h-4 w-4 ${
                          email.isStarred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'
                        }`}
                      />
                    </Button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className={`text-sm truncate ${!email.isRead ? 'font-semibold' : 'font-medium'}`}>
                          {folder === 'sent' ? email.to : email.from}
                        </p>
                        <div className="flex items-center gap-2 shrink-0">
                          {email.attachments && email.attachments.length > 0 && (
                            <Paperclip className="h-4 w-4 text-gray-400" />
                          )}
                          <span className="text-xs text-gray-500">
                            {formatDate(email.date)}
                          </span>
                        </div>
                      </div>

                      <p className={`text-sm mb-1 truncate ${!email.isRead ? 'font-semibold' : ''}`}>
                        {email.subject}
                      </p>
                      
                      <p className="text-xs text-gray-600 truncate">
                        {email.body.replace(/<[^>]*>/g, '').substring(0, 100)}...
                      </p>
                    </div>

                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onReply(email);
                        }}
                        className="p-1 h-auto"
                        title="Beantwoorden"
                      >
                        <Reply className="h-4 w-4" />
                      </Button>
                      
                      {folder !== 'archive' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onArchive(email.id);
                          }}
                          className="p-1 h-auto"
                          title="Archiveren"
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(email.id);
                        }}
                        className="p-1 h-auto text-red-600 hover:text-red-700"
                        title="Verwijderen"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
