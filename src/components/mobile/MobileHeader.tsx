import { ArrowLeft, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface MobileHeaderProps {
  title?: string;
  showBack?: boolean;
  onMenuClick?: () => void;
}

export const MobileHeader = ({ title, showBack = false, onMenuClick }: MobileHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-40 bg-background border-b border-border md:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="text-lg font-bold text-smans-primary">
            SMANS CRM
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {showBack ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMenuClick}
              className="h-8 w-8 p-0"
            >
              <Menu className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      {title && (
        <div className="px-4 pb-2">
          <h1 className="text-lg font-semibold truncate">{title}</h1>
        </div>
      )}
    </div>
  );
};