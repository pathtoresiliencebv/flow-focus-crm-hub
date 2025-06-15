
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users"><Users className="mr-2 h-4 w-4" />Gebruikers</TabsTrigger>
          <TabsTrigger value="roles"><Settings className="mr-2 h-4 w-4" />Rollen & Rechten</TabsTrigger>
          <TabsTrigger value="salary"><CircleDollarSign className="mr-2 h-4 w-4" />Salarisadministratie</TabsTrigger>
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

