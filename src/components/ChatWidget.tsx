
import { useState, useEffect } from "react";
import { MessageCircle, X, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImprovedChatWindow } from "./ImprovedChatWindow";
import { cn } from "@/lib/utils";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";

export const ChatWidget = () => {
  const { user } = useAuth();
  const { channels } = useChat();
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(true); // Start fullscreen on desktop by default
  
  // Calculate total unread count across all channels
  const unreadCount = channels.reduce((total, channel) => total + (channel.unread_count || 0), 0);
  
  // Handle ESC key to close fullscreen
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isFullscreen]);

  // Don't show if user is not authenticated
  if (!user) return null;

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <>
      {/* Chat Window - Fullscreen or normal mode */}
      {isOpen && (
        <div className={cn(
          "fixed z-60 shadow-2xl rounded-lg overflow-hidden bg-background border transition-all duration-300",
          isFullscreen 
            ? "inset-0" // True fullscreen
            : "bottom-20 md:bottom-20 right-4 w-[400px] md:w-[800px] h-[500px] md:h-[700px] max-w-[90vw] max-h-[80vh]" // Normal mode
        )}>
          <div className="relative w-full h-full">
            {/* Fullscreen toggle button - only on desktop */}
            <div className="absolute top-2 right-14 z-10 hidden md:block">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                className="h-8 w-8 p-0 hover:bg-accent"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            <ImprovedChatWindow onClose={() => setIsOpen(false)} />
          </div>
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
