import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { usePageHeader } from "@/contexts/PageHeaderContext";
import ProjectDetail from "@/components/ProjectDetail";
import { useCrmStore } from "@/hooks/useCrmStore";

export default function ProjectDetailPage() {
  const { setTitle, setActions } = usePageHeader();
  const { projectId } = useParams();
  const { projects } = useCrmStore();
  const project = projects.find(p => p.id === projectId);

  useEffect(() => {
    setTitle(project?.title || "Project Details");
    setActions(null);
    return () => {
      setTitle("");
      setActions(null);
    };
  }, [project]);

  return <ProjectDetail />;
}

