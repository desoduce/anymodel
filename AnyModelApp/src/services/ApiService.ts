import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EncryptedStorage from './EncryptedStorage';
import LLMDirectService from './LLMDirectService';
import DocumentProcessor from './DocumentProcessor';

// Configure your backend URL here
// Note: This app works standalone without a backend server - it connects directly to LLM providers
// The backend is only needed if you want centralized document processing or PII filtering
const API_BASE_URL = __DEV__
  ? 'http://localhost:8000'
  : (process.env.EXPO_PUBLIC_API_URL || '');

export interface LLMProvider {
  name: string;
  models: string[];
  display_name: string;
}

export interface ChatRequest {
  prompt: string;
  llm_provider: string;
  model?: string;
  file_contents?: string[];
  api_keys?: {
    openai?: string;
    anthropic?: string;
    gemini?: string;
    ollama_url?: string;
    openrouter?: string;
  };
}

export interface ChatResponse {
  response: string;
  provider: string;
  model: string;
  cleaned_prompt: string;
  document_info?: {
    has_documents: boolean;
    document_count: number;
  };
}

export interface UploadResponse {
  success: boolean;
  results: {
    success: boolean;
    filtered_text?: string;
    error?: string;
    filename: string;
    metadata?: any;
    pii_detected?: boolean;
    filtering_stats?: any;
  }[];
  summary: {
    total_files: number;
    successful: number;
    failed: number;
  };
}

class ApiService {
  private axiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async getProviders(): Promise<LLMProvider[]> {
    // Return built-in providers - no server connection needed
    return [
      {
        name: 'openai',
        display_name: 'OpenAI',
        models: ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo']
      },
      {
        name: 'anthropic',
        display_name: 'Anthropic Claude',
        models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307']
      },
      {
        name: 'gemini',
        display_name: 'Google Gemini',
        models: ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash']
      },
      {
        name: 'ollama',
        display_name: 'Ollama (Local)',
        models: ['llama2', 'codellama', 'mistral', 'neural-chat']
      },
      {
        name: 'openrouter',
        display_name: 'OpenRouter',
        models: ['minimax/minimax-01', 'anthropic/claude-3.5-sonnet', 'meta-llama/llama-3.1-405b-instruct', 'google/gemini-pro-1.5']
      }
    ];
  }

  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    try {
      // Send directly to LLM providers instead of backend
      return await LLMDirectService.sendMessageDirect(request);
    } catch (error) {
      if (__DEV__) console.error('Error sending message:', error);
      // Pass through the original error message instead of replacing it
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  async uploadFiles(files: { uri: string; name: string; type: string }[]): Promise<UploadResponse> {
    try {
      // Process files locally instead of uploading to backend
      return await DocumentProcessor.processFiles(files);
    } catch (error) {
      if (__DEV__) console.error('Error processing files:', error);
      throw new Error('Failed to process files');
    }
  }

  // Settings management
  async saveSettings(settings: any): Promise<void> {
    try {
      await AsyncStorage.setItem('app_settings', JSON.stringify(settings));
    } catch (error) {
      if (__DEV__) console.error('Error saving settings:', error);
    }
  }

  async getSettings(): Promise<any> {
    try {
      const settings = await AsyncStorage.getItem('app_settings');
      return settings ? JSON.parse(settings) : {};
    } catch (error) {
      if (__DEV__) console.error('Error loading settings:', error);
      return {};
    }
  }

  async saveApiUrl(url: string): Promise<void> {
    try {
      await AsyncStorage.setItem('api_url', url);
      // Update axios base URL
      this.axiosInstance.defaults.baseURL = url;
    } catch (error) {
      if (__DEV__) console.error('Error saving API URL:', error);
    }
  }

  async getApiUrl(): Promise<string> {
    try {
      const url = await AsyncStorage.getItem('api_url');
      return url || API_BASE_URL;
    } catch (error) {
      if (__DEV__) console.error('Error loading API URL:', error);
      return API_BASE_URL;
    }
  }

  async initializeApiUrl(): Promise<void> {
    const savedUrl = await this.getApiUrl();
    this.axiosInstance.defaults.baseURL = savedUrl;
  }

  // API Keys management with encryption
  async saveApiKeys(apiKeys: any): Promise<void> {
    try {
      await EncryptedStorage.saveApiKeys(apiKeys);
    } catch (error) {
      if (__DEV__) console.error('Error saving API keys:', error);
      throw error;
    }
  }

  async getApiKeys(): Promise<any> {
    try {
      return await EncryptedStorage.getApiKeys();
    } catch (error) {
      if (__DEV__) console.error('Error loading API keys:', error);
      return null;
    }
  }

  async clearApiKeys(): Promise<void> {
    try {
      await EncryptedStorage.clearApiKeys();
    } catch (error) {
      if (__DEV__) console.error('Error clearing API keys:', error);
      throw error;
    }
  }

  async hasApiKeys(): Promise<boolean> {
    try {
      return await EncryptedStorage.hasApiKeys();
    } catch (error) {
      if (__DEV__) console.error('Error checking API keys:', error);
      return false;
    }
  }

  async getMaskedApiKeys(): Promise<any> {
    try {
      return await EncryptedStorage.getMaskedApiKeys();
    } catch (error) {
      if (__DEV__) console.error('Error getting masked API keys:', error);
      return null;
    }
  }
}

export default new ApiService();
