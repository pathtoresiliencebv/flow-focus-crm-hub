
export interface User {
  id: number;
  name: string;
  role: "Administrator" | "Verkoper" | "Installateur" | "Administratie" | "Bekijker";
}

const users: User[] = [
  { id: 1, name: "Admin User", role: "Administrator" },
  { id: 2, name: "Piet Bakker", role: "Installateur" },
  { id: 3, name: "Peter Bakker", role: "Installateur" },
  { id: 4, name: "Verkoper User", role: "Verkoper" },
  { id: 5, name: "Admi User", role: "Administratie" },
  { id: 6, name: "Viewer User", role: "Bekijker" },
];

// This is a temporary mock store to fix build issues.
// It should be replaced with a proper data fetching from Supabase.
export const useUserStore = () => {
  return { users };
};
