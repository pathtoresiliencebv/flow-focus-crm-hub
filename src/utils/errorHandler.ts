import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface ErrorContext {
  userId?: string;
  action?: string;
  component?: string;
  additionalData?: Record<string, any>;
}

export interface ErrorReport {
  id: string;
  message: string;
  stack?: string;
  context: ErrorContext;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'ui' | 'api' | 'auth' | 'sync' | 'mobile' | 'payment' | 'unknown';
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorQueue: ErrorReport[] = [];
  private isOnline = true;

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // Determine error category based on error properties
  private categorizeError(error: Error, context?: ErrorContext): ErrorReport['category'] {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    if (message.includes('auth') || message.includes('login') || message.includes('permission')) {
      return 'auth';
    }
    
    if (message.includes('network') || message.includes('fetch') || message.includes('api') || 
        message.includes('supabase') || message.includes('timeout')) {
      return 'api';
    }
    
    if (message.includes('sync') || message.includes('offline') || message.includes('queue')) {
      return 'sync';
    }
    
    if (message.includes('payment') || message.includes('stripe') || message.includes('invoice')) {
      return 'payment';
    }
    
    if (message.includes('capacitor') || message.includes('native') || message.includes('mobile')) {
      return 'mobile';
    }
    
    if (context?.component || stack.includes('react') || stack.includes('component')) {
      return 'ui';
    }
    
    return 'unknown';
  }

  // Determine error severity
  private determineSeverity(error: Error, category: ErrorReport['category']): ErrorReport['severity'] {
    const message = error.message.toLowerCase();
    
    // Critical errors
    if (message.includes('payment failed') || 
        message.includes('data loss') || 
        message.includes('security') ||
        category === 'auth' && message.includes('unauthorized')) {
      return 'critical';
    }
    
    // High severity
    if (category === 'api' && (message.includes('500') || message.includes('server error')) ||
        category === 'payment' ||
        message.includes('sync failed') ||
        message.includes('database')) {
      return 'high';
    }
    
    // Medium severity
    if (category === 'api' || category === 'sync' || category === 'mobile') {
      return 'medium';
    }
    
    // Low severity (UI issues, validation errors, etc.)
    return 'low';
  }

  // Create user-friendly error messages
  private createUserMessage(error: Error, category: ErrorReport['category']): string {
    const message = error.message.toLowerCase();
    
    switch (category) {
      case 'auth':
        if (message.includes('unauthorized') || message.includes('forbidden')) {
          return 'Je hebt geen toestemming voor deze actie. Log opnieuw in.';
        }
        return 'Er is een probleem met je inloggegevens. Probeer opnieuw in te loggen.';
      
      case 'api':
        if (message.includes('network') || message.includes('offline')) {
          return 'Geen internetverbinding. Controleer je verbinding en probeer opnieuw.';
        }
        if (message.includes('timeout')) {
          return 'De server reageert langzaam. Probeer het over een moment opnieuw.';
        }
        return 'Er is een probleem met de serververbinding. Probeer het later opnieuw.';
      
      case 'sync':
        return 'Synchronisatie mislukt. Je wijzigingen worden opgeslagen wanneer je weer online bent.';
      
      case 'payment':
        return 'Er is een probleem opgetreden bij de betaling. Controleer je gegevens en probeer opnieuw.';
      
      case 'mobile':
        return 'Er is een probleem met een mobiele functie. Herstart de app als het probleem aanhoudt.';
      
      case 'ui':
        return 'Er is een weergaveprobleem opgetreden. Ververs de pagina als het probleem aanhoudt.';
      
      default:
        return 'Er is een onverwachte fout opgetreden. Probeer het opnieuw of neem contact op met ondersteuning.';
    }
  }

  // Handle error with context
  async handleError(error: Error, context?: ErrorContext, showToast = true): Promise<void> {
    try {
      const category = this.categorizeError(error, context);
      const severity = this.determineSeverity(error, category);
      
      const errorReport: ErrorReport = {
        id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        message: error.message,
        stack: error.stack,
        context: {
          userId: context?.userId || 'unknown',
          action: context?.action || 'unknown',
          component: context?.component || 'unknown',
          additionalData: context?.additionalData || {},
        },
        timestamp: Date.now(),
        severity,
        category,
      };

      // Add to queue for later processing
      this.errorQueue.push(errorReport);

      // Log to console in development
      if (import.meta.env.DEV) {
        console.group(`🚨 Error [${severity.toUpperCase()}]`);
        console.error('Message:', error.message);
        console.error('Category:', category);
        console.error('Context:', context);
        console.error('Stack:', error.stack);
        console.groupEnd();
      }

      // Send to error reporting service if online
      if (this.isOnline) {
        await this.reportError(errorReport);
      }

      // Show user-friendly toast message
      if (showToast) {
        const userMessage = this.createUserMessage(error, category);
        const title = severity === 'critical' ? 'Kritieke fout' : 
                     severity === 'high' ? 'Fout opgetreden' : 
                     'Waarschuwing';
        
        toast({
          title,
          description: userMessage,
          variant: severity === 'critical' || severity === 'high' ? 'destructive' : 'default',
        });
      }

    } catch (handlingError) {
      // Fallback: log to console if error handling itself fails
      console.error('Error in error handler:', handlingError);
      console.error('Original error:', error);
    }
  }

  // Report error to backend service
  private async reportError(errorReport: ErrorReport): Promise<void> {
    try {
      const { error } = await supabase
        .from('error_logs')
        .insert({
          error_id: errorReport.id,
          message: errorReport.message,
          stack_trace: errorReport.stack,
          category: errorReport.category,
          severity: errorReport.severity,
          user_id: errorReport.context.userId,
          component: errorReport.context.component,
          action: errorReport.context.action,
          additional_data: errorReport.context.additionalData,
          timestamp: new Date(errorReport.timestamp).toISOString(),
          user_agent: navigator.userAgent,
          url: window.location.href,
        });

      if (error) {
        console.error('Failed to report error to backend:', error);
        // Keep in queue for retry
        return;
      }

      // Remove from queue after successful reporting
      const index = this.errorQueue.findIndex(e => e.id === errorReport.id);
      if (index > -1) {
        this.errorQueue.splice(index, 1);
      }

    } catch (reportError) {
      console.error('Error reporting failed:', reportError);
    }
  }

  // Process queued errors when back online
  async processQueuedErrors(): Promise<void> {
    if (!this.isOnline || this.errorQueue.length === 0) return;

    const errors = [...this.errorQueue];
    for (const error of errors) {
      await this.reportError(error);
    }
  }

  // Set online status for queue processing
  setOnlineStatus(isOnline: boolean): void {
    const wasOffline = !this.isOnline;
    this.isOnline = isOnline;
    
    // Process queued errors when coming back online
    if (wasOffline && isOnline) {
      this.processQueuedErrors();
    }
  }

  // Get error statistics
  getErrorStats(): { total: number; bySeverity: Record<string, number>; byCategory: Record<string, number> } {
    const stats = {
      total: this.errorQueue.length,
      bySeverity: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
    };

    this.errorQueue.forEach(error => {
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
      stats.byCategory[error.category] = (stats.byCategory[error.category] || 0) + 1;
    });

    return stats;
  }

  // Clear error queue (for cleanup)
  clearErrorQueue(): void {
    this.errorQueue = [];
  }
}

// Global error handler instance
export const errorHandler = ErrorHandler.getInstance();

// Helper functions for common error scenarios
export const handleApiError = (error: Error, action: string, component?: string) => {
  errorHandler.handleError(error, { action, component, additionalData: { type: 'api' } });
};

export const handleAuthError = (error: Error, action: string) => {
  errorHandler.handleError(error, { action, component: 'auth', additionalData: { type: 'authentication' } });
};

export const handleSyncError = (error: Error, data?: any) => {
  errorHandler.handleError(error, { 
    action: 'sync', 
    component: 'offline-sync', 
    additionalData: { data, type: 'synchronization' } 
  });
};

export const handlePaymentError = (error: Error, paymentData?: any) => {
  errorHandler.handleError(error, { 
    action: 'payment', 
    component: 'payment-processing', 
    additionalData: { paymentData, type: 'payment' } 
  });
};

export const handleMobileError = (error: Error, feature: string) => {
  errorHandler.handleError(error, { 
    action: feature, 
    component: 'mobile-app', 
    additionalData: { feature, type: 'mobile' } 
  });
};

// React Error Boundary hook
export const useErrorHandler = () => {
  return {
    handleError: errorHandler.handleError.bind(errorHandler),
    handleApiError,
    handleAuthError,
    handleSyncError,
    handlePaymentError,
    handleMobileError,
  };
};