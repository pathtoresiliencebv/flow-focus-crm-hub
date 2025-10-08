import { useEffect } from "react";
import { usePageHeader } from "@/contexts/PageHeaderContext";
import { ProjectsBoard } from "@/components/ProjectsBoard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function ProjectsPage() {
  const { setTitle, setActions } = usePageHeader();

  useEffect(() => {
    setTitle("Projecten");
    setActions(
      <Button size="sm" className="bg-red-600 hover:bg-red-700">
        <Plus className="h-4 w-4 mr-2" />
        Nieuw Project
      </Button>
    );
    return () => {
      setTitle("");
      setActions(null);
    };
  }, []);

  return <ProjectsBoard />;
}

