
import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatWindow } from "./ChatWindow";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { cn } from "@/lib/utils";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";

export const ChatWidget = () => {
  const { user } = useAuth();
  const { channels } = useChat();
  const [isOpen, setIsOpen] = useState(false);
  
  // Calculate total unread count across all channels
  const unreadCount = channels.reduce((total, channel) => total + (channel.unread_count || 0), 0);

  return (
    <>
      {/* Chat Window - Now resizable */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-[50vw] h-[50vh] min-w-[300px] min-h-[300px] max-w-[80vw] max-h-[80vh]">
          <ResizablePanelGroup direction="horizontal" className="w-full h-full">
            <ResizablePanel defaultSize={100} minSize={30}>
              <ChatWindow onClose={() => setIsOpen(false)} />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      )}

      {/* Chat Toggle Button - Fixed positioning for always visible */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "h-14 w-14 rounded-full shadow-lg transition-all duration-200",
            "bg-smans-primary hover:bg-smans-primary/90",
            "flex items-center justify-center relative",
            "border-2 border-white"
          )}
        >
          {isOpen ? (
            <X className="h-6 w-6 text-white" />
          ) : (
            <>
              <MessageCircle className="h-6 w-6 text-white" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </>
          )}
        </Button>
      </div>
    </>
  );
};
