import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Reply, 
  ReplyAll, 
  Forward, 
  Archive, 
  Star, 
  Trash2, 
  Download, 
  Paperclip,
  Clock,
  User,
  Mail,
  Calendar,
  AlertCircle,
  CheckCircle,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { useNylasMessages } from '@/hooks/useNylasMessages';
import { toast } from 'sonner';

interface NylasMessageDetailProps {
  messageId: string;
  onReply?: (message: any) => void;
  onReplyAll?: (message: any) => void;
  onForward?: (message: any) => void;
  onClose?: () => void;
  className?: string;
}

interface Message {
  id: string;
  nylas_message_id: string;
  from_email: string;
  from_name: string;
  to_emails: string[];
  cc_emails: string[];
  bcc_emails: string[];
  subject: string;
  body_text: string;
  body_html: string;
  received_at: string;
  sent_at: string;
  is_read: boolean;
  is_starred: boolean;
  labels: string[];
  folder: string;
  has_attachments: boolean;
  attachments: any[];
  in_reply_to: string;
  message_references: string;
  message_id: string;
  thread_id: string;
}

interface ThreadMessage {
  id: string;
  from_email: string;
  from_name: string;
  subject: string;
  body_text: string;
  body_html: string;
  received_at: string;
  sent_at: string;
  is_read: boolean;
  is_starred: boolean;
  has_attachments: boolean;
  attachments: any[];
}

export function NylasMessageDetail({ 
  messageId, 
  onReply, 
  onReplyAll, 
  onForward, 
  onClose,
  className = '' 
}: NylasMessageDetailProps) {
  const [message, setMessage] = useState<Message | null>(null);
  const [threadMessages, setThreadMessages] = useState<ThreadMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showHtml, setShowHtml] = useState<boolean>(false);

  const { 
    getMessage, 
    getThreadMessages, 
    markAsRead, 
    markAsUnread, 
    starMessage, 
    unstarMessage,
    archiveMessage,
    deleteMessage,
    downloadAttachment
  } = useNylasMessages();

  // Load message details
  useEffect(() => {
    const loadMessage = async () => {
      if (!messageId) return;

      setLoading(true);
      setError(null);

      try {
        const messageData = await getMessage(messageId);
        setMessage(messageData);

        // Mark as read if not already
        if (!messageData.is_read) {
          await markAsRead(messageId);
        }

        // Load thread messages if thread exists
        if (messageData.thread_id) {
          const threadData = await getThreadMessages(messageData.thread_id);
          setThreadMessages(threadData);
        }
      } catch (err) {
        console.error('Error loading message:', err);
        setError('Fout bij laden van bericht');
      } finally {
        setLoading(false);
      }
    };

    loadMessage();
  }, [messageId, getMessage, getThreadMessages, markAsRead]);

  // Handle star/unstar
  const handleStar = async () => {
    if (!message) return;

    setIsProcessing(true);
    try {
      if (message.is_starred) {
        await unstarMessage(message.id);
        setMessage(prev => prev ? { ...prev, is_starred: false } : null);
      } else {
        await starMessage(message.id);
        setMessage(prev => prev ? { ...prev, is_starred: true } : null);
      }
    } catch (err) {
      console.error('Error toggling star:', err);
      toast.error('Fout bij bijwerken van ster');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle archive
  const handleArchive = async () => {
    if (!message) return;

    setIsProcessing(true);
    try {
      await archiveMessage(message.id);
      toast.success('Bericht gearchiveerd');
      onClose?.();
    } catch (err) {
      console.error('Error archiving message:', err);
      toast.error('Fout bij archiveren van bericht');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!message) return;

    setIsProcessing(true);
    try {
      await deleteMessage(message.id);
      toast.success('Bericht verwijderd');
      onClose?.();
    } catch (err) {
      console.error('Error deleting message:', err);
      toast.error('Fout bij verwijderen van bericht');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle attachment download
  const handleDownloadAttachment = async (attachment: any) => {
    try {
      await downloadAttachment(message!.id, attachment.id);
      toast.success('Bijlage gedownload');
    } catch (err) {
      console.error('Error downloading attachment:', err);
      toast.error('Fout bij downloaden van bijlage');
    }
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('nl-NL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Render HTML content safely
  const renderHtmlContent = (html: string) => {
    return (
      <div 
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  };

  if (loading) {
    return (
      <Card className={`w-full ${className}`}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Bericht laden...</span>
        </CardContent>
      </Card>
    );
  }

  if (error || !message) {
    return (
      <Card className={`w-full ${className}`}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600">{error || 'Bericht niet gevonden'}</p>
            {onClose && (
              <Button variant="outline" onClick={onClose} className="mt-4">
                Sluiten
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Message Header */}
      <Card className="mb-4">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg mb-2">{message.subject}</CardTitle>
              
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span className="font-medium">{message.from_name || message.from_email}</span>
                  <span>&lt;{message.from_email}&gt;</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{formatDate(message.received_at || message.sent_at)}</span>
                </div>
              </div>

              {/* Recipients */}
              <div className="space-y-1 text-sm text-gray-600">
                {message.to_emails.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    <span>Aan: {message.to_emails.join(', ')}</span>
                  </div>
                )}
                {message.cc_emails.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    <span>CC: {message.cc_emails.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Star Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleStar}
                disabled={isProcessing}
                className={message.is_starred ? 'text-yellow-500' : 'text-gray-400'}
              >
                <Star className={`h-4 w-4 ${message.is_starred ? 'fill-current' : ''}`} />
              </Button>

              {/* Labels */}
              {message.labels.length > 0 && (
                <div className="flex gap-1">
                  {message.labels.map((label) => (
                    <Badge key={label} variant="secondary" className="text-xs">
                      {label}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Attachments */}
          {message.has_attachments && message.attachments.length > 0 && (
            <div className="mb-4 p-3 bg-gray-50 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <Paperclip className="h-4 w-4 text-gray-500" />
                <span className="font-medium text-sm">Bijlagen ({message.attachments.length})</span>
              </div>
              <div className="space-y-2">
                {message.attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-white rounded border"
                  >
                    <div className="flex items-center gap-2">
                      <Paperclip className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="text-sm font-medium">{attachment.filename}</div>
                        <div className="text-xs text-gray-500">
                          {formatFileSize(attachment.size)}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadAttachment(attachment)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Message Body */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHtml(!showHtml)}
              >
                {showHtml ? 'Tekst' : 'HTML'}
              </Button>
            </div>
            
            <div className="border rounded-md p-4 min-h-[200px]">
              {showHtml && message.body_html ? (
                renderHtmlContent(message.body_html)
              ) : (
                <pre className="whitespace-pre-wrap font-sans text-sm">
                  {message.body_text || 'Geen tekst beschikbaar'}
                </pre>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onReply?.(message)}
              disabled={isProcessing}
            >
              <Reply className="h-4 w-4 mr-1" />
              Antwoorden
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onReplyAll?.(message)}
              disabled={isProcessing}
            >
              <ReplyAll className="h-4 w-4 mr-1" />
              Allen Antwoorden
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onForward?.(message)}
              disabled={isProcessing}
            >
              <Forward className="h-4 w-4 mr-1" />
              Doorsturen
            </Button>

            <div className="flex-1" />

            <Button
              variant="outline"
              size="sm"
              onClick={handleArchive}
              disabled={isProcessing}
              className="text-orange-600 hover:text-orange-700"
            >
              <Archive className="h-4 w-4 mr-1" />
              Archiveren
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={isProcessing}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Verwijderen
            </Button>

            {onClose && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={isProcessing}
              >
                Sluiten
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Thread Messages */}
      {threadMessages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Conversatie ({threadMessages.length} berichten)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {threadMessages.map((threadMessage) => (
                <div
                  key={threadMessage.id}
                  className="border rounded-md p-4 bg-gray-50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-sm">
                        {threadMessage.from_name || threadMessage.from_email}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>{formatDate(threadMessage.received_at || threadMessage.sent_at)}</span>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-700">
                    <pre className="whitespace-pre-wrap font-sans">
                      {threadMessage.body_text?.substring(0, 200)}
                      {threadMessage.body_text && threadMessage.body_text.length > 200 && '...'}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

