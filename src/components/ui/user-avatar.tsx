/**
 * User Avatar Component
 * 
 * Displays a colored circular avatar with user initials.
 * Colors are consistent across the entire application using userColorService.
 * Used in chat, planning, and anywhere user identification is needed.
 */

import React from 'react';
import { Avatar, AvatarFallback } from './avatar';
import { getUserColor, getUserInitials, type User } from '@/utils/userColorService';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';

export interface UserAvatarProps {
  user: User;
  allUsers: User[];
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
  showTooltip?: boolean;
  className?: string;
}

/**
 * Size mappings for avatar dimensions
 */
const sizeClasses = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

/**
 * UserAvatar Component
 * 
 * Renders a colored avatar with initials for a user.
 * Color is determined by userColorService for consistency.
 */
export function UserAvatar({
  user,
  allUsers,
  size = 'md',
  showName = false,
  showTooltip = true,
  className,
}: UserAvatarProps) {
  const colorScheme = getUserColor(user.id, allUsers);
  const initials = getUserInitials(user.full_name);
  const displayName = user.full_name || user.email || 'Onbekende gebruiker';

  const avatarElement = (
    <div className={cn('flex items-center gap-2', className)}>
      <Avatar className={sizeClasses[size]}>
        <AvatarFallback
          className="font-semibold transition-transform hover:scale-105"
          style={{
            backgroundColor: colorScheme.bg,
            color: colorScheme.text,
          }}
        >
          {initials}
        </AvatarFallback>
      </Avatar>
      {showName && (
        <span className="text-sm font-medium text-gray-700">
          {displayName}
        </span>
      )}
    </div>
  );

  if (showTooltip && !showName) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {avatarElement}
          </TooltipTrigger>
          <TooltipContent>
            <p>{displayName}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return avatarElement;
}

/**
 * Multiple User Avatars Component
 * 
 * Displays multiple user avatars in a stack/row.
 * Shows up to maxVisible avatars, with a "+X" indicator for remaining users.
 */
export interface MultiUserAvatarsProps {
  users: User[];
  allUsers: User[];
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  maxVisible?: number;
  showTooltip?: boolean;
  className?: string;
  overlap?: boolean;
}

export function MultiUserAvatars({
  users,
  allUsers,
  size = 'sm',
  maxVisible = 3,
  showTooltip = true,
  className,
  overlap = true,
}: MultiUserAvatarsProps) {
  const visibleUsers = users.slice(0, maxVisible);
  const remainingCount = users.length - maxVisible;

  if (users.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex items-center', className)}>
      <div className={cn('flex', overlap ? '-space-x-2' : 'gap-1')}>
        {visibleUsers.map((user, index) => (
          <div
            key={user.id}
            className={cn(
              'ring-2 ring-white rounded-full',
              overlap && 'hover:z-10 hover:scale-110 transition-transform'
            )}
            style={{ zIndex: visibleUsers.length - index }}
          >
            <UserAvatar
              user={user}
              allUsers={allUsers}
              size={size}
              showTooltip={showTooltip}
            />
          </div>
        ))}
      </div>
      {remainingCount > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  'flex items-center justify-center rounded-full bg-gray-200 text-gray-600 font-semibold',
                  sizeClasses[size],
                  overlap && '-ml-2 ring-2 ring-white'
                )}
              >
                <span className="text-xs">+{remainingCount}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                {users.slice(maxVisible).map((user) => (
                  <p key={user.id} className="text-sm">
                    {user.full_name || user.email}
                  </p>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

/**
 * User Avatar with Color Badge
 * 
 * Shows avatar with a small colored dot indicator
 * Useful for status indicators or category markers
 */
export interface UserAvatarWithBadgeProps extends UserAvatarProps {
  badgeColor?: string;
  badgePosition?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
}

export function UserAvatarWithBadge({
  badgeColor,
  badgePosition = 'bottom-right',
  ...props
}: UserAvatarWithBadgeProps) {
  const positionClasses = {
    'top-right': 'top-0 right-0',
    'bottom-right': 'bottom-0 right-0',
    'top-left': 'top-0 left-0',
    'bottom-left': 'bottom-0 left-0',
  };

  return (
    <div className="relative inline-block">
      <UserAvatar {...props} />
      {badgeColor && (
        <span
          className={cn(
            'absolute w-3 h-3 rounded-full ring-2 ring-white',
            positionClasses[badgePosition]
          )}
          style={{ backgroundColor: badgeColor }}
        />
      )}
    </div>
  );
}

