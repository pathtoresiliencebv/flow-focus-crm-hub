import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EmailDebugProps {
  accountId: string;
}

export const EmailDebug = ({ accountId }: EmailDebugProps) => {
  const [debugResult, setDebugResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const runDebug = async () => {
    setLoading(true);
    setDebugResult(null);

    try {
      console.log('🔍 Running OX Mail debug...');
      
      const { data, error } = await supabase.functions.invoke('ox-mail-debug', {
        body: { accountId }
      });

      console.log('🔍 Debug result:', { data, error });

      if (error) {
        setDebugResult({
          success: false,
          error: error.message,
          type: 'Supabase Error'
        });
      } else {
        setDebugResult(data);
      }

      toast({
        title: "Debug test voltooid",
        description: error ? "Er zijn fouten gevonden" : "Debug succesvol",
        variant: error ? "destructive" : "default"
      });

    } catch (err: any) {
      console.error('❌ Debug test failed:', err);
      setDebugResult({
        success: false,
        error: err.message,
        type: 'Network Error'
      });
      
      toast({
        title: "Debug test gefaald",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl p-4 border rounded-lg bg-white">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">🔍 Email Debug Tool</h3>
      </div>
      <div className="space-y-4">
        <Button 
          onClick={runDebug} 
          disabled={loading}
          className="w-full"
        >
          {loading ? "Debug test uitvoeren..." : "Start Debug Test"}
        </Button>

        {debugResult && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg">
            <h3 className="font-semibold mb-2">Debug Result:</h3>
            <pre className="text-xs overflow-auto max-h-96">
              {JSON.stringify(debugResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
