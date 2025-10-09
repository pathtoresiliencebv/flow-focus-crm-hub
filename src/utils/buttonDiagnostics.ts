/**
 * Button Diagnostics Utility
 * ==========================
 * 
 * Helper functions to diagnose button click issues across the platform
 */

export const logButtonClick = (buttonName: string, metadata?: any) => {
  console.log(`🔘 BUTTON CLICK: ${buttonName}`, {
    timestamp: new Date().toISOString(),
    ...metadata
  });
};

export const logButtonError = (buttonName: string, error: any) => {
  console.error(`❌ BUTTON ERROR: ${buttonName}`, {
    timestamp: new Date().toISOString(),
    error: error.message || error,
    stack: error.stack
  });
};

export const testButtonInteractivity = () => {
  console.log('🔍 Testing Button Interactivity...');
  
  // Check if there are any overlays blocking clicks
  const overlays = document.querySelectorAll('[class*="overlay"], [class*="modal"], [class*="backdrop"]');
  console.log(`📊 Found ${overlays.length} potential overlay elements`);
  
  overlays.forEach((overlay, index) => {
    const styles = window.getComputedStyle(overlay);
    console.log(`Overlay ${index}:`, {
      display: styles.display,
      visibility: styles.visibility,
      pointerEvents: styles.pointerEvents,
      zIndex: styles.zIndex,
      opacity: styles.opacity
    });
  });
  
  // Check if buttons are actually clickable
  const buttons = document.querySelectorAll('button');
  console.log(`📊 Found ${buttons.length} button elements`);
  
  let disabledCount = 0;
  let hiddenCount = 0;
  let blockedCount = 0;
  
  buttons.forEach(button => {
    if (button.disabled) disabledCount++;
    const styles = window.getComputedStyle(button);
    if (styles.display === 'none' || styles.visibility === 'hidden') hiddenCount++;
    if (styles.pointerEvents === 'none') blockedCount++;
  });
  
  console.log('📊 Button Statistics:', {
    total: buttons.length,
    disabled: disabledCount,
    hidden: hiddenCount,
    blockedByPointerEvents: blockedCount,
    clickable: buttons.length - disabledCount - hiddenCount - blockedCount
  });
  
  return {
    total: buttons.length,
    disabled: disabledCount,
    hidden: hiddenCount,
    blocked: blockedCount,
    clickable: buttons.length - disabledCount - hiddenCount - blockedCount
  };
};

// Attach to window for easy console access
if (typeof window !== 'undefined') {
  (window as any).testButtons = testButtonInteractivity;
  (window as any).logButtonClick = logButtonClick;
}

