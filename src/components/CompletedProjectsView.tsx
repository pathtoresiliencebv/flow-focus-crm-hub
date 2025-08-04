import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";  
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  CheckCircle, 
  Calendar, 
  User, 
  MapPin, 
  Star,
  FileText,
  Download,
  Mail,
  Eye,
  Search,
  Filter
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';

interface CompletedProject {
  id: string;
  project_id: string;
  project_title: string;
  customer_name: string;
  customer_email: string;
  address: string;
  installer_name: string;
  completion_date: string;
  customer_satisfaction: number;
  work_performed: string;
  recommendations?: string;
  pdf_url?: string;
  email_sent_at?: string;
  status: string;
  created_at: string;
  photo_count?: number;
}

export const CompletedProjectsView: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const { toast } = useToast();
  const [completions, setCompletions] = useState<CompletedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSatisfaction, setFilterSatisfaction] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<string>('all');

  useEffect(() => {
    loadCompletedProjects();
  }, []);

  const loadCompletedProjects = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('project_completions')
        .select(`
          *,
          projects:project_id (
            title,
            customer_name,
            customer_email,
            address
          ),
          profiles:installer_id (
            full_name
          ),
          completion_photos (count)
        `)
        .eq('status', 'completed')
        .order('completion_date', { ascending: false });

      if (error) throw error;

      const formattedCompletions: CompletedProject[] = data?.map(item => ({
        id: item.id,
        project_id: item.project_id,
        project_title: item.projects?.title || 'Unknown Project',
        customer_name: item.projects?.customer_name || 'Unknown Customer',
        customer_email: item.projects?.customer_email || '',
        address: item.projects?.address || '',
        installer_name: item.profiles?.full_name || 'Unknown Installer',
        completion_date: item.completion_date,
        customer_satisfaction: item.customer_satisfaction,
        work_performed: item.work_performed,
        recommendations: item.recommendations,
        pdf_url: item.pdf_url,
        email_sent_at: item.email_sent_at,
        status: item.status,
        created_at: item.created_at,
        photo_count: item.completion_photos?.length || 0,
      })) || [];

      setCompletions(formattedCompletions);
    } catch (error: any) {
      console.error('Error loading completed projects:', error);
      toast({
        title: "Error",
        description: "Failed to load completed projects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resendEmail = async (completion: CompletedProject) => {
    if (!completion.pdf_url) {
      toast({
        title: "Error",
        description: "No PDF available to send",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('send-completion-email', {
        body: {
          to: completion.customer_email,
          customer_name: completion.customer_name,
          project_title: completion.project_title,
          project_address: completion.address,
          installer_name: completion.installer_name,
          completion_date: completion.completion_date,
          customer_satisfaction: completion.customer_satisfaction,
          work_performed: completion.work_performed,
          recommendations: completion.recommendations,
          pdf_url: completion.pdf_url,
        },
      });

      if (error) throw error;

      if (data?.success) {
        // Update email sent timestamp
        await supabase
          .from('project_completions')
          .update({ email_sent_at: new Date().toISOString() })
          .eq('id', completion.id);

        toast({
          title: "Email Sent",
          description: `Completion report resent to ${completion.customer_name}`,
        });

        loadCompletedProjects(); // Refresh list
      } else {
        throw new Error(data?.error || 'Failed to send email');
      }
    } catch (error: any) {
      console.error('Error resending email:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to resend email",
        variant: "destructive",
      });
    }
  };

  const filteredCompletions = completions.filter(completion => {
    // Search filter
    const matchesSearch = 
      completion.project_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      completion.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      completion.installer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      completion.address.toLowerCase().includes(searchTerm.toLowerCase());

    // Satisfaction filter
    const matchesSatisfaction = 
      filterSatisfaction === 'all' || 
      completion.customer_satisfaction.toString() === filterSatisfaction;

    // Period filter
    let matchesPeriod = true;
    if (filterPeriod !== 'all') {
      const completionDate = new Date(completion.completion_date);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - completionDate.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (filterPeriod) {
        case '7':
          matchesPeriod = daysDiff <= 7;
          break;
        case '30':
          matchesPeriod = daysDiff <= 30;
          break;
        case '90':
          matchesPeriod = daysDiff <= 90;
          break;
      }
    }

    return matchesSearch && matchesSatisfaction && matchesPeriod;
  });

  const getSatisfactionColor = (rating: number) => {
    if (rating >= 5) return 'text-green-600';
    if (rating >= 4) return 'text-yellow-600';
    return 'text-red-600';
  };

  const renderSatisfactionStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star} 
            className={`h-4 w-4 ${
              star <= rating 
                ? 'text-yellow-400 fill-current' 
                : 'text-gray-300'
            }`} 
          />
        ))}
        <span className={`ml-1 font-medium ${getSatisfactionColor(rating)}`}>
          {rating}/5
        </span>
      </div>
    );
  };

  if (!hasPermission('projects_view')) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          You don't have permission to view completed projects.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Completed Projects</h2>
          <p className="text-muted-foreground">
            View and manage project completion reports
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {filteredCompletions.length} project(s)
        </Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={filterSatisfaction} onValueChange={setFilterSatisfaction}>
              <SelectTrigger>
                <SelectValue placeholder="Satisfaction rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
                <SelectItem value="4">4 Stars</SelectItem>
                <SelectItem value="3">3 Stars</SelectItem>
                <SelectItem value="2">2 Stars</SelectItem>
                <SelectItem value="1">1 Star</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPeriod} onValueChange={setFilterPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Time period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={loadCompletedProjects}
              disabled={loading}
            >
              <Filter className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Completions List */}
      {loading ? (
        <div className="grid grid-cols-1  gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredCompletions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No completed projects found</h3>
            <p className="text-muted-foreground">
              {searchTerm || filterSatisfaction !== 'all' || filterPeriod !== 'all'
                ? 'Try adjusting your filters to see more results.'
                : 'Completed projects will appear here once work is finished and reported.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredCompletions.map((completion) => (
            <Card key={completion.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <h3 className="font-semibold text-lg">{completion.project_title}</h3>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        Completed
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{completion.customer_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{completion.address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(completion.completion_date).toLocaleDateString('nl-NL')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">By:</span>
                        <span>{completion.installer_name}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="text-sm text-muted-foreground">Satisfaction:</span>
                          <div className="mt-1">
                            {renderSatisfactionStars(completion.customer_satisfaction)}
                          </div>
                        </div>
                        {completion.photo_count > 0 && (
                          <Badge variant="secondary">
                            {completion.photo_count} photo(s)
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {completion.pdf_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(completion.pdf_url, '_blank')}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            View PDF
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resendEmail(completion)}
                          disabled={!completion.pdf_url}
                        >
                          <Mail className="h-4 w-4 mr-1" />
                          {completion.email_sent_at ? 'Resend' : 'Send'} Email
                        </Button>
                      </div>
                    </div>

                    {completion.email_sent_at && (
                      <div className="text-xs text-muted-foreground">
                        Email sent: {new Date(completion.email_sent_at).toLocaleString('nl-NL')}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};