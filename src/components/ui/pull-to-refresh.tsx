import React, { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Loader2, RotateCcw } from 'lucide-react';
import { useNativeCapabilities } from '@/hooks/useNativeCapabilities';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
  threshold?: number;
  disabled?: boolean;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  className,
  threshold = 80,
  disabled = false
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const startY = useRef<number>(0);
  const { hapticFeedback, isNativeApp } = useNativeCapabilities();

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    startY.current = e.touches[0].clientY;
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - startY.current;
    
    // Only start pulling if we're at the top of the scroll container
    const scrollTop = (e.currentTarget as HTMLElement).scrollTop;
    
    if (scrollTop === 0 && deltaY > 0) {
      e.preventDefault();
      const distance = Math.min(deltaY * 0.6, threshold * 1.5);
      setPullDistance(distance);
      setIsPulling(true);
      
      // Haptic feedback when threshold is reached
      if (distance >= threshold && isNativeApp) {
        hapticFeedback();
      }
    }
  }, [disabled, isRefreshing, threshold, hapticFeedback, isNativeApp]);

  const handleTouchEnd = useCallback(async () => {
    if (disabled || isRefreshing) return;
    
    setIsPulling(false);
    
    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setPullDistance(0);
  }, [disabled, isRefreshing, pullDistance, threshold, onRefresh]);

  const refreshProgress = Math.min((pullDistance / threshold) * 100, 100);
  const isTriggered = pullDistance >= threshold;

  return (
    <div
      className={cn("relative h-full overflow-auto", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: isPulling || isRefreshing ? `translateY(${Math.min(pullDistance, threshold)}px)` : undefined,
        transition: !isPulling && !isRefreshing ? 'transform 0.3s ease-out' : undefined
      }}
    >
      {/* Pull to refresh indicator */}
      <div 
        className={cn(
          "absolute inset-x-0 top-0 z-10 flex items-center justify-center bg-background/90 backdrop-blur-sm transition-all duration-200",
          isPulling || isRefreshing ? "opacity-100" : "opacity-0"
        )}
        style={{
          height: `${Math.min(pullDistance, threshold)}px`,
          transform: `translateY(-${threshold}px)`
        }}
      >
        <div className="flex flex-col items-center gap-1">
          {isRefreshing ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : (
            <RotateCcw 
              className={cn(
                "h-5 w-5 text-muted-foreground transition-all duration-200",
                isTriggered && "text-primary scale-110"
              )}
              style={{
                transform: `rotate(${refreshProgress * 3.6}deg)`
              }}
            />
          )}
          <span className="text-xs text-muted-foreground">
            {isRefreshing 
              ? "Vernieuwen..." 
              : isTriggered 
                ? "Loslaten om te vernieuwen"
                : "Trek om te vernieuwen"
            }
          </span>
        </div>
      </div>

      {children}
    </div>
  );
};