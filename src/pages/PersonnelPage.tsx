import { useEffect } from "react";
import { usePageHeader } from "@/contexts/PageHeaderContext";
import Personnel from "@/components/Personnel";

export default function PersonnelPage() {
  const { setTitle, setActions } = usePageHeader();

  useEffect(() => {
    setTitle("Personeel");
    setActions(null);
    return () => {
      setTitle("");
      setActions(null);
    };
  }, []);

  return <Personnel />;
}

