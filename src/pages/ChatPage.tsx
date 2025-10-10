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
  }, [setTitle, setActions]);

  return <SimpleChatPage />;
}

