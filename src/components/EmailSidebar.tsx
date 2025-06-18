
import React from 'react';
import { Button } from '@/components/ui/button';
import { Inbox, Send, FileText, Star, Archive, Clock, Trash, Settings } from 'lucide-react';

interface EmailSidebarProps {
  activeFolder: string;
  setActiveFolder: (folder: string) => void;
  onComposeClick: () => void;
  hasEmailAccounts: boolean;
  onNavigateToSettings: () => void;
}

export const EmailSidebar: React.FC<EmailSidebarProps> = ({
  activeFolder,
  setActiveFolder,
  onComposeClick,
  hasEmailAccounts,
  onNavigateToSettings,
}) => {
  const folders = [
    { name: 'inbox', label: 'Postvak IN', icon: Inbox },
    { name: 'sent', label: 'Verzonden', icon: Send },
    { name: 'archive', label: 'Archief', icon: Archive },
    { name: 'drafts', label: 'Concepten', icon: FileText },
    { name: 'starred', label: 'Gemarkeerd', icon: Star },
    { name: 'scheduled', label: 'Gepland', icon: Clock },
    { name: 'trash', label: 'Prullenbak', icon: Trash },
  ];

  return (
    <div className="w-full md:w-64 border-r h-full py-4 shrink-0">
      <div className="px-4">
        <Button 
          onClick={onComposeClick} 
          className="w-full mb-4 bg-smans-primary hover:bg-smans-primary/90"
          disabled={!hasEmailAccounts}
        >
          Nieuwe E-mail
        </Button>
      </div>
      
      <div className="space-y-1 px-2">
        {folders.map(folder => (
          <Button
            key={folder.name}
            variant={activeFolder === folder.name ? 'secondary' : 'ghost'}
            className="justify-start w-full font-normal"
            onClick={() => setActiveFolder(folder.name)}
            disabled={!hasEmailAccounts}
          >
            <folder.icon className="h-4 w-4 mr-2" />
            {folder.label}
          </Button>
        ))}
      </div>

      <div className="mt-4 px-2">
        <Button
          variant="ghost"
          className="justify-start w-full font-normal"
          onClick={onNavigateToSettings}
        >
          <Settings className="h-4 w-4 mr-2" />
          E-mail Instellingen
        </Button>
      </div>
      
      {!hasEmailAccounts && (
        <div className="mt-4 px-4 text-sm text-muted-foreground">
          <p className="mb-2">Er zijn nog geen e-mailaccounts ingesteld.</p>
          <Button 
            variant="outline" 
            className="w-full text-xs" 
            onClick={onNavigateToSettings}
          >
            Account toevoegen
          </Button>
        </div>
      )}
    </div>
  );
};
