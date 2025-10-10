import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MobileProjectCompletionWizard } from './MobileProjectCompletionWizard';
import type { Project } from "@/hooks/useCrmStore";

interface MobileProjectCompletionDialogProps {
  project: Project | null;
  workTimeLogId?: string;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

/**
 * Mobile-optimized dialog for project completion workflow
 * Uses MobileProjectCompletionWizard without page navigation
 * All operations are AJAX-based with React Query
 */
export const MobileProjectCompletionDialog: React.FC<MobileProjectCompletionDialogProps> = ({
  project,
  workTimeLogId,
  isOpen,
  onClose,
  onComplete
}) => {
  if (!project) return null;

  const handleComplete = () => {
    onComplete();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-full h-full max-h-screen p-0 gap-0 overflow-y-auto">
        <DialogHeader className="p-4 border-b sticky top-0 bg-background z-10">
          <DialogTitle>Project Oplevering</DialogTitle>
        </DialogHeader>
        
        <div className="overflow-y-auto">
          <MobileProjectCompletionWizard
            project={project}
            workTimeLogId={workTimeLogId}
            onBack={onClose}
            onComplete={handleComplete}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

