// app/profile.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Image,
  useWindowDimensions,
} from 'react-native';
import { router, useRouter, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  loginTime: string;
  isPremium?: boolean;
  premiumExpiry?: string;
  premiumPlan?: string;
}

export default function Profile() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedPhone, setEditedPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [premiumExpiry, setPremiumExpiry] = useState<string | null>(null);
  const [premiumPlan, setPremiumPlan] = useState<string | null>(null);
  const [userBalance, setUserBalance] = useState(0);
  const router = useRouter();

  useEffect(() => {
    loadUserData();
    checkPremiumStatus();
    loadUserBalance();
  }, []);

  // Listen for premium status changes when returning from payment
  useFocusEffect(
    React.useCallback(() => {
      checkPremiumStatus();
      loadUserBalance();
    }, [])
  );

  const loadUserBalance = async () => {
    try {
      const balance = await AsyncStorage.getItem('userBalance');
      setUserBalance(parseInt(balance || '0'));
    } catch (error) {
      console.error('Error loading user balance:', error);
    }
  };

  const checkPremiumStatus = async () => {
    try {
      const premiumStatus = await AsyncStorage.getItem('isPremium');
      const expiryDate = await AsyncStorage.getItem('premiumExpiry');
      const planType = await AsyncStorage.getItem('premiumPlan');
      
      setIsPremium(premiumStatus === 'true');
      setPremiumExpiry(expiryDate);
      setPremiumPlan(planType);
      
      // Check if premium has expired
      if (premiumStatus === 'true' && expiryDate) {
        const expiry = new Date(expiryDate);
        const now = new Date();
        
        if (now > expiry) {
          // Premium has expired
          await AsyncStorage.setItem('isPremium', 'false');
          await AsyncStorage.removeItem('premiumExpiry');
          await AsyncStorage.removeItem('premiumPlan');
          setIsPremium(false);
          setPremiumExpiry(null);
          setPremiumPlan(null);
          
          // Update user session data
          const userSession = await AsyncStorage.getItem('userSession');
          if (userSession) {
            const user = JSON.parse(userSession);
            const updatedUser = { ...user, isPremium: false };
            await AsyncStorage.setItem('userSession', JSON.stringify(updatedUser));
            setUserData(updatedUser);
          }
          
          Alert.alert(
            'Premium Expired',
            'Your premium subscription has expired. Upgrade now to continue enjoying premium features!',
            [
              { text: 'Later', style: 'cancel' },
              { text: 'Upgrade Now', onPress: handleUpgradePress }
            ]
          );
        }
      }
    } catch (error) {
      console.error('Error checking premium status:', error);
    }
  };

  const handleUpgradePress = () => {
    if (!userData) return;
    
    router.push({
      pathname: '/payment-screen',
      params: {
        email: userData.email || '',
        contact: userData.phone || '',
        name: userData.name || ''
      }
    });
  };

  const handleManagePremium = () => {
    Alert.alert(
      'Manage Premium',
      `Current Plan: ${premiumPlan || 'Premium'}\nExpires: ${premiumExpiry ? formatDate(premiumExpiry) : 'Unknown'}\nBalance: ₹${userBalance}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Upgrade/Extend', onPress: handleUpgradePress },
        { 
          text: 'Cancel Subscription', 
          style: 'destructive',
          onPress: handleCancelSubscription 
        }
      ]
    );
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'Cancel Premium',
      'Are you sure you want to cancel your premium subscription? You will lose access to premium features immediately.',
      [
        { text: 'Keep Premium', style: 'cancel' },
        {
          text: 'Cancel Premium',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.setItem('isPremium', 'false');
              await AsyncStorage.removeItem('premiumExpiry');
              await AsyncStorage.removeItem('premiumPlan');
              setIsPremium(false);
              setPremiumExpiry(null);
              setPremiumPlan(null);
              
              // Update user session data
              if (userData) {
                const updatedUser = { ...userData, isPremium: false };
                await AsyncStorage.setItem('userSession', JSON.stringify(updatedUser));
                setUserData(updatedUser);
              }
              
              Alert.alert('Premium Cancelled', 'Your premium subscription has been cancelled.');
            } catch (error) {
              console.error('Error cancelling premium:', error);
              Alert.alert('Error', 'Failed to cancel premium subscription.');
            }
          }
        }
      ]
    );
  };

  const loadUserData = async () => {
    try {
      const userSession = await AsyncStorage.getItem('userSession');
      if (userSession) {
        const user = JSON.parse(userSession);
        setUserData(user);
        setEditedName(user.name || '');
        setEditedPhone(user.phone || '');
        setIsPremium(user.isPremium || false);
      } else {
        Alert.alert('Error', 'No user session found. Please login again.', [
          { text: 'OK', onPress: () => router.replace('/login') }
        ]);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load profile data.');
    } finally {
      setLoading(false);
    }
  };

  const validatePhone = (phone: string): boolean => {
    if (!phone) return true; // Phone is optional
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone);
  };

  const handleSaveProfile = async () => {
    if (!editedName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    if (editedPhone && !validatePhone(editedPhone)) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    setSaving(true);
    try {
      // Update the user data
      const updatedUser: UserData = {
        ...userData!,
        name: editedName.trim(),
        phone: editedPhone.trim() || null
      };

      // Save to AsyncStorage
      await AsyncStorage.setItem('userSession', JSON.stringify(updatedUser));
      setUserData(updatedUser);
      setIsEditing(false);
      
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit: () => void = () => {
    setEditedName(userData?.name || '');
    setEditedPhone(userData?.phone || '');
    setIsEditing(false);
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await AsyncStorage.removeItem('userSession');
            router.replace('/');
          } catch (error) {
            console.error('Logout error:', error);
            Alert.alert('Error', 'Failed to logout. Please try again.');
          }
        },
      },
    ]);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown';
    }
  };

  const getPremiumStatusText = () => {
    if (!isPremium) return null;
    
    if (!premiumExpiry) return 'Premium Active';
    
    const expiry = new Date(premiumExpiry);
    const now = new Date();
    const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft <= 0) return 'Premium Expired';
    if (daysLeft <= 7) return `Premium expires in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`;
    if (daysLeft <= 30) return `Premium expires in ${daysLeft} days`;
    
    return `Premium until ${expiry.toLocaleDateString()}`;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#6c5ce7" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="alert-circle-outline" size={60} color="#e74c3c" />
        <Text style={styles.errorText}>Failed to load profile</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadUserData}>
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Profile</Text>
          {isPremium && (
            <Ionicons name="star" size={20} color="#FFD700" style={styles.headerStar} />
          )}
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Premium Status Card */}
        <View style={[styles.premiumCard, isPremium ? styles.premiumCardActive : styles.premiumCardInactive]}>
          <View style={styles.premiumCardContent}>
            <Ionicons 
              name={isPremium ? "star" : "star-outline"} 
              size={24} 
              color={isPremium ? "#FFD700" : "#666"} 
            />
            <View style={styles.premiumTextContainer}>
              <Text style={[styles.premiumTitle, isPremium && styles.premiumTitleActive]}>
                {isPremium ? 'Premium Member' : 'Free Member'}
              </Text>
              <Text style={[styles.premiumSubtitle, isPremium && styles.premiumSubtitleActive]}>
                {isPremium ? getPremiumStatusText() : 'Upgrade to unlock all features'}
              </Text>
              {userBalance > 0 && (
                <Text style={[styles.premiumBalance, isPremium && styles.premiumBalanceActive]}>
                  Balance: ₹{userBalance}
                </Text>
              )}
            </View>
          </View>
          
          <TouchableOpacity 
            style={[styles.premiumButton, isPremium && styles.premiumButtonManage]}
            onPress={isPremium ? handleManagePremium : handleUpgradePress}
            activeOpacity={0.8}
          >
            <Text style={[styles.premiumButtonText, isPremium && styles.premiumButtonTextManage]}>
              {isPremium ? 'Manage' : 'Upgrade'}
            </Text>
            <Ionicons 
              name="chevron-forward" 
              size={16} 
              color={isPremium ? "#53a20e" : "#fff"} 
              style={{ marginLeft: 4 }}
            />
          </TouchableOpacity>
        </View>
        
        {/* Profile Avatar */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={50} color="#6c5ce7" />
            {isPremium && (
              <View style={styles.premiumBadge}>
                <Ionicons name="star" size={16} color="#FFD700" />
              </View>
            )}
          </View>
        </View>

        {/* Profile Information */}
        <View style={styles.infoContainer}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Name</Text>
            {isEditing ? (
              <View style={styles.editInputContainer}>
                <TextInput
                  style={styles.editInput}
                  value={editedName}
                  onChangeText={setEditedName}
                  placeholder="Enter your name"
                  autoCapitalize="words"
                />
              </View>
            ) : (
              <Text style={styles.infoValue}>{userData.name}</Text>
            )}
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{userData.email}</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Phone</Text>
            {isEditing ? (
              <View style={styles.editInputContainer}>
                <TextInput
                  style={styles.editInput}
                  value={editedPhone}
                  onChangeText={setEditedPhone}
                  placeholder="Enter your phone number"
                  keyboardType="phone-pad"
                  maxLength={10}
                />
                <Text style={styles.phoneHint}>(Optional)</Text>
              </View>
            ) : (
              <Text style={styles.infoValue}>{userData.phone || 'Not provided'}</Text>
            )}
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>User ID</Text>
            <Text style={styles.infoValueSmall}>{userData.id}</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Account Status</Text>
            <View style={styles.statusContainer}>
              <Text style={[styles.infoValue, isPremium && styles.premiumStatus]}>
                {isPremium ? 'Premium Account' : 'Free Account'}
              </Text>
              {isPremium && <Ionicons name="star" size={16} color="#FFD700" />}
            </View>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Last Login</Text>
            <Text style={styles.infoValue}>{formatDate(userData.loginTime)}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {isEditing ? (
            <>
              <TouchableOpacity 
                style={[styles.saveButton, saving && styles.buttonDisabled]} 
                onPress={handleSaveProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={20} color="#fff" style={styles.buttonIcon} />
                    <Text style={styles.buttonText}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelButton} onPress={handleCancelEdit}>
                <Ionicons name="close" size={20} color="#666" style={styles.buttonIcon} />
                <Text style={[styles.buttonText, { color: '#666' }]}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.editProfileButton} onPress={() => setIsEditing(true)}>
                <Ionicons name="create-outline" size={20} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Edit Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.dataButton, { backgroundColor: '#9b59b6' }]}
                onPress={() => router.push('/users')}
              >
                <Ionicons name="people-outline" size={20} color="#fff" style={styles.buttonIcon} />
                <Text style={[styles.buttonText, { color: '#fff' }]}>View All Users</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={20} color="#e74c3c" style={styles.buttonIcon} />
                <Text style={[styles.buttonText, { color: '#e74c3c' }]}>Logout</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 5,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerStar: {
    marginLeft: 8,
  },
  content: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40, 
  },
  premiumCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  premiumCardActive: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  premiumCardInactive: {
    backgroundColor: '#53a20e',
  },
  premiumCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  premiumTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  premiumTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  premiumTitleActive: {
    color: '#333',
  },
  premiumSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  premiumSubtitleActive: {
    color: '#666',
  },
  premiumBalance: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
  premiumBalanceActive: {
    color: '#999',
  },
  premiumButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  premiumButtonManage: {
    backgroundColor: 'rgba(83, 162, 14, 0.1)',
    borderWidth: 1,
    borderColor: '#53a20e',
  },
  premiumButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  premiumButtonTextManage: {
    color: '#53a20e',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  premiumBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FFD700',
    padding: 6,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
  },
  infoContainer: {
    marginTop: 20,
  },
  infoItem: {
    marginBottom: 20,
  },
  infoLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#666',
  },
  infoValueSmall: {
    fontSize: 14,
    color: '#666',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  premiumStatus: {
    color: '#53a20e',
    fontWeight: '600',
  },
  editInputContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingVertical: 8,
  },
  editInput: {
    fontSize: 16,
    color: '#333',
  },
  phoneHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  buttonContainer: {
    marginTop: 30,
    marginBottom: 40, 
    width: '100%',
  },
  editProfileButton: {
    backgroundColor: '#6c5ce7',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: '#27ae60',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  cancelButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  logoutButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e74c3c',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  dataButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#6c5ce7',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
  },
  buttonDisabled: {
    backgroundColor: '#a29bfe',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 8,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    marginTop: 15,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#6c5ce7',
    padding: 12,
    borderRadius: 8,
    paddingHorizontal: 20,
  },
});