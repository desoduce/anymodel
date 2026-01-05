export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  provider?: string;
  model?: string;
  hasDocuments?: boolean;
  documentCount?: number;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentFile {
  id: string;
  name: string;
  uri: string;
  type: string;
  size: number;
  processed: boolean;
  content?: string;
  error?: string;
}

export interface ApiKeys {
  openai: string;
  anthropic: string;
  gemini: string;
  ollama_url: string;
  openrouter: string;
}

export interface AppSettings {
  defaultProvider: string;
  defaultModel: string;
  apiUrl: string;
  theme: 'light' | 'dark' | 'system';
  sendOnEnter: boolean;
  showProviderInResponse: boolean;
  chatStyle: 'classic' | 'modern' | 'gamified' | 'professional';
}

export type RootStackParamList = {
  Main: undefined;
  Settings: undefined;
  ProviderSelection: {
    onSelect: (provider: string, model?: string) => void;
  };
};

export type MainTabParamList = {
  Chat: undefined;
  Upload: undefined;
  History: undefined;
};
