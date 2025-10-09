import { useEffect, useState, useCallback } from "react";
import { usePageHeader } from "@/contexts/PageHeaderContext";
import { SimplifiedPlanningManagement } from "@/components/SimplifiedPlanningManagement";
import { Button } from "@/components/ui/button";
import { Plus, CalendarDays, CalendarRange } from "lucide-react";

export default function PlanningPage() {
  const { setTitle, setActions } = usePageHeader();
  const [viewMode, setViewMode] = useState<'month' | 'availability'>('month');
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);

  // ✅ FIXED: Wrap in useCallback for stable references
  const handleMonthViewClick = useCallback(() => {
    console.log('📅 Maand view clicked!');
    setViewMode('month');
  }, []);

  const handleAvailabilityViewClick = useCallback(() => {
    console.log('📅 Beschikbaarheid view clicked!');
    setViewMode('availability');
  }, []);

  const handleNewCustomerClick = useCallback(() => {
    console.log('➕ Nieuwe Klant Afspraak clicked!');
    setShowCustomerDialog(true);
  }, []);

  useEffect(() => {
    console.log('📝 PlanningPage: Setting up header with viewMode:', viewMode);
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
      console.log('📝 PlanningPage: Cleaning up header');
      setTitle("");
      setActions(null);
    };
  }, [viewMode, setTitle, setActions, handleMonthViewClick, handleAvailabilityViewClick, handleNewCustomerClick]);

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

