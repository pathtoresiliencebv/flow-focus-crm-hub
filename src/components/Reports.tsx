
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ReportsHeader } from '@/components/reports/ReportsHeader';
import { SalesReports } from '@/components/reports/SalesReports';
import { ProjectReports } from '@/components/reports/ProjectReports';
import { FinancialReports } from '@/components/reports/FinancialReports';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from "@/components/ui/card";

export const Reports = () => {
  const [period, setPeriod] = useState('month');
  const { toast } = useToast();
  const { profile } = useAuth();
  
  // Block access for Installateurs
  if (profile?.role === 'Installateur') {
    return (
      <div className="p-4 sm:p-6">
        <Card>
          <CardContent className="text-center py-8">
            <h2 className="text-xl font-semibold mb-2">Geen toegang</h2>
            <p className="text-muted-foreground">
              U heeft geen toegang tot rapportages.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const handleDownload = () => {
    toast({
      title: "Rapport gedownload",
      description: "Het rapport is succesvol gedownload.",
    });
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <ReportsHeader 
        period={period}
        onPeriodChange={setPeriod}
        onDownload={handleDownload}
      />

      <Tabs defaultValue="sales" className="w-full">
        <TabsList className="mb-4 w-full sm:w-auto">
          <TabsTrigger value="sales" className="text-xs sm:text-sm">Verkoopcijfers</TabsTrigger>
          <TabsTrigger value="projects" className="text-xs sm:text-sm">Projectoverzicht</TabsTrigger>
          <TabsTrigger value="finance" className="text-xs sm:text-sm">Financiële resultaten</TabsTrigger>
        </TabsList>

        <TabsContent value="sales">
          <SalesReports period={period} />
        </TabsContent>

        <TabsContent value="projects">
          <ProjectReports period={period} />
        </TabsContent>

        <TabsContent value="finance">
          <FinancialReports period={period} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
