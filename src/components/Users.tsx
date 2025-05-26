
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useUserStore, UserRole } from "@/hooks/useUserStore";
import { RoleManagement } from "@/components/RoleManagement";
import { Settings, Users as UsersIcon } from "lucide-react";

export const Users = () => {
  const { toast } = useToast();
  const { users, addUser, updateUser, deleteUser } = useUserStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("users");
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Bekijker' as UserRole,
    status: 'Actief' as 'Actief' | 'Inactief'
  });

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    addUser({
      name: formData.name,
      email: formData.email,
      role: formData.role,
      status: formData.status,
      lastLogin: "Nog niet ingelogd"
    });
    
    setFormData({
      name: '',
      email: '',
      role: 'Bekijker',
      status: 'Actief'
    });
    setIsCreateDialogOpen(false);
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      updateUser(editingUser.id, formData);
      setIsEditDialogOpen(false);
      setEditingUser(null);
    }
  };

  const handleDeleteUser = (userId: number) => {
    if (confirm('Weet je zeker dat je deze gebruiker wilt verwijderen?')) {
      deleteUser(userId);
    }
  };

  const toggleUserStatus = (userId: number, currentStatus: string) => {
    const newStatus = currentStatus === "Actief" ? "Inactief" : "Actief";
    updateUser(userId, { status: newStatus });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Gebruikersbeheer</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <UsersIcon className="h-4 w-4" />
            Gebruikers
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Rollen & Rechten
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <div className="flex justify-between items-center">
            <Input 
              placeholder="Zoek gebruikers..." 
              className="max-w-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
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
                      <Input 
                        id="name" 
                        className="col-span-3" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required 
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="email" className="text-right">
                        Email
                      </Label>
                      <Input 
                        id="email" 
                        type="email" 
                        className="col-span-3" 
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        required 
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="role" className="text-right">
                        Rol
                      </Label>
                      <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value as UserRole})}>
                        <SelectTrigger className="col-span-3">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Administrator">Administrator</SelectItem>
                          <SelectItem value="Verkoper">Verkoper</SelectItem>
                          <SelectItem value="Installateur">Installateur</SelectItem>
                          <SelectItem value="Administratie">Administratie</SelectItem>
                          <SelectItem value="Bekijker">Bekijker</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="active" className="text-right">
                        Actief
                      </Label>
                      <div className="col-span-3">
                        <Switch 
                          id="active" 
                          checked={formData.status === "Actief"}
                          onCheckedChange={(checked) => setFormData({...formData, status: checked ? "Actief" : "Inactief"})}
                        />
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
            <CardHeader>
              <CardTitle>Gebruikersoverzicht</CardTitle>
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
                    <TableHead>Rechten</TableHead>
                    <TableHead>Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          user.status === "Actief" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}>
                          {user.status}
                        </span>
                      </TableCell>
                      <TableCell>{user.lastLogin}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {user.permissions.length} rechten
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">Acties</Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white">
                            <DropdownMenuItem onClick={() => handleEditUser(user)}>
                              Bewerken
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleUserStatus(user.id, user.status)}>
                              {user.status === "Actief" ? "Deactiveren" : "Activeren"}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              Verwijderen
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <RoleManagement />
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <form onSubmit={handleUpdateUser}>
            <DialogHeader>
              <DialogTitle>Gebruiker bewerken</DialogTitle>
              <DialogDescription>
                Wijzig de gebruikersgegevens.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Naam
                </Label>
                <Input 
                  id="edit-name" 
                  className="col-span-3" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-email" className="text-right">
                  Email
                </Label>
                <Input 
                  id="edit-email" 
                  type="email" 
                  className="col-span-3" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-role" className="text-right">
                  Rol
                </Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value as UserRole})}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Administrator">Administrator</SelectItem>
                    <SelectItem value="Verkoper">Verkoper</SelectItem>
                    <SelectItem value="Installateur">Installateur</SelectItem>
                    <SelectItem value="Administratie">Administratie</SelectItem>
                    <SelectItem value="Bekijker">Bekijker</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-active" className="text-right">
                  Actief
                </Label>
                <div className="col-span-3">
                  <Switch 
                    id="edit-active" 
                    checked={formData.status === "Actief"}
                    onCheckedChange={(checked) => setFormData({...formData, status: checked ? "Actief" : "Inactief"})}
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="submit">Bijwerken</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;
