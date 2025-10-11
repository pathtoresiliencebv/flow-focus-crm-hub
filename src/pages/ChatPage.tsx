import { useEffect } from "react";
import { usePageHeader } from "@/contexts/PageHeaderContext";
import { SimpleChatPage } from "@/components/SimpleChatPage";

export default function ChatPage() {
  const { setTitle, setActions } = usePageHeader();

  // Debug render cycles
  useEffect(() => {
    console.log('🔄 ChatPage rendered');
  });

  useEffect(() => {
    setTitle("Chat");
    setActions(null);
    return () => {
      setTitle("");
      setActions(null);
    };
    // 🔥 CRITICAL: setTitle and setActions are STABLE (useCallback with [])
    // Including them in deps causes INFINITE LOOP when context updates!
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <SimpleChatPage />;
}

