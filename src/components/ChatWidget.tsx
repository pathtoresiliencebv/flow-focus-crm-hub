
import { useState, useEffect } from "react";
import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnhancedChatWindow } from "./chat/EnhancedChatWindow";
import { cn } from "@/lib/utils";
import { useEnhancedChat } from "@/hooks/useEnhancedChat";
import { useAuth } from "@/hooks/useAuth";

export const ChatWidget = () => {
  const { user } = useAuth();
  const { totalUnreadCount } = useEnhancedChat({
    enableRealtime: true,
    enableDirectMessages: true,
    enableChannels: true,
    autoLoadMessages: false
  });
  const [isOpen, setIsOpen] = useState(false);
  
  // Don't show if user is not authenticated
  if (!user) return null;

  return (
    <>
      {/* Chat Window - Always fullscreen */}
      {isOpen && (
        <div className="fixed inset-0 z-60 shadow-2xl overflow-hidden bg-background border transition-all duration-300">
          <EnhancedChatWindow onClose={() => setIsOpen(false)} />
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
              {totalUnreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                </span>
              )}
            </>
          )}
        </Button>
      </div>
    </>
  );
};
