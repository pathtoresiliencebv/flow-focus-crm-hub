import { useEffect, useState } from "react";
import { usePageHeader } from "@/contexts/PageHeaderContext";
import { Dashboard } from "@/components/Dashboard";
import { SimplifiedPlanningManagement } from "@/components/SimplifiedPlanningManagement";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Plus, CalendarDays, CalendarRange } from "lucide-react";

export default function DashboardPage() {
  const { setTitle, setActions } = usePageHeader();
  const { profile } = useAuth();
  const [viewMode, setViewMode] = useState<'month' | 'availability'>('month');
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);

  const handleMonthViewClick = () => {
    setViewMode('month');
  };

  const handleAvailabilityViewClick = () => {
    setViewMode('availability');
  };

  const handleNewCustomerClick = () => {
    setShowCustomerDialog(true);
  };

  useEffect(() => {
    setTitle("Planning");
    setActions(
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMonthViewClick}
            className={viewMode === 'month' ? 'bg-[#fee2e2] text-[hsl(0,71%,36%)] hover:bg-[#fecaca] shadow-sm font-semibold' : 'hover:bg-gray-200'}
          >
            <CalendarDays className="h-4 w-4 mr-2" />
            Maand
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAvailabilityViewClick}
            className={viewMode === 'availability' ? 'bg-[#fee2e2] text-[hsl(0,71%,36%)] hover:bg-[#fecaca] shadow-sm font-semibold' : 'hover:bg-gray-200'}
          >
            <CalendarRange className="h-4 w-4 mr-2" />
            Beschikbaarheid
          </Button>
        </div>
        <Button 
          onClick={handleNewCustomerClick} 
          className="bg-[hsl(0,71%,36%)] hover:bg-[hsl(0,71%,30%)]"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nieuwe Klant Afspraak
        </Button>
      </div>
    );
    return () => {
      setTitle("");
      setActions(null);
    };
  }, [viewMode, setTitle, setActions]);

  // Show planning for admin/administratie, regular dashboard for installateurs
  if (profile?.role === 'Installateur') {
    return <Dashboard />;
  }

  return (
    <div className="h-full">
      <SimplifiedPlanningManagement 
        viewMode={viewMode}
        showCustomerDialog={showCustomerDialog}
        onCloseCustomerDialog={() => setShowCustomerDialog(false)}
      />
    </div>
  );
}

