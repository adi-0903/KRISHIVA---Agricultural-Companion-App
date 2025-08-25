//database.ts
import * as SQLite from 'expo-sqlite';
  import NetInfo from '@react-native-community/netinfo';
  import { Platform } from 'react-native';

  // API endpoint configuration
  const API_CONFIG = {
    ENABLED: true, // ✅ Enable backend sync
    ENDPOINT: 'http://x8kck8g4k0k80gs4ww0gcco4.106.51.142.222.sslip.io/upload_market_prices',
    MAX_RETRIES: 3,
    RETRY_DELAY: 5000 // 5 seconds
  };

  interface User {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    password: string;
    created_at: string;
  }

  const DATABASE_NAME = 'authapp.db';

  // Open database - use async version for better compatibility
  const db = SQLite.openDatabaseAsync(DATABASE_NAME, {
    useNewConnection: true
  });

  // Create table
  export const initDatabase = async (): Promise<boolean> => {
    try {
      const database = await db;

      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

          // Add phone column if it doesn't exist
      const tableInfo = await database.getAllAsync("PRAGMA table_info(users)");
      const hasPhoneColumn = tableInfo.some((col: any) => col.name === 'phone');
      if (!hasPhoneColumn) {
        await database.execAsync('ALTER TABLE users ADD COLUMN phone TEXT');
      }

      // Check if the old crop_market_data table exists with string ID
      const oldTableInfo = await database.getAllAsync<{name: string}>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='crop_market_data'"
      );
      
      if (oldTableInfo.length > 0) {
        // Check if we need to migrate from old schema
        const columns = await database.getAllAsync<{name: string, type: string, cid: number, notnull: number, dflt_value: any, pk: number}>(
          "PRAGMA table_info(crop_market_data)"
        );
        const idColumn = columns.find(col => col.name === 'id');
        
        if (idColumn && idColumn.type === 'TEXT') {
          console.log('🔄 Migrating crop_market_data table to new schema...');
          
          // Create a backup table
          await database.execAsync(`
            CREATE TABLE IF NOT EXISTS crop_market_data_backup (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              crop_name TEXT NOT NULL,
              district_name TEXT NOT NULL,
              market_selling_price REAL NOT NULL,
              is_synced BOOLEAN DEFAULT 0,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
          `);
          
          // Copy data to backup table with new IDs
          await database.execAsync(`
            INSERT INTO crop_market_data_backup (crop_name, district_name, market_selling_price, is_synced, created_at)
            SELECT crop_name, district_name, market_selling_price, is_synced, created_at
            FROM crop_market_data;
          `);
          
          // Drop old table
          await database.execAsync('DROP TABLE IF EXISTS crop_market_data');
          
          console.log('✅ Migration completed: Created backup and dropped old table');
        }
      }
      
      // Create new table with correct schema
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS crop_market_data (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          crop_name TEXT NOT NULL,
          district_name TEXT NOT NULL,
          market_selling_price REAL NOT NULL,
          is_synced BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(crop_name, district_name, market_selling_price)
        );
      `);
      
      // If we have a backup, copy data back and drop the backup
      const backupExists = await database.getAllAsync(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='crop_market_data_backup'"
      );
      
      if (backupExists.length > 0) {
        console.log('🔄 Restoring data from backup...');
        await database.execAsync(`
          INSERT INTO crop_market_data (crop_name, district_name, market_selling_price, is_synced, created_at)
          SELECT crop_name, district_name, market_selling_price, is_synced, created_at
          FROM crop_market_data_backup;
        `);
        
        await database.execAsync('DROP TABLE IF EXISTS crop_market_data_backup');
        console.log('✅ Data restoration completed');
      }

      console.log('✅ Database and tables initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Error creating table', error);
      throw error;
    }
  };

  // Create user
  export const createUser = async (
    name: string,
    email: string,
    password: string,
    phone?: string
  ): Promise<{ insertId?: number }> => {
    try {
      const database = await db;
      
      // Check if user with this email already exists
      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        throw new Error('An account with this email already exists. Please use a different email or log in.');
      }
      
      const result = await database.runAsync(
        'INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)',
        [name, email, password, phone || null]
      );
      
      if (!result.lastInsertRowId) {
        throw new Error('Failed to create user. Please try again.');
      }
      
      console.log('✅ User created successfully');
      return { insertId: result.lastInsertRowId };
    } catch (error: any) {
      console.error('❌ Error creating user:', error);
      // Re-throw with a more user-friendly message if it's a unique constraint error
      if (error.message.includes('UNIQUE constraint failed')) {
        throw new Error('An account with this email already exists. Please use a different email or log in.');
      }
      throw new Error(error.message || 'Failed to create account. Please try again.');
    }
  };

  // Get user by email
  export const getUserByEmail = async (email: string): Promise<User | undefined> => {
    try {
      const database = await db;
      const result = await database.getFirstAsync<{
        id: number;
        name: string;
        email: string;
        password: string;
        phone?: string;
        created_at: string;
      }>(
        'SELECT id, name, email, password, phone, created_at FROM users WHERE email = ?',
        [email]
      );
      
      if (!result) return undefined;
      
      return {
        id: result.id,
        name: result.name,
        email: result.email,
        password: result.password,
        phone: result.phone || null,
        created_at: result.created_at
      };
    } catch (error) {
      console.error('❌ Error fetching user', error);
      throw error;
    }
  };

  interface ValidationResult {
    success: boolean;
    user?: User;
    message?: string;
  }

  // Update user profile
  export const updateUserProfile = async (
    userId: number,
    updates: { name?: string; email?: string; phone?: string }
  ): Promise<boolean> => {
    try {
      const database = await db;
      const updateFields = [];
      const params = [];
      
      if (updates.name) {
        updateFields.push('name = ?');
        params.push(updates.name);
      }
      if (updates.email) {
        updateFields.push('email = ?');
        params.push(updates.email);
      }
      if (updates.phone !== undefined) {
        updateFields.push('phone = ?');
        params.push(updates.phone);
      }
      
      if (updateFields.length === 0) return false;
      
      params.push(userId);
      
      await database.runAsync(
        `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
        params
      );
      
      return true;
    } catch (error) {
      console.error('Error updating user profile:', error);
      return false;
    }
  };

  // Get user by ID
  export const getUserById = async (id: number): Promise<User | undefined> => {
    try {
      const database = await db;
      const result = await database.getFirstAsync<{
        id: number;
        name: string;
        email: string;
        password: string;
        phone?: string;
        created_at: string;
      }>(
        'SELECT id, name, email, password, phone, created_at FROM users WHERE id = ?',
        [id]
      );
      
      if (!result) return undefined;
      
      return {
        id: result.id,
        name: result.name,
        email: result.email,
        password: result.password,
        phone: result.phone || null,
        created_at: result.created_at
      };
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      return undefined;
    }
  };

  // Validate user login
  export const validateUser = async (
    email: string,
    password: string
  ): Promise<ValidationResult> => {
    try {
      const user = await getUserByEmail(email);
      if (user && user.password === password) {
        // Ensure we return the complete user object with phone number
        return { 
          success: true, 
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone || null,
            password: user.password,
            created_at: user.created_at
          } 
        };
      }
      return { success: false, message: 'Invalid email or password' };
    } catch (error) {
      console.error('❌ Validation error', error);
      return { success: false, message: 'An error occurred during login' };
    }
  };

  // Get all users with their registration date
  export const getAllUsers = async (): Promise<Array<{
    id: number;
    name: string;
    email: string;
    phone?: string;
    created_at: string;
  }>> => {
    try {
      const database = await db;
      // Only select necessary fields, exclude password for security
      return await database.getAllAsync(
        'SELECT id, name, email, phone, created_at FROM users ORDER BY created_at DESC'
      );
    } catch (error) {
      console.error('Error getting users:', error);
      throw new Error('Failed to fetch users. Please try again later.');
    }
  };

  // Interface for crop market data
  export interface CropMarketData {
    id: number;
    crop_name: string;
    district_name: string;
    market_selling_price: number;
    is_synced: boolean;
    created_at: string;
  }

  // Save crop market data locally with duplicate prevention
  export const saveCropMarketData = async (data: Omit<CropMarketData, 'id' | 'is_synced' | 'created_at'>): Promise<{id: number, success: boolean}> => {
    const database = await db;
    
    // Trim and normalize input data
    const normalizedData = {
      crop_name: data.crop_name.trim(),
      district_name: data.district_name.trim(),
      market_selling_price: data.market_selling_price
    };

    // Start a transaction for atomic operations
    await database.execAsync('BEGIN TRANSACTION');
    
    try {
      // Check for duplicates using case-insensitive comparison and trimmed values including price
      const existing = await database.getFirstAsync<{id: number, crop_name: string, district_name: string, market_selling_price: number}>(
        `SELECT id, crop_name, district_name, market_selling_price 
         FROM crop_market_data 
         WHERE LOWER(TRIM(crop_name)) = LOWER(TRIM(?)) 
         AND LOWER(TRIM(district_name)) = LOWER(TRIM(?))
         AND market_selling_price = ?`,
        [normalizedData.crop_name, normalizedData.district_name, normalizedData.market_selling_price]
      );

      if (existing) {
        throw new Error(
          `A crop with the name "${existing.crop_name}" in "${existing.district_name}" ` +
          `with price ₹${existing.market_selling_price} already exists. ` +
          'Please update the existing entry or use a different crop/district/price combination.'
        );
      }

      const networkState = await NetInfo.fetch();
      let isSynced = false;

      if (networkState.isConnected && networkState.isInternetReachable) {
        try {
          isSynced = await syncWithBackend([data]);
        } catch (syncError) {
          console.warn('⚠️ Sync with backend failed, saving locally only');
          // Continue with local save even if sync fails
        }
      }

      // Insert into local database using normalized data
      const result = await database.runAsync(
        `INSERT INTO crop_market_data 
        (crop_name, district_name, market_selling_price, is_synced)
        VALUES (?, ?, ?, ?)`,
        [
          normalizedData.crop_name, 
          normalizedData.district_name, 
          normalizedData.market_selling_price, 
          isSynced ? 1 : 0
        ]
      );
      
      if (!result.lastInsertRowId) {
        throw new Error('Failed to save crop data. Please try again.');
      }

      await database.execAsync('COMMIT');
      
      return {
        id: result.lastInsertRowId as number,
        success: true
      };
    } catch (error: any) {
      await database.execAsync('ROLLBACK');
      
      if (error.message.includes('UNIQUE constraint failed') || 
          error.message.includes('SQLITE_CONSTRAINT_UNIQUE')) {
        throw new Error('Crop already exists. Please check the details or update the new entry.');
      }
      
      console.error('❌ Error saving crop market data:', error);
      throw error;
    }
  };

  // Get all crop data (both synced and unsynced)
  export const getAllCropData = async (): Promise<CropMarketData[]> => {
    try {
      const database = await db;
      const result = await database.getAllAsync(
        'SELECT * FROM crop_market_data ORDER BY created_at DESC'
      );
      return result as CropMarketData[];
    } catch (error) {
      console.error('❌ Error fetching crop data', error);
      throw error;
    }
  };

  // Get only unsynced data (kept for backward compatibility)
  export const getUnsyncedData = async (): Promise<CropMarketData[]> => {
    try {
      const database = await db;
      const result = await database.getAllAsync(
        'SELECT * FROM crop_market_data WHERE is_synced = 0'
      );
      return result as CropMarketData[];
    } catch (error) {
      console.error('❌ Error fetching unsynced data', error);
      throw error;
    }
  };

  // Mark data as synced
  export const markAsSynced = async (ids: number[]): Promise<void> => {
    try {
      if (ids.length === 0) return;

      const database = await db;
      const placeholders = ids.map(() => '?').join(',');
      await database.runAsync(
        `UPDATE crop_market_data SET is_synced = 1 WHERE id IN (${placeholders})`,
        ids
      );
      console.log(`✅ Marked ${ids.length} items as synced`);
    } catch (error) {
      console.error('❌ Error marking data as synced', error);
      throw error;
    }
  };

  // Sync data with backend
  const syncWithBackend = async (data: any[]): Promise<boolean> => {
    if (!API_CONFIG.ENABLED) {
      console.log('🔌 Backend sync is disabled. Enable it in database.ts');
      return true;
    }

    try {
      console.log(`🔄 Attempting to sync ${data.length} items`);

      // Format data for API, including the ID for reference
      const formattedData = data.map(item => ({
        id: item.id, // Include the ID for reference
        crop_name: item.crop_name,
        market_selling_price: item.market_selling_price,
        district_name: item.district_name,
        created_at: item.created_at || new Date().toISOString()
      }));

      // ✅ Proper timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout

      const response = await fetch(API_CONFIG.ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(formattedData),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(`❌ Backend returned status: ${response.status}`, await response.text());
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Extract IDs of successfully synced items
      const syncedIds = data.map(item => item.id).filter(Boolean);
      if (syncedIds.length > 0) {
        await markAsSynced(syncedIds);
      }

      console.log(`✅ Successfully synced ${data.length} items with backend`);
      return true;
    } catch (error) {
      console.error('❌ Sync failed with error:', error);
      return false;
    }
  };

  // Check network status and sync if online
  export const checkAndSyncData = async (): Promise<{ success: boolean; syncedCount?: number }> => {
    try {
      console.log('🔍 Checking network status...');
      const networkState = await NetInfo.fetch();

      if (!networkState.isConnected || !networkState.isInternetReachable) {
        console.log('🌐 No network connection available');
        return { success: false };
      }

      console.log('📡 Network is available, checking for unsynced data...');
      const unsyncedData = await getUnsyncedData();

      if (unsyncedData.length === 0) {
        console.log('✅ No unsynced data found');
        return { success: true, syncedCount: 0 };
      }

      console.log(`🔄 Found ${unsyncedData.length} unsynced items`);
      const success = await syncWithBackend(unsyncedData);

      if (success) {
        console.log(`✅ Successfully processed ${unsyncedData.length} items`);
        await markAsSynced(unsyncedData.map(item => item.id));
        return { success: true, syncedCount: unsyncedData.length };
      }

      return { success: false };

    } catch (error) {
      console.error('❌ Error in checkAndSyncData:', error);
      return { success: false };
    }
  };

  // Get the next available ID for crop market data
  export const getNextCropId = async (): Promise<number> => {
    try {
      const database = await db;
      
      // First, check if the table exists
      const tableExists = await database.getFirstAsync<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='crop_market_data'"
      );
      
      if (!tableExists) {
        // Table doesn't exist yet, initialize the database
        await initDatabase();
        return 1;
      }
      
      // Get the maximum ID from the table
      const result = await database.getFirstAsync<{ maxId: number | null }>(
        'SELECT MAX(id) as maxId FROM crop_market_data'
      );
      
      // If no records exist or maxId is null, start from 1, otherwise increment the max ID
      return (result?.maxId || 0) + 1;
    } catch (error) {
      console.error('❌ Error getting next crop ID:', error);
      // Fallback to 1 if there's an error
      return 1;
    }
  };

  // Get crop data by ID
  export const getCropDataById = async (id: number): Promise<CropMarketData | null> => {
    const database = await db;
    
    try {
      const result = await database.getFirstAsync<CropMarketData>(
        'SELECT * FROM crop_market_data WHERE id = ?',
        [id]
      );
      
      return result || null;
    } catch (error) {
      console.error('❌ Error fetching crop data:', error);
      throw error;
    }
  };

  // Set up network status listener
  let unsubscribeNetInfo: (() => void) | null = null;
  let isSyncing = false;
  const SYNC_RETRY_DELAY = 5000; // 5 seconds

  const syncWithRetry = async (retryCount = 0, maxRetries = 3) => {
    if (isSyncing) return;
    
    try {
      isSyncing = true;
      const { success } = await checkAndSyncData();
      if (!success && retryCount < maxRetries) {
        console.log(`⏳ Sync failed, retrying in ${SYNC_RETRY_DELAY/1000} seconds... (${retryCount + 1}/${maxRetries})`);
        setTimeout(() => syncWithRetry(retryCount + 1, maxRetries), SYNC_RETRY_DELAY);
      }
    } catch (error) {
      console.error('❌ Error in syncWithRetry:', error);
      if (retryCount < maxRetries) {
        setTimeout(() => syncWithRetry(retryCount + 1, maxRetries), SYNC_RETRY_DELAY);
      }
    } finally {
      isSyncing = false;
    }
  };

  export const setupSyncListener = (): (() => void) => {
    // Clean up any existing listeners
    if (unsubscribeNetInfo) {
      unsubscribeNetInfo();
    }

    // Set up new listener
    unsubscribeNetInfo = NetInfo.addEventListener(state => {
      console.log('🌐 Network state changed:', state.isConnected, state.isInternetReachable);
      if (state.isConnected && state.isInternetReachable) {
        console.log('🔄 Network available, triggering sync...');
        syncWithRetry();
      }
    });

    // Return cleanup function
    return () => {
      if (unsubscribeNetInfo) {
        unsubscribeNetInfo();
        unsubscribeNetInfo = null;
      }
    };
  };

  // Export a manual sync function that can be called from components
  export const triggerManualSync = () => {
    console.log('🔄 Manual sync triggered');
    return syncWithRetry();
  };