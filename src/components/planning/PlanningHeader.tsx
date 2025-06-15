
import { Button } from "@/components/ui/button";
import { CalendarDays, Plus } from "lucide-react";

interface PlanningHeaderProps {
  onMultiDayClick: () => void;
  onNewPlanningClick: () => void;
  selectedDate: Date | undefined;
}

export const PlanningHeader = ({ onMultiDayClick, onNewPlanningClick, selectedDate }: PlanningHeaderProps) => {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Planning Beheer</h1>
        <p className="text-gray-600 mt-1 text-sm sm:text-base">Beheer en plan alle activiteiten van je team</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={onMultiDayClick} variant="outline" className="shadow-sm hover:shadow-md transition-shadow w-full sm:w-auto">
          <CalendarDays className="mr-2 h-4 w-4" />
          Meerdaagse Planning
        </Button>
        <Button onClick={onNewPlanningClick} disabled={!selectedDate} className="bg-smans-primary hover:bg-smans-primary/90 text-white shadow-sm hover:shadow-md transition-all w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nieuwe Planning
        </Button>
      </div>
    </div>
  );
};
