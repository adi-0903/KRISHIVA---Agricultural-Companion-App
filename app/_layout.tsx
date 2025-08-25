import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { RootStackParamList } from './types';
import SyncManager from './SyncManager';

type ScreenName = keyof RootStackParamList;

type PaymentScreenParams = {
  email?: string;
  contact?: string;
  name?: string;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {
      'payment-screen': PaymentScreenParams;
    }
  }
}

const RootLayout = () => {
  return (
    <>
      <SyncManager />
      <StatusBar style="dark" />
      <Stack>
        <Stack.Screen
          name="index"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="login"
          options={{ title: 'Login', headerShown: true }}
        />
        <Stack.Screen
          name="signup"
          options={{ title: 'Sign Up', headerShown: true }}
        />
        <Stack.Screen
          name="crop-details"
          options={{ title: 'Add Crop Details', headerShown: true }}
        />
        <Stack.Screen
          name="profile"
          options={{ title: 'My Profile', headerShown: true }}
        />
        <Stack.Screen
          name="data-view"
          options={{ title: 'Market Data', headerShown: true }}
        />
        <Stack.Screen
          name="users"
          options={{ title: 'Registered Users', headerShown: true }}
        />
        <Stack.Screen
          name="payment-screen"
          options={{ title: 'Upgrade to Premium', headerShown: true }}
        />
      </Stack>
    </>
  );
};

export default RootLayout;