import { useEffect, useState, useCallback, useMemo } from "react";
import { usePageHeader } from "@/contexts/PageHeaderContext";
import { TimeRegistration } from "@/components/TimeRegistration";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function TimePage() {
  const { setTitle, setActions } = usePageHeader();
  const [showTimeDialog, setShowTimeDialog] = useState(false);

  const handleNewTimeEntry = useCallback(() => {
    setShowTimeDialog(true);
  }, []);

  // 🔥 Memoize JSX to prevent infinite re-renders
  const headerActions = useMemo(() => (
    <Button 
      onClick={handleNewTimeEntry}
      size="sm"
      className="bg-[hsl(0,71%,36%)] hover:bg-[hsl(0,71%,30%)] text-white"
    >
      <Plus className="h-4 w-4 mr-2" />
      Nieuwe Tijd Registratie
    </Button>
  ), [handleNewTimeEntry]);

  useEffect(() => {
    setTitle("Tijdregistratie");
    setActions(headerActions);
    return () => {
      setTitle("");
      setActions(null);
    };
  }, [setTitle, setActions, headerActions]);

  return (
    <TimeRegistration 
      showTimeDialog={showTimeDialog}
      onCloseTimeDialog={() => setShowTimeDialog(false)}
    />
  );
}

