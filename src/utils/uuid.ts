/**
 * Generate a UUID v4 that works in all environments
 * Falls back to a compatible implementation if crypto.randomUUID is not available
 */
export function generateUUID(): string {
  // Try native crypto.randomUUID if available
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch (e) {
      console.warn('crypto.randomUUID failed, using fallback');
    }
  }
  
  // Fallback: Generate UUID v4 manually
  // This is a standards-compliant UUID v4 generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Alias for generateUUID for drop-in replacement
 */
export const randomUUID = generateUUID;

