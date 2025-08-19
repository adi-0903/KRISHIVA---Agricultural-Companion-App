// app/index.tsx
import { Ionicons } from '@expo/vector-icons';
import { StatusBar as RNStatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import type { RouteName } from './types';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { initDatabase, setupSyncListener, checkAndSyncData } from '../database/database';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      try {
        // First initialize the database
        await initDatabase();
        console.log('Database initialized successfully');
        
        // Then check user session
        const userSession = await AsyncStorage.getItem('userSession');
        if (userSession) {
          const user = JSON.parse(userSession);
          setIsLoggedIn(true);
          setUserName(user.name);
        } else {
          setIsLoggedIn(false);
        }
        
        // Set up sync listener
        setupSyncListener();
        
        // Initial sync check
        await checkAndSyncData();
        
        // Set up periodic sync every 5 minutes
        const syncInterval = setInterval(() => {
          checkAndSyncData();
        }, 5 * 60 * 1000);
        
        return () => {
          clearInterval(syncInterval);
        };
      } catch (error) {
        console.error('Error initializing app:', error);
        Alert.alert('Error', 'Failed to initialize the application. Please restart the app.');
      } finally {
        setLoading(false);
      }
    };
    
    initApp();
  }, []);

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await AsyncStorage.removeItem('userSession');
            setIsLoggedIn(false);
            setUserName('');
            Alert.alert('Success', 'You have been logged out successfully.');
          } catch (error) {
            console.error('Logout error:', error);
            Alert.alert('Error', 'Failed to logout. Please try again.');
          }
        },
      },
    ]);
  };

  const router = useRouter();

  const navigateTo = (path: RouteName) => {
    router.push(path);
  };

  // Navigate to crop details
  const navigateToCropDetails = () => {
    router.push('/crop-details' as RouteName);
  };

  // Navigate to profile
  const navigateToProfile = () => {
    router.push('/profile' as RouteName);
  };

  // Navigate to data view
  const navigateToDataView = () => {
    router.push('/data-view' as RouteName);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#6c5ce7" />
        <Text style={styles.loadingText}>Initializing...</Text>
      </View>
    );
  }

  // Add a manual sync button handler
  const handleManualSync = async () => {
    try {
      setLoading(true);
      await checkAndSyncData();
      Alert.alert('Success', 'Data synchronized successfully!');
    } catch (error) {
      console.error('Sync error:', error);
      Alert.alert('Error', 'Failed to sync data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isLoggedIn) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollCenter}>
        <RNStatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Ionicons name="checkmark-circle" size={80} color="#27ae60" />
            <Text style={styles.title}>Welcome Back!</Text>
            <Text style={styles.userGreeting}>Hello, {userName}</Text>
          </View>

          <Text style={styles.subtitle}>You are successfully logged in</Text>
          
          <View style={styles.gridContainer}>
            {/* First Row */}
            <View style={styles.gridRow}>
              <TouchableOpacity style={[styles.gridButton, {backgroundColor: '#3498db'}]} onPress={navigateToProfile}>
                <Ionicons
                  name="person-outline"
                  size={28}
                  color="#fff"
                  style={styles.gridIcon}
                />
                <Text style={styles.gridButtonText}>View Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.gridButton, {backgroundColor: '#2ecc71'}]} onPress={navigateToCropDetails}>
                <Ionicons
                  name="leaf-outline"
                  size={28}
                  color="#fff"
                  style={styles.gridIcon}
                />
                <Text style={styles.gridButtonText}>Crop Details</Text>
              </TouchableOpacity>
            </View>

            {/* Second Row */}
            <View style={styles.gridRow}>
              <TouchableOpacity style={[styles.gridButton, {backgroundColor: '#9b59b6'}]} onPress={navigateToDataView}>
                <Ionicons
                  name="bar-chart-outline"
                  size={28}
                  color="#fff"
                  style={styles.gridIcon}
                />
                <Text style={styles.gridButtonText}>Market Data</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.gridButton, {backgroundColor: '#f39c12'}]} 
                onPress={handleManualSync}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons
                      name="sync"
                      size={28}
                      color="#fff"
                      style={styles.gridIcon}
                    />
                    <Text style={styles.gridButtonText}>Sync Now</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.logoutButton, {marginTop: 20}, isPressed && styles.logoutButtonPressed]} 
            onPress={handleLogout}
            activeOpacity={1}
            onPressIn={() => setIsPressed(true)}
            onPressOut={() => setIsPressed(false)}
          >
            <Ionicons
              name="log-out-outline"
              size={20}
              color="#ff4757"
              style={styles.buttonIcon}
            />
            <Text style={[styles.buttonText, { color: '#ff4757' }]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollCenter}>
      <RNStatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/images/crop.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={styles.title}>KRISHIVA</Text>
      </View>

      <Text style={styles.subtitle}>Crops Ki Kahani, Data Mein Samhani</Text>

      <View style={styles.buttonContainer}>
        <Link href="/login" asChild>
          <TouchableOpacity style={styles.loginButton}>
            <Ionicons
              name="log-in-outline"
              size={20}
              color="#fff"
              style={styles.buttonIcon}
            />
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
        </Link>

        <Link href="/signup" asChild>
          <TouchableOpacity style={styles.signupButton}>
            <Ionicons
              name="person-add-outline"
              size={18}
              color="#6c5ce7"
              style={[styles.buttonIcon, { marginRight: 10}]}
            />
            <Text style={styles.signupButtonText}>
              Create Account
            </Text>
          </TouchableOpacity>
        </Link>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // ... existing styles ...
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6c5ce7',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginBottom: 15,
    width: '100%',
    maxWidth: 300,
    elevation: 3,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  syncIcon: {
    marginRight: 5,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollCenter: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridContainer: {
    width: '100%',
    marginTop: 20,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  gridButton: {
    width: '48%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gridIcon: {
    marginBottom: 10,
  },
  gridButtonText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 16,
  },
  logoutButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ff4757',
    marginTop: 20,
    backgroundColor: 'transparent',
  },
  logoutButtonPressed: {
    backgroundColor: '#ff4757',
  },
  content: {
    width: '100%',
    alignItems: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
    width: '100%',
    paddingHorizontal: 20,
  },
  logoImage: {
    width: 150,
    height: 150,
    marginBottom: 10,
    marginTop: 10,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: '#6c5ce7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2d3436',
    marginTop: 20,
    textAlign: 'center',
    width: '100%',
  },
  userGreeting: {
    fontSize: 18,
    color: '#6c5ce7',
    marginTop: 5,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 16,
    color: '#636e72',
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 30,
    lineHeight: 24,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 20, 
  },
  menuButton: {
    backgroundColor: '#6c5ce7',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginBottom: 15,
    width: '100%',
    maxWidth: 300, 
    alignItems: 'center',
    elevation: 3, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  loginButton: {
    backgroundColor: '#6c5ce7',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    marginBottom: 12,
    width: '100%',
    maxWidth: 240,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  signupButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    marginBottom: 12,
    width: '100%',
    maxWidth: 240,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: '#6c5ce7',
  },
  signupButtonText: {
    color: '#6c5ce7',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  buttonIcon: {
    marginRight: 10,
  },
});
