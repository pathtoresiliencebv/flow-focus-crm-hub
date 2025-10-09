/**
 * Centralized User Color Service
 * 
 * Provides consistent color schemes for users across the entire application.
 * Used in chat, planning, reports, and anywhere user identification is needed.
 */

export interface ColorScheme {
  bg: string;
  text: string;
  name: string;
  light: string;
  dark: string;
}

/**
 * Centralized color palette for monteurs/users
 * Each user gets assigned a unique color based on their position in the user list
 */
export const MONTEUR_COLORS: ColorScheme[] = [
  { 
    bg: '#3B82F6', 
    text: '#FFFFFF', 
    name: 'blue',
    light: '#DBEAFE',
    dark: '#1E40AF'
  },
  { 
    bg: '#EF4444', 
    text: '#FFFFFF', 
    name: 'red',
    light: '#FEE2E2',
    dark: '#991B1B'
  },
  { 
    bg: '#10B981', 
    text: '#FFFFFF', 
    name: 'green',
    light: '#D1FAE5',
    dark: '#047857'
  },
  { 
    bg: '#F59E0B', 
    text: '#FFFFFF', 
    name: 'amber',
    light: '#FEF3C7',
    dark: '#B45309'
  },
  { 
    bg: '#8B5CF6', 
    text: '#FFFFFF', 
    name: 'purple',
    light: '#EDE9FE',
    dark: '#6D28D9'
  },
  { 
    bg: '#EC4899', 
    text: '#FFFFFF', 
    name: 'pink',
    light: '#FCE7F3',
    dark: '#BE185D'
  },
  { 
    bg: '#06B6D4', 
    text: '#FFFFFF', 
    name: 'cyan',
    light: '#CFFAFE',
    dark: '#0E7490'
  },
  { 
    bg: '#84CC16', 
    text: '#FFFFFF', 
    name: 'lime',
    light: '#ECFCCB',
    dark: '#4D7C0F'
  },
  { 
    bg: '#F97316', 
    text: '#FFFFFF', 
    name: 'orange',
    light: '#FFEDD5',
    dark: '#C2410C'
  },
  { 
    bg: '#6366F1', 
    text: '#FFFFFF', 
    name: 'indigo',
    light: '#E0E7FF',
    dark: '#4338CA'
  },
];

export interface User {
  id: string;
  full_name?: string | null;
  email?: string;
}

/**
 * Get a consistent color scheme for a user based on their ID
 * @param userId - The user's unique ID
 * @param allUsers - Array of all users (to determine consistent index)
 * @returns ColorScheme object with bg, text, name, light, and dark colors
 */
export function getUserColor(userId: string, allUsers: User[]): ColorScheme {
  // Find the user's index in the sorted user list for consistency
  const sortedUsers = [...allUsers].sort((a, b) => a.id.localeCompare(b.id));
  const userIndex = sortedUsers.findIndex(u => u.id === userId);
  
  // If user not found, use a default color
  if (userIndex === -1) {
    return MONTEUR_COLORS[0];
  }
  
  // Return color based on index (wraps around if more users than colors)
  return MONTEUR_COLORS[userIndex % MONTEUR_COLORS.length];
}

/**
 * Get user initials from full name
 * @param fullName - User's full name (e.g., "John Doe")
 * @returns Initials (e.g., "JD")
 */
export function getUserInitials(fullName: string | null | undefined): string {
  if (!fullName || fullName.trim() === '') {
    return 'U'; // Unknown user
  }
  
  const nameParts = fullName.trim().split(/\s+/);
  
  if (nameParts.length === 1) {
    // Single name - use first two characters
    return nameParts[0].substring(0, 2).toUpperCase();
  }
  
  // Multiple names - use first letter of first two parts
  return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
}

/**
 * Get a color for a user by ID (simplified version without needing full user list)
 * Uses a hash of the user ID to determine color index
 * @param userId - The user's unique ID
 * @returns ColorScheme object
 */
export function getUserColorById(userId: string): ColorScheme {
  // Simple hash function to get consistent color for user ID
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % MONTEUR_COLORS.length;
  return MONTEUR_COLORS[index];
}

/**
 * Get multiple colors for a gradient (for multi-user items)
 * @param userIds - Array of user IDs
 * @param allUsers - Array of all users
 * @returns Array of color hex codes
 */
export function getMultiUserColors(userIds: string[], allUsers: User[]): string[] {
  return userIds.map(id => getUserColor(id, allUsers).bg);
}

/**
 * Create a CSS gradient string for multiple users
 * @param userIds - Array of user IDs
 * @param allUsers - Array of all users
 * @returns CSS gradient string
 */
export function createMultiUserGradient(userIds: string[], allUsers: User[]): string {
  if (userIds.length === 0) return MONTEUR_COLORS[0].bg;
  if (userIds.length === 1) return getUserColor(userIds[0], allUsers).bg;
  
  const colors = getMultiUserColors(userIds, allUsers);
  const step = 100 / colors.length;
  
  const stops = colors.map((color, index) => {
    const start = index * step;
    const end = (index + 1) * step;
    return `${color} ${start}%, ${color} ${end}%`;
  }).join(', ');
  
  return `linear-gradient(90deg, ${stops})`;
}

