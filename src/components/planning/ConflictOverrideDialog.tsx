/**
 * Conflict Override Dialog
 * 
 * Shows conflicts when trying to schedule a monteur at a time
 * when they already have other bookings. Allows admin to override or adjust.
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Calendar, Clock, X, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import type { TimeConflict } from '@/utils/monteurAvailabilityService';

export interface ConflictOverrideDialogProps {
  /**
   * Whether dialog is open
   */
  open: boolean;
  
  /**
   * Detected conflicts
   */
  conflicts: TimeConflict[];
  
  /**
   * Monteur name
   */
  monteurName: string;
  
  /**
   * Planning date
   */
  date: Date;
  
  /**
   * New planning times
   */
  newPlanning: {
    startTime: string;
    endTime: string;
    title?: string;
  };
  
  /**
   * Called when user chooses to override conflicts
   */
  onOverride: () => void;
  
  /**
   * Called when user cancels
   */
  onCancel: () => void;
  
  /**
   * Called when user wants to adjust time
   */
  onAdjustTime?: () => void;
}

const SEVERITY_CONFIG = {
  high: {
    color: 'destructive',
    label: 'Hoog',
    icon: '🔴',
  },
  medium: {
    color: 'warning',
    label: 'Gemiddeld',
    icon: '🟡',
  },
  low: {
    color: 'secondary',
    label: 'Laag',
    icon: '🟢',
  },
} as const;

export function ConflictOverrideDialog({
  open,
  conflicts,
  monteurName,
  date,
  newPlanning,
  onOverride,
  onCancel,
  onAdjustTime,
}: ConflictOverrideDialogProps) {
  const totalConflictMinutes = conflicts.reduce(
    (sum, c) => sum + c.overlap.durationMinutes,
    0
  );

  const highestSeverity = conflicts.reduce((max, c) => {
    const severityOrder = { low: 1, medium: 2, high: 3 };
    return severityOrder[c.severity] > severityOrder[max] ? c.severity : max;
  }, 'low' as TimeConflict['severity']);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Planning Conflict Gedetecteerd
          </DialogTitle>
          <DialogDescription>
            Er zijn {conflicts.length} conflict{conflicts.length !== 1 ? 'en' : ''} gevonden
            met bestaande planning voor <strong>{monteurName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Overview Alert */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">
                  Totaal conflict: {Math.round(totalConflictMinutes / 60 * 10) / 10} uur
                </p>
                <p className="text-sm">
                  De monteur heeft al {conflicts.length} andere {conflicts.length === 1 ? 'afspraak' : 'afspraken'} op dit tijdstip.
                </p>
              </div>
            </AlertDescription>
          </Alert>

          {/* New Planning Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-blue-900">Nieuwe Planning</p>
                <p className="text-sm text-blue-700 mt-1">
                  {newPlanning.title || 'Nieuw project'}
                </p>
                <div className="flex items-center gap-4 mt-2 text-sm text-blue-600">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(date, 'EEEE d MMMM yyyy', { locale: nl })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {newPlanning.startTime.slice(0, 5)} - {newPlanning.endTime.slice(0, 5)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Existing Bookings with Conflicts */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Bestaande Planning ({conflicts.length})
            </p>
            
            {conflicts.map((conflict, index) => (
              <div
                key={index}
                className="border rounded-lg p-3 bg-red-50 border-red-200"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-red-900">
                        {conflict.existingBooking.title}
                      </p>
                      <Badge
                        variant={SEVERITY_CONFIG[conflict.severity].color as any}
                        className="text-xs"
                      >
                        {SEVERITY_CONFIG[conflict.severity].icon}{' '}
                        {SEVERITY_CONFIG[conflict.severity].label}
                      </Badge>
                    </div>
                    
                    {conflict.existingBooking.description && (
                      <p className="text-sm text-red-700 mb-2">
                        {conflict.existingBooking.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-red-600">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {conflict.existingBooking.start_time.slice(0, 5)} -{' '}
                        {conflict.existingBooking.end_time.slice(0, 5)}
                      </span>
                    </div>
                    
                    {/* Overlap Info */}
                    <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-800">
                      <strong>❌ Overlap:</strong>{' '}
                      {conflict.overlap.start.slice(0, 5)} -{' '}
                      {conflict.overlap.end.slice(0, 5)}{' '}
                      ({Math.round(conflict.overlap.durationMinutes / 60 * 10) / 10}u)
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Warning Message */}
          <Alert>
            <AlertDescription className="text-sm">
              <p className="font-medium mb-2">⚠️ Let op!</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>De monteur kan niet op twee plekken tegelijk zijn</li>
                <li>Dit kan leiden tot vertragingen en klantonvredenheid</li>
                <li>Overweeg om de tijd aan te passen of een andere monteur te kiezen</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="w-full sm:w-auto"
          >
            <X className="h-4 w-4 mr-2" />
            Annuleren
          </Button>
          
          {onAdjustTime && (
            <Button
              variant="secondary"
              onClick={onAdjustTime}
              className="w-full sm:w-auto"
            >
              <Edit className="h-4 w-4 mr-2" />
              Tijd Aanpassen
            </Button>
          )}
          
          <Button
            variant="destructive"
            onClick={onOverride}
            className="w-full sm:w-auto"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Toch Plannen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

