
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserManagement from "./UserManagement";
import RoleManagement from "./RoleManagement";
import Salary from "./Salary";
import { Users, Settings, CircleDollarSign } from 'lucide-react';

const Personnel = () => {
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Personeelszaken</h2>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="users" className="flex-col sm:flex-row gap-1 sm:gap-2 h-auto py-3">
            <Users className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Gebruikers</span>
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex-col sm:flex-row gap-1 sm:gap-2 h-auto py-3">
            <Settings className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Rollen & Rechten</span>
          </TabsTrigger>
          <TabsTrigger value="salary" className="flex-col sm:flex-row gap-1 sm:gap-2 h-auto py-3">
            <CircleDollarSign className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Salaris</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="roles">
          <RoleManagement />
        </TabsContent>

        <TabsContent value="salary">
          <Salary />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Personnel;

