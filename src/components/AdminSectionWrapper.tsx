import React, { Suspense } from 'react';
import { useAdminDataLoader } from '@/hooks/useAdminDataLoader';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';

interface AdminSectionWrapperProps {
  children: React.ReactNode;
  section: 'customers' | 'projects' | 'planning' | 'timeRegistration' | 'receipts' | 'quotes' | 'personnel' | 'users' | 'settings' | 'email' | 'chat';
  title: string;
  icon?: React.ReactNode;
}

export const AdminSectionWrapper: React.FC<AdminSectionWrapperProps> = ({
  children,
  section,
  title,
  icon
}) => {
  const { profile } = useAuth();
  const { 
    getErrorMessage, 
    isLoading, 
    isAdmin,
    loadCustomers,
    loadProjects,
    loadPlanning,
    loadReceipts,
    loadQuotes,
    loadUsers,
    loadPersonnel,
    loadTimeRegistration,
    loadSettings,
    loadEmail,
    loadChat
  } = useAdminDataLoader();

  // Check if user is Administrator
  if (profile?.role !== 'Administrator') {
    return <>{children}</>;
  }

  const errorMessage = getErrorMessage(section);
  const loading = isLoading(section);

  // Get the appropriate load function
  const getLoadFunction = () => {
    switch (section) {
      case 'customers': return loadCustomers;
      case 'projects': return loadProjects;
      case 'planning': return loadPlanning;
      case 'receipts': return loadReceipts;
      case 'quotes': return loadQuotes;
      case 'users': return loadUsers;
      case 'personnel': return loadPersonnel;
      case 'timeRegistration': return loadTimeRegistration;
      case 'settings': return loadSettings;
      case 'email': return loadEmail;
      case 'chat': return loadChat;
      default: return () => Promise.resolve();
    }
  };

  const handleRetry = async () => {
    const loadFunction = getLoadFunction();
    await loadFunction();
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">{title} laden...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (errorMessage) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              {icon}
              <AlertTriangle className="h-5 w-5" />
              Error loading {title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {errorMessage}
            </p>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleRetry}
                variant="outline"
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Opnieuw proberen
              </Button>
              <Button 
                onClick={() => window.location.reload()}
                className="flex-1"
              >
                Pagina vernieuwen
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show normal content with Suspense for error boundary
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">{title} laden...</p>
        </div>
      </div>
    }>
      {children}
    </Suspense>
  );
};
