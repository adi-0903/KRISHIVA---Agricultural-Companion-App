import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { getAllCropData, getCropDataById } from '../database/database';

// Format date to show in a more readable format
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

interface CropData {
  id: number;
  crop_name: string;
  district_name: string;
  market_selling_price: number;
  created_at: string;
}

export default function DataView() {
  const [localData, setLocalData] = useState<CropData[]>([]);
  const [backendData, setBackendData] = useState<CropData[]>([]);
  const [loading, setLoading] = useState({
    local: true,
    backend: true,
  });

  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState({
    local: '',
    backend: '',
  });
  const router = useRouter();

  const fetchLocalData = async () => {
    try {
      const data = await getAllCropData();
      setLocalData(data);
      setError(prev => ({ ...prev, local: '' }));
    } catch (err) {
      console.error('Error fetching local data:', err);
      setError(prev => ({ ...prev, local: 'Failed to load local data' }));
    } finally {
      setLoading(prev => ({ ...prev, local: false }));
    }
  };

  const fetchBackendData = async () => {
    try {
      const response = await fetch(
        'http://x8kck8g4k0k80gs4ww0gcco4.106.51.142.222.sslip.io/market_prices',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      
      // Handle case where responseData might be null or undefined
      if (!responseData) {
        console.log('No data received from server');
        setBackendData([]);
        setError(prev => ({ ...prev, backend: 'No data available from server' }));
        return;
      }

      // Check if responseData is an array directly or has a data property that's an array
      const dataArray = Array.isArray(responseData) 
        ? responseData 
        : (responseData.data && Array.isArray(responseData.data) ? responseData.data : []);

      if (dataArray.length === 0) {
        console.log('Empty data array received from server');
        setBackendData([]);
        setError(prev => ({ ...prev, backend: 'No market data available' }));
        return;
      }

      // Safely map the data with proper null checks
      const formattedData = dataArray
        .filter((item: any) => item != null) // Filter out any null/undefined items
        .map((item: any, index: number) => ({
          id: item?.id || index + 1,
          crop_name: item?.crop_name?.toString() || 'N/A',
          district_name: item?.district_name?.toString() || 'N/A',
          market_selling_price: Number(item?.market_selling_price) || 0,
          created_at: item?.created_at || new Date().toISOString(),
        }));

      setBackendData(formattedData);
      setError(prev => ({ ...prev, backend: '' }));
    } catch (err) {
      console.error('Error fetching backend data:', err);
      setError(prev => ({
        ...prev,
        backend: 'Unable to load backend data. Please check your connection and try again later.',
      }));
      setBackendData([]);
    } finally {
      setLoading(prev => ({ ...prev, backend: false }));
    }
  };

  const loadData = async () => {
    setRefreshing(true);
    await Promise.all([fetchLocalData(), fetchBackendData()]);
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, []);



  const renderDataSection = (title: string, data: CropData[], loading: boolean, error: string) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {loading ? (
        <ActivityIndicator size="small" color="#6c5ce7" style={styles.loader} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : data.length === 0 ? (
        <Text style={styles.emptyText}>No data available</Text>
      ) : (
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerText, { flex: 2 }]}>Crop</Text>
            <Text style={[styles.headerText, { flex: 2 }]}>District</Text>
            <Text style={[styles.headerText, { flex: 1, textAlign: 'right', paddingRight: 8 }]}>Price (₹)</Text>
            {title === 'Local Data' && (
              <Text style={[styles.headerText, { flex: 1.5, textAlign: 'right' }]}>Date</Text>
            )}
          </View>
          <ScrollView>
            {data.map((item) => (
              <View key={`${title}-${item.id}`} style={styles.tableRow}>
                <Text style={[styles.cell, { flex: 2 }]}>{item.crop_name}</Text>
                <Text style={[styles.cell, { flex: 2 }]}>{item.district_name}</Text>
                <Text style={[styles.priceCell, { flex: 1, textAlign: 'right', paddingRight: title === 'Local Data' ? 0 : 8 }]}>
                  ₹{Number(item.market_selling_price).toLocaleString('en-IN')}
                </Text>
                {title === 'Local Data' && (
                  <Text style={[styles.dateCell, { flex: 1.5, textAlign: 'right' }]}>
                    {formatDate(item.created_at)}
                  </Text>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#6c5ce7" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Market Data</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadData} />
        }>
        {renderDataSection(
          'Local Data',
          localData,
          loading.local,
          error.local
        )}
        
        {renderDataSection(
          'Backend Data',
          backendData,
          loading.backend,
          error.backend
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3436',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#2d3436',
  },
  loader: {
    padding: 16,
  },
  errorText: {
    color: '#e74c3c',
    textAlign: 'center',
    padding: 8,
  },
  emptyText: {
    color: '#95a5a6',
    textAlign: 'center',
    padding: 8,
  },
  table: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerText: {
    fontWeight: '600',
    color: '#6c5ce7',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    backgroundColor: '#fff',
    alignItems: 'center',
  },

  cell: {
    fontSize: 13,
    color: '#2d3436',
    paddingHorizontal: 4,
  },
  priceCell: {
    fontSize: 13,
    fontWeight: '600',
    color: '#00b894',
    textAlign: 'right',
    paddingRight: 8,
  },
  dateCell: {
    fontSize: 12,
    color: '#7f8c8d',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
