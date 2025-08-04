import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileImprovedChatView } from "./mobile/MobileImprovedChatView";
import { ImprovedChatWindow } from "./ImprovedChatWindow";
import { useChatUnreadCount } from "@/hooks/useChatUnreadCount";

interface FloatingChatProps {
  currentProjectId?: string;
  currentProjectTitle?: string;
}

export const FloatingChat: React.FC<FloatingChatProps> = ({ 
  currentProjectId, 
  currentProjectTitle 
}) => {
  const { user, profile } = useAuth();
  const isMobile = useIsMobile();
  const { totalUnreadCount } = useChatUnreadCount();
  const [isOpen, setIsOpen] = useState(false);

  // Check if user has chat access
  const hasChatAccess = profile?.role && ['Administrator', 'Administratie', 'Installateur'].includes(profile.role);

  // Debug logging
  console.log('FloatingChat Debug:', {
    user: !!user,
    profile: profile?.role,
    hasChatAccess,
    totalUnreadCount,
    isOpen
  });

  // Show chat button if user exists and has chat access
  if (!user || !hasChatAccess) return null;

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div className={cn(
          "fixed z-50 shadow-2xl rounded-lg overflow-hidden bg-background border",
          isMobile 
            ? "inset-4 top-16" // Full screen on mobile with top margin
            : "bottom-20 right-4 w-[400px] h-[500px] max-w-[90vw] max-h-[80vh]" // Bottom right on desktop
        )}>
          {isMobile ? (
            <MobileImprovedChatView onBack={() => setIsOpen(false)} />
          ) : (
            <ImprovedChatWindow onClose={() => setIsOpen(false)} />
          )}
        </div>
      )}

      {/* Chat Toggle Button - ALWAYS VISIBLE on desktop */}
      <div className={cn(
        "fixed z-50",
        isMobile ? "bottom-20 right-4" : "bottom-8 right-8"
      )}>
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "rounded-full shadow-2xl transition-all duration-200 transform hover:scale-110",
            "bg-smans-primary hover:bg-smans-primary/90",
            "flex items-center justify-center relative",
            "border-4 border-white",
            "ring-4 ring-smans-primary/20",
            isMobile ? "h-12 w-12" : "h-16 w-16"
          )}
        >
          {isOpen ? (
            <X className={cn("text-primary-foreground", isMobile ? "h-5 w-5" : "h-6 w-6")} />
          ) : (
            <>
              <MessageCircle className={cn("text-primary-foreground", isMobile ? "h-5 w-5" : "h-6 w-6")} />
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