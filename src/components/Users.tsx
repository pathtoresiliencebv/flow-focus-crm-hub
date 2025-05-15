
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

export const Users = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredUsers = mockUsers.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Gebruiker aangemaakt",
      description: "De nieuwe gebruiker is succesvol toegevoegd.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Gebruikers</h2>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button>Nieuwe gebruiker</Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreateUser}>
              <DialogHeader>
                <DialogTitle>Nieuwe gebruiker toevoegen</DialogTitle>
                <DialogDescription>
                  Vul alle velden in om een nieuwe gebruiker aan te maken.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Naam
                  </Label>
                  <Input id="name" className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input id="email" type="email" className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="role" className="text-right">
                    Rol
                  </Label>
                  <Input id="role" className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="active" className="text-right">
                    Actief
                  </Label>
                  <div className="col-span-3">
                    <Switch id="active" defaultChecked />
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button type="submit">Aanmaken</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Gebruikersbeheer</CardTitle>
          <Input 
            placeholder="Zoeken..." 
            className="max-w-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Naam</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Laatste inlog</TableHead>
                <TableHead>Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      user.status === "Actief" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}>
                      {user.status}
                    </span>
                  </TableCell>
                  <TableCell>{user.lastLogin}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">Acties</Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white">
                        <DropdownMenuItem>Bewerken</DropdownMenuItem>
                        <DropdownMenuItem>Reset wachtwoord</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">Deactiveren</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

const mockUsers = [
  { 
    id: 1, 
    name: "Jan de Vries", 
    email: "jan@kozijnencrm.nl", 
    role: "Administrator", 
    status: "Actief", 
    lastLogin: "15-05-2025 09:45" 
  },
  { 
    id: 2, 
    name: "Marie Jansen", 
    email: "marie@kozijnencrm.nl", 
    role: "Verkoper", 
    status: "Actief", 
    lastLogin: "14-05-2025 16:30" 
  },
  { 
    id: 3, 
    name: "Peter Bakker", 
    email: "peter@kozijnencrm.nl", 
    role: "Installateur", 
    status: "Actief", 
    lastLogin: "15-05-2025 08:15" 
  },
  { 
    id: 4, 
    name: "Sara Visser", 
    email: "sara@kozijnencrm.nl", 
    role: "Administratie", 
    status: "Inactief", 
    lastLogin: "10-05-2025 11:20" 
  },
  { 
    id: 5, 
    name: "Thomas Mulder", 
    email: "thomas@kozijnencrm.nl", 
    role: "Verkoper", 
    status: "Actief", 
    lastLogin: "15-05-2025 10:55" 
  },
];

export default Users;
