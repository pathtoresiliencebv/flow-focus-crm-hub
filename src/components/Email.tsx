
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  Mail,
  Send,
  Reply,
  Star,
  Archive,
  Trash2,
  Settings,
  Plus,
  Sparkles,
  RefreshCw,
  Search,
  Filter,
  MoreVertical,
  Paperclip,
  Forward
} from "lucide-react";
import { EmailSettings } from "./EmailSettings";
import { EmailCompose } from "./EmailCompose";
import { EmailTemplates } from "./EmailTemplates";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

export function Email() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [activeFolder, setActiveFolder] = useState("inbox");
  const [showSettings, setShowSettings] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch emails for current user
  const { data: emails = [], isLoading: emailsLoading, refetch: refetchEmails } = useQuery({
    queryKey: ['emails', user?.id, activeFolder],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('emails')
        .select('*')
        .eq('user_id', user.id)
        .eq('folder', activeFolder)
        .order('received_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  // Fetch email accounts
  const { data: emailAccounts = [] } = useQuery({
    queryKey: ['email-accounts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_email_accounts')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  // Mark email as read
  const markAsReadMutation = useMutation({
    mutationFn: async (emailId: string) => {
      const { error } = await supabase
        .from('emails')
        .update({ is_read: true })
        .eq('id', emailId)
        .eq('user_id', user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
    }
  });

  // Star/unstar email
  const toggleStarMutation = useMutation({
    mutationFn: async ({ emailId, isStarred }: { emailId: string; isStarred: boolean }) => {
      const { error } = await supabase
        .from('emails')
        .update({ is_starred: !isStarred })
        .eq('id', emailId)
        .eq('user_id', user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
    }
  });

  const handleEmailClick = (email: any) => {
    setSelectedEmail(email);
    if (!email.is_read) {
      markAsReadMutation.mutate(email.id);
    }
  };

  const getUnreadCount = (folder: string) => {
    return emails.filter(email => email.folder === folder && !email.is_read).length;
  };

  const filteredEmails = emails.filter(email => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      email.subject.toLowerCase().includes(searchLower) ||
      email.from_address.toLowerCase().includes(searchLower) ||
      email.body_text?.toLowerCase().includes(searchLower)
    );
  });

  const folders = [
    { key: 'inbox', label: 'Postvak IN', icon: Mail, count: getUnreadCount('inbox') },
    { key: 'sent', label: 'Verzonden', icon: Send, count: 0 },
    { key: 'starred', label: 'Met ster', icon: Star, count: 0 },
    { key: 'archive', label: 'Archief', icon: Archive, count: 0 },
    { key: 'trash', label: 'Prullenbak', icon: Trash2, count: 0 }
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center gap-3">
          <Mail className="h-8 w-8 text-smans-primary" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">E-mail</h1>
            <p className="text-gray-600">Beheer uw e-mails en communicatie</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchEmails()}
            disabled={emailsLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${emailsLoading ? 'animate-spin' : ''}`} />
            Vernieuwen
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTemplates(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Templates
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Instellingen
          </Button>
          <Button
            onClick={() => setShowCompose(true)}
            className="bg-smans-primary hover:bg-smans-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nieuwe e-mail
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r bg-gray-50/50 p-4">
          <div className="space-y-2">
            {folders.map((folder) => {
              const Icon = folder.icon;
              return (
                <button
                  key={folder.key}
                  onClick={() => setActiveFolder(folder.key)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                    activeFolder === folder.key
                      ? 'bg-smans-primary text-white'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{folder.label}</span>
                  </div>
                  {folder.count > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {folder.count}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>

          {emailAccounts.length === 0 && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 mb-2">
                Geen e-mail accounts ingesteld
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(true)}
                className="text-yellow-800 border-yellow-300"
              >
                Account toevoegen
              </Button>
            </div>
          )}
        </div>

        {/* Email List */}
        <div className="flex-1 flex">
          <div className="w-1/2 border-r flex flex-col">
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Zoeken in e-mails..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {emailsLoading ? (
                <div className="p-8 text-center">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">E-mails laden...</p>
                </div>
              ) : filteredEmails.length === 0 ? (
                <div className="p-8 text-center">
                  <Mail className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 mb-2">Geen e-mails gevonden</p>
                  <p className="text-sm text-gray-500">
                    {activeFolder === 'inbox' ? 'Uw inbox is leeg' : `Geen e-mails in ${folders.find(f => f.key === activeFolder)?.label}`}
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredEmails.map((email) => (
                    <div
                      key={email.id}
                      onClick={() => handleEmailClick(email)}
                      className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                        selectedEmail?.id === email.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                      } ${!email.is_read ? 'bg-blue-50/30' : ''}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${!email.is_read ? 'font-bold' : ''}`}>
                            {email.from_name || email.from_address}
                          </span>
                          {email.is_starred && (
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {email.received_at && format(new Date(email.received_at), 'dd MMM', { locale: nl })}
                        </span>
                      </div>
                      <p className={`text-sm mb-1 ${!email.is_read ? 'font-semibold' : ''}`}>
                        {email.subject}
                      </p>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {email.body_text?.substring(0, 100)}...
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Email Detail */}
          <div className="flex-1 flex flex-col">
            {selectedEmail ? (
              <>
                <div className="p-6 border-b">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold mb-2">{selectedEmail.subject}</h2>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>Van: {selectedEmail.from_name || selectedEmail.from_address}</span>
                        <span>Aan: {selectedEmail.to_addresses.join(', ')}</span>
                        {selectedEmail.received_at && (
                          <span>
                            {format(new Date(selectedEmail.received_at), 'dd MMMM yyyy, HH:mm', { locale: nl })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleStarMutation.mutate({
                          emailId: selectedEmail.id,
                          isStarred: selectedEmail.is_starred
                        })}
                      >
                        <Star className={`h-4 w-4 ${selectedEmail.is_starred ? 'text-yellow-500 fill-current' : ''}`} />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Reply className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Forward className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 p-6 overflow-y-auto">
                  <div 
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ 
                      __html: selectedEmail.body_html || selectedEmail.body_text?.replace(/\n/g, '<br>') 
                    }}
                  />
                </div>

                <div className="p-6 border-t bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Button className="bg-smans-primary hover:bg-smans-primary/90">
                      <Reply className="h-4 w-4 mr-2" />
                      Beantwoorden
                    </Button>
                    <Button variant="outline">
                      <Sparkles className="h-4 w-4 mr-2" />
                      AI Antwoord
                    </Button>
                    <Button variant="outline">
                      <Forward className="h-4 w-4 mr-2" />
                      Doorsturen
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Mail className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-xl font-medium text-gray-600 mb-2">Selecteer een e-mail</p>
                  <p className="text-gray-500">Kies een e-mail uit de lijst om de inhoud te bekijken</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <EmailSettings
        open={showSettings}
        onOpenChange={setShowSettings}
      />
      
      <EmailCompose
        open={showCompose}
        onOpenChange={setShowCompose}
        replyTo={null}
      />

      <EmailTemplates
        open={showTemplates}
        onOpenChange={setShowTemplates}
      />
    </div>
  );
}
