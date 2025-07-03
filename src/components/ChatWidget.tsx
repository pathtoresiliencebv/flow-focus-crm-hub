
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
  
  // Don't show if user is not authenticated
  if (!user) return null;

  return (
    <>
      {/* Chat Window - Fixed bottom right with scrolling */}
      {isOpen && (
        <div className="fixed bottom-20 md:bottom-20 right-4 z-60 w-[400px] md:w-[800px] h-[500px] md:h-[700px] max-w-[90vw] max-h-[80vh] shadow-2xl">
          <ResizablePanelGroup direction="horizontal" className="w-full h-full">
            <ResizablePanel defaultSize={100} minSize={30}>
              <ChatWindow onClose={() => setIsOpen(false)} />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      )}

      {/* Chat Toggle Button - Fixed bottom right, mobile-optimized positioning */}
      <div className="fixed bottom-24 md:bottom-4 right-4 z-60" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "h-14 w-14 rounded-full shadow-lg transition-all duration-200",
            "bg-primary hover:bg-primary/90",
            "flex items-center justify-center relative",
            "border-2 border-background"
          )}
        >
          {isOpen ? (
            <X className="h-6 w-6 text-primary-foreground" />
          ) : (
            <>
              <MessageCircle className="h-6 w-6 text-primary-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </>
          )}
        </Button>
      </div>
    </>
  );
};
