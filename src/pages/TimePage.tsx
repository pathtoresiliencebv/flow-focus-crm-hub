import { useEffect } from "react";
import { usePageHeader } from "@/contexts/PageHeaderContext";
import { TimeRegistration } from "@/components/TimeRegistration";

export default function TimePage() {
  const { setTitle, setActions } = usePageHeader();

  useEffect(() => {
    setTitle("Tijdregistratie");
    setActions(null);
    return () => {
      setTitle("");
      setActions(null);
    };
  }, []);

  return <TimeRegistration />;
}

