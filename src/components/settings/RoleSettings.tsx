import React from 'react';
import { Shield } from 'lucide-react';
import RoleManagement from '@/components/RoleManagement';

export const RoleSettings = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Rollen & Rechten</h1>
          <p className="text-muted-foreground">Beheer gebruikersrollen en hun toegangsrechten</p>
        </div>
      </div>
      
      <RoleManagement />
    </div>
  );
};