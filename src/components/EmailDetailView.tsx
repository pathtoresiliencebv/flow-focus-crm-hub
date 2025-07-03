import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ArrowLeft, Reply, Forward, Archive, Trash2, Star, Paperclip } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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

interface EmailDetailViewProps {
  email: Email;
  onBack: () => void;
  onReply: (email: Email) => void;
  onToggleStar: (id: string, isStarred: boolean) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}

export const EmailDetailView: React.FC<EmailDetailViewProps> = ({
  email,
  onBack,
  onReply,
  onToggleStar,
  onArchive,
  onDelete
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('nl-NL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header with back button and actions */}
      <div className="p-4 border-b flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Terug
        </Button>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleStar(email.id, !email.isStarred)}
          >
            <Star
              className={`h-4 w-4 ${
                email.isStarred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'
              }`}
            />
          </Button>
          
          <Button variant="ghost" size="sm" onClick={() => onReply(email)}>
            <Reply className="h-4 w-4" />
          </Button>
          
          <Button variant="ghost" size="sm">
            <Forward className="h-4 w-4" />
          </Button>
          
          {email.folder !== 'archive' && (
            <Button variant="ghost" size="sm" onClick={() => onArchive(email.id)}>
              <Archive className="h-4 w-4" />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(email.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Email content */}
      <div className="flex-1 overflow-y-auto p-4">
        <Card>
          <CardHeader className="pb-4">
            <div className="space-y-4">
              <h1 className="text-2xl font-bold">{email.subject}</h1>
              
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="space-y-1">
                  <div><strong>Van:</strong> {email.from}</div>
                  <div><strong>Aan:</strong> {email.to}</div>
                </div>
                <div className="text-right">
                  <div>{formatDate(email.date)}</div>
                  {email.attachments && email.attachments.length > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <Paperclip className="h-3 w-3" />
                      <span>{email.attachments.length} bijlage(n)</span>
                    </div>
                  )}
                </div>
              </div>

              {email.attachments && email.attachments.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium mb-2">Bijlagen:</h3>
                  <div className="flex flex-wrap gap-2">
                    {email.attachments.map((attachment, index) => (
                      <Badge key={index} variant="outline" className="flex items-center gap-1">
                        <Paperclip className="h-3 w-3" />
                        {attachment}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
          
          <CardContent>
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: email.body.includes('<') ? email.body : email.body.replace(/\n/g, '<br>') 
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};