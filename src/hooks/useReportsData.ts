import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, subMonths, subQuarters, subYears, startOfWeek, startOfMonth, startOfQuarter, startOfYear } from 'date-fns';

export interface SalesMetrics {
  totalSales: number;
  previousPeriodSales: number;
  newCustomers: number;
  previousPeriodCustomers: number;
  averageOrderValue: number;
  previousPeriodAOV: number;
  monthlySalesData: Array<{ name: string; value: number; target: number }>;
}

export interface ProjectMetrics {
  activeProjects: number;
  completedProjects: number;
  averageProjectDuration: number;
  statusDistribution: Array<{ name: string; value: number; color: string }>;
  projectTrends: Array<{ name: string; started: number; completed: number }>;
}

export interface FinancialMetrics {
  totalRevenue: number;
  totalCosts: number;
  profit: number;
  profitMargin: number;
  financialTrends: Array<{ name: string; revenue: number; costs: number; profit: number }>;
}

const getPeriodDates = (period: string) => {
  const now = new Date();
  
  switch (period) {
    case 'week':
      return {
        startDate: startOfWeek(now),
        endDate: now,
        previousStartDate: startOfWeek(subDays(now, 7)),
        previousEndDate: subDays(now, 7)
      };
    case 'quarter':
      return {
        startDate: startOfQuarter(now),
        endDate: now,
        previousStartDate: startOfQuarter(subQuarters(now, 1)),
        previousEndDate: subQuarters(now, 1)
      };
    case 'year':
      return {
        startDate: startOfYear(now),
        endDate: now,
        previousStartDate: startOfYear(subYears(now, 1)),
        previousEndDate: subYears(now, 1)
      };
    default: // month
      return {
        startDate: startOfMonth(now),
        endDate: now,
        previousStartDate: startOfMonth(subMonths(now, 1)),
        previousEndDate: subMonths(now, 1)
      };
  }
};

export const useReportsData = (period: string = 'month') => {
  const [salesData, setSalesData] = useState<SalesMetrics | null>(null);
  const [projectData, setProjectData] = useState<ProjectMetrics | null>(null);
  const [financialData, setFinancialData] = useState<FinancialMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReportsData = async () => {
      try {
        setLoading(true);
        setError(null);

        const { startDate, endDate, previousStartDate, previousEndDate } = getPeriodDates(period);

        // Fetch sales data from quotes and invoices
        const [quotesResult, invoicesResult, customersResult, projectsResult, materialsResult] = await Promise.all([
          supabase
            .from('quotes')
            .select('*')
            .eq('status', 'goedgekeurd')
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString()),
          
          supabase
            .from('invoices')
            .select('*')
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString()),

          supabase
            .from('customers')
            .select('*')
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString()),

          supabase
            .from('projects')
            .select('*'),

          supabase
            .from('project_materials')
            .select('*')
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString())
        ]);

        // Calculate sales metrics
        const currentQuotes = quotesResult.data || [];
        const currentInvoices = invoicesResult.data || [];
        const currentCustomers = customersResult.data || [];
        const allProjects = projectsResult.data || [];
        const currentMaterials = materialsResult.data || [];

        const totalSales = currentQuotes.reduce((sum, quote) => sum + (quote.total_amount || 0), 0) +
                          currentInvoices.reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0);

        // Get previous period data for comparison
        const [prevQuotesResult, prevCustomersResult] = await Promise.all([
          supabase
            .from('quotes')
            .select('*')
            .eq('status', 'goedgekeurd')
            .gte('created_at', previousStartDate.toISOString())
            .lte('created_at', previousEndDate.toISOString()),
          
          supabase
            .from('customers')
            .select('*')
            .gte('created_at', previousStartDate.toISOString())
            .lte('created_at', previousEndDate.toISOString())
        ]);

        const previousQuotes = prevQuotesResult.data || [];
        const previousCustomers = prevCustomersResult.data || [];
        const previousPeriodSales = previousQuotes.reduce((sum, quote) => sum + (quote.total_amount || 0), 0);

        const averageOrderValue = currentQuotes.length > 0 ? totalSales / currentQuotes.length : 0;
        const previousAOV = previousQuotes.length > 0 ? previousPeriodSales / previousQuotes.length : 0;

        // Generate monthly sales data for charts
        const monthlySalesData = [];
        for (let i = 11; i >= 0; i--) {
          const monthStart = startOfMonth(subMonths(new Date(), i));
          const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
          
          const monthQuotes = await supabase
            .from('quotes')
            .select('*')
            .eq('status', 'goedgekeurd')
            .gte('created_at', monthStart.toISOString())
            .lte('created_at', monthEnd.toISOString());

          const monthlyTotal = (monthQuotes.data || []).reduce((sum, quote) => sum + (quote.total_amount || 0), 0);
          
          monthlySalesData.push({
            name: format(monthStart, 'MMM'),
            value: monthlyTotal,
            target: monthlyTotal * 1.1 // 10% growth target
          });
        }

        setSalesData({
          totalSales,
          previousPeriodSales,
          newCustomers: currentCustomers.length,
          previousPeriodCustomers: previousCustomers.length,
          averageOrderValue,
          previousPeriodAOV: previousAOV,
          monthlySalesData
        });

        // Calculate project metrics
        const activeProjects = allProjects.filter(p => p.status === 'in-uitvoering').length;
        const completedProjects = allProjects.filter(p => p.status === 'afgerond').length;
        
        // Calculate average project duration (simplified)
        const avgDuration = 12; // Placeholder - would need project start/end dates

        const statusDistribution = [
          { name: 'Te plannen', value: allProjects.filter(p => p.status === 'te-plannen').length, color: '#8884d8' },
          { name: 'Gepland', value: allProjects.filter(p => p.status === 'gepland').length, color: '#83a6ed' },
          { name: 'In uitvoering', value: activeProjects, color: '#8dd1e1' },
          { name: 'Herkeuring', value: allProjects.filter(p => p.status === 'herkeuring').length, color: '#82ca9d' },
          { name: 'Afgerond', value: completedProjects, color: '#ff8042' }
        ];

        // Generate project trends (simplified)
        const projectTrends = [];
        for (let i = 4; i >= 0; i--) {
          const weekStart = subDays(new Date(), i * 7);
          projectTrends.push({
            name: `Week ${5 - i}`,
            started: Math.floor(Math.random() * 6) + 1, // Placeholder data
            completed: Math.floor(Math.random() * 5) + 1
          });
        }

        setProjectData({
          activeProjects,
          completedProjects,
          averageProjectDuration: avgDuration,
          statusDistribution,
          projectTrends
        });

        // Calculate financial metrics
        const totalRevenue = totalSales;
        const totalCosts = currentMaterials.reduce((sum, material) => sum + (material.total_cost || 0), 0);
        const profit = totalRevenue - totalCosts;
        const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

        // Generate financial trends
        const financialTrends = [];
        for (let i = 5; i >= 0; i--) {
          const monthStart = startOfMonth(subMonths(new Date(), i));
          const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
          
          const [monthQuotesResult, monthMaterialsResult] = await Promise.all([
            supabase
              .from('quotes')
              .select('*')
              .eq('status', 'goedgekeurd')
              .gte('created_at', monthStart.toISOString())
              .lte('created_at', monthEnd.toISOString()),
            
            supabase
              .from('project_materials')
              .select('*')
              .gte('created_at', monthStart.toISOString())
              .lte('created_at', monthEnd.toISOString())
          ]);

          const monthRevenue = (monthQuotesResult.data || []).reduce((sum, quote) => sum + (quote.total_amount || 0), 0);
          const monthCosts = (monthMaterialsResult.data || []).reduce((sum, material) => sum + (material.total_cost || 0), 0);
          
          financialTrends.push({
            name: format(monthStart, 'MMM'),
            revenue: monthRevenue,
            costs: monthCosts,
            profit: monthRevenue - monthCosts
          });
        }

        setFinancialData({
          totalRevenue,
          totalCosts,
          profit,
          profitMargin,
          financialTrends
        });

      } catch (err) {
        console.error('Error fetching reports data:', err);
        setError('Er is een fout opgetreden bij het ophalen van de rapportagedata');
      } finally {
        setLoading(false);
      }
    };

    fetchReportsData();
  }, [period]);

  return {
    salesData,
    projectData,
    financialData,
    loading,
    error
  };
};