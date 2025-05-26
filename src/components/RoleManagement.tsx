
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserStore, Permission, UserRole } from "@/hooks/useUserStore";

const permissionLabels: Record<Permission, string> = {
  "customers_view": "Klanten bekijken",
  "customers_edit": "Klanten bewerken",
  "customers_delete": "Klanten verwijderen",
  "projects_view": "Projecten bekijken",
  "projects_edit": "Projecten bewerken",
  "projects_delete": "Projecten verwijderen",
  "invoices_view": "Facturen bekijken",
  "invoices_edit": "Facturen bewerken",
  "invoices_delete": "Facturen verwijderen",
  "users_view": "Gebruikers bekijken",
  "users_edit": "Gebruikers bewerken",
  "users_delete": "Gebruikers verwijderen",
  "reports_view": "Rapporten bekijken",
  "settings_edit": "Instellingen bewerken"
};

const permissionCategories = {
  "Klanten": ["customers_view", "customers_edit", "customers_delete"] as Permission[],
  "Projecten": ["projects_view", "projects_edit", "projects_delete"] as Permission[],
  "Facturen": ["invoices_view", "invoices_edit", "invoices_delete"] as Permission[],
  "Gebruikers": ["users_view", "users_edit", "users_delete"] as Permission[],
  "Overig": ["reports_view", "settings_edit"] as Permission[]
};

export const RoleManagement = () => {
  const { rolePermissions, updateRolePermissions } = useUserStore();
  const [selectedRole, setSelectedRole] = useState<UserRole>("Administrator");

  const currentRolePermissions = rolePermissions.find(r => r.role === selectedRole);

  const handlePermissionChange = (permission: Permission, checked: boolean) => {
    if (!currentRolePermissions) return;

    const updatedPermissions = checked
      ? [...currentRolePermissions.permissions, permission]
      : currentRolePermissions.permissions.filter(p => p !== permission);

    updateRolePermissions(selectedRole, updatedPermissions);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Rolbeheer</h3>
        <p className="text-sm text-muted-foreground">
          Beheer de rechten per gebruikersrol. Wijzigingen worden direct toegepast op alle gebruikers met deze rol.
        </p>
      </div>

      <Tabs value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
        <TabsList className="grid grid-cols-5 w-full">
          {rolePermissions.map((role) => (
            <TabsTrigger key={role.role} value={role.role} className="text-xs">
              {role.role}
            </TabsTrigger>
          ))}
        </TabsList>

        {rolePermissions.map((role) => (
          <TabsContent key={role.role} value={role.role}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {role.role}
                  <Badge variant="outline">{role.permissions.length} rechten</Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">{role.description}</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.entries(permissionCategories).map(([category, permissions]) => (
                  <div key={category} className="space-y-3">
                    <h4 className="font-medium text-sm">{category}</h4>
                    <div className="grid grid-cols-1 gap-3 ml-4">
                      {permissions.map((permission) => (
                        <div key={permission} className="flex items-center space-x-2">
                          <Checkbox
                            id={`${role.role}-${permission}`}
                            checked={role.permissions.includes(permission)}
                            onCheckedChange={(checked) => 
                              handlePermissionChange(permission, checked as boolean)
                            }
                          />
                          <label
                            htmlFor={`${role.role}-${permission}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {permissionLabels[permission]}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default RoleManagement;
