import React, { useState, useEffect, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '../../contexts/ThemeContext';
import ApiService, { LLMProvider } from '../../src/services/ApiService';
import DocumentStore from '../../src/services/DocumentStore';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  provider?: string;
  model?: string;
  hasDocuments?: boolean;
  documentCount?: number;
}

interface DocumentFile {
  id: string;
  name: string;
  uri: string;
  type: string;
  size: number;
  processed: boolean;
  content?: string;
  error?: string;
}

export default function ChatScreen() {
  const [messages, setMessages] = useState(() => [] as Message[]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState(() => [] as LLMProvider[]);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [hasProcessedDocs, setHasProcessedDocs] = useState(false);
  const [chatStyle, setChatStyle] = useState<'classic' | 'modern' | 'gamified' | 'professional'>('modern');
  const [attachedDocuments, setAttachedDocuments] = useState<DocumentFile[]>([]);
  const [processingDocs, setProcessingDocs] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Theme from context
  const { theme } = useTheme();

  useEffect(() => {
    loadProviders();
    ApiService.initializeApiUrl();
    checkProcessedDocuments();
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    try {
      const savedSettings = await ApiService.getSettings();
      
      if (savedSettings.defaultProvider) {
        setSelectedProvider(savedSettings.defaultProvider);
      }
      if (savedSettings.defaultModel) {
        setSelectedModel(savedSettings.defaultModel);
      }
      if (savedSettings.chatStyle) {
        setChatStyle(savedSettings.chatStyle);
      }
    } catch (error) {
      if (__DEV__) console.log('No saved settings found, using defaults');
    }
  };

  // Reload user settings when tab becomes focused (user navigates back from settings)
  useFocusEffect(
    React.useCallback(() => {
      loadUserSettings();
    }, [])
  );

  const checkProcessedDocuments = async () => {
    const hasDocsAvailable = await DocumentStore.hasProcessedDocuments();
    setHasProcessedDocs(hasDocsAvailable);
  };

  const clearDocuments = async () => {
    Alert.alert(
      'Clear Documents',
      'Remove all uploaded documents from memory?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await DocumentStore.clearProcessedDocuments();
            setHasProcessedDocs(false);
            setAttachedDocuments([]);
            Alert.alert('Success', 'All documents cleared');
          }
        }
      ]
    );
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'text/plain',
          'text/csv',
        ],
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets) {
        // File size limits (in bytes)
        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
        const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB total

        // Check individual file sizes
        const oversizedFiles = result.assets.filter(asset => (asset.size || 0) > MAX_FILE_SIZE);
        if (oversizedFiles.length > 0) {
          Alert.alert(
            'File Too Large',
            `The following file(s) exceed the 10MB limit:\n${oversizedFiles.map(f => f.name).join(', ')}\n\nPlease select smaller files.`
          );
          return;
        }

        // Check total size including already attached documents
        const currentTotalSize = attachedDocuments.reduce((sum, doc) => sum + doc.size, 0);
        const newTotalSize = result.assets.reduce((sum, asset) => sum + (asset.size || 0), 0);
        if (currentTotalSize + newTotalSize > MAX_TOTAL_SIZE) {
          Alert.alert(
            'Total Size Limit Exceeded',
            `Total file size would exceed 50MB limit.\n\nCurrent: ${(currentTotalSize / 1024 / 1024).toFixed(1)}MB\nAdding: ${(newTotalSize / 1024 / 1024).toFixed(1)}MB\n\nPlease remove some files first.`
          );
          return;
        }

        const newDocs = result.assets.map((asset, index) => ({
          id: Date.now() + index + '',
          name: asset.name || 'Unknown file',
          uri: asset.uri,
          type: asset.mimeType || 'application/octet-stream',
          size: asset.size || 0,
          processed: false,
        }));

        setAttachedDocuments(prev => [...prev, ...newDocs]);
        // Auto-process documents
        processAttachedDocuments([...attachedDocuments, ...newDocs]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const processAttachedDocuments = async (docs: DocumentFile[]) => {
    if (docs.length === 0) return;

    setProcessingDocs(true);
    try {
      const files = docs.map(doc => ({
        uri: doc.uri,
        name: doc.name,
        type: doc.type,
      }));

      const response = await ApiService.uploadFiles(files);

      const updatedDocs = docs.map((doc, index) => {
        const result = response.results[index];
        return {
          ...doc,
          processed: true,
          content: result.success ? result.filtered_text : undefined,
          error: !result.success ? result.error : undefined,
        };
      });

      setAttachedDocuments(updatedDocs);

      // Save to DocumentStore for context
      const successfulDocs = updatedDocs.filter(doc => doc.processed && doc.content);
      if (successfulDocs.length > 0) {
        await DocumentStore.saveProcessedDocuments(successfulDocs);
        setHasProcessedDocs(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to process documents');
    } finally {
      setProcessingDocs(false);
    }
  };

  const removeAttachedDocument = (id: string) => {
    setAttachedDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  const loadProviders = async () => {
    try {
      const providersData = await ApiService.getProviders();
      setProviders(providersData);
      if (providersData.length > 0) {
        // Try to find OpenRouter as default provider
        const openRouterProvider = providersData.find(p => p.name === 'openrouter');
        const defaultProvider = openRouterProvider || providersData[0];

        setSelectedProvider(defaultProvider.name);
        if (defaultProvider.models.length > 0) {
          setSelectedModel(defaultProvider.models[0]);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load LLM providers. Please check your connection and API URL.');
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;
    if (!selectedProvider) {
      Alert.alert('Error', 'Please select an LLM provider first');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      // Get saved API keys from encrypted storage
      const apiKeys = await ApiService.getApiKeys();

      // Get processed document contents from store
      const documentContents = await DocumentStore.getProcessedDocumentContents();

      const response = await ApiService.sendMessage({
        prompt: inputText,
        llm_provider: selectedProvider,
        model: selectedModel || undefined,
        file_contents: documentContents && documentContents.length > 0 ? documentContents : undefined,
        api_keys: apiKeys,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.response,
        sender: 'assistant',
        timestamp: new Date(),
        provider: response.provider,
        model: response.model,
        hasDocuments: response.document_info?.has_documents,
        documentCount: response.document_info?.document_count,
      };

      setMessages(prev => [...prev, assistantMessage]);
      // Note: Keep processed documents for future chats
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to send message. Please try again.';
      Alert.alert('Error', errorMessage);
      if (__DEV__) console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, messageType: string) => {
    try {
      // Dynamically import clipboard to avoid errors in Expo Go
      const Clipboard = await import('expo-clipboard');
      await Clipboard.setStringAsync(text);
      Alert.alert('Copied!', `${messageType} copied to clipboard`);
    } catch (error) {
      // Clipboard not available in current environment
      Alert.alert('Copy Text', text, [
        { text: 'OK', style: 'cancel' }
      ]);
    }
  };

  const handleQuickReply = async (replyText: string) => {
    if (!selectedProvider || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: replyText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const apiKeys = await ApiService.getApiKeys();
      const documentContents = await DocumentStore.getProcessedDocumentContents();

      const response = await ApiService.sendMessage({
        prompt: replyText,
        llm_provider: selectedProvider,
        model: selectedModel || undefined,
        file_contents: documentContents.length > 0 ? documentContents : undefined,
        api_keys: apiKeys,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.response,
        sender: 'assistant',
        timestamp: new Date(),
        provider: response.provider,
        model: response.model,
        hasDocuments: response.document_info?.has_documents,
        documentCount: response.document_info?.document_count,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Classic Message Rendering (Original)
  const renderClassicMessage = ({ item }: { item: Message }) => (
    <TouchableOpacity 
      style={[
        styles.messageContainer,
        item.sender === 'user' ? 
          { ...styles.userMessage, backgroundColor: '#007AFF' } : 
          { ...styles.assistantMessage, backgroundColor: theme === 'dark' ? '#333' : '#f0f0f0', borderColor: theme === 'dark' ? '#555' : '#e0e0e0' }
      ]}
      onLongPress={() => copyToClipboard(item.text, item.sender === 'user' ? 'Message' : 'Response')}
      activeOpacity={0.7}
    >
      <Text 
      style={[
      styles.messageText,
      { color: item.sender === 'user' ? '#fff' : (theme === 'dark' ? '#ECEDEE' : '#11181C') }
      ]}
      selectable={true}
      >
        {item.text}
      </Text>
      <TouchableOpacity 
        style={styles.copyButton}
        onPress={() => copyToClipboard(item.text, item.sender === 'user' ? 'Message' : 'Response')}
      >
        <Icon name="content-copy" size={14} color={item.sender === 'user' ? 'rgba(255,255,255,0.7)' : (theme === 'dark' ? '#aaa' : '#666')} />
      </TouchableOpacity>
      {item.sender === 'assistant' && (
        <Text style={[styles.messageInfo, { color: theme === 'dark' ? '#aaa' : '#666' }]}>
          {item.provider}{item.model ? ` > ${item.model}` : ''}
          {item.hasDocuments ? ` • ${item.documentCount} document(s)` : ''}
        </Text>
      )}
      <Text style={[styles.timestamp, { color: theme === 'dark' ? '#aaa' : '#999' }]}>
        {item.timestamp.toLocaleTimeString()}
      </Text>
    </TouchableOpacity>
  );

  // Modern Message Rendering (Bubble Chat Layout - NO COPY BUTTON, DIFFERENT SPACING)
  const renderModernMessage = ({ item }: { item: Message }) => (
    <View style={{ marginVertical: 2 }}>
      <TouchableOpacity 
        style={[
          styles.modernMessageContainer,
          item.sender === 'user' 
            ? styles.modernUserMessage 
            : [
                styles.modernAssistantMessage, 
                { backgroundColor: theme === 'dark' ? '#333' : '#f0f0f0' }
              ],
        ]}
        onLongPress={() => copyToClipboard(item.text, item.sender === 'user' ? 'Message' : 'Response')}
        activeOpacity={0.8}
      >
        {/* NO COPY BUTTON - more bubble-like experience */}
        <Text 
          style={[
            styles.modernMessageText,
            { color: item.sender === 'user' ? '#fff' : (theme === 'dark' ? '#ECEDEE' : '#11181C') }
          ]}
          selectable={true}
        >
          {item.text}
        </Text>
        {item.sender === 'assistant' && (
          <Text style={[styles.modernMessageInfo, { color: theme === 'dark' ? '#aaa' : '#666' }]}>
            {item.provider}{item.model ? ` > ${item.model}` : ''}
          </Text>
        )}
      </TouchableOpacity>
      
      {/* Functional Quick reply buttons */}
      {item.sender === 'assistant' && (
        <View style={styles.modernQuickReplies}>
          <TouchableOpacity 
            style={[styles.modernQuickReply, { borderColor: theme === 'dark' ? '#555' : '#ddd' }]}
            onPress={() => handleQuickReply("Tell me more about this")}
          >
            <Text style={[styles.modernQuickReplyText, { color: theme === 'dark' ? '#ECEDEE' : '#11181C' }]}>
              Tell me more
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.modernQuickReply, { borderColor: theme === 'dark' ? '#555' : '#ddd' }]}
            onPress={() => handleQuickReply("Thanks!")}
          >
            <Text style={[styles.modernQuickReplyText, { color: theme === 'dark' ? '#ECEDEE' : '#11181C' }]}>
              Thanks!
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.modernQuickReply, { borderColor: theme === 'dark' ? '#555' : '#ddd' }]}
            onPress={() => handleQuickReply("Can you explain this differently?")}
          >
            <Text style={[styles.modernQuickReplyText, { color: theme === 'dark' ? '#ECEDEE' : '#11181C' }]}>
              Explain
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // Placeholder for Gamified and Professional styles
  const renderGamifiedMessage = ({ item }: { item: Message }) => renderClassicMessage({ item });
  const renderProfessionalMessage = ({ item }: { item: Message }) => renderClassicMessage({ item });

  // Main render function with conditional styling
  const renderMessage = ({ item }: { item: Message }) => {
    switch (chatStyle) {
      case 'modern':
        return renderModernMessage({ item });
      case 'gamified':
        return renderGamifiedMessage({ item });
      case 'professional':
        return renderProfessionalMessage({ item });
      default:
        return renderClassicMessage({ item });
    }
  };

  // Helper function to get provider-specific icon and color
  const getProviderInfo = (providerName: string) => {
    switch(providerName) {
      case 'openai':
        return { icon: 'android', color: '#10A37F' }; // OpenAI green (robot-like)
      case 'anthropic':
        return { icon: 'psychology', color: '#D97706' }; // Anthropic orange
      case 'ollama':
        return { icon: 'computer', color: '#6366F1' }; // Purple for local
      default:
        return { icon: 'chat', color: '#666' }; // Generic fallback
    }
  };

  const selectProvider = () => {
    if (providers.length === 0) {
      Alert.alert('Error', 'No providers available');
      return;
    }

    Alert.alert(
      'Select Provider',
      'Choose an LLM provider',
      [
        ...providers.map((provider) => ({
          text: provider.display_name,
          onPress: () => {
            setSelectedProvider(provider.name);
            if (provider.models.length > 0) {
              setSelectedModel(provider.models[0]);
            }
          }
        })),
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme === 'dark' ? '#151718' : '#fff' }]}>
      <View style={[styles.header, { 
        backgroundColor: theme === 'dark' ? '#151718' : '#fff', 
        borderBottomColor: theme === 'dark' ? '#555' : '#e0e0e0' 
      }]}>
        {/* App Logo */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/images/icon.png')} 
            style={styles.appLogo}
            resizeMode="contain"
          />
          <Text style={[styles.appName, { color: theme === 'dark' ? '#ECEDEE' : '#11181C' }]}>
            ChatinShield
          </Text>
        </View>

        {/* Provider Selection */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {hasProcessedDocs && (
            <TouchableOpacity
              onPress={clearDocuments}
              style={[
                styles.clearDocsButton,
                { backgroundColor: theme === 'dark' ? 'rgba(255,59,48,0.2)' : 'rgba(255,59,48,0.1)' }
              ]}
            >
              <Icon name="delete" size={20} color="#FF3B30" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.providerButton,
              { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
            ]}
            onPress={selectProvider}
          >
            <Icon
              name={getProviderInfo(selectedProvider).icon}
              size={20}
              color={getProviderInfo(selectedProvider).color}
              style={styles.providerIcon}
            />
            <Text style={[styles.providerText, { color: theme === 'dark' ? '#ECEDEE' : '#11181C' }]}>
              {providers.find(p => p.name === selectedProvider)?.display_name || 'Select Provider'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={[styles.messagesList, { backgroundColor: theme === 'dark' ? '#151718' : '#fff' }]}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        onLayout={() => flatListRef.current?.scrollToEnd()}
      />

      {/* Attached Documents Display */}
      {attachedDocuments.length > 0 && (
        <View style={[styles.attachedDocsContainer, {
          backgroundColor: theme === 'dark' ? '#1a1a1a' : '#f5f5f5',
          borderTopColor: theme === 'dark' ? '#333' : '#e0e0e0'
        }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.docChipsScroll}>
            {attachedDocuments.map((doc) => (
              <View
                key={doc.id}
                style={[styles.docChip, {
                  backgroundColor: theme === 'dark' ? '#333' : '#fff',
                  borderColor: doc.processed ? (doc.error ? '#ff4444' : '#4CAF50') : '#999'
                }]}
              >
                <Icon
                  name={doc.processed ? (doc.error ? 'error' : 'check-circle') : 'description'}
                  size={16}
                  color={doc.processed ? (doc.error ? '#ff4444' : '#4CAF50') : '#999'}
                />
                <Text
                  style={[styles.docChipText, { color: theme === 'dark' ? '#ECEDEE' : '#11181C' }]}
                  numberOfLines={1}
                >
                  {doc.name}
                </Text>
                <TouchableOpacity onPress={() => removeAttachedDocument(doc.id)}>
                  <Icon name="close" size={16} color={theme === 'dark' ? '#aaa' : '#666'} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
          {processingDocs && (
            <ActivityIndicator size="small" color="#007AFF" style={styles.docProcessing} />
          )}
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
        style={[styles.inputContainer, {
          backgroundColor: theme === 'dark' ? '#151718' : '#fff',
          borderTopColor: theme === 'dark' ? '#555' : '#e0e0e0'
        }]}
      >
        <TouchableOpacity
          style={styles.attachButton}
          onPress={pickDocument}
          disabled={loading || processingDocs}
        >
          <Icon
            name="attach-file"
            size={24}
            color={loading || processingDocs ? "#ccc" : "#007AFF"}
          />
        </TouchableOpacity>
        <TextInput
          style={[styles.textInput, {
            backgroundColor: theme === 'dark' ? '#444' : '#fff',
            color: theme === 'dark' ? '#ECEDEE' : '#11181C',
            borderColor: theme === 'dark' ? '#555' : '#e0e0e0'
          }]}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type your message..."
          placeholderTextColor={theme === 'dark' ? '#aaa' : '#999'}
          multiline
          editable={!loading}
        />
        <TouchableOpacity
          style={[styles.sendButton, loading && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={loading || !inputText.trim()}
          testID="send-button"
        >
          <Icon
            name={loading ? "hourglass-empty" : "send"}
            size={24}
            color={loading || !inputText.trim() ? "#ccc" : "#007AFF"}
          />
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appLogo: {
    width: 28,
    height: 28,
    marginRight: 8,
  },
  appName: {
    fontSize: 18,
    fontWeight: '600',
  },
  providerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  clearDocsButton: {
    padding: 8,
    borderRadius: 8,
  },
  providerIcon: {
    marginRight: 6,
  },
  providerText: {
    fontSize: 14,
    fontWeight: '500',
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: '80%',
    padding: 12,
    paddingRight: 40,
    borderRadius: 12,
    position: 'relative',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageInfo: {
    fontSize: 12,
    marginTop: 4,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  attachedDocsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  docChipsScroll: {
    flex: 1,
  },
  docChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    maxWidth: 250,
    minWidth: 100,
  },
  docChipText: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 6,
    marginRight: 6,
    flex: 1,
  },
  docProcessing: {
    marginLeft: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 12,
    borderTopWidth: 1,
  },
  attachButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 120,
    fontSize: 16,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  copyButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    padding: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 12,
  },
  // Modern Chat Styles
  modernMessageContainer: {
    marginVertical: 8,
    maxWidth: '80%',
    padding: 16,
    borderRadius: 20,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modernUserMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF', // Keep user message blue (theme consistent)
    borderBottomRightRadius: 4, // Asymmetric bubble tail
    marginLeft: 60, // More bubble-like spacing
  },
  modernAssistantMessage: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4, // Asymmetric bubble tail  
    marginRight: 60, // More bubble-like spacing
  },
  modernMessageText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  modernMessageInfo: {
    fontSize: 11,
    marginTop: 8,
    opacity: 0.7,
    fontWeight: '500',
  },
  modernQuickReplies: {
    flexDirection: 'row',
    marginTop: 8,
    marginLeft: 16,
    gap: 8,
  },
  modernQuickReply: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  modernQuickReplyText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
