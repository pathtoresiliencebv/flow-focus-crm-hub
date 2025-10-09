import { useEffect, useState, useCallback } from "react";
import { usePageHeader } from "@/contexts/PageHeaderContext";
import { ProjectsBoard } from "@/components/ProjectsBoard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function ProjectsPage() {
  const { setTitle, setActions } = usePageHeader();
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);

  // ✅ Use useCallback to create stable function reference
  const handleNewProject = useCallback(() => {
    console.log('🔵 Nieuw Project button clicked!');
    setShowNewProjectDialog(true);
  }, []);

  useEffect(() => {
    setTitle("Projecten");
    setActions(
      <Button 
        size="sm" 
        className="bg-[hsl(0,71%,36%)] hover:bg-[hsl(0,71%,30%)] text-white"
        onClick={handleNewProject}
      >
        <Plus className="h-4 w-4 mr-2" />
        Nieuw Project
      </Button>
    );
    return () => {
      setTitle("");
      setActions(null);
    };
  }, [setTitle, setActions, handleNewProject]);

  return (
    <ProjectsBoard 
      showNewProjectDialog={showNewProjectDialog}
      onCloseNewProjectDialog={() => setShowNewProjectDialog(false)}
    />
  );
}

