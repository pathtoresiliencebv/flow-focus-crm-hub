import { useEffect } from "react";
import { usePageHeader } from "@/contexts/PageHeaderContext";
import UserManagement from "@/components/UserManagement";

export default function UsersPage() {
  const { setTitle, setActions } = usePageHeader();

  useEffect(() => {
    setTitle("Gebruikers");
    setActions(null);
    return () => {
      setTitle("");
      setActions(null);
    };
  }, []);

  return <UserManagement />;
}

