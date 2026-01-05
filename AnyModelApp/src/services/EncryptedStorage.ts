import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

export interface ApiKeys {
  openai: string;
  anthropic: string;
  gemini: string;
  ollama_url: string;
  openrouter: string;
}

class EncryptedStorage {
  private static readonly ENCRYPTION_KEY = 'anymodel_encryption_key';
  private static readonly API_KEYS_STORAGE_KEY = 'encrypted_api_keys';
  private static readonly FILTER_PATTERNS_STORAGE_KEY = 'encrypted_filter_patterns';
  private static readonly FILTER_KEYWORDS_STORAGE_KEY = 'encrypted_filter_keywords';

  // Generate or retrieve encryption key from keychain
  private async getEncryptionKey(): Promise<string> {
    // First check if keychain is available
    if (!this.isKeychainAvailable()) {
      if (__DEV__) console.log('Keychain not available, using fallback encryption method');
      return this.getFallbackEncryptionKey();
    }

    try {
      // Try to get existing key from keychain
      const credentials = await Keychain.getInternetCredentials(EncryptedStorage.ENCRYPTION_KEY);
      if (credentials && credentials.password) {
        return credentials.password;
      }
    } catch (error) {
      if (__DEV__) console.log('No existing encryption key found, generating new one');
    }

    // Generate new encryption key
    const newKey = await Crypto.randomUUID();
    
    try {
      // Store in keychain for future use
      await Keychain.setInternetCredentials(
        EncryptedStorage.ENCRYPTION_KEY,
        'anymodel_user',
        newKey
      );
      if (__DEV__) console.log('✅ Encryption key stored successfully in keychain');
    } catch (error) {
      // Only show warning if not in development/simulator where keychain may not be available
      if (__DEV__) {
        console.log('ℹ️  Keychain not available in development - using fallback storage');
      } else {
        if (__DEV__) console.warn('Failed to store encryption key in keychain:', error);
      }
      // Continue with the key even if keychain storage fails
      // This allows the app to function in development/simulator environments
    }

    return newKey;
  }

  // Check if keychain service is available
  private isKeychainAvailable(): boolean {
    try {
      return Keychain && typeof Keychain.setInternetCredentials === 'function';
    } catch (error) {
      return false;
    }
  }

  // Fallback encryption key for when keychain is not available
  private async getFallbackEncryptionKey(): Promise<string> {
    const fallbackKey = 'fallback_encryption_key_' + await Crypto.randomUUID();
    
    // Store in AsyncStorage as fallback (less secure but functional)
    try {
      const existingKey = await AsyncStorage.getItem('fallback_encryption_key');
      if (existingKey) {
        return existingKey;
      }
      
      await AsyncStorage.setItem('fallback_encryption_key', fallbackKey);
      return fallbackKey;
    } catch (error) {
      if (__DEV__) console.warn('Fallback key storage failed, using session-only key');
      return fallbackKey;
    }
  }

  // Simple encryption using base64 and key mixing (for demo purposes)
  // In production, use proper encryption libraries like crypto-js
  private async encryptData(data: string): Promise<string> {
    const key = await this.getEncryptionKey();
    const combined = key + data + key.split('').reverse().join('');
    return btoa(combined);
  }

  private async decryptData(encryptedData: string): Promise<string> {
    try {
      const key = await this.getEncryptionKey();
      const combined = atob(encryptedData);
      const reversedKey = key.split('').reverse().join('');
      
      // Extract original data by removing keys from start and end
      const startIndex = key.length;
      const endIndex = combined.length - reversedKey.length;
      return combined.substring(startIndex, endIndex);
    } catch (error) {
      if (__DEV__) console.error('Failed to decrypt data:', error);
      throw new Error('Failed to decrypt stored data');
    }
  }

  async saveApiKeys(apiKeys: ApiKeys): Promise<void> {
    try {
      const jsonData = JSON.stringify(apiKeys);
      const encryptedData = await this.encryptData(jsonData);
      await AsyncStorage.setItem(EncryptedStorage.API_KEYS_STORAGE_KEY, encryptedData);
    } catch (error) {
      if (__DEV__) console.error('Failed to save API keys:', error);
      throw new Error('Failed to save API keys securely');
    }
  }

  async getApiKeys(): Promise<ApiKeys | null> {
    try {
      const defaults: ApiKeys = {
        openai: '',
        anthropic: '',
        gemini: '',
        ollama_url: 'http://localhost:11434',
        openrouter: ''
      };

      const encryptedData = await AsyncStorage.getItem(EncryptedStorage.API_KEYS_STORAGE_KEY);
      if (!encryptedData) {
        // Return empty defaults - users must provide their own API keys
        return defaults;
      }

      const jsonData = await this.decryptData(encryptedData);
      const savedKeys = JSON.parse(jsonData);

      // Merge saved keys with defaults to ensure all fields exist
      return {
        ...defaults,
        ...savedKeys
      };
    } catch (error) {
      if (__DEV__) console.error('Failed to retrieve API keys:', error);
      return null;
    }
  }

  async clearApiKeys(): Promise<void> {
    try {
      await AsyncStorage.removeItem(EncryptedStorage.API_KEYS_STORAGE_KEY);
    } catch (error) {
      if (__DEV__) console.error('Failed to clear API keys:', error);
      throw new Error('Failed to clear API keys');
    }
  }

  async clearAllSecureData(): Promise<void> {
    try {
      // Clear encrypted data
      await this.clearApiKeys();
      
      // Clear encryption key from keychain (if available)
      if (this.isKeychainAvailable()) {
        try {
          // @ts-ignore - keychain types issue
          await Keychain.resetInternetCredentials(EncryptedStorage.ENCRYPTION_KEY);
        } catch (error) {
          // Ignore if key doesn't exist
          if (__DEV__) console.log('No keychain entry to clear');
        }
      }
      
      // Clear fallback key from AsyncStorage
      try {
        await AsyncStorage.removeItem('fallback_encryption_key');
      } catch (error) {
        if (__DEV__) console.log('No fallback key to clear');
      }
    } catch (error) {
      if (__DEV__) console.error('Failed to clear secure data:', error);
      throw new Error('Failed to clear all secure data');
    }
  }

  // Utility method to check if API keys are configured
  async hasApiKeys(): Promise<boolean> {
    const keys = await this.getApiKeys();
    if (!keys) return false;
    
    return !!(keys.openai || keys.anthropic || keys.ollama_url);
  }

  // Utility method to get masked keys for display
  async getMaskedApiKeys(): Promise<Partial<ApiKeys> | null> {
    const keys = await this.getApiKeys();
    if (!keys) return null;

    return {
      openai: keys.openai ? this.maskKey(keys.openai) : '',
      anthropic: keys.anthropic ? this.maskKey(keys.anthropic) : '',
      gemini: keys.gemini ? this.maskKey(keys.gemini) : '',
      ollama_url: keys.ollama_url || '',
      openrouter: keys.openrouter ? this.maskKey(keys.openrouter) : '',
    };
  }

  private maskKey(key: string): string {
    if (key.length <= 8) return '••••••••';
    return key.substring(0, 4) + '••••••••' + key.substring(key.length - 4);
  }

  // Custom Filter Patterns Management
  async saveFilterPatterns(patterns: string[]): Promise<void> {
    try {
      const jsonData = JSON.stringify(patterns);
      const encryptedData = await this.encryptData(jsonData);
      await AsyncStorage.setItem(EncryptedStorage.FILTER_PATTERNS_STORAGE_KEY, encryptedData);
    } catch (error) {
      if (__DEV__) console.error('Failed to save filter patterns:', error);
      throw new Error('Failed to save filter patterns securely');
    }
  }

  async getFilterPatterns(): Promise<string[]> {
    try {
      const encryptedData = await AsyncStorage.getItem(EncryptedStorage.FILTER_PATTERNS_STORAGE_KEY);
      if (!encryptedData) {
        return [];
      }

      const jsonData = await this.decryptData(encryptedData);
      return JSON.parse(jsonData);
    } catch (error) {
      if (__DEV__) console.error('Failed to retrieve filter patterns:', error);
      return [];
    }
  }

  async clearFilterPatterns(): Promise<void> {
    try {
      await AsyncStorage.removeItem(EncryptedStorage.FILTER_PATTERNS_STORAGE_KEY);
    } catch (error) {
      if (__DEV__) console.error('Failed to clear filter patterns:', error);
      throw new Error('Failed to clear filter patterns');
    }
  }

  // Custom Filter Keywords Management
  async saveFilterKeywords(keywords: string[]): Promise<void> {
    try {
      const jsonData = JSON.stringify(keywords);
      const encryptedData = await this.encryptData(jsonData);
      await AsyncStorage.setItem(EncryptedStorage.FILTER_KEYWORDS_STORAGE_KEY, encryptedData);
    } catch (error) {
      if (__DEV__) console.error('❌ Failed to save filter keywords:', error);
      throw new Error('Failed to save filter keywords securely');
    }
  }

  async getFilterKeywords(): Promise<string[]> {
    try {
      const encryptedData = await AsyncStorage.getItem(EncryptedStorage.FILTER_KEYWORDS_STORAGE_KEY);
      if (!encryptedData) {
        return [];
      }

      const jsonData = await this.decryptData(encryptedData);
      const keywords = JSON.parse(jsonData);
      return keywords;
    } catch (error) {
      if (__DEV__) console.error('❌ Failed to retrieve filter keywords:', error);
      return [];
    }
  }

  async clearFilterKeywords(): Promise<void> {
    try {
      await AsyncStorage.removeItem(EncryptedStorage.FILTER_KEYWORDS_STORAGE_KEY);
    } catch (error) {
      if (__DEV__) console.error('❌ Failed to clear filter keywords:', error);
      throw new Error('Failed to clear filter keywords');
    }
  }
}

export default new EncryptedStorage();
