
export type UserRole = "Administrator" | "Verkoper" | "Installateur" | "Administratie" | "Bekijker";

export type Permission = 
  | "customers_view" | "customers_edit" | "customers_delete"
  | "projects_view" | "projects_edit" | "projects_delete" 
  | "invoices_view" | "invoices_edit" | "invoices_delete"
  | "users_view" | "users_edit" | "users_delete"
  | "reports_view" | "settings_edit";

export const permissionLabels: Record<Permission, string> = {
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

export const permissionCategories = {
  "Klanten": ["customers_view", "customers_edit", "customers_delete"] as Permission[],
  "Projecten": ["projects_view", "projects_edit", "projects_delete"] as Permission[],
  "Facturen": ["invoices_view", "invoices_edit", "invoices_delete"] as Permission[],
  "Gebruikers": ["users_view", "users_edit", "users_delete"] as Permission[],
  "Overig": ["reports_view", "settings_edit"] as Permission[]
};

export interface RoleDescription {
  role: UserRole;
  description: string;
}

export const roleDescriptions: RoleDescription[] = [
    { role: "Administrator", description: "Volledige toegang tot alle functies" },
    { role: "Verkoper", description: "Kan klanten en projecten beheren, facturen bekijken" },
    { role: "Installateur", description: "Kan projecten bekijken en bijwerken" },
    { role: "Administratie", description: "Kan facturen beheren en rapporten bekijken" },
    { role: "Bekijker", description: "Alleen lezen toegang" },
];

