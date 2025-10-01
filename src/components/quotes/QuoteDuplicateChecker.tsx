import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const QuoteDuplicateChecker: React.FC = () => {
  const { toast } = useToast();
  const [isChecking, setIsChecking] = useState(false);
  const [duplicates, setDuplicates] = useState<any[]>([]);

  const checkForDuplicates = async () => {
    setIsChecking(true);
    try {
      console.log('🔍 Checking for duplicate quote numbers...');

      // Check for duplicates
      const { data: duplicateCheck, error: duplicateError } = await supabase
        .from('quotes')
        .select('quote_number')
        .then(({ data, error }) => {
          if (error) throw error;
          
          const numberCounts: Record<string, number> = {};
          data?.forEach(quote => {
            numberCounts[quote.quote_number] = (numberCounts[quote.quote_number] || 0) + 1;
          });
          
          const duplicateNumbers = Object.entries(numberCounts)
            .filter(([_, count]) => count > 1)
            .map(([number, count]) => ({ quote_number: number, count }));
            
          return { data: duplicateNumbers, error: null };
        });

      if (duplicateError) {
        throw duplicateError;
      }

      setDuplicates(duplicateCheck || []);
      
      if (duplicateCheck?.length === 0) {
        toast({
          title: "✅ Geen duplicaten gevonden",
          description: "Alle quote nummers zijn uniek",
        });
      } else {
        toast({
          title: `⚠️ ${duplicateCheck?.length} duplicaten gevonden`,
          description: "Klik op 'Fix Duplicaten' om automatisch op te lossen",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error checking duplicates:', error);
      toast({
        title: "Fout bij controleren",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  const fixDuplicates = async () => {
    setIsChecking(true);
    try {
      console.log('🔧 Fixing duplicate quote numbers...');

      const { data: fixResults, error: fixError } = await supabase
        .rpc('fix_duplicate_quote_numbers' as any);

      if (fixError) {
        throw fixError;
      }

      console.log('Fixed duplicates:', fixResults);

      if (!Array.isArray(fixResults) || fixResults.length === 0) {
        toast({
          title: "✅ Geen duplicaten om te fixen",
          description: "Alle quote nummers zijn al uniek",
        });
      } else {
        toast({
          title: `✅ ${fixResults.length} duplicaten opgelost`,
          description: "Nieuwe unieke nummers zijn toegewezen",
        });
      }

      // Refresh the duplicates list
      await checkForDuplicates();
    } catch (error: any) {
      console.error('Error fixing duplicates:', error);
      toast({
        title: "Fout bij oplossen",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">🔢 Quote Nummer Duplicaten Checker</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={checkForDuplicates}
            disabled={isChecking}
            size="sm"
          >
            {isChecking ? '🔄 Controleren...' : '🔍 Check Duplicaten'}
          </Button>
          
          {duplicates.length > 0 && (
            <Button 
              onClick={fixDuplicates}
              disabled={isChecking}
              variant="destructive"
              size="sm"
            >
              {isChecking ? '🔧 Bezig...' : '🔧 Fix Duplicaten'}
            </Button>
          )}
        </div>

        {duplicates.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Gevonden duplicaten:</h4>
            {duplicates.map((duplicate, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-red-50 rounded">
                <span className="font-mono text-sm">{duplicate.quote_number}</span>
                <Badge variant="destructive">{duplicate.count}x</Badge>
              </div>
            ))}
          </div>
        )}

        <div className="text-xs text-gray-600">
          <p><strong>💡 Tips:</strong></p>
          <p>• Deze checker vindt alle duplicate quote nummers</p>
          <p>• "Fix Duplicaten" wijst automatisch nieuwe unieke nummers toe</p>
          <p>• De oudste quote houdt het originele nummer</p>
        </div>
      </CardContent>
    </Card>
  );
};
