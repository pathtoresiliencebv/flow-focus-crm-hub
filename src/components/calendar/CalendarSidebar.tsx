import React from 'react';
import { Calendar, Users, User, ChevronDown, ChevronRight } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { UserRole } from '@/types/permissions';
import { CalendarFilters } from '@/hooks/useCalendarFilters';
import { useUsers } from '@/hooks/useUsers';

interface CalendarSidebarProps {
  filters: CalendarFilters;
  onToggleRole: (role: UserRole) => void;
  onToggleUser: (userId: string) => void;
  onTogglePersonalEvents: () => void;
  isRoleActive: (role: UserRole) => boolean;
  isUserActive: (userId: string) => boolean;
}

interface RoleSection {
  role: UserRole;
  label: string;
  color: string;
}

const ROLE_SECTIONS: RoleSection[] = [
  { role: 'Administrator', label: 'Administrator', color: 'bg-red-500' },
  { role: 'Installateur', label: 'Installateurs', color: 'bg-blue-500' },
  { role: 'Administratie', label: 'Administratie', color: 'bg-green-500' },
];

export const CalendarSidebar: React.FC<CalendarSidebarProps> = ({
  filters,
  onToggleRole,
  onToggleUser,
  onTogglePersonalEvents,
  isRoleActive,
  isUserActive,
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
    <div className="w-80 bg-background border-r border-border h-full overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-foreground">Team Agenda's</h2>
        </div>

        {/* Personal Events */}
        <div className="mb-6">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
            <Checkbox
              id="personal-events"
              checked={filters.showPersonalEvents}
              onCheckedChange={onTogglePersonalEvents}
            />
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <label 
                htmlFor="personal-events" 
                className="text-sm font-medium cursor-pointer"
              >
                Mijn Agenda
              </label>
            </div>
          </div>
        </div>

        {/* Team Sections */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Team Agenda's</h3>
          
          {ROLE_SECTIONS.map((section) => {
            const roleUsers = getUsersForRole(section.role);
            const isOpen = openSections.includes(section.role);
            
            return (
              <Collapsible key={section.role} open={isOpen} onOpenChange={() => toggleSection(section.role)}>
                <div className="space-y-2">
                  {/* Role Header */}
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <Checkbox
                      id={`role-${section.role}`}
                      checked={isRoleActive(section.role)}
                      onCheckedChange={() => onToggleRole(section.role)}
                    />
                    <div className="flex items-center gap-2 flex-1">
                      <div className={`w-3 h-3 rounded-full ${section.color}`} />
                      <label 
                        htmlFor={`role-${section.role}`} 
                        className="text-sm font-medium cursor-pointer flex-1"
                      >
                        {section.label}
                      </label>
                    </div>
                    {roleUsers.length > 0 && (
                      <CollapsibleTrigger asChild>
                        <button className="p-1 hover:bg-muted rounded">
                          {isOpen ? 
                            <ChevronDown className="h-4 w-4" /> : 
                            <ChevronRight className="h-4 w-4" />
                          }
                        </button>
                      </CollapsibleTrigger>
                    )}
                  </div>

                  {/* Users in Role */}
                  <CollapsibleContent>
                    <div className="ml-6 space-y-1">
                      {roleUsers.map((user) => (
                        <div 
                          key={user.id}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <Checkbox
                            id={`user-${user.id}`}
                            checked={isUserActive(user.id)}
                            onCheckedChange={() => onToggleUser(user.id)}
                          />
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <label 
                              htmlFor={`user-${user.id}`} 
                              className="text-sm cursor-pointer"
                            >
                              {user.full_name}
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>
      </div>
    </div>
  );
};