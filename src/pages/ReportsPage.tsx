import { useEffect } from "react";
import { usePageHeader } from "@/contexts/PageHeaderContext";
import { Reports } from "@/components/Reports";

export default function ReportsPage() {
  const { setTitle, setActions } = usePageHeader();

  useEffect(() => {
    setTitle("Rapportages");
    setActions(null);
    return () => {
      setTitle("");
      setActions(null);
    };
  }, []);

  return <Reports />;
}

