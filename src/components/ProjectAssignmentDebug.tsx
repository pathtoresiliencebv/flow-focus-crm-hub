import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const ProjectAssignmentDebug = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runDiagnostics = async () => {
    if (!user) return;
    
    setIsLoading(true);
    const results: any = {};
    
    try {
      // 1. Check current user info
      results.user = {
        id: user.id,
        email: user.email,
        role: profile?.role,
        status: profile?.status
      };

      // 2. Test get_user_role function
      const { data: roleData, error: roleError } = await supabase
        .rpc('get_user_role', { p_user_id: user.id });
      results.roleFunction = { data: roleData, error: roleError?.message };

      // 3. Get projects via RPC
      const { data: rpcProjects, error: rpcError } = await supabase
        .rpc('get_user_projects');
      results.rpcProjects = { 
        count: rpcProjects?.length || 0, 
        data: rpcProjects?.slice(0, 3),
        error: rpcError?.message 
      };

      // 4. Get projects via direct query
      const { data: directProjects, error: directError } = await supabase
        .from('projects')
        .select('id, title, assigned_user_id, user_id, status')
        .limit(5);
      results.directProjects = { 
        count: directProjects?.length || 0, 
        data: directProjects,
        error: directError?.message 
      };

      // 5. Check specific project access if any exist
      if (directProjects && directProjects.length > 0) {
        const { data: debugData, error: debugError } = await supabase
          .rpc('debug_project_access', { p_project_id: directProjects[0].id });
        results.projectAccess = { data: debugData, error: debugError?.message };
      }

      setDebugInfo(results);
      
      toast({
        title: "Diagnostics complete",
        description: "Check console for detailed results",
      });
      
      console.log('🔧 Project Assignment Debug Results:', results);
      
    } catch (error) {
      console.error('Error running diagnostics:', error);
      toast({
        title: "Diagnostics failed",
        description: (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (profile?.role !== 'Administrator') {
    return null; // Only show for admins
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>🔧 Project Assignment Debug Tool</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runDiagnostics} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Running Diagnostics...' : 'Run Project Visibility Diagnostics'}
        </Button>
        
        {debugInfo && (
          <div className="mt-4 p-4 bg-gray-100 rounded text-sm">
            <pre className="whitespace-pre-wrap overflow-auto max-h-96">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
