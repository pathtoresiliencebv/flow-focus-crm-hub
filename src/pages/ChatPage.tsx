import { useEffect } from "react";
import { usePageHeader } from "@/contexts/PageHeaderContext";
import { SimpleChatPage } from "@/components/SimpleChatPage";

export default function ChatPage() {
  const { setTitle, setActions } = usePageHeader();

  useEffect(() => {
    setTitle("Chat");
    setActions(null);
    return () => {
      setTitle("");
      setActions(null);
    };
  }, []);

  return <SimpleChatPage />;
}

