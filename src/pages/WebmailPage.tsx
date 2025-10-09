import { useEffect } from "react";
import { usePageHeader } from "@/contexts/PageHeaderContext";
import { RoundcubeWebmail } from "@/components/webmail/RoundcubeWebmail";
import { Mail } from "lucide-react";

export default function WebmailPage() {
  const { setTitle, setActions } = usePageHeader();

  useEffect(() => {
    setTitle("Webmail");
    setActions(null);
    return () => {
      setTitle("");
      setActions(null);
    };
  }, [setTitle, setActions]);

  return (
    <div className="h-full">
      <RoundcubeWebmail />
    </div>
  );
}

