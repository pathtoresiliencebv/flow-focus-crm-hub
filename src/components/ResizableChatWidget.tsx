
import { useState, useRef, useEffect } from "react";
import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnhancedChatWindow } from "./chat/EnhancedChatWindow";
import { cn } from "@/lib/utils";

export const ResizableChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);
  const [size, setSize] = useState({ width: 600, height: 400 });
  const [isResizing, setIsResizing] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !chatRef.current) return;

      const rect = chatRef.current.getBoundingClientRect();
      const newWidth = Math.max(300, Math.min(window.innerWidth * 0.8, window.innerWidth - e.clientX + 20));
      const newHeight = Math.max(300, Math.min(window.innerHeight * 0.8, window.innerHeight - e.clientY + 100));

      setSize({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  return (
    <>
      {/* Resizable Chat Window */}
      {isOpen && (
        <div 
          ref={chatRef}
          className="fixed bottom-20 right-4 z-50 bg-white rounded-lg shadow-2xl border"
          style={{ 
            width: `${size.width}px`, 
            height: `${size.height}px`,
            minWidth: '300px',
            minHeight: '300px',
            maxWidth: '80vw',
            maxHeight: '80vh'
          }}
        >
          {/* Resize handle */}
          <div
            className="absolute top-0 left-0 w-4 h-4 cursor-nw-resize bg-gray-300 hover:bg-gray-400 transition-colors"
            onMouseDown={handleMouseDown}
            style={{ borderRadius: '0 0 4px 0' }}
          />
          
          {/* Resize handle - top edge */}
          <div
            className="absolute top-0 left-4 right-4 h-1 cursor-n-resize bg-transparent hover:bg-gray-300 transition-colors"
            onMouseDown={handleMouseDown}
          />
          
          {/* Resize handle - left edge */}
          <div
            className="absolute top-4 bottom-0 left-0 w-1 cursor-w-resize bg-transparent hover:bg-gray-300 transition-colors"
            onMouseDown={handleMouseDown}
          />

          <div className="w-full h-full">
            <EnhancedChatWindow onClose={() => setIsOpen(false)} />
          </div>
        </div>
      )}

      {/* Chat Toggle Button */}
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
