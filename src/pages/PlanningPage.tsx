import { useEffect } from "react";
import { usePageHeader } from "@/contexts/PageHeaderContext";
import { SimplifiedPlanningManagement } from "@/components/SimplifiedPlanningManagement";

export default function PlanningPage() {
  const { setTitle, setActions } = usePageHeader();

  useEffect(() => {
    setTitle("Planning");
    setActions(null);
    return () => {
      setTitle("");
      setActions(null);
    };
  }, []);

  return (
    <div className="h-full">
      <SimplifiedPlanningManagement />
    </div>
  );
}

