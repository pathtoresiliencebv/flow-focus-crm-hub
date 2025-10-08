import { useEffect } from "react";
import { usePageHeader } from "@/contexts/PageHeaderContext";
import Settings from "./Settings";

export default function SettingsPage() {
  const { setTitle, setActions } = usePageHeader();

  useEffect(() => {
    setTitle("Instellingen");
    setActions(null);
    return () => {
      setTitle("");
      setActions(null);
    };
  }, []);

  return <Settings />;
}

