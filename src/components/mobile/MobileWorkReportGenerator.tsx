import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FileText, Download, Printer } from "lucide-react";
import { useQuotes } from "@/hooks/useQuotes";
import { Project } from "@/hooks/useCrmStore";

interface MobileWorkReportGeneratorProps {
  project: Project;
  deliveryId: string;
  onClose: () => void;
}

interface WorkReportData {
  projectTitle: string;
  customerName: string;
  deliveryDate: string;
  monteurName: string;
  summaryText: string;
  clientSignature: string;
  monteurSignature: string;
  deliveryPhotos: string[];
}

export const MobileWorkReportGenerator: React.FC<MobileWorkReportGeneratorProps> = ({
  project,
  deliveryId,
  onClose
}) => {
  const { quotes } = useQuotes();
  const [workReportData, setWorkReportData] = useState<WorkReportData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // Fetch delivery data and generate work report
    generateWorkReport();
  }, [deliveryId]);

  const generateWorkReport = async () => {
    setIsGenerating(true);
    try {
      // Here you would fetch the delivery data and related quote
      // For now, we'll create a mock work report
      const mockData: WorkReportData = {
        projectTitle: project.title,
        customerName: 'Onbekende klant', // This will be fetched from customer data
        deliveryDate: new Date().toLocaleDateString('nl-NL'),
        monteurName: 'Monteur', // This should come from user profile
        summaryText: 'Project succesvol opgeleverd volgens specificaties.',
        clientSignature: 'data:image/png;base64,...', // This should come from delivery data
        monteurSignature: 'data:image/png;base64,...', // This should come from delivery data
        deliveryPhotos: [] // This should come from delivery data
      };
      
      setWorkReportData(mockData);
    } catch (error) {
      console.error('Error generating work report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = () => {
    // This would generate and download a PDF of the work report
    console.log('Downloading work report PDF...');
  };

  const handlePrint = () => {
    window.print();
  };

  if (isGenerating || !workReportData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <FileText className="h-16 w-16 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Werkbrief Genereren</h3>
            <p className="text-muted-foreground">
              De werkbrief wordt gegenereerd...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with actions */}
      <div className="sticky top-0 z-10 bg-background border-b p-4">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={onClose}>
            Sluiten
          </Button>
          <h1 className="text-lg font-semibold">Werkbrief</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Work Report Content */}
      <div className="p-4 space-y-6" style={{ printColorAdjust: 'exact' }}>
        {/* Header */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">WERKBRIEF</CardTitle>
            <p className="text-muted-foreground">Project Oplevering</p>
          </CardHeader>
        </Card>

        {/* Project Information */}
        <Card>
          <CardHeader>
            <CardTitle>Project Gegevens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Project</p>
                <p className="font-medium">{workReportData.projectTitle}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Klant</p>
                <p className="font-medium">{workReportData.customerName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Opleverdatum</p>
                <p className="font-medium">{workReportData.deliveryDate}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monteur</p>
                <p className="font-medium">{workReportData.monteurName}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Work Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Uitgevoerde Werkzaamheden</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{workReportData.summaryText}</p>
          </CardContent>
        </Card>

        {/* Photos Section */}
        {workReportData.deliveryPhotos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Oplevering Foto's</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {workReportData.deliveryPhotos.map((photo, index) => (
                  <img
                    key={index}
                    src={photo}
                    alt={`Oplevering foto ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Signatures */}
        <Card>
          <CardHeader>
            <CardTitle>Handtekeningen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Client Signature */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Klant Handtekening</p>
                <div className="border rounded p-4 h-24 bg-white flex items-center justify-center">
                  {workReportData.clientSignature ? (
                    <img 
                      src={workReportData.clientSignature} 
                      alt="Klant handtekening"
                      className="max-h-full max-w-full"
                    />
                  ) : (
                    <p className="text-muted-foreground text-sm">Geen handtekening</p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {workReportData.customerName}
                </p>
              </div>

              {/* Monteur Signature */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Monteur Handtekening</p>
                <div className="border rounded p-4 h-24 bg-white flex items-center justify-center">
                  {workReportData.monteurSignature ? (
                    <img 
                      src={workReportData.monteurSignature} 
                      alt="Monteur handtekening"
                      className="max-h-full max-w-full"
                    />
                  ) : (
                    <p className="text-muted-foreground text-sm">Geen handtekening</p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {workReportData.monteurName}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <Card>
          <CardContent className="text-center py-4">
            <Separator className="mb-4" />
            <p className="text-xs text-muted-foreground">
              Dit document bevestigt de succesvolle oplevering van het project.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Gegenereerd op {new Date().toLocaleString('nl-NL')}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};