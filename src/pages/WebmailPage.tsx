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
    // 🔥 CRITICAL: setTitle and setActions are STABLE (useCallback with [])
    // Including them in deps causes INFINITE LOOP when context updates!
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-full">
      <RoundcubeWebmail />
    </div>
  );
}

