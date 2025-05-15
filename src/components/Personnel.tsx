
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Users from "./Users";
import Salary from "./Salary";

const Personnel = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Personeelszaken</h2>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="mb-4">
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
