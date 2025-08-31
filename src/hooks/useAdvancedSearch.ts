import { useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface SearchFilters {
  dateRange: {
    start: Date;
    end: Date;
  };
  participants: string[];
  messageTypes: ('text' | 'file' | 'image' | 'voice')[];
  languages: string[];
  hasFiles: boolean;
  isTranslated: boolean;
  sentiment: 'positive' | 'neutral' | 'negative' | 'all';
  projects: string[];
}

interface SearchResult {
  messageId: string;
  content: string;
  highlight: string;
  context: any[];
  relevanceScore: number;
  conversationId: string;
  timestamp: string;
  from_user_name?: string;
  to_user_name?: string;
}

interface UseAdvancedSearchReturn {
  results: SearchResult[];
  totalCount: number;
  isSearching: boolean;
  filters: SearchFilters;
  setFilters: (filters: Partial<SearchFilters>) => void;
  search: (query: string) => Promise<void>;
  clearSearch: () => void;
  hasActiveFilters: boolean;
}

const defaultFilters: SearchFilters = {
  dateRange: {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    end: new Date()
  },
  participants: [],
  messageTypes: ['text', 'file', 'image', 'voice'],
  languages: [],
  hasFiles: false,
  isTranslated: false,
  sentiment: 'all',
  projects: []
};

export const useAdvancedSearch = (): UseAdvancedSearchReturn => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [filters, setFiltersState] = useState<SearchFilters>(defaultFilters);

  const setFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.participants.length > 0 ||
      filters.messageTypes.length !== 4 ||
      filters.languages.length > 0 ||
      filters.hasFiles ||
      filters.isTranslated ||
      filters.sentiment !== 'all' ||
      filters.projects.length > 0 ||
      filters.dateRange.start.getTime() !== defaultFilters.dateRange.start.getTime() ||
      filters.dateRange.end.getTime() !== defaultFilters.dateRange.end.getTime()
    );
  }, [filters]);

  const search = useCallback(async (query: string) => {
    if (!user || !query.trim()) {
      setResults([]);
      setTotalCount(0);
      return;
    }

    setIsSearching(true);

    try {
      // Build the search query with filters
      let searchQuery = supabase
        .from('direct_messages')
        .select(`
          id,
          content,
          created_at,
          from_user_id,
          to_user_id,
          message_type,
          file_name,
          detected_language,
          translated_content
        `)
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
        .gte('created_at', filters.dateRange.start.toISOString())
        .lte('created_at', filters.dateRange.end.toISOString());

      // Add text search
      if (query.trim()) {
        searchQuery = searchQuery.textSearch('content', query, {
          type: 'websearch',
          config: 'english'
        });
      }

      // Apply message type filters
      if (filters.messageTypes.length > 0 && filters.messageTypes.length < 4) {
        searchQuery = searchQuery.in('message_type', filters.messageTypes);
      }

      // Apply participant filters
      if (filters.participants.length > 0) {
        const participantConditions = filters.participants
          .map(p => `from_user_id.eq.${p},to_user_id.eq.${p}`)
          .join(',');
        searchQuery = searchQuery.or(participantConditions);
      }

      // Apply language filters
      if (filters.languages.length > 0) {
        searchQuery = searchQuery.in('detected_language', filters.languages);
      }

      // Apply file filter
      if (filters.hasFiles) {
        searchQuery = searchQuery.not('file_name', 'is', null);
      }

      // Apply translation filter
      if (filters.isTranslated) {
        searchQuery = searchQuery.not('translated_content', 'is', null);
      }

      // Execute search
      const { data: messages, error, count } = await searchQuery
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        throw error;
      }

      // Process results with highlighting
      const processedResults: SearchResult[] = (messages || []).map(message => {
        const content = message.content || '';
        const queryWords = query.toLowerCase().split(' ').filter(w => w.length > 2);
        
        // Simple highlighting
        let highlight = content;
        queryWords.forEach(word => {
          const regex = new RegExp(`(${word})`, 'gi');
          highlight = highlight.replace(regex, '<mark>$1</mark>');
        });

        // Calculate simple relevance score
        const relevanceScore = queryWords.reduce((score, word) => {
          const occurrences = (content.toLowerCase().match(new RegExp(word, 'g')) || []).length;
          return score + occurrences;
        }, 0);

        return {
          messageId: message.id,
          content,
          highlight: highlight.length > 200 ? highlight.substring(0, 200) + '...' : highlight,
          context: [], // Would be populated with surrounding messages
          relevanceScore,
          conversationId: `${message.from_user_id}-${message.to_user_id}`,
          timestamp: message.created_at,
          from_user_name: 'User', // Would be populated from profiles
          to_user_name: 'User'
        };
      });

      // Sort by relevance
      processedResults.sort((a, b) => b.relevanceScore - a.relevanceScore);

      setResults(processedResults);
      setTotalCount(count || processedResults.length);

      if (processedResults.length === 0) {
        toast({
          title: "No results found",
          description: "Try adjusting your search terms or filters.",
        });
      }

    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Error",
        description: "An error occurred while searching. Please try again.",
        variant: "destructive"
      });
      setResults([]);
      setTotalCount(0);
    } finally {
      setIsSearching(false);
    }
  }, [user, filters, toast]);

  const clearSearch = useCallback(() => {
    setResults([]);
    setTotalCount(0);
    setFiltersState(defaultFilters);
  }, []);

  return {
    results,
    totalCount,
    isSearching,
    filters,
    setFilters,
    search,
    clearSearch,
    hasActiveFilters
  };
};