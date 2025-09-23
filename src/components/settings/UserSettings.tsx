import React from 'react';
import { Users } from 'lucide-react';
import UserManagement from '@/components/UserManagement';

export const UserSettings = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Users className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Gebruikersbeheer</h1>
          <p className="text-muted-foreground">Beheer gebruikers van het systeem</p>
        </div>
      </div>
      
      <UserManagement />
    </div>
  );
};