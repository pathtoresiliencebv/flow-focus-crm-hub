import { useEffect, useState, useCallback, useMemo } from "react";
import { usePageHeader } from "@/contexts/PageHeaderContext";
import { ProjectsBoard } from "@/components/ProjectsBoard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function ProjectsPage() {
  const { setTitle, setActions } = usePageHeader();
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);

  // ✅ Use useCallback to create stable function reference
  const handleNewProject = useCallback(() => {
    console.log('🔵 Nieuw Project button clicked!');
    setShowNewProjectDialog(true);
  }, []);

  // ✅ Stable callback for closing dialog
  const handleCloseNewProjectDialog = useCallback(() => {
    setShowNewProjectDialog(false);
  }, []);

  // 🔥 CRITICAL: Memoize the Button JSX element to prevent infinite re-renders!
  // React elements are objects, so <Button /> creates a NEW object every render.
  // Without memoization, this triggers PageHeaderContext updates on every render.
  const headerActions = useMemo(() => (
    <Button 
      size="sm" 
      className="bg-[hsl(0,71%,36%)] hover:bg-[hsl(0,71%,30%)] text-white"
      onClick={handleNewProject}
    >
      <Plus className="h-4 w-4 mr-2" />
      Nieuw Project
    </Button>
  ), [handleNewProject]);

  useEffect(() => {
    console.log('📝 ProjectsPage: Setting up header');
    setTitle("Projecten");
    setActions(headerActions); // Use memoized element
    
    return () => {
      console.log('📝 ProjectsPage: Cleaning up header');
      setTitle("");
      setActions(null);
    };
  }, [setTitle, setActions]); // Don't include headerActions - it's memoized and causes loops

  return (
    <ErrorBoundary>
      <ProjectsBoard 
        showNewProjectDialog={showNewProjectDialog}
        onCloseNewProjectDialog={handleCloseNewProjectDialog}
      />
    </ErrorBoundary>
  );
}

