import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  FileText, 
  Euro, 
  CalendarDays, 
  TrendingUp, 
  ArrowUpRight,
  User,
  Clock,
  Target,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Activity,
  BarChart3,
  Calendar,
  Receipt
} from "lucide-react";
import { useCrmStore } from "@/hooks/useCrmStore";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/utils";
import { addDays, format, subDays } from "date-fns";
import { nl } from "date-fns/locale";

export const AdminDashboard = () => {
  const { customers, projects } = useCrmStore();
  const { profile } = useAuth();

  // Calculate metrics
  const currentWeek = new Date();
  const lastWeek = subDays(currentWeek, 7);
  
  // New leads (customers created this week)
  const newLeadsThisWeek = customers.filter(c => 
    new Date(c.created_at) >= lastWeek
  ).length;
  
  const newLeadsLastWeek = customers.filter(c => {
    const created = new Date(c.created_at);
    return created >= subDays(lastWeek, 7) && created < lastWeek;
  }).length;
  
  const leadsChange = newLeadsThisWeek - newLeadsLastWeek;

  // Active quotes (projects with status 'te-plannen' or 'gepland')
  const activeQuotes = projects.filter(p => 
    p.status === 'te-plannen' || p.status === 'gepland'
  ).length;
  
  // Running projects (projects with status 'in-uitvoering')
  const runningProjects = projects.filter(p => 
    p.status === 'in-uitvoering'
  ).length;
  
  const runningProjectsThisWeek = projects.filter(p => {
    const updated = new Date(p.updated_at);
    return p.status === 'in-uitvoering' && updated >= lastWeek;
  }).length;

  // Outstanding invoices (placeholder - would need invoice data)
  const outstandingInvoices = 3;

  // Total revenue this year
  const currentYear = new Date().getFullYear();
  const totalRevenue = projects
    .filter(p => new Date(p.created_at).getFullYear() === currentYear)
    .reduce((sum, p) => sum + (p.value || 0), 0);

  // Last year revenue for comparison
  const lastYearRevenue = projects
    .filter(p => new Date(p.created_at).getFullYear() === currentYear - 1)
    .reduce((sum, p) => sum + (p.value || 0), 0);
  
  const revenueGrowth = lastYearRevenue > 0 
    ? ((totalRevenue - lastYearRevenue) / lastYearRevenue) * 100 
    : 0;

  // Recent activities (last 7 days)
  const recentActivities = [
    ...customers.filter(c => new Date(c.created_at) >= lastWeek).map(c => ({
      id: c.id,
        type: 'customer',
        title: `Nieuwe klant toegevoegd - ${c.name}`,
        description: 'new_lead',
        user: 'Redwan Machou',
        department: 'Sales',
        date: c.created_at,
        icon: User
      })),
    ...projects.filter(p => new Date(p.created_at) >= lastWeek).map(p => ({
      id: p.id,
      type: 'project',
      title: p.status === 'te-plannen' ? `Offerte ${p.title}` : `Project ${p.title}`,
      description: p.status === 'te-plannen' ? 'Verstuurd naar klant - terest' : 'Gestart - Kozijnen Bakkerij Jensen - Hoofdstraat 45',
      user: 'Redwan Machou',
      department: p.status === 'te-plannen' ? 'Backoffice' : 'Operations',
      date: p.created_at,
      icon: p.status === 'te-plannen' ? FileText : Target
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  // Performance metrics
  const avgProjectValue = projects.length > 0 
    ? projects.reduce((sum, p) => sum + (p.value || 0), 0) / projects.length 
    : 0;

  const completedProjects = projects.filter(p => p.status === 'afgerond').length;
  const completionRate = projects.length > 0 
    ? (completedProjects / projects.length) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Goedemorgen, {profile?.full_name?.split(' ')[0] || 'Admin'}
            </h1>
            <p className="text-muted-foreground mt-1">
              Hier is een overzicht van de activiteiten.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2">
              <FileText className="h-4 w-4" />
              Nieuwe Offerte
            </Button>
            <Button className="gap-2">
              <Users className="h-4 w-4" />
              Nieuwe Klant
            </Button>
          </div>
        </div>

        {/* Top Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Nieuwe Leads
              </CardTitle>
              <User className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {customers.length}
              </div>
              <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                +{leadsChange} deze week
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Actieve Offertes
              </CardTitle>
              <FileText className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {activeQuotes}
              </div>
              <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                +{Math.max(0, activeQuotes - 2)} deze week
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Lopende Projecten
              </CardTitle>
              <Target className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {runningProjects}
              </div>
              <p className="text-xs text-muted-foreground">
                {runningProjectsThisWeek} deze week
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Openstaande Facturen
              </CardTitle>
              <Receipt className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {outstandingInvoices}
              </div>
              <p className="text-xs text-muted-foreground">
                Onder controle
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Total Revenue Card */}
          <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg font-semibold">
                Totale Omzet (Dit Jaar)
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground mb-2">
                {formatCurrency(totalRevenue)}
              </div>
              <p className="text-sm text-green-600 font-medium flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                +{revenueGrowth.toFixed(0)}% t.o.v. vorig jaar
              </p>
            </CardContent>
          </Card>

          {/* Active Projects */}
          <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg font-semibold">
                  Actieve Projecten
                </CardTitle>
              </div>
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                Alles bekijken →
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {projects.filter(p => p.status !== 'afgerond').slice(0, 2).map((project, index) => (
                <div key={project.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                  <div className="space-y-1">
                    <div className="font-medium text-sm">
                      {project.title || `PROJ-${new Date().getFullYear()}-${String(index + 1).padStart(3, '0')}`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {project.status === 'te-plannen' ? 'Voortgang' : 'Nazorg'}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      {formatCurrency(project.value || 0)}
                      <span className="mx-1">•</span>
                      <Calendar className="h-3 w-3" />
                      {format(new Date(project.created_at), 'd MMM', { locale: nl })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {project.status === 'te-plannen' ? 'Nazorg' : 'Nazorg'}
                    </div>
                    <div className="text-xs text-muted-foreground">%</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center gap-2 pb-4">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg font-semibold">
                Recente Activiteit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <activity.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground truncate">
                        {activity.user}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{activity.department}</span>
                        <span>{format(new Date(activity.date), 'd MMM.', { locale: nl })}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {activity.description}
                    </p>
                  </div>
                </div>
              ))}
              <Button variant="ghost" className="w-full mt-4 text-primary hover:text-primary/80">
                Alle activiteit bekijken →
              </Button>
            </CardContent>
          </Card>

          {/* Performance Overview */}
          <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center gap-2 pb-4">
              <BarChart3 className="h-5 w-5 text-green-500" />
              <CardTitle className="text-lg font-semibold">
                Performance Overzicht
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 rounded-lg bg-background/50">
                  <div className="text-2xl font-bold text-blue-500 mb-1">
                    {completionRate.toFixed(0)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Conversie Rate
                  </div>
                </div>
                <div className="text-center p-4 rounded-lg bg-background/50">
                  <div className="text-2xl font-bold text-green-500 mb-1">
                    {formatCurrency(avgProjectValue)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Avg. Project Waarde
                  </div>
                </div>
                <div className="text-center p-4 rounded-lg bg-background/50">
                  <div className="text-2xl font-bold text-orange-500 mb-1">
                    {(completionRate * 0.8).toFixed(0)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Voltooingsrate
                  </div>
                </div>
                <div className="text-center p-4 rounded-lg bg-background/50">
                  <div className="text-2xl font-bold text-purple-500 mb-1">
                    {outstandingInvoices}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Openstaande Facturen
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Snelle Acties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Button variant="outline" className="h-16 flex-col gap-2">
                <Users className="h-5 w-5" />
                <span className="text-sm">Sales Pipeline</span>
                <span className="text-xs text-muted-foreground">Leads beheren</span>
              </Button>
              <Button variant="outline" className="h-16 flex-col gap-2">
                <Target className="h-5 w-5" />
                <span className="text-sm">Operations</span>
                <span className="text-xs text-muted-foreground">Projecten uitvoeren</span>
              </Button>
              <Button variant="outline" className="h-16 flex-col gap-2">
                <Calendar className="h-5 w-5" />
                <span className="text-sm">Planning</span>
                <span className="text-xs text-muted-foreground">Afspraken bekijken</span>
              </Button>
              <Button variant="outline" className="h-16 flex-col gap-2">
                <Receipt className="h-5 w-5" />
                <span className="text-sm">Facturatie</span>
                <span className="text-xs text-muted-foreground">Betalingen controleren</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};