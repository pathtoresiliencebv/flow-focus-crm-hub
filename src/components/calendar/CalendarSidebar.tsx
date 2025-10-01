import React from 'react';
import { Calendar, Users, User, ChevronDown, ChevronRight, FolderOpen, Plus } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { UserRole } from '@/types/permissions';
import { CalendarFilters } from '@/hooks/useCalendarFilters';
import { useUsers } from '@/hooks/useUsers';
import { cn } from '@/lib/utils';

interface CalendarSidebarProps {
  filters: CalendarFilters;
  onToggleRole: (role: UserRole) => void;
  onToggleUser: (userId: string) => void;
  onTogglePersonalEvents: () => void;
  isRoleActive: (role: UserRole) => boolean;
  isUserActive: (userId: string) => boolean;
  collapsed: boolean;
}

interface RoleSection {
  role: UserRole;
  label: string;
  color: string;
}

const ROLE_SECTIONS: RoleSection[] = [
  { role: 'Administrator', label: 'Administrator', color: 'bg-role-administrator' },
  { role: 'Installateur', label: 'Installateurs', color: 'bg-role-installateur' },
  { role: 'Administratie', label: 'Administratie', color: 'bg-role-administratie' },
];

export const CalendarSidebar: React.FC<CalendarSidebarProps> = ({
  filters,
  onToggleRole,
  onToggleUser,
  onTogglePersonalEvents,
  isRoleActive,
  isUserActive,
  collapsed,
}) => {
  const { users } = useUsers();
  const [openSections, setOpenSections] = React.useState<UserRole[]>(['Administrator', 'Installateur', 'Administratie']);

  const toggleSection = (role: UserRole) => {
    setOpenSections(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const getUsersForRole = (role: UserRole) => {
    return users.filter(user => user.role === role);
  };

  return (
    <div className={cn(
      "bg-sidebar border-r border-sidebar-border h-full overflow-hidden transition-all duration-300 ease-in-out",
      collapsed ? "w-16" : "w-80"
    )}>
      <div className="h-full overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b border-sidebar-border/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-sidebar-accent rounded-lg">
              <Calendar className="h-4 w-4 text-sidebar-primary" />
            </div>
            {!collapsed && (
              <div>
                <h2 className="font-semibold text-sidebar-foreground text-base">Team Agenda's</h2>
                <p className="text-xs text-sidebar-foreground/70">Beheer team planning</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Personal Events Section */}
          <div className="space-y-3">
            {!collapsed && (
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider">
                  Persoonlijk
                </h3>
              </div>
            )}
            
            <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-sidebar-accent transition-colors group">
              <Checkbox
                id="personal-events"
                checked={filters.showPersonalEvents}
                onCheckedChange={onTogglePersonalEvents}
                className="data-[state=checked]:bg-role-personal data-[state=checked]:border-role-personal"
              />
              <div className="flex items-center gap-3 flex-1">
                <div className="w-3 h-3 rounded-full bg-role-personal shadow-sm" />
                {!collapsed && (
                  <label 
                    htmlFor="personal-events" 
                    className="text-sm font-medium cursor-pointer text-sidebar-foreground group-hover:text-sidebar-foreground"
                  >
                    Mijn Agenda
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Team Sections */}
          <div className="space-y-4">
            {!collapsed && (
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider">
                  Team Agenda's
                </h3>
                <span className="text-xs text-sidebar-foreground/50">
                  {users.length} leden
                </span>
              </div>
            )}
            
            <div className="space-y-3">
              {ROLE_SECTIONS.map((section) => {
                const roleUsers = getUsersForRole(section.role);
                const isOpen = openSections.includes(section.role);
                
                return (
                  <Collapsible key={section.role} open={isOpen} onOpenChange={() => toggleSection(section.role)}>
                    <div className="space-y-2">
                      {/* Role Header */}
                      <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-sidebar-accent transition-colors group">
                        <Checkbox
                          id={`role-${section.role}`}
                          checked={isRoleActive(section.role)}
                          onCheckedChange={() => onToggleRole(section.role)}
                          className={`data-[state=checked]:${section.color.replace('bg-', 'bg-')} data-[state=checked]:border-${section.color.replace('bg-', '')}`}
                        />
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`w-3 h-3 rounded-full ${section.color} shadow-sm`} />
                          {!collapsed && (
                            <label 
                              htmlFor={`role-${section.role}`} 
                              className="text-sm font-medium cursor-pointer flex-1 text-sidebar-foreground group-hover:text-sidebar-foreground"
                            >
                              {section.label}
                            </label>
                          )}
                        </div>
                        {roleUsers.length > 0 && !collapsed && (
                          <CollapsibleTrigger asChild>
                            <button className="p-1.5 hover:bg-sidebar-accent rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                              {isOpen ? 
                                <ChevronDown className="h-3.5 w-3.5 text-sidebar-foreground/70" /> : 
                                <ChevronRight className="h-3.5 w-3.5 text-sidebar-foreground/70" />
                              }
                            </button>
                          </CollapsibleTrigger>
                        )}
                        {!collapsed && (
                          <span className="text-xs text-sidebar-foreground/50 tabular-nums">
                            {roleUsers.length}
                          </span>
                        )}
                      </div>

                      {/* Users in Role */}
                      {!collapsed && (
                        <CollapsibleContent>
                          <div className="ml-6 space-y-1.5 border-l border-sidebar-border/30 pl-4">
                            {roleUsers.map((user) => (
                              <div 
                                key={user.id}
                                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-sidebar-accent/50 transition-colors group"
                              >
                                <Checkbox
                                  id={`user-${user.id}`}
                                  checked={isUserActive(user.id)}
                                  onCheckedChange={() => onToggleUser(user.id)}
                                  className="scale-90"
                                />
                                <div className="flex items-center gap-2.5 flex-1">
                                  <div className="w-6 h-6 bg-sidebar-accent rounded-full flex items-center justify-center">
                                    <User className="h-3 w-3 text-sidebar-foreground/60" />
                                  </div>
                                  <label 
                                    htmlFor={`user-${user.id}`} 
                                    className="text-sm cursor-pointer text-sidebar-foreground/90 group-hover:text-sidebar-foreground"
                                  >
                                    {user.full_name}
                                  </label>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      )}
                    </div>
                  </Collapsible>
                );
              })}
            </div>
          </div>

          {/* Ongeplande Projecten Section */}
          <div className="space-y-3">
            {!collapsed && (
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider">
                  Ongeplande Projecten
                </h3>
                <button className="p-1 hover:bg-sidebar-accent rounded transition-colors">
                  <Plus className="h-3.5 w-3.5 text-sidebar-foreground/50" />
                </button>
              </div>
            )}
            
            <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-sidebar-accent transition-colors group">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-3 h-3 rounded-full bg-role-project shadow-sm" />
                {!collapsed && (
                  <span className="text-sm font-medium text-sidebar-foreground group-hover:text-sidebar-foreground">
                    Alle projecten
                  </span>
                )}
              </div>
              {!collapsed && (
                <span className="text-xs text-sidebar-foreground/50 tabular-nums">
                  12
                </span>
              )}
            </div>

            {!collapsed && (
              <div className="ml-6 space-y-1.5 border-l border-sidebar-border/30 pl-4">
                <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-sidebar-accent/50 transition-colors group">
                  <div className="w-6 h-6 bg-sidebar-accent rounded-full flex items-center justify-center">
                    <FolderOpen className="h-3 w-3 text-sidebar-foreground/60" />
                  </div>
                  <span className="text-sm text-sidebar-foreground/90 group-hover:text-sidebar-foreground">
                    Keuken renovatie - Familie Jansen
                  </span>
                </div>
                <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-sidebar-accent/50 transition-colors group">
                  <div className="w-6 h-6 bg-sidebar-accent rounded-full flex items-center justify-center">
                    <FolderOpen className="h-3 w-3 text-sidebar-foreground/60" />
                  </div>
                  <span className="text-sm text-sidebar-foreground/90 group-hover:text-sidebar-foreground">
                    Badkamer installatie - Van der Berg
                  </span>
                </div>
                <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-sidebar-accent/50 transition-colors group">
                  <div className="w-6 h-6 bg-sidebar-accent rounded-full flex items-center justify-center">
                    <FolderOpen className="h-3 w-3 text-sidebar-foreground/60" />
                  </div>
                  <span className="text-sm text-sidebar-foreground/90 group-hover:text-sidebar-foreground">
                    CV ketel vervanging - Pietersen
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};