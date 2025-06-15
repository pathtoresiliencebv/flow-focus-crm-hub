
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ReportsHeader } from '@/components/reports/ReportsHeader';
import { SalesReports } from '@/components/reports/SalesReports';
import { ProjectReports } from '@/components/reports/ProjectReports';
import { FinancialReports } from '@/components/reports/FinancialReports';
import { InventoryReports } from '@/components/reports/InventoryReports';

export const Reports = () => {
  const [period, setPeriod] = useState('month');
  const { toast } = useToast();
  
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
        <TabsList className="mb-4">
          <TabsTrigger value="sales">Verkoopcijfers</TabsTrigger>
          <TabsTrigger value="projects">Projectoverzicht</TabsTrigger>
          <TabsTrigger value="finance">Financiële resultaten</TabsTrigger>
          <TabsTrigger value="inventory">Voorraadanalyse</TabsTrigger>
        </TabsList>

        <TabsContent value="sales">
          <SalesReports />
        </TabsContent>

        <TabsContent value="projects">
          <ProjectReports />
        </TabsContent>

        <TabsContent value="finance">
          <FinancialReports />
        </TabsContent>

        <TabsContent value="inventory">
          <InventoryReports />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
