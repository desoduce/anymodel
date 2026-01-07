import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ApiService, { LLMProvider } from '../../src/services/ApiService';
import { AppSettings, ApiKeys } from '../../src/types/index';
import { useTheme } from '../../contexts/ThemeContext';
import EncryptedStorage from '../../src/services/EncryptedStorage';

export default function SettingsScreen() {
  const { theme, userTheme, setUserTheme } = useTheme();
  const [settings, setSettings] = useState<AppSettings>({
    defaultProvider: '',
    defaultModel: '',
    apiUrl: '',
    theme: 'system',
    sendOnEnter: true,
    showProviderInResponse: true,
    chatStyle: 'modern',
  });
  const [providers, setProviders] = useState<LLMProvider[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKeys>({
    openai: '',
    anthropic: '',
    gemini: '',
    ollama_url: 'http://localhost:11434',
    openrouter: ''
  });
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [customFilters, setCustomFilters] = useState('');
  const [showCustomFilters, setShowCustomFilters] = useState(false);
  const [apiKeysExpanded, setApiKeysExpanded] = useState(true);

  useEffect(() => {
    loadSettings();
    loadProviders();
    loadCustomFilters();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await ApiService.getSettings();
      const apiUrl = await ApiService.getApiUrl();
      const savedApiKeys = await ApiService.getApiKeys();

      setSettings(prev => ({
        ...prev,
        ...savedSettings,
        apiUrl,
      }));

      // Always set API keys, even if they're defaults
      if (savedApiKeys) {
        setApiKeys(savedApiKeys);
      } else {
        // Set default keys if none are saved - users must provide their own API keys
        setApiKeys({
          openai: '',
          anthropic: '',
          gemini: '',
          ollama_url: 'http://localhost:11434',
          openrouter: ''
        });
      }
    } catch (error) {
      if (__DEV__) console.error('Error loading settings:', error);
    }
  };

  const loadProviders = async () => {
    try {
      const providersData = await ApiService.getProviders();
      setProviders(providersData);
    } catch (error) {
      if (__DEV__) console.error('Error loading providers:', error);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      // Save regular settings and API keys
      await ApiService.saveSettings(settings);
      await ApiService.saveApiKeys(apiKeys);
      
      // Always save custom filters (even if empty to clear old ones)
      const filterResult = await saveCustomFiltersHelper();
      
      // Show comprehensive success message
      const filterMessage = filterResult.patterns > 0 || filterResult.keywords > 0 
        ? `\n${filterResult.patterns} regex patterns, ${filterResult.keywords} keywords saved`
        : '\nCustom filters cleared';
      
      Alert.alert('Success', `Settings and API keys saved successfully${filterMessage}`);
    } catch (error) {
      if (__DEV__) console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const testApiKeys = async () => {
    setLoading(true);
    try {
      const providersData = await ApiService.getProviders();
      
      // Check which providers have valid keys
      const availableProviders = [];
      if (apiKeys.openai) availableProviders.push('OpenAI');
      if (apiKeys.anthropic) availableProviders.push('Anthropic');
      if (apiKeys.gemini) availableProviders.push('Gemini');
      if (apiKeys.ollama_url) availableProviders.push('Ollama');
      
      Alert.alert(
        'API Keys Status',
        `✅ ${providersData.length} provider(s) available\n${availableProviders.length} provider(s) configured with API keys:\n${availableProviders.join(', ')}`
      );
      setProviders(providersData);
    } catch (error) {
      Alert.alert(
        'API Keys Status',
        '❌ Error checking providers. Please verify your API keys.'
      );
    } finally {
      setLoading(false);
    }
  };

  const loadCustomFilters = async () => {
    try {
      // Load both patterns and keywords and combine them
      const patterns = await EncryptedStorage.getFilterPatterns();
      const keywords = await EncryptedStorage.getFilterKeywords();
      const combined = [...patterns, ...keywords];
      setCustomFilters(combined.join('\n'));
    } catch (error) {
      if (__DEV__) console.error('Error loading custom filters:', error);
    }
  };

  const saveCustomFiltersHelper = async () => {
    const filters = customFilters
      .split('\n')
      .map(f => f.trim())
      .filter(f => f.length > 0);
    
    // Separate regex patterns from simple keywords
    const patterns: string[] = [];
    const keywords: string[] = [];
    
    filters.forEach(filter => {
      // Check if it's a regex pattern (contains regex special characters)
      if (/[.*+?^${}()|[\]\\]/.test(filter)) {
        patterns.push(filter);
      } else {
        keywords.push(filter);
      }
    });
    
    await EncryptedStorage.saveFilterPatterns(patterns);
    await EncryptedStorage.saveFilterKeywords(keywords);
    
    // Reload filters to ensure UI reflects actual saved state
    await loadCustomFilters();
    
    return { patterns: patterns.length, keywords: keywords.length };
  };


  const clearCustomFilters = () => {
    Alert.alert(
      'Clear Custom Filters',
      'Are you sure you want to clear all custom filters?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: async () => {
            try {
              await EncryptedStorage.clearFilterPatterns();
              await EncryptedStorage.clearFilterKeywords();
              
              // Reload filters to ensure UI reflects actual cleared state  
              await loadCustomFilters();
              
              Alert.alert('Success', 'All custom filters cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear custom filters');
            }
          }
        }
      ]
    );
  };

  const updateSetting = async (key: keyof AppSettings, value: any) => {
    const newSettings = {
      ...settings,
      [key]: value,
    };
    
    setSettings(newSettings);
    
    try {
      // For theme changes, use context to update immediately
      if (key === 'theme') {
        await setUserTheme(value);
        Alert.alert(
          'Theme Updated', 
          `Theme changed to ${value}.`,
          [{ text: 'OK' }]
        );
      } else {
        // Save other settings to storage
        await ApiService.saveSettings(newSettings);
        // Reload settings to ensure UI is in sync
        await loadSettings();
      }
    } catch (error) {
      if (__DEV__) console.error(`Error saving ${key} setting:`, error);
      Alert.alert('Error', `Failed to save ${key} setting`);
    }
  };

  const selectProvider = () => {
    if (providers.length === 0) {
      Alert.alert('Error', 'No providers available. Test your connection first.');
      return;
    }

    Alert.alert(
      'Select Default Provider',
      'Choose your default LLM provider',
      [
        ...providers.map((provider) => ({
          text: provider.display_name,
          onPress: async () => {
            // First update provider
            const newSettings = {
              ...settings,
              defaultProvider: provider.name,
              defaultModel: provider.models.length > 0 ? provider.models[0] : '',
            };
            
            setSettings(newSettings);
            await ApiService.saveSettings(newSettings);
            await loadSettings();
          }
        })),
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const selectModel = () => {
    const currentProvider = providers.find(p => p.name === settings.defaultProvider);
    if (!currentProvider || currentProvider.models.length === 0) {
      Alert.alert('Error', 'No models available for the selected provider');
      return;
    }

    Alert.alert(
      'Select Default Model',
      `Choose a model for ${currentProvider.display_name}`,
      [
        ...currentProvider.models.map((model) => ({
          text: model,
          onPress: async () => {
            const newSettings = {
              ...settings,
              defaultModel: model,
            };
            
            setSettings(newSettings);
            await ApiService.saveSettings(newSettings);
            await loadSettings();
          }
        })),
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const clearApiKeys = () => {
    Alert.alert(
      'Clear API Keys',
      'Are you sure you want to clear all API keys? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All Keys',
          style: 'destructive',
          onPress: async () => {
            try {
              await ApiService.clearApiKeys();
              setApiKeys({
                openai: '',
                anthropic: '',
                gemini: '',
                ollama_url: 'http://localhost:11434',
                openrouter: ''
              });
              Alert.alert('Success', 'All API keys have been cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear API keys');
            }
          }
        }
      ]
    );
  };

  const resetToDefaults = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to defaults?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setSettings({
              defaultProvider: '',
              defaultModel: '',
              apiUrl: 'http://localhost:8000',
              theme: 'system',
              sendOnEnter: true,
              showProviderInResponse: true,
              chatStyle: 'modern',
            });
          }
        }
      ]
    );
  };

  const getChatStyleDisplay = (style: string): string => {
    switch (style) {
      case 'classic': return '💬 Classic';
      case 'modern': return '✨ Modern';
      case 'gamified': return '🎮 Gamified';
      case 'professional': return '💼 Professional';
      default: return '✨ Modern';
    }
  };

  const selectChatStyle = () => {
    Alert.alert(
      'Select Chat Style',
      'Choose how you want the chat interface to look and feel',
      [
        {
          text: '💬 Classic',
          onPress: () => updateSetting('chatStyle', 'classic')
        },
        {
          text: '✨ Modern (Current Default)',
          onPress: () => updateSetting('chatStyle', 'modern')
        },
        {
          text: '🎮 Gamified (Fun Elements)',
          onPress: () => updateSetting('chatStyle', 'gamified')
        },
        {
          text: '💼 Professional (Rich Text)',
          onPress: () => updateSetting('chatStyle', 'professional')
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>


        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setApiKeysExpanded(!apiKeysExpanded)}
          >
            <Text style={styles.sectionTitle}>API Keys</Text>
            <View style={styles.headerIcons}>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  setShowApiKeys(!showApiKeys);
                }}
                style={{ marginRight: 12 }}
              >
                <Icon name={showApiKeys ? "visibility-off" : "visibility"} size={20} color="#666" />
              </TouchableOpacity>
              <Icon
                name={apiKeysExpanded ? "expand-less" : "expand-more"}
                size={24}
                color="#666"
              />
            </View>
          </TouchableOpacity>

          {apiKeysExpanded && (
            <>
              <View style={styles.settingItem}>
                <Text style={styles.label}>OpenAI API Key</Text>
                <TextInput
                  style={styles.textInput}
                  value={apiKeys.openai}
                  onChangeText={(text) => setApiKeys(prev => ({ ...prev, openai: text }))}
                  placeholder="sk-..."
                  secureTextEntry={!showApiKeys}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.settingItem}>
                <Text style={styles.label}>Anthropic API Key</Text>
                <TextInput
                  style={styles.textInput}
                  value={apiKeys.anthropic}
                  onChangeText={(text) => setApiKeys(prev => ({ ...prev, anthropic: text }))}
                  placeholder="sk-ant-..."
                  secureTextEntry={!showApiKeys}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.settingItem}>
                <Text style={styles.label}>Gemini API Key</Text>
                <TextInput
                  style={styles.textInput}
                  value={apiKeys.gemini}
                  onChangeText={(text) => setApiKeys(prev => ({ ...prev, gemini: text }))}
                  placeholder="AI..."
                  secureTextEntry={!showApiKeys}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.settingItem}>
                <Text style={styles.label}>Ollama URL</Text>
                <TextInput
                  style={styles.textInput}
                  value={apiKeys.ollama_url}
                  onChangeText={(text) => setApiKeys(prev => ({ ...prev, ollama_url: text }))}
                  placeholder="http://localhost:11434"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.settingItem}>
                <Text style={styles.label}>OpenRouter API Key</Text>
                <TextInput
                  style={styles.textInput}
                  value={apiKeys.openrouter}
                  onChangeText={(text) => setApiKeys(prev => ({ ...prev, openrouter: text }))}
                  placeholder="sk-or-..."
                  secureTextEntry={!showApiKeys}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.infoBox}>
                <Icon name="info" size={16} color="#666" />
                <Text style={styles.infoText}>
                  API keys are encrypted and stored securely on your device.
                  Keys are sent directly to providers and never shared with our servers.
                </Text>
              </View>

              <View style={styles.warningBox}>
                <Icon name="warning" size={16} color="#FF9500" />
                <Text style={styles.warningText}>
                  ⚠️ PII filtering uses basic pattern matching. Always review documents for sensitive information before processing.
                </Text>
              </View>

              <View style={styles.keyButtonsContainer}>
                <TouchableOpacity
                  style={styles.testKeysButton}
                  onPress={testApiKeys}
                  disabled={loading}
                >
                  <Icon name="check-circle" size={20} color="#34C759" />
                  <Text style={styles.testKeysButtonText}>
                    {loading ? 'Checking...' : 'Test API Keys'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.clearKeysButton}
                  onPress={clearApiKeys}
                >
                  <Icon name="clear-all" size={20} color="#FF3B30" />
                  <Text style={styles.clearKeysButtonText}>Clear All Keys</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Default LLM Settings</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={selectProvider}>
            <Text style={styles.label}>Default Provider</Text>
            <View style={styles.valueContainer}>
              <Text style={styles.value}>
                {providers.find(p => p.name === settings.defaultProvider)?.display_name || 'None selected'}
              </Text>
              <Icon name="chevron-right" size={20} color="#666" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={selectModel}>
            <Text style={styles.label}>Default Model</Text>
            <View style={styles.valueContainer}>
              <Text style={styles.value}>
                {settings.defaultModel || 'None selected'}
              </Text>
              <Icon name="chevron-right" size={20} color="#666" />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Preferences</Text>
          
          <View style={styles.settingItem}>
            <Text style={styles.label}>Send message on Enter</Text>
            <Switch
              value={settings.sendOnEnter}
              onValueChange={(value) => updateSetting('sendOnEnter', value)}
            />
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.label}>Show provider in responses</Text>
            <Switch
              value={settings.showProviderInResponse}
              onValueChange={(value) => updateSetting('showProviderInResponse', value)}
            />
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.label}>Chat Style</Text>
            <TouchableOpacity
              style={[styles.picker, { backgroundColor: theme === 'dark' ? '#444' : '#f0f0f0' }]}
              onPress={() => selectChatStyle()}
            >
              <Text style={[styles.pickerText, { color: theme === 'dark' ? '#ECEDEE' : '#11181C' }]}>
                {getChatStyleDisplay(settings.chatStyle)}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.label}>Theme</Text>
            <View style={styles.themeContainer}>
              <TouchableOpacity
                style={[
                  styles.themeButton,
                  userTheme === 'light' && styles.themeButtonActive
                ]}
                onPress={() => updateSetting('theme', 'light')}
              >
                <Text style={[
                  styles.themeButtonText,
                  userTheme === 'light' && styles.themeButtonTextActive
                ]}>Light</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.themeButton,
                  userTheme === 'dark' && styles.themeButtonActive
                ]}
                onPress={() => updateSetting('theme', 'dark')}
              >
                <Text style={[
                  styles.themeButtonText,
                  userTheme === 'dark' && styles.themeButtonTextActive
                ]}>Dark</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.themeButton,
                  userTheme === 'system' && styles.themeButtonActive
                ]}
                onPress={() => updateSetting('theme', 'system')}
              >
                <Text style={[
                  styles.themeButtonText,
                  userTheme === 'system' && styles.themeButtonTextActive
                ]}>System</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Custom Filters</Text>
          
          <View style={styles.infoBox}>
            <Icon name="info" size={16} color="#666" />
            <Text style={styles.infoText}>
              Add custom filters to block sensitive data. Each line is a separate filter. Regex patterns (with special characters) and simple keywords are automatically detected. Use the &ldquo;Save Settings&rdquo; button to save filters.
            </Text>
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.label}>Show/Hide Filters</Text>
            <Switch
              value={showCustomFilters}
              onValueChange={setShowCustomFilters}
            />
          </View>

          {showCustomFilters && (
            <>
              <View style={styles.textAreaContainer}>
                <Text style={styles.label}>Custom Filters (One per line)</Text>
                <Text style={[styles.helpText, { color: theme === 'dark' ? '#aaa' : '#666' }]}>
                  Examples:\n• \d{3}-\d{2}-\d{4} (regex for SSN)\n• CONFIDENTIAL (exact keyword)\n• john.doe (simple keyword)\n• [A-Z]{2}\d{6} (regex pattern)
                </Text>
                <TextInput
                  style={[styles.textArea, { 
                    backgroundColor: theme === 'dark' ? '#444' : '#fff',
                    color: theme === 'dark' ? '#ECEDEE' : '#11181C',
                    borderColor: theme === 'dark' ? '#555' : '#ddd',
                    minHeight: 150
                  }]}
                  value={customFilters}
                  onChangeText={setCustomFilters}
                  placeholder="Enter filters (one per line)...\ne.g.:\n\d{3}-\d{2}-\d{4}\nCONFIDENTIAL\nProject Alpha\n@[A-Za-z0-9_]+"
                  placeholderTextColor={theme === 'dark' ? '#aaa' : '#999'}
                  multiline
                  numberOfLines={8}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.customPatternButtonsContainer}>
                <TouchableOpacity 
                  style={styles.clearPatternButton} 
                  onPress={clearCustomFilters}
                >
                  <Icon name="delete" size={20} color="#FF3B30" />
                  <Text style={styles.clearPatternButtonText}>Clear All Filters</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={saveSettings}
            disabled={loading}
          >
            <Icon name="save" size={20} color="white" />
            <Text style={styles.saveButtonText}>Save Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.resetButton} 
            onPress={resetToDefaults}
          >
            <Icon name="refresh" size={20} color="#666" />
            <Text style={styles.resetButtonText}>Reset to Defaults</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 50,
  },
  section: {
    backgroundColor: 'white',
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  value: {
    fontSize: 16,
    color: '#666',
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginLeft: 12,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f8ff',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  testButtonText: {
    color: '#007AFF',
    fontSize: 16,
    marginLeft: 8,
  },
  buttonContainer: {
    padding: 16,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    borderRadius: 8,
  },
  resetButtonText: {
    color: '#666',
    fontSize: 16,
    marginLeft: 8,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    lineHeight: 16,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9500',
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#856404',
    marginLeft: 8,
    lineHeight: 16,
  },
  clearKeysButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff2f2',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#ffcccc',
  },
  clearKeysButtonText: {
    color: '#FF3B30',
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
  keyButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  testKeysButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fff0',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccffcc',
  },
  testKeysButtonText: {
    color: '#34C759',
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
  themeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  themeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  themeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  themeButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  themeButtonTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  textAreaContainer: {
    marginVertical: 8,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    fontSize: 14,
    minHeight: 100,
    maxHeight: 150,
    textAlignVertical: 'top',
  },
  customPatternButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  clearPatternButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  clearPatternButtonText: {
    color: '#FF3B30',
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
  helpText: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  pickerText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
