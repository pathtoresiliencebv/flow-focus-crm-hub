
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Users from "./Users";
import Salary from "./Salary";

const Personnel = () => {
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Personeelszaken</h2>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList>
          <TabsTrigger value="users">Gebruikers</TabsTrigger>
          <TabsTrigger value="salary">Salarisadministratie</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Users />
        </TabsContent>

        <TabsContent value="salary">
          <Salary />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Personnel;
