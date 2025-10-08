
import React, { useState } from 'react';
import { IconBox } from "@/components/ui/icon-box";
import UserManagement from "./UserManagement";
import RoleManagement from "./RoleManagement";
import Salary from "./Salary";
import { Users, Shield, CircleDollarSign } from 'lucide-react';

const Personnel = () => {
  const [activeTab, setActiveTab] = useState("users");

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Icon Boxes Navigation */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <IconBox
          icon={<Users className="h-6 w-6" />}
          label="Gebruikers"
          active={activeTab === "users"}
          onClick={() => setActiveTab("users")}
        />
        <IconBox
          icon={<Shield className="h-6 w-6" />}
          label="Rollen & Rechten"
          active={activeTab === "roles"}
          onClick={() => setActiveTab("roles")}
        />
        <IconBox
          icon={<CircleDollarSign className="h-6 w-6" />}
          label="Salaris"
          active={activeTab === "salary"}
          onClick={() => setActiveTab("salary")}
        />
      </div>

      {/* Content */}
      {activeTab === "users" && <UserManagement />}
      {activeTab === "roles" && <RoleManagement />}
      {activeTab === "salary" && <Salary />}
    </div>
  );
};

export default Personnel;

