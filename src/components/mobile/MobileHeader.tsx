import { ArrowLeft, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { NotificationCenter } from "@/components/NotificationCenter";
import { RealtimeIndicator } from "@/components/RealtimeIndicator";

interface MobileHeaderProps {
  title?: string;
  showBack?: boolean;
  onMenuClick?: () => void;
}

export const MobileHeader = ({ title, showBack = false, onMenuClick }: MobileHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border md:hidden">
      {/* Safe area padding for devices with notch */}
      <div className="pt-safe-area-inset-top">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="text-lg font-bold text-smans-primary truncate">
              SMANS CRM
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <RealtimeIndicator />
            <NotificationCenter />
            {showBack ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="h-10 w-10 p-0 touch-manipulation active:scale-95 transition-transform"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMenuClick}
                className="h-10 w-10 p-0 touch-manipulation active:scale-95 transition-transform"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
        
        {title && (
          <div className="px-4 pb-3">
            <h1 className="text-xl font-semibold truncate">{title}</h1>
          </div>
        )}
      </div>
    </div>
  );
};