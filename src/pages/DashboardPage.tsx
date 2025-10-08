import { useEffect } from "react";
import { usePageHeader } from "@/contexts/PageHeaderContext";
import { Dashboard } from "@/components/Dashboard";
import { SimplifiedPlanningManagement } from "@/components/SimplifiedPlanningManagement";
import { useAuth } from "@/contexts/AuthContext";

export default function DashboardPage() {
  const { setTitle, setActions } = usePageHeader();
  const { profile } = useAuth();

  useEffect(() => {
    setTitle("Dashboard");
    setActions(null);
    return () => {
      setTitle("");
      setActions(null);
    };
  }, []);

  // Show planning for admin/administratie, regular dashboard for installateurs
  if (profile?.role === 'Installateur') {
    return <Dashboard />;
  }

  return (
    <div className="h-full">
      <SimplifiedPlanningManagement />
    </div>
  );
}

