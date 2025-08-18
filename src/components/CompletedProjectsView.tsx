import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock } from "lucide-react";

export const CompletedProjectsView: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Afgeronde Projecten
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Afgeronde projecten worden hier weergegeven wanneer de database is geconfigureerd.
            </p>
            <Badge variant="secondary" className="mt-4">
              In ontwikkeling
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};