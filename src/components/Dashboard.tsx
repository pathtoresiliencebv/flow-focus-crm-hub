
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";
import { SimplifiedPlanningManagement } from "./SimplifiedPlanningManagement";
import { useCrmStore } from "@/hooks/useCrmStore";
import { InstallateurProjectCard } from "./dashboard/InstallateurProjectCard";
import { useAuth } from "@/contexts/AuthContext";

export const Dashboard = () => {
  const { projects } = useCrmStore();
  const { profile, user } = useAuth();

  // Filter projects based on user role
  const filteredProjects = profile?.role === 'Installateur' 
    ? projects.filter(p => p.assigned_user_id === user?.id)
    : projects;

  return (
    <div className="h-full bg-gradient-to-br from-slate-50 to-blue-50 overflow-hidden">
      {/* Simple Header - Only for Installateus */}
      {profile?.role === 'Installateur' ? (
        <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <CalendarDays className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              Planning
            </h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Mijn toegewezen projecten</p>
          </div>

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
        /* Admin/Administratie: Full Screen Planning */
        <div className="h-full flex flex-col">
          {/* Simple Header */}
          <div className="px-3 sm:px-6 py-3 sm:py-4 border-b bg-white/80 backdrop-blur-sm">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <CalendarDays className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              Planning
            </h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Monteur agenda & projectplanning</p>
          </div>
          
          {/* Full Screen Planning Management */}
          <div className="flex-1 overflow-hidden">
            <SimplifiedPlanningManagement />
          </div>
        </div>
      )}
    </div>
  );
};
