import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../../src/integrations/supabase/client';

interface Quote {
  id: string;
  quote_number: string;
  customer_name: string;
  project_title?: string;
  total_amount: number;
  status: string;
  created_at: string;
}

export default function QuotesScreen() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchQuotes = async () => {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select('id, quote_number, customer_name, project_title, total_amount, status, created_at')
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching quotes:', error);
        return;
      }

      setQuotes(data || []);
    } catch (error) {
      console.error('Error in fetchQuotes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchQuotes();
  };

  const filteredQuotes = quotes.filter(quote =>
    quote.quote_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quote.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (quote.project_title && quote.project_title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'goedgekeurd':
        return '#10b981';
      case 'verzonden':
        return '#3b82f6';
      case 'concept':
        return '#6b7280';
      case 'afgewezen':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'goedgekeurd':
        return 'Goedgekeurd';
      case 'verzonden':
        return 'Verzonden';
      case 'concept':
        return 'Concept';
      case 'afgewezen':
        return 'Afgewezen';
      default:
        return status;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#a61f23" />
        <Text style={styles.loadingText}>Offertes laden...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Offertes</Text>
        <Text style={styles.headerSubtitle}>{filteredQuotes.length} offertes</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Zoek op nummer, klant of project..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholderTextColor="#9ca3af"
        />
      </View>

      {/* Quotes List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredQuotes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchTerm ? 'Geen offertes gevonden' : 'Geen offertes beschikbaar'}
            </Text>
          </View>
        ) : (
          filteredQuotes.map((quote) => (
            <TouchableOpacity key={quote.id} style={styles.quoteCard}>
              <View style={styles.quoteHeader}>
                <Text style={styles.quoteNumber}>{quote.quote_number}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(quote.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(quote.status) }]}>
                    {getStatusLabel(quote.status)}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.customerName}>{quote.customer_name}</Text>
              
              {quote.project_title && (
                <Text style={styles.projectTitle}>{quote.project_title}</Text>
              )}
              
              <View style={styles.quoteFooter}>
                <Text style={styles.amount}>{formatCurrency(quote.total_amount)}</Text>
                <Text style={styles.date}>{formatDate(quote.created_at)}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
  },
  searchInput: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  scrollView: {
    flex: 1,
  },
  quoteCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  quoteNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  projectTitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  quoteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#a61f23',
  },
  date: {
    fontSize: 14,
    color: '#9ca3af',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
  },
});