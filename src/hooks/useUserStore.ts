
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

export type UserRole = "Administrator" | "Verkoper" | "Installateur" | "Administratie" | "Bekijker";

export type Permission = 
  | "customers_view" | "customers_edit" | "customers_delete"
  | "projects_view" | "projects_edit" | "projects_delete" 
  | "invoices_view" | "invoices_edit" | "invoices_delete"
  | "users_view" | "users_edit" | "users_delete"
  | "reports_view" | "settings_edit";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  status: "Actief" | "Inactief";
  lastLogin: string;
  createdAt: string;
}

export interface RolePermissions {
  role: UserRole;
  permissions: Permission[];
  description: string;
}

const STORAGE_KEYS = {
  USERS: 'crm_users',
  ROLE_PERMISSIONS: 'crm_role_permissions'
};

// Default role permissions
const defaultRolePermissions: RolePermissions[] = [
  {
    role: "Administrator",
    permissions: [
      "customers_view", "customers_edit", "customers_delete",
      "projects_view", "projects_edit", "projects_delete",
      "invoices_view", "invoices_edit", "invoices_delete",
      "users_view", "users_edit", "users_delete",
      "reports_view", "settings_edit"
    ],
    description: "Volledige toegang tot alle functies"
  },
  {
    role: "Verkoper",
    permissions: [
      "customers_view", "customers_edit",
      "projects_view", "projects_edit",
      "invoices_view", "invoices_edit",
      "reports_view"
    ],
    description: "Kan klanten en projecten beheren, facturen bekijken"
  },
  {
    role: "Installateur",
    permissions: [
      "customers_view",
      "projects_view", "projects_edit",
      "reports_view"
    ],
    description: "Kan projecten bekijken en bijwerken"
  },
  {
    role: "Administratie",
    permissions: [
      "customers_view",
      "projects_view",
      "invoices_view", "invoices_edit",
      "reports_view"
    ],
    description: "Kan facturen beheren en rapporten bekijken"
  },
  {
    role: "Bekijker",
    permissions: [
      "customers_view",
      "projects_view",
      "invoices_view",
      "reports_view"
    ],
    description: "Alleen lezen toegang"
  }
];

// Initial users
const initialUsers: User[] = [
  {
    id: 1,
    name: "Jan de Vries",
    email: "jan@kozijnencrm.nl",
    role: "Administrator",
    permissions: defaultRolePermissions.find(r => r.role === "Administrator")?.permissions || [],
    status: "Actief",
    lastLogin: "15-05-2025 09:45",
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    name: "Marie Jansen",
    email: "marie@kozijnencrm.nl",
    role: "Verkoper",
    permissions: defaultRolePermissions.find(r => r.role === "Verkoper")?.permissions || [],
    status: "Actief",
    lastLogin: "14-05-2025 16:30",
    createdAt: new Date().toISOString()
  },
  {
    id: 3,
    name: "Peter Bakker",
    email: "peter@kozijnencrm.nl",
    role: "Installateur",
    permissions: defaultRolePermissions.find(r => r.role === "Installateur")?.permissions || [],
    status: "Actief",
    lastLogin: "15-05-2025 08:15",
    createdAt: new Date().toISOString()
  },
  {
    id: 4,
    name: "Sara Visser",
    email: "sara@kozijnencrm.nl",
    role: "Administratie",
    permissions: defaultRolePermissions.find(r => r.role === "Administratie")?.permissions || [],
    status: "Inactief",
    lastLogin: "10-05-2025 11:20",
    createdAt: new Date().toISOString()
  },
  {
    id: 5,
    name: "Thomas Mulder",
    email: "thomas@kozijnencrm.nl",
    role: "Verkoper",
    permissions: defaultRolePermissions.find(r => r.role === "Verkoper")?.permissions || [],
    status: "Actief",
    lastLogin: "15-05-2025 10:55",
    createdAt: new Date().toISOString()
  }
];

export const useUserStore = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermissions[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
    const savedRolePermissions = localStorage.getItem(STORAGE_KEYS.ROLE_PERMISSIONS);

    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    } else {
      setUsers(initialUsers);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(initialUsers));
    }

    if (savedRolePermissions) {
      setRolePermissions(JSON.parse(savedRolePermissions));
    } else {
      setRolePermissions(defaultRolePermissions);
      localStorage.setItem(STORAGE_KEYS.ROLE_PERMISSIONS, JSON.stringify(defaultRolePermissions));
    }
  }, []);

  // User functions
  const addUser = (userData: Omit<User, 'id' | 'createdAt' | 'permissions'>) => {
    const rolePerms = rolePermissions.find(r => r.role === userData.role);
    const newUser: User = {
      ...userData,
      id: Date.now(),
      permissions: rolePerms?.permissions || [],
      createdAt: new Date().toISOString()
    };
    
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
    
    toast({
      title: "Gebruiker toegevoegd",
      description: `${newUser.name} is succesvol toegevoegd.`,
    });
    
    return newUser;
  };

  const updateUser = (id: number, userData: Partial<User>) => {
    const updatedUsers = users.map(user => {
      if (user.id === id) {
        const updatedUser = { ...user, ...userData };
        // Update permissions if role changed
        if (userData.role && userData.role !== user.role) {
          const rolePerms = rolePermissions.find(r => r.role === userData.role);
          updatedUser.permissions = rolePerms?.permissions || [];
        }
        return updatedUser;
      }
      return user;
    });
    setUsers(updatedUsers);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
    
    toast({
      title: "Gebruiker bijgewerkt",
      description: "Gebruiker is succesvol bijgewerkt.",
    });
  };

  const deleteUser = (id: number) => {
    const updatedUsers = users.filter(user => user.id !== id);
    setUsers(updatedUsers);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
    
    toast({
      title: "Gebruiker verwijderd",
      description: "Gebruiker is succesvol verwijderd.",
    });
  };

  // Role permission functions
  const updateRolePermissions = (role: UserRole, permissions: Permission[]) => {
    const updatedRolePermissions = rolePermissions.map(rp =>
      rp.role === role ? { ...rp, permissions } : rp
    );
    setRolePermissions(updatedRolePermissions);
    localStorage.setItem(STORAGE_KEYS.ROLE_PERMISSIONS, JSON.stringify(updatedRolePermissions));

    // Update all users with this role
    const updatedUsers = users.map(user =>
      user.role === role ? { ...user, permissions } : user
    );
    setUsers(updatedUsers);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
    
    toast({
      title: "Rolrechten bijgewerkt",
      description: `Rechten voor ${role} zijn bijgewerkt.`,
    });
  };

  const getUserPermissions = (userId: number): Permission[] => {
    const user = users.find(u => u.id === userId);
    return user?.permissions || [];
  };

  const hasPermission = (userId: number, permission: Permission): boolean => {
    const userPermissions = getUserPermissions(userId);
    return userPermissions.includes(permission);
  };

  return {
    users,
    rolePermissions,
    addUser,
    updateUser,
    deleteUser,
    updateRolePermissions,
    getUserPermissions,
    hasPermission
  };
};
