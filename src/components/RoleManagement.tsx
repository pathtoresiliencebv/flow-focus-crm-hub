
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import {
  Permission,
  UserRole,
  permissionLabels,
  permissionCategories,
  roleDescriptions,
} from "@/types/permissions";

interface RolePermissionData {
  role: UserRole;
  permissions: Permission[];
  description: string;
}

export const RoleManagement = () => {
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<UserRole>("Administrator");

  const { data: roles, isLoading, error } = useQuery<RolePermissionData[], Error>({
    queryKey: ['role_permissions'],
    queryFn: async () => {
      const { data, error } = await supabase.from('role_permissions').select('role, permission');
      if (error) throw new Error(error.message);

      const groupedByRole = data.reduce((acc, item) => {
        const role = item.role as UserRole;
        const permission = item.permission as Permission;
        if (!acc[role]) {
          acc[role] = [];
        }
        acc[role].push(permission);
        return acc;
      }, {} as Record<UserRole, Permission[]>);

      return roleDescriptions.map(rd => ({
        ...rd,
        permissions: groupedByRole[rd.role] || [],
      }));
    },
  });
  
  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ role, permissions }: { role: UserRole; permissions: Permission[] }) => {
      const { error } = await supabase.rpc('update_role_permissions', {
        p_role: role,
        p_permissions: permissions,
      });
      if (error) throw new Error(`RPC Error: ${error.message}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role_permissions'] });
      queryClient.invalidateQueries({ queryKey: ['users'] }); // Invalidate user queries as their permissions might change
      toast({ title: 'Success', description: 'Role permissions updated successfully.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });


  const handlePermissionChange = (permission: Permission, checked: boolean) => {
    const currentRoleData = roles?.find(r => r.role === selectedRole);
    if (!currentRoleData) return;

    const updatedPermissions = checked
      ? [...currentRoleData.permissions, permission]
      : currentRoleData.permissions.filter(p => p !== permission);
    
    updatePermissionsMutation.mutate({ role: selectedRole, permissions: updatedPermissions });
  };
  
  if (isLoading) return <div>Loading roles...</div>;
  if (error) return <div>Error: {error.message}</div>;

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
          {roles?.map((role) => (
            <TabsTrigger key={role.role} value={role.role} className="text-xs">
              {role.role}
            </TabsTrigger>
          ))}
        </TabsList>

        {roles?.map((role) => (
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
                            disabled={updatePermissionsMutation.isPending}
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
