import React, { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Users, FolderKanban, CheckCircle2, TrendingUp } from "lucide-react";
import { useCrmStore } from "@/hooks/useCrmStore";
import { InstallateurProjectCard } from "./dashboard/InstallateurProjectCard";
import { useAuth } from "@/contexts/AuthContext";

export const Dashboard = () => {
  const { projects, customers } = useCrmStore();
  const { profile, user } = useAuth();

  // 🔥 CRITICAL FIX: useCrmStore ALREADY filters projects for Installateurs!
  // No need to filter again here - that causes new array references every render → infinite loop!
  // Just use the projects directly from useCrmStore
  const filteredProjects = projects;

  // 🔥 Memoize statistics to prevent infinite loops
  const stats = useMemo(() => ({
    totalCustomers: customers.length,
    activeProjects: projects.filter(p => p.status !== 'afgerond' && p.status !== 'geannuleerd').length,
    completedProjects: projects.filter(p => p.status === 'afgerond').length,
    totalRevenue: projects
      .filter(p => p.status === 'afgerond')
      .reduce((sum, p) => sum + (p.value || 0), 0),
  }), [customers.length, projects]);

  return (
    <div className="h-full bg-gradient-to-br from-slate-50 to-blue-50 overflow-auto">
      {/* Installateur View */}
      {profile?.role === 'Installateur' ? (
        <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm mx-1 sm:mx-0">
            <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-6 pt-4 sm:pt-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <CalendarDays className="h-5 w-5 text-primary" />
                <span className="text-base sm:text-xl">Mijn Projecten</span>
              </CardTitle>
              <CardDescription className="text-muted-foreground text-sm">
                Overzicht van aan u toegewezen projecten
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              {filteredProjects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="font-semibold mb-2">Geen projecten toegewezen</h3>
                  <p className="text-sm">Er zijn momenteel geen projecten aan u toegewezen</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredProjects.map((project) => (
                    <InstallateurProjectCard
                      key={project.id}
                      project={project}
                      onProjectClick={(projectId) => window.location.href = `/projects/${projectId}`}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Admin/Administratie: Dashboard with Statistics */
        <div className="p-6 space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Customers */}
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Totaal Klanten
                  </CardTitle>
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-gray-900">{stats.totalCustomers}</p>
                <p className="text-xs text-gray-500 mt-1">Geregistreerde klanten</p>
              </CardContent>
            </Card>

            {/* Active Projects */}
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Actieve Projecten
                  </CardTitle>
                  <FolderKanban className="h-5 w-5 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-gray-900">{stats.activeProjects}</p>
                <p className="text-xs text-gray-500 mt-1">In behandeling</p>
              </CardContent>
            </Card>

            {/* Completed Projects */}
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Afgeronde Projecten
                  </CardTitle>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-gray-900">{stats.completedProjects}</p>
                <p className="text-xs text-gray-500 mt-1">Succesvol voltooid</p>
              </CardContent>
            </Card>

            {/* Total Revenue */}
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Totale Omzet
                  </CardTitle>
                  <TrendingUp className="h-5 w-5 text-red-600" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-gray-900">
                  €{stats.totalRevenue.toLocaleString('nl-NL')}
                </p>
                <p className="text-xs text-gray-500 mt-1">Afgeronde projecten</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => window.location.href = '/customers'}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Klanten
                </CardTitle>
                <CardDescription>Beheer uw klanten</CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-lg border-0 bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => window.location.href = '/projects'}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderKanban className="h-5 w-5 text-orange-600" />
                  Projecten
                </CardTitle>
                <CardDescription>Overzicht van alle projecten</CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => window.location.href = '/planning'}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-purple-600" />
                  Planning
                </CardTitle>
                <CardDescription>Monteur agenda & planning</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
