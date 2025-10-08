import { useEffect } from "react";
import { usePageHeader } from "@/contexts/PageHeaderContext";
import { Dashboard } from "@/components/Dashboard";
import { SimplifiedPlanningManagement } from "@/components/SimplifiedPlanningManagement";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function DashboardPage() {
  const { setTitle, setActions } = usePageHeader();
  const { profile } = useAuth();

  useEffect(() => {
    setTitle("Planning");
    setActions(
      <Button 
        size="sm" 
        className="bg-[hsl(0,71%,36%)] hover:bg-[hsl(0,71%,30%)] text-white"
        onClick={() => window.location.href = '/planning/new'}
      >
        <Plus className="h-4 w-4 mr-2" />
        Nieuwe Klant Afspraak
      </Button>
    );
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

