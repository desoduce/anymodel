import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface WelcomeScreenProps {
  visible: boolean;
  onComplete: () => void;
}

interface Step {
  id: number;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ visible, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps: Step[] = [
    {
      id: 0,
      title: 'Welcome to ChatinShield',
      description: 'Your privacy-first AI chat client with built-in PII protection. Connect to multiple AI providers with your own API keys.',
      icon: 'shield-checkmark',
    },
    {
      id: 1,
      title: 'Why API Keys?',
      description: 'ChatinShield connects directly to AI providers using your API keys. This means:\n\n• Maximum privacy - we never see your conversations\n• You control your costs\n• Access to multiple AI models\n• Your data stays with you',
      icon: 'key',
    },
    {
      id: 2,
      title: 'Get Your API Keys',
      description: 'You need at least one API key to start. We recommend OpenRouter for beginners (provides access to 100+ models).',
      icon: 'cloud-download',
    },
    {
      id: 3,
      title: 'Setup Your Keys',
      description: 'Once you have an API key, go to Settings → API Keys to enter it. Your keys are encrypted and stored only on your device.',
      icon: 'settings',
    },
  ];

  const providerLinks = [
    {
      name: 'OpenRouter',
      description: 'Access 100+ models with one key (Recommended)',
      url: 'https://openrouter.ai/keys',
      icon: 'layers' as keyof typeof Ionicons.glyphMap,
      color: '#6366F1',
    },
    {
      name: 'Google Gemini',
      description: 'Free tier available',
      url: 'https://makersuite.google.com/app/apikey',
      icon: 'logo-google' as keyof typeof Ionicons.glyphMap,
      color: '#4285F4',
    },
    {
      name: 'OpenAI',
      description: 'GPT-4 and ChatGPT models',
      url: 'https://platform.openai.com/api-keys',
      icon: 'sparkles' as keyof typeof Ionicons.glyphMap,
      color: '#10A37F',
    },
    {
      name: 'Anthropic',
      description: 'Claude AI models',
      url: 'https://console.anthropic.com/settings/keys',
      icon: 'chatbubbles' as keyof typeof Ionicons.glyphMap,
      color: '#D97706',
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const openLink = (url: string) => {
    Linking.openURL(url).catch((err) => {
      if (__DEV__) console.error('Failed to open URL:', err);
    });
  };

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleSkip}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={[styles.skipText, { color: '#666' }]}>Skip</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            {steps.map((step, index) => (
              <View
                key={step.id}
                style={[
                  styles.progressDot,
                  {
                    backgroundColor: index === currentStep ? '#007AFF' : '#E0E0E0',
                  },
                ]}
              />
            ))}
          </View>

          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: '#F5F5F5' }]}>
            <Ionicons name={currentStepData.icon} size={64} color="#007AFF" />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: '#000' }]}>
            {currentStepData.title}
          </Text>

          {/* Description */}
          <Text style={[styles.description, { color: '#666' }]}>
            {currentStepData.description}
          </Text>

          {/* Provider Links (only show on step 2) */}
          {currentStep === 2 && (
            <View style={styles.providersContainer}>
              {providerLinks.map((provider) => (
                <TouchableOpacity
                  key={provider.name}
                  style={[styles.providerCard, { backgroundColor: '#F5F5F5' }]}
                  onPress={() => openLink(provider.url)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.providerIconContainer, { backgroundColor: provider.color }]}>
                    <Ionicons name={provider.icon} size={24} color="#FFFFFF" />
                  </View>
                  <View style={styles.providerInfo}>
                    <Text style={[styles.providerName, { color: '#000' }]}>
                      {provider.name}
                    </Text>
                    <Text style={[styles.providerDescription, { color: '#666' }]}>
                      {provider.description}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </TouchableOpacity>
              ))}

              {/* View Full Guide Link */}
              <TouchableOpacity
                style={[styles.guideLink, { backgroundColor: '#E0E0E0' }]}
                onPress={() => openLink('https://github.com/desoduce/anymodel/blob/main/AnyModelApp/API_KEYS_GUIDE.md')}
                activeOpacity={0.7}
              >
                <Ionicons name="book" size={20} color="#007AFF" />
                <Text style={[styles.guideLinkText, { color: '#007AFF' }]}>
                  View Full API Keys Setup Guide
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Navigation Buttons */}
        <View style={[styles.footer, { borderTopColor: '#E0E0E0' }]}>
          <View style={styles.footerButtons}>
            {!isFirstStep && (
              <TouchableOpacity
                onPress={handleBack}
                style={[styles.backButton, { backgroundColor: '#F5F5F5' }]}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-back" size={20} color="#000" />
                <Text style={[styles.backButtonText, { color: '#000' }]}>Back</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleNext}
              style={[
                styles.nextButton,
                { backgroundColor: '#007AFF' },
                !isFirstStep && styles.nextButtonExpanded,
              ]}
              activeOpacity={0.7}
            >
              <Text style={styles.nextButtonText}>
                {isLastStep ? 'Get Started' : 'Next'}
              </Text>
              {!isLastStep && <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 32,
  },
  providersContainer: {
    gap: 12,
  },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  providerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  providerDescription: {
    fontSize: 14,
  },
  guideLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  guideLinkText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 4,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 4,
    flex: 1,
  },
  nextButtonExpanded: {
    flex: 1,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default WelcomeScreen;
