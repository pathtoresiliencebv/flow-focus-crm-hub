import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, RefreshCw, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEmailAccounts } from '@/hooks/useEmailAccounts';
import { SMTPIMAPSetup } from '@/components/email/SMTPIMAPSetup';
import { useToast } from '@/hooks/use-toast';

export default function Email() {
  const { accounts, loading: accountsLoading, syncAccount } = useEmailAccounts();
  const [syncing, setSyncing] = useState(false);
  const [showAccountSetup, setShowAccountSetup] = useState(false);
  const { toast } = useToast();

  // Filter out old accounts without SMTP/IMAP configuration
  const validAccounts = accounts.filter(acc => acc.smtp_host && acc.imap_host);
  const primaryAccount = validAccounts.find(acc => acc.is_primary) || validAccounts[0];

  // Debug logging
  console.log('=== EMAIL DEBUG START ===');
  console.log('Total accounts from DB:', accounts.length);
  console.log('Valid accounts (with SMTP/IMAP):', validAccounts.length);
  console.log('Loading?', accountsLoading);
  console.log('Show setup?', showAccountSetup);
  console.log('Accounts data:', accounts);
  console.log('Valid accounts data:', validAccounts);
  console.log('=== EMAIL DEBUG END ===');

  const handleSync = async () => {
    if (!primaryAccount) return;
    
    try {
      setSyncing(true);
      const result = await syncAccount(primaryAccount.id);
      toast({
        title: "Synchronisatie voltooid",
        description: `${result.syncedCount || 0} nieuwe berichten gesynchroniseerd.`,
      });
    } catch (error) {
      console.error('Sync failed:', error);
      toast({
        title: "Synchronisatie mislukt",
        description: error.message || "Er is een fout opgetreden tijdens synchronisatie.",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  // Show SMTP/IMAP setup if no valid accounts or user clicked "Add Account"
  if ((!accountsLoading && validAccounts.length === 0) || showAccountSetup) {
    return (
      <div className="h-full overflow-auto bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="w-full max-w-4xl mx-auto">
          <SMTPIMAPSetup 
            onSuccess={() => {
              setShowAccountSetup(false);
              toast({
                title: "Account toegevoegd",
                description: "Je email account is succesvol gekoppeld!",
              });
            }}
            onCancel={validAccounts.length > 0 ? () => setShowAccountSetup(false) : undefined}
          />
        </div>
      </div>
    );
  }

  if (accountsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Email accounts laden...</p>
        </div>
      </div>
    );
  }

  // Simple Email Interface (Roundcube-inspired)
  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Top Toolbar */}
      <div className="border-b px-6 py-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold text-gray-900">Email</h1>
            {primaryAccount && (
              <span className="text-sm text-gray-500">
                {primaryAccount.email_address}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={syncing}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", syncing && "animate-spin")} />
              {syncing ? 'Synchroniseren...' : 'Synchroniseer'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAccountSetup(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Instellingen
            </Button>
            
            <Button size="sm" className="bg-red-600 hover:bg-red-700">
              <Plus className="h-4 w-4 mr-2" />
              Nieuw Bericht
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="mb-6">
            <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Email functionaliteit komt eraan!
          </h2>
          <p className="text-gray-600 mb-6">
            Je email account is gekoppeld. De inbox, versturen en ontvangen van emails wordt momenteel geïmplementeerd.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <h3 className="font-medium text-blue-900 mb-2">Wat werkt al:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✅ SMTP/IMAP configuratie</li>
              <li>✅ Email accounts toevoegen</li>
              <li>✅ Verbinding testen</li>
              <li>✅ Email synchronisatie</li>
            </ul>
            
            <h3 className="font-medium text-blue-900 mt-4 mb-2">Binnenkort beschikbaar:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>⏳ Inbox weergave</li>
              <li>⏳ Emails versturen</li>
              <li>⏳ Emails ontvangen</li>
              <li>⏳ Bijlagen</li>
            </ul>
          </div>

          <div className="mt-6 text-sm text-gray-500">
            <p>
              Je kunt nu al emails versturen via{' '}
              <span className="font-medium">Instellingen → Email Accounts</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
