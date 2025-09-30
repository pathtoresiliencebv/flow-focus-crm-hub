import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { applyQuoteMigration } from '@/utils/applyQuoteMigration';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export const MigrationPanel: React.FC = () => {
  const { toast } = useToast();
  const [isApplying, setIsApplying] = useState(false);
  const [migrationResult, setMigrationResult] = useState<any>(null);

  const handleApplyMigration = async () => {
    setIsApplying(true);
    setMigrationResult(null);

    try {
      const result = await applyQuoteMigration();
      setMigrationResult(result);

      if (result.success) {
        toast({
          title: "✅ Migration Succesvol",
          description: `Quote nummer functie bijgewerkt. Test: ${result.testQuoteNumber}`,
        });
      } else {
        toast({
          title: "❌ Migration Mislukt",
          description: result.error || "Onbekende fout",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "❌ Fout",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔧 Database Migratie - Quote Nummer Fix
        </CardTitle>
        <CardDescription>
          Los de duplicate key constraint error op voor quote nummers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Probleem:</strong> Quote nummers kunnen dupliceren bij gelijktijdige aanmaak.
            <br />
            <strong>Oplossing:</strong> Database advisory locking implementatie.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <h4 className="font-medium text-sm">Wat deze migratie doet:</h4>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>✅ Verbetert generate_quote_number() met advisory locks</li>
            <li>✅ Voorkomt race conditions bij simultane quotes</li>
            <li>✅ Voegt fix_duplicate_quote_numbers() toe</li>
            <li>✅ Lost bestaande duplicaten automatisch op</li>
          </ul>
        </div>

        <Button
          onClick={handleApplyMigration}
          disabled={isApplying}
          className="w-full"
          size="lg"
        >
          {isApplying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Migratie toepassen...
            </>
          ) : (
            <>
              🚀 Pas Migratie Toe
            </>
          )}
        </Button>

        {migrationResult && (
          <Alert variant={migrationResult.success ? "default" : "destructive"}>
            {migrationResult.success ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              {migrationResult.success ? (
                <>
                  <strong>✅ Migratie succesvol toegepast!</strong>
                  <br />
                  Test quote nummer: {migrationResult.testQuoteNumber}
                </>
              ) : (
                <>
                  <strong>❌ Migratie mislukt</strong>
                  <br />
                  {migrationResult.fallbackInstructions && (
                    <pre className="mt-2 text-xs whitespace-pre-wrap bg-black/10 p-2 rounded">
                      {migrationResult.fallbackInstructions}
                    </pre>
                  )}
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="text-xs text-muted-foreground border-t pt-3">
          <p><strong>⚠️ Handmatige optie:</strong></p>
          <ol className="list-decimal list-inside space-y-1 mt-1">
            <li>Ga naar <a href="https://supabase.com/dashboard" target="_blank" className="text-blue-600 hover:underline">Supabase Dashboard</a></li>
            <li>Selecteer je project → SQL Editor</li>
            <li>Kopieer SQL uit: <code className="bg-gray-100 px-1 rounded">supabase/migrations/20250930_fix_quote_number_race_condition.sql</code></li>
            <li>Voer de SQL uit</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};
