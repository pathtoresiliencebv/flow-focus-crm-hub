import React, { useState } from 'react';
import { Search, Filter, Calendar, Users, FileText, Globe, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAdvancedSearch } from '@/hooks/useAdvancedSearch';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export const AdvancedSearch: React.FC = () => {
  const {
    results,
    totalCount,
    isSearching,
    filters,
    setFilters,
    search,
    clearSearch,
    hasActiveFilters
  } = useAdvancedSearch();
  
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    if (searchQuery.trim()) {
      search(searchQuery);
    } else {
      clearSearch();
    }
  };

  const messageTypes = [
    { value: 'text', label: 'Text' },
    { value: 'file', label: 'Files' },
    { value: 'image', label: 'Images' },
    { value: 'voice', label: 'Voice' }
  ];

  const languages = [
    { value: 'nl', label: 'Nederlands' },
    { value: 'en', label: 'English' },
    { value: 'de', label: 'Deutsch' },
    { value: 'fr', label: 'Français' },
    { value: 'es', label: 'Español' }
  ];

  const sentiments = [
    { value: 'all', label: 'All' },
    { value: 'positive', label: 'Positive' },
    { value: 'neutral', label: 'Neutral' },
    { value: 'negative', label: 'Negative' }
  ];

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Search Header */}
      <div className="border-b p-4 space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search messages, files, or conversations..."
              className="pl-10 pr-4"
            />
          </div>
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="relative"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                !
              </Badge>
            )}
          </Button>
          {(query || hasActiveFilters) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQuery('');
                clearSearch();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            {filters.participants.length > 0 && (
              <Badge variant="secondary">
                <Users className="h-3 w-3 mr-1" />
                {filters.participants.length} users
              </Badge>
            )}
            {filters.messageTypes.length !== 4 && (
              <Badge variant="secondary">
                <FileText className="h-3 w-3 mr-1" />
                {filters.messageTypes.join(', ')}
              </Badge>
            )}
            {filters.languages.length > 0 && (
              <Badge variant="secondary">
                <Globe className="h-3 w-3 mr-1" />
                {filters.languages.join(', ')}
              </Badge>
            )}
            {filters.sentiment !== 'all' && (
              <Badge variant="secondary">
                Sentiment: {filters.sentiment}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="border-b p-4 bg-muted/50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Date Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <Calendar className="h-4 w-4 mr-2" />
                      {format(filters.dateRange.start, 'MMM dd')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <CalendarComponent
                      mode="single"
                      selected={filters.dateRange.start}
                      onSelect={(date) => date && setFilters({
                        dateRange: { ...filters.dateRange, start: date }
                      })}
                    />
                  </PopoverContent>
                </Popover>
                <span className="text-muted-foreground">to</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <Calendar className="h-4 w-4 mr-2" />
                      {format(filters.dateRange.end, 'MMM dd')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <CalendarComponent
                      mode="single"
                      selected={filters.dateRange.end}
                      onSelect={(date) => date && setFilters({
                        dateRange: { ...filters.dateRange, end: date }
                      })}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Message Types */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Message Types</label>
              <div className="space-y-2">
                {messageTypes.map((type) => (
                  <div key={type.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={type.value}
                      checked={filters.messageTypes.includes(type.value as any)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFilters({
                            messageTypes: [...filters.messageTypes, type.value as any]
                          });
                        } else {
                          setFilters({
                            messageTypes: filters.messageTypes.filter(t => t !== type.value)
                          });
                        }
                      }}
                    />
                    <label htmlFor={type.value} className="text-sm">
                      {type.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Languages */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Languages</label>
              <Select
                value={filters.languages.length > 0 ? filters.languages[0] : ""}
                onValueChange={(value) => setFilters({ languages: value ? [value] : [] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any language</SelectItem>
                  {languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Additional Filters */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Additional</label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has-files"
                    checked={filters.hasFiles}
                    onCheckedChange={(checked) => setFilters({ hasFiles: !!checked })}
                  />
                  <label htmlFor="has-files" className="text-sm">Has files</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is-translated"
                    checked={filters.isTranslated}
                    onCheckedChange={(checked) => setFilters({ isTranslated: !!checked })}
                  />
                  <label htmlFor="is-translated" className="text-sm">Translated</label>
                </div>
              </div>
            </div>

            {/* Sentiment */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Sentiment</label>
              <Select
                value={filters.sentiment}
                onValueChange={(value: any) => setFilters({ sentiment: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sentiments.map((sentiment) => (
                    <SelectItem key={sentiment.value} value={sentiment.value}>
                      {sentiment.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="flex-1 p-4">
        {isSearching ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-muted-foreground">Searching...</p>
            </div>
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Found {totalCount} results
              </p>
            </div>
            
            <ScrollArea className="h-[calc(100vh-400px)]">
              <div className="space-y-3">
                {results.map((result) => (
                  <Card key={result.messageId} className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{format(new Date(result.timestamp), 'MMM dd, yyyy HH:mm')}</span>
                          <Badge variant="outline" className="text-xs">
                            Score: {result.relevanceScore}
                          </Badge>
                        </div>
                        <div 
                          className="text-sm" 
                          dangerouslySetInnerHTML={{ __html: result.highlight }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        ) : query || hasActiveFilters ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No results found</p>
              <p className="text-sm text-muted-foreground">Try adjusting your search terms or filters</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Start typing to search</p>
              <p className="text-sm text-muted-foreground">Search through your messages, files, and conversations</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};