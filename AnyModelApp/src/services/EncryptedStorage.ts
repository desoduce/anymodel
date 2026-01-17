import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ApiKeys {
  openai: string;
  anthropic: string;
  gemini: string;
  ollama_url: string;
  openrouter: string;
}

class EncryptedStorage {
  private static readonly API_KEYS_STORAGE_KEY = 'api_keys';
  private static readonly FILTER_PATTERNS_STORAGE_KEY = 'filter_patterns';
  private static readonly FILTER_KEYWORDS_STORAGE_KEY = 'filter_keywords';

  // Base64 encode data
  private encodeData(data: string): string {
    try {
      return btoa(data);
    } catch (error) {
      if (__DEV__) console.error('Failed to encode data:', error);
      throw new Error('Failed to encode data');
    }
  }

  // Base64 decode data
  private decodeData(encodedData: string): string {
    try {
      return atob(encodedData);
    } catch (error) {
      if (__DEV__) console.error('Failed to decode data:', error);
      throw new Error('Failed to decode stored data');
    }
  }

  async saveApiKeys(apiKeys: ApiKeys): Promise<void> {
    try {
      const jsonData = JSON.stringify(apiKeys);
      const encodedData = this.encodeData(jsonData);
      await AsyncStorage.setItem(EncryptedStorage.API_KEYS_STORAGE_KEY, encodedData);
    } catch (error) {
      if (__DEV__) console.error('Failed to save API keys:', error);
      throw new Error('Failed to save API keys');
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

      const encodedData = await AsyncStorage.getItem(EncryptedStorage.API_KEYS_STORAGE_KEY);
      if (!encodedData) {
        // Return empty defaults - users must provide their own API keys
        return defaults;
      }

      const jsonData = this.decodeData(encodedData);
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
      // Clear all stored data
      await this.clearApiKeys();
      await this.clearFilterPatterns();
      await this.clearFilterKeywords();
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
      const encodedData = this.encodeData(jsonData);
      await AsyncStorage.setItem(EncryptedStorage.FILTER_PATTERNS_STORAGE_KEY, encodedData);
    } catch (error) {
      if (__DEV__) console.error('Failed to save filter patterns:', error);
      throw new Error('Failed to save filter patterns');
    }
  }

  async getFilterPatterns(): Promise<string[]> {
    try {
      const encodedData = await AsyncStorage.getItem(EncryptedStorage.FILTER_PATTERNS_STORAGE_KEY);
      if (!encodedData) {
        return [];
      }

      const jsonData = this.decodeData(encodedData);
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
      const encodedData = this.encodeData(jsonData);
      await AsyncStorage.setItem(EncryptedStorage.FILTER_KEYWORDS_STORAGE_KEY, encodedData);
    } catch (error) {
      if (__DEV__) console.error('Failed to save filter keywords:', error);
      throw new Error('Failed to save filter keywords');
    }
  }

  async getFilterKeywords(): Promise<string[]> {
    try {
      const encodedData = await AsyncStorage.getItem(EncryptedStorage.FILTER_KEYWORDS_STORAGE_KEY);
      if (!encodedData) {
        return [];
      }

      const jsonData = this.decodeData(encodedData);
      const keywords = JSON.parse(jsonData);
      return keywords;
    } catch (error) {
      if (__DEV__) console.error('Failed to retrieve filter keywords:', error);
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
