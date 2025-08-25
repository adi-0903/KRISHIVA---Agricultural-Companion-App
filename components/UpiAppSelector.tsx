// components/UpiAppSelector.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView } from 'react-native';

interface UpiApp {
  name: string;
  packageName: string;
  intent: string;
  icon?: string;
}

interface UpiAppSelectorProps {
  onAppSelect: (appKey: string) => void;
  selectedApp?: string;
}

const UPI_APPS: Record<string, UpiApp & { icon: string }> = {
  phonepe: {
    name: 'PhonePe',
    packageName: 'com.phonepe.app',
    intent: 'phonepe',
    icon: '📱' // You can replace with actual image URLs
  },
  googlepay: {
    name: 'Google Pay',
    packageName: 'com.google.android.apps.nbu.paisa.user',
    intent: 'tez',
    icon: '💳'
  },
  paytm: {
    name: 'Paytm',
    packageName: 'net.one97.paytm',
    intent: 'paytm',
    icon: '💙'
  },
  amazonpay: {
    name: 'Amazon Pay',
    packageName: 'in.amazon.mShop.android.shopping',
    intent: 'amazonpay',
    icon: '🛒'
  },
  bhim: {
    name: 'BHIM UPI',
    packageName: 'in.org.npci.upiapp',
    intent: 'bhim',
    icon: '🏛️'
  },
  cred: {
    name: 'CRED',
    packageName: 'com.dreamplug.androidapp',
    intent: 'cred',
    icon: '💎'
  }
};

const UpiAppSelector: React.FC<UpiAppSelectorProps> = ({ onAppSelect, selectedApp }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose your UPI App</Text>
      <ScrollView contentContainerStyle={styles.appsContainer}>
        {Object.entries(UPI_APPS).map(([key, app]) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.appButton,
              selectedApp === key && styles.selectedAppButton
            ]}
            onPress={() => onAppSelect(key)}
            activeOpacity={0.7}
          >
            <Text style={styles.appIcon}>{app.icon}</Text>
            <Text style={[
              styles.appName,
              selectedApp === key && styles.selectedAppName
            ]}>
              {app.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <Text style={styles.note}>
        💡 Selecting an app will directly open it for payment
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  appsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  appButton: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  selectedAppButton: {
    borderColor: '#53a20e',
    backgroundColor: '#f0f8e9',
  },
  appIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  appName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
  },
  selectedAppName: {
    color: '#53a20e',
    fontWeight: '600',
  },
  note: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 15,
  },
});

export default UpiAppSelector;