import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useDirectChat } from './useDirectChat';

export const useChatUnreadCount = () => {
  const { user, profile } = useAuth();
  const { availableUsers, getUnreadCount } = useDirectChat();
  const [totalUnreadCount, setTotalUnreadCount] = useState<number>(0);

  // Check if user has chat access
  const hasChatAccess = ['Administrator', 'Administratie', 'Installateur'].includes(profile?.role || '');

  const calculateTotalUnreadCount = useCallback(async () => {
    // Return 0 if user doesn't have chat access
    if (!hasChatAccess || !user || !availableUsers || availableUsers.length === 0) {
      setTotalUnreadCount(0);
      return;
    }

    try {
      let total = 0;
      for (const chatUser of availableUsers) {
        if (chatUser?.id && getUnreadCount) {
          const count = await getUnreadCount(chatUser.id);
          total += count || 0;
        }
      }
      setTotalUnreadCount(total);
    } catch (error) {
      console.error('Error calculating unread count:', error);
      setTotalUnreadCount(0);
    }
  }, [hasChatAccess, user, availableUsers, getUnreadCount]);

  useEffect(() => {
    calculateTotalUnreadCount();
    
    // Refresh unread count every 30 seconds
    const interval = setInterval(calculateTotalUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, [calculateTotalUnreadCount]);

  return {
    totalUnreadCount,
    refreshUnreadCount: calculateTotalUnreadCount
  };
};