import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { setupSyncListener, triggerManualSync } from '../database/database';

// Export the hook
export const useSyncManager = () => {
  useEffect(() => {
    // Set up the network listener
    const cleanupNetworkListener = setupSyncListener();
    
    // Set up app state change listener
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        console.log('🔄 App came to foreground, checking for sync...');
        triggerManualSync();
      }
    });

    // Initial sync check
    const initialSync = setTimeout(() => {
      console.log('🚀 Performing initial sync check...');
      triggerManualSync();
    }, 2000); // Small delay to let other app initialization complete

    return () => {
      // Clean up listeners
      cleanupNetworkListener();
      subscription.remove();
      clearTimeout(initialSync);
    };
  }, []);
};

// Default export component that uses the hook
const SyncManager = () => {
  useSyncManager();
  return null; // This component doesn't render anything
};

export default SyncManager;
