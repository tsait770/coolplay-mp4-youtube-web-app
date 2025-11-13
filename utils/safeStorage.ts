import AsyncStorage from '@react-native-async-storage/async-storage';

export async function safeGetItem<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const item = await AsyncStorage.getItem(key);
    
    if (!item || item === 'undefined' || item === 'null') {
      return defaultValue;
    }

    const cleaned = item.trim();
    
    if (!cleaned || cleaned.length === 0) {
      return defaultValue;
    }

    if (!cleaned.startsWith('{') && !cleaned.startsWith('[') && !cleaned.startsWith('"')) {
      console.warn(`Invalid JSON format for key ${key}, resetting to default`);
      await AsyncStorage.removeItem(key);
      return defaultValue;
    }

    try {
      return JSON.parse(cleaned) as T;
    } catch (parseError) {
      console.error(`JSON parse error for key ${key}:`, parseError);
      await AsyncStorage.removeItem(key);
      return defaultValue;
    }
  } catch (error) {
    console.error(`Error reading from AsyncStorage key ${key}:`, error);
    return defaultValue;
  }
}

export async function safeSetItem<T>(key: string, value: T): Promise<boolean> {
  try {
    const jsonString = JSON.stringify(value);
    
    try {
      JSON.parse(jsonString);
    } catch (validateError) {
      console.error(`Invalid JSON before saving to ${key}:`, validateError);
      return false;
    }

    await AsyncStorage.setItem(key, jsonString);
    return true;
  } catch (error) {
    console.error(`Error writing to AsyncStorage key ${key}:`, error);
    return false;
  }
}

export async function safeRemoveItem(key: string): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing from AsyncStorage key ${key}:`, error);
    return false;
  }
}

export async function safeClear(): Promise<boolean> {
  try {
    await AsyncStorage.clear();
    return true;
  } catch (error) {
    console.error('Error clearing AsyncStorage:', error);
    return false;
  }
}

export async function getAllKeys(): Promise<readonly string[]> {
  try {
    return await AsyncStorage.getAllKeys();
  } catch (error) {
    console.error('Error getting all keys from AsyncStorage:', error);
    return [];
  }
}

export async function repairCorruptedData(): Promise<void> {
  try {
    const keys = await getAllKeys();
    
    for (const key of keys) {
      try {
        const item = await AsyncStorage.getItem(key);
        
        if (!item || item === 'undefined' || item === 'null') {
          console.log(`Removing invalid data for key: ${key}`);
          await AsyncStorage.removeItem(key);
          continue;
        }

        const cleaned = item.trim();
        
        if (!cleaned || cleaned.length === 0) {
          console.log(`Removing empty data for key: ${key}`);
          await AsyncStorage.removeItem(key);
          continue;
        }

        if (!cleaned.startsWith('{') && !cleaned.startsWith('[') && !cleaned.startsWith('"')) {
          console.log(`Removing non-JSON data for key: ${key}`);
          await AsyncStorage.removeItem(key);
          continue;
        }

        try {
          JSON.parse(cleaned);
        } catch {
          console.log(`Removing corrupted JSON for key: ${key}`);
          await AsyncStorage.removeItem(key);
        }
      } catch (error) {
        console.error(`Error checking key ${key}:`, error);
      }
    }
    
    console.log('AsyncStorage repair completed');
  } catch (error) {
    console.error('Error repairing AsyncStorage:', error);
  }
}
