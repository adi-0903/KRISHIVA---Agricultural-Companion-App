import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { saveCropMarketData, initDatabase, getNextCropId, deleteCropData, getCropDataById } from '../database/database';

interface FormData {
  id: number | null;
  crop_name: string;
  district_name: string;
  market_selling_price: string;
}

export default function CropDetails() {
  const [dbInitialized, setDbInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    id: null,
    crop_name: '',
    district_name: '',
    market_selling_price: ''
  });

  useEffect(() => {
    let isMounted = true;
    
    const initializeDB = async () => {
      try {
        await initDatabase();
        
        // Check if we're editing an existing crop
        const params = new URLSearchParams(window.location.search);
        const editId = params.get('edit');
        
        if (editId) {
          // In edit mode, load the existing data
          const cropId = parseInt(editId);
          if (!isNaN(cropId)) {
            const existingData = await getCropDataById(cropId);
            if (existingData && isMounted) {
              setFormData({
                id: existingData.id,
                crop_name: existingData.crop_name,
                district_name: existingData.district_name,
                market_selling_price: existingData.market_selling_price.toString()
              });
              setIsEditMode(true);
              setDbInitialized(true);
              return;
            }
          }
        }
        
        // If not in edit mode or failed to load existing data, get next ID
        const nextId = await getNextCropId();
        if (isMounted) {
          setFormData(prev => ({
            ...prev,
            id: nextId
          }));
          setDbInitialized(true);
        }
      } catch (error) {
        console.error('Error initializing database:', error);
        if (isMounted) {
          Alert.alert('Error', 'Failed to initialize database. Please restart the app.');
        }
      }
    };

    initializeDB();
    
    return () => {
      isMounted = false;
    };
  }, []);

  if (!dbInitialized) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator size="large" color="#6c5ce7" />
        <Text style={styles.loadingText}>Initializing database...</Text>
      </View>
    );
  }


  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDelete = async () => {
    if (!formData.id) return;
    
    try {
      setLoading(true);
      await deleteCropData(formData.id);
      Alert.alert('Success', 'Crop data deleted successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error deleting crop data:', error);
      Alert.alert('Error', 'Failed to delete crop data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = () => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this crop entry? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: handleDelete }
      ]
    );
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!formData.crop_name || !formData.district_name || !formData.market_selling_price) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const price = Number(formData.market_selling_price);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Error', 'Please enter a valid price (must be a positive number)');
      return;
    }

    setLoading(true);
    try {
      const { id } = await saveCropMarketData({
        crop_name: formData.crop_name.trim(),
        district_name: formData.district_name.trim(),
        market_selling_price: price
      });

      Alert.alert('Success', 'Crop details saved successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
      
      // Clear form while keeping the next ID
      setFormData(prev => ({
        ...prev,
        id: id + 1, // Set to next expected ID
        crop_name: '',
        district_name: '',
        market_selling_price: ''
      }));
    } catch (error: any) {
      console.error('Error saving crop details:', error);
      
      // Check for duplicate entry error
      if (error.message && error.message.includes('Crop already exists')) {
        Alert.alert('Duplicate Entry', error.message);
      } else {
        Alert.alert('Error', 'Crop already exists. Cannot add duplicate data.');
      }
    } finally {
      if (dbInitialized) {
        setLoading(false);
      }
    }
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Add Crop Details</Text>
      <Text style={styles.subtitle}>Fill in the details below to add a new crop entry</Text>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Crop ID</Text>
        <TextInput
          style={[styles.input, styles.disabledInput]}
          value={formData.id?.toString() || ''}
          placeholder="ID will be auto-generated"
          keyboardType="numeric"
          editable={false}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Crop Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter crop name"
          value={formData.crop_name}
          onChangeText={(text) => handleInputChange('crop_name', text)}
          keyboardType="default"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>District Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter district name"
          value={formData.district_name}
          onChangeText={(text) => handleInputChange('district_name', text)}
          keyboardType="default"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Market Selling Price (₹)</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter price"
          value={formData.market_selling_price}
          onChangeText={(text) => handleInputChange('market_selling_price', text)}
          keyboardType="numeric"
        />
      </View>

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? (isEditMode ? 'Updating...' : 'Saving...') : (isEditMode ? 'Update Details' : 'Save Details')}
        </Text>
      </TouchableOpacity>

      {isEditMode && (
        <TouchableOpacity 
          style={[styles.deleteButton, loading && styles.buttonDisabled]}
          onPress={handleDeleteConfirm}
          disabled={loading}
        >
          <Ionicons name="trash-outline" size={20} color="#fff" />
          <Text style={styles.deleteButtonText}>
            {loading ? 'Deleting...' : 'Delete Entry'}
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
        disabled={loading}
      >
        <Ionicons name="arrow-back" size={20} color="#6c5ce7" />
        <Text style={styles.backButtonText}>Back to {isEditMode ? 'List' : 'Home'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2d3436',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#636e72',
    textAlign: 'center',
    marginBottom: 30,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#555',
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#666',
  },
  button: {
    backgroundColor: '#6c5ce7',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#ff4757',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6c5ce7',
    backgroundColor: 'transparent',
  },
  backButtonText: {
    color: '#6c5ce7',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
