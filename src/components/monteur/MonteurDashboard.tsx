import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Play, 
  CheckCircle2, 
  AlertCircle,
  Navigation,
  Phone,
  Mail,
  Eye,
  FolderKanban,
  FileText,
  Image as ImageIcon
} from "lucide-react";
import { format, isToday, isFuture, isPast, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { usePlanningStore } from '@/hooks/usePlanningStore';
import { useCrmStore } from '@/hooks/useCrmStore';
import { useNavigate } from 'react-router-dom';

interface MonteurDashboardProps {
  onStartProject?: (planningId: string) => void;
  onViewProject?: (projectId: string) => void;
}

export function MonteurDashboard({ onStartProject, onViewProject }: MonteurDashboardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { planningItems, loading } = usePlanningStore();
  const { customers, projects } = useCrmStore();
  const [activeTab, setActiveTab] = useState('today');

  // Filter planning for current user (monteur)
  const myPlanning = planningItems.filter(item => 
    item.assigned_user_id === user?.id || item.user_id === user?.id
  );

  // Today's planning
  const todayPlanning = myPlanning.filter(item => 
    isToday(parseISO(item.start_date))
  ).sort((a, b) => a.start_time.localeCompare(b.start_time));

  // Upcoming planning (future)
  const upcomingPlanning = myPlanning.filter(item => 
    isFuture(parseISO(item.start_date)) && !isToday(parseISO(item.start_date))
  ).sort((a, b) => a.start_date.localeCompare(b.start_date));

  // All assigned projects (not just active ones)
  const myProjects = projects.filter(p => 
    p.assigned_user_id === user?.id
  );

  // Active projects (in-uitvoering status)
  const activeProjects = myProjects.filter(p => 
    p.status === 'in-uitvoering'
  );

  // Completed today
  const completedToday = myProjects.filter(p => 
    p.status === 'afgerond' && 
    p.updated_at && isToday(parseISO(p.updated_at))
  );

  const getCustomerForPlanning = (item: any) => {
    if (item.customer_id) {
      return customers.find(c => c.id === item.customer_id);
    }
    if (item.project_id) {
      const project = projects.find(p => p.id === item.project_id);
      if (project?.customer_id) {
        return customers.find(c => c.id === project.customer_id);
      }
    }
    return null;
  };

  const getProjectForPlanning = (item: any) => {
    if (item.project_id) {
      return projects.find(p => p.id === item.project_id);
    }
    return null;
  };

  const handleStartProject = (planningItem: any) => {
    console.log('🚀 Starting project for planning item:', planningItem);
    if (onStartProject) {
      onStartProject(planningItem.id);
    } else {
      // Navigate to project detail page for monteur workflow
      const projectId = planningItem.project_id;
      if (projectId) {
        navigate(`/projects/${projectId}`);
      } else {
        console.error('No project ID found for planning item:', planningItem);
      }
    }
  };

  const handleViewProject = (projectId: string) => {
    console.log('👁️ Viewing project:', projectId);
    if (onViewProject) {
      onViewProject(projectId);
    } else {
      navigate(`/projects/${projectId}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Gepland': return 'bg-blue-100 text-blue-800';
      case 'in-uitvoering': return 'bg-green-100 text-green-800';
      case 'afgerond': return 'bg-gray-100 text-gray-800';
      case 'geannuleerd': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Planning laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Vandaag</p>
                <h3 className="text-2xl font-bold text-blue-600">{todayPlanning.length}</h3>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Actief</p>
                <h3 className="text-2xl font-bold text-green-600">{activeProjects.length}</h3>
              </div>
              <Play className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Komende</p>
                <h3 className="text-2xl font-bold text-purple-600">{upcomingPlanning.length}</h3>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Afgerond Vandaag</p>
                <h3 className="text-2xl font-bold text-gray-600">{completedToday.length}</h3>
              </div>
              <CheckCircle2 className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="today">
            Vandaag ({todayPlanning.length})
          </TabsTrigger>
          <TabsTrigger value="active">
            Actief ({activeProjects.length})
          </TabsTrigger>
          <TabsTrigger value="upcoming">
            Komende ({upcomingPlanning.length})
          </TabsTrigger>
          <TabsTrigger value="projects">
            Projecten ({myProjects.length})
          </TabsTrigger>
        </TabsList>

        {/* TODAY TAB */}
        <TabsContent value="today" className="space-y-4">
          {todayPlanning.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    Geen planning voor vandaag
                  </h3>
                  <p className="text-sm text-gray-500">
                    Je hebt momenteel geen afspraken ingepland voor vandaag.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            todayPlanning.map((item) => {
              const customer = getCustomerForPlanning(item);
              const project = getProjectForPlanning(item);
              const isActive = project?.status === 'in-uitvoering';

              return (
                <Card key={item.id} className={isActive ? "border-green-500 border-2" : ""}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg">{item.title}</CardTitle>
                          <Badge className={getStatusColor(item.status || 'Gepland')}>
                            {item.status || 'Gepland'}
                          </Badge>
                          {isActive && (
                            <Badge className="bg-green-600">
                              <Play className="h-3 w-3 mr-1" />
                              Bezig
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {item.start_time.substring(0, 5)} - {item.end_time.substring(0, 5)}
                          </span>
                          {item.expected_duration_minutes && (
                            <span className="flex items-center gap-1">
                              ⏱️ {Math.floor(item.expected_duration_minutes / 60)}u {item.expected_duration_minutes % 60}m
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {item.description && (
                      <p className="text-sm text-gray-600">{item.description}</p>
                    )}

                    {customer && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <h4 className="font-semibold text-sm mb-2">👤 Klant Informatie</h4>
                        <div className="space-y-1 text-sm">
                          <p className="font-medium">{customer.name}</p>
                          {customer.phone && (
                            <a 
                              href={`tel:${customer.phone}`}
                              className="flex items-center gap-2 text-blue-600 hover:underline"
                            >
                              <Phone className="h-4 w-4" />
                              {customer.phone}
                            </a>
                          )}
                          {customer.email && (
                            <a 
                              href={`mailto:${customer.email}`}
                              className="flex items-center gap-2 text-blue-600 hover:underline"
                            >
                              <Mail className="h-4 w-4" />
                              {customer.email}
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {item.location && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-red-600 mt-1 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-700">{item.location}</p>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
                          >
                            <Navigation className="h-3 w-3" />
                            Open in Google Maps
                          </a>
                        </div>
                      </div>
                    )}

                    {item.special_instructions && (
                      <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                          <div>
                            <p className="font-semibold text-sm text-yellow-800">
                              Speciale Instructies
                            </p>
                            <p className="text-sm text-yellow-700 mt-1">
                              {item.special_instructions}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      {!isActive ? (
                        <Button 
                          onClick={() => handleStartProject(item)}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Start Project
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => project && handleViewProject(project.id)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Bekijk Project
                        </Button>
                      )}
                      <Button 
                        variant="outline"
                        onClick={() => {
                          const address = item.location || (customer ? `${customer.address}` : null);
                          if (address) {
                            window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}&travelmode=driving`, '_blank');
                          }
                        }}
                        disabled={!item.location && !customer}
                        title="Open navigatie in Google Maps"
                      >
                        <Navigation className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* ACTIVE TAB */}
        <TabsContent value="active" className="space-y-4">
          {activeProjects.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Play className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    Geen actieve projecten
                  </h3>
                  <p className="text-sm text-gray-500">
                    Start een project vanuit je planning om hier te verschijnen.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            activeProjects.map((project) => {
              const customer = customers.find(c => c.id === project.customer_id);
              
              return (
                <Card key={project.id} className="border-green-500 border-2">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg">{project.title}</CardTitle>
                          <Badge className="bg-green-600">
                            <Play className="h-3 w-3 mr-1" />
                            In Uitvoering
                          </Badge>
                        </div>
                        {customer && (
                          <p className="text-sm text-gray-600">{customer.name}</p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {project.description && (
                      <p className="text-sm text-gray-600 mb-4">{project.description}</p>
                    )}
                    
                    <Button 
                      onClick={() => handleViewProject(project.id)}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Bekijk & Werk Verder
                    </Button>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* UPCOMING TAB */}
        <TabsContent value="upcoming" className="space-y-4">
          {upcomingPlanning.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    Geen komende planning
                  </h3>
                  <p className="text-sm text-gray-500">
                    Je hebt momenteel geen toekomstige afspraken.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            upcomingPlanning.map((item) => {
              const customer = getCustomerForPlanning(item);
              
              return (
                <Card key={item.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg">{item.title}</CardTitle>
                          <Badge variant="outline">
                            {format(parseISO(item.start_date), 'dd MMM yyyy', { locale: nl })}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          {item.start_time.substring(0, 5)} - {item.end_time.substring(0, 5)}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {customer && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700">{customer.name}</p>
                        {item.location && (
                          <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {item.location}
                          </p>
                        )}
                      </div>
                    )}
                    
                    {item.description && (
                      <p className="text-sm text-gray-600">{item.description}</p>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* PROJECTS TAB */}
        <TabsContent value="projects" className="space-y-4">
          {myProjects.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <FolderKanban className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    Geen projecten toegewezen
                  </h3>
                  <p className="text-sm text-gray-500">
                    Er zijn momenteel geen projecten aan u toegewezen.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            myProjects.map((project) => {
              const customer = customers.find(c => c.id === project.customer_id);
              const isActive = project.status === 'in-uitvoering';
              const isCompleted = project.status === 'afgerond';

              return (
                <Card key={project.id} className={isActive ? "border-green-500 border-2" : ""}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg">{project.title}</CardTitle>
                          <Badge className={getStatusColor(project.status)}>
                            {project.status}
                          </Badge>
                          {isActive && (
                            <Badge className="bg-green-600">
                              <Play className="h-3 w-3 mr-1" />
                              Bezig
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          {project.date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(project.date).toLocaleDateString('nl-NL')}
                            </span>
                          )}
                          {project.value && (
                            <span className="flex items-center gap-1">
                              💰 €{project.value.toLocaleString('nl-NL')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {project.description && (
                      <p className="text-sm text-gray-600">{project.description}</p>
                    )}

                    {customer && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <h4 className="font-semibold text-sm mb-2">👤 Klant Informatie</h4>
                        <div className="space-y-1 text-sm">
                          <p className="font-medium">{customer.name}</p>
                          {customer.phone && (
                            <a 
                              href={`tel:${customer.phone}`}
                              className="flex items-center gap-2 text-blue-600 hover:underline"
                            >
                              <Phone className="h-4 w-4" />
                              {customer.phone}
                            </a>
                          )}
                          {customer.email && (
                            <a 
                              href={`mailto:${customer.email}`}
                              className="flex items-center gap-2 text-blue-600 hover:underline"
                            >
                              <Mail className="h-4 w-4" />
                              {customer.email}
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleViewProject(project.id)}
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Bekijk Project
                      </Button>
                      {!isCompleted && (
                        <Button 
                          variant="outline"
                          onClick={() => handleStartProject({ project_id: project.id })}
                          className="flex-1"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Start Project
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

