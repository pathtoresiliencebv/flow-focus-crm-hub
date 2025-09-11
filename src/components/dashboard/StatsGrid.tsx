
import React from 'react';
import { StatCard } from './StatCard';
import { Users, FileText, Euro, CalendarDays, TrendingUp } from 'lucide-react';

interface StatsGridProps {
  totalCustomers: number;
  activeProjects: number;
  totalRevenue: number;
  completedProjects: number;
  userRole?: string;
}

export const StatsGrid = ({ totalCustomers, activeProjects, totalRevenue, completedProjects, userRole }: StatsGridProps) => {
  return (
    <div className={`grid grid-cols-2 ${userRole === 'Installateur' ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-3 sm:gap-6`}>
      <StatCard title="Totaal Klanten" value={totalCustomers} icon={Users} iconColorClass="text-blue-600">
        <p className="text-xs text-green-600 font-medium">
          <TrendingUp className="inline h-3 w-3 mr-1" />
          Actief
        </p>
      </StatCard>
      <StatCard title="Actieve Projecten" value={activeProjects} icon={FileText} iconColorClass="text-green-600">
        <p className="text-xs text-blue-600 font-medium">
          In behandeling
        </p>
      </StatCard>
      {userRole !== 'Installateur' && (
        <StatCard title="Totale Omzet" value={`€${totalRevenue.toLocaleString()}`} icon={Euro} iconColorClass="text-purple-600">
          <p className="text-xs text-purple-600 font-medium">
            Dit jaar
          </p>
        </StatCard>
      )}
      <StatCard title="Afgeronde Projecten" value={completedProjects} icon={CalendarDays} iconColorClass="text-orange-600">
        <p className="text-xs text-orange-600 font-medium">
          Succesvol
        </p>
      </StatCard>
    </div>
  );
};
