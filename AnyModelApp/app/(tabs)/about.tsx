import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../contexts/ThemeContext';

export default function AboutScreen() {
  const { theme } = useTheme();
  const [expandedSections, setExpandedSections] = useState({
    about: true,
    features: false,
    privacy: false,
    disclaimer: false,
    eula: false,
    support: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const openURL = (url: string) => {
    Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
  };

  const CollapsibleSection = ({
    title,
    section,
    children
  }: {
    title: string;
    section: keyof typeof expandedSections;
    children: React.ReactNode
  }) => (
    <View style={styles.section}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => toggleSection(section)}
      >
        <Text style={styles.sectionTitle}>{title}</Text>
        <Icon
          name={expandedSections[section] ? "expand-less" : "expand-more"}
          size={24}
          color="#666"
        />
      </TouchableOpacity>
      {expandedSections[section] && (
        <View style={styles.sectionContent}>
          {children}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>

        {/* App Header */}
        <View style={styles.header}>
          <Text style={styles.appName}>ChatinShield</Text>
          <Text style={styles.version}>Version 1.3.0</Text>
          <Text style={styles.tagline}>AI Chat with Privacy Protection</Text>
        </View>

        {/* About Section */}
        <CollapsibleSection title="About ChatinShield" section="about">
          <Text style={styles.bodyText}>
            ChatinShield is a powerful AI chat assistant that connects to multiple Large Language Models (LLMs)
            including OpenAI GPT, Anthropic Claude, Google Gemini, and OpenRouter. The app features advanced
            PII (Personally Identifiable Information) filtering to protect your sensitive data.
          </Text>
          <Text style={styles.bodyText}>
            Built with React Native and Expo, ChatinShield provides a seamless cross-platform experience
            for iOS and Android users. All API keys are encrypted and stored securely on your device.
          </Text>
        </CollapsibleSection>

        {/* Features Section */}
        <CollapsibleSection title="Features" section="features">
          <View style={styles.featureItem}>
            <Icon name="auto-awesome" size={20} color="#007AFF" />
            <Text style={styles.featureText}>Multi-LLM Support (OpenAI, Claude, Gemini, OpenRouter)</Text>
          </View>
          <View style={styles.featureItem}>
            <Icon name="shield" size={20} color="#007AFF" />
            <Text style={styles.featureText}>Advanced PII Filtering & Custom Patterns</Text>
          </View>
          <View style={styles.featureItem}>
            <Icon name="upload-file" size={20} color="#007AFF" />
            <Text style={styles.featureText}>Document Processing (PDF, DOCX, Excel, Images)</Text>
          </View>
          <View style={styles.featureItem}>
            <Icon name="camera-alt" size={20} color="#007AFF" />
            <Text style={styles.featureText}>OCR Text Recognition with MLKit</Text>
          </View>
          <View style={styles.featureItem}>
            <Icon name="lock" size={20} color="#007AFF" />
            <Text style={styles.featureText}>Encrypted Local Storage for API Keys</Text>
          </View>
          <View style={styles.featureItem}>
            <Icon name="palette" size={20} color="#007AFF" />
            <Text style={styles.featureText}>Light/Dark Theme Support</Text>
          </View>
          <View style={styles.featureItem}>
            <Icon name="style" size={20} color="#007AFF" />
            <Text style={styles.featureText}>Multiple Chat Styles (Modern, Classic, Professional)</Text>
          </View>
          <View style={styles.featureItem}>
            <Icon name="security" size={20} color="#007AFF" />
            <Text style={styles.featureText}>File Upload Limits (10MB/file, 50MB total)</Text>
          </View>
          <View style={styles.featureItem}>
            <Icon name="verified-user" size={20} color="#007AFF" />
            <Text style={styles.featureText}>Production-Hardened Security (No Debug Logging)</Text>
          </View>
        </CollapsibleSection>

        {/* Privacy & Security Section */}
        <CollapsibleSection title="Privacy & Security" section="privacy">
          <Text style={styles.bodyText}>
            <Text style={styles.boldText}>Your Privacy is Our Priority{'\n\n'}</Text>
            ChatinShield is designed with privacy-first principles and production-grade security:
          </Text>
          <Text style={styles.bulletPoint}>• All API keys encrypted with AES-256 and stored locally on your device</Text>
          <Text style={styles.bulletPoint}>• Your conversations and documents are sent directly to your chosen LLM provider</Text>
          <Text style={styles.bulletPoint}>• We do not store, transmit, or access your chat history or documents</Text>
          <Text style={styles.bulletPoint}>• PII filtering happens on-device before sending to LLM providers</Text>
          <Text style={styles.bulletPoint}>• File upload limits (10MB/file, 50MB total) prevent memory issues</Text>
          <Text style={styles.bulletPoint}>• Production builds have zero debug logging (no data leakage)</Text>
          <Text style={styles.bulletPoint}>• No third-party analytics or tracking</Text>
          <Text style={styles.bulletPoint}>• No user accounts or registration required</Text>

          <Text style={styles.bodyText}>
            {'\n'}<Text style={styles.boldText}>Security Measures:{'\n'}</Text>
            • All console logs disabled in production builds{'\n'}
            • No hardcoded API keys in source code{'\n'}
            • Environment-based configuration{'\n'}
            • AES-256 encryption for API keys and sensitive data{'\n'}
            • Encryption keys stored in iOS Keychain / Android Keystore{'\n'}
            • File size validation before processing
          </Text>

          <Text style={styles.bodyText}>
            {'\n'}<Text style={styles.boldText}>What We Collect:{'\n'}</Text>
            We do not collect any personal information. All data remains on your device or is sent directly
            to your chosen LLM provider according to their privacy policies.
          </Text>
        </CollapsibleSection>

        {/* Disclaimer Section */}
        <CollapsibleSection title="Disclaimer" section="disclaimer">
          <Text style={styles.bodyText}>
            <Text style={styles.boldText}>IMPORTANT DISCLAIMER{'\n\n'}</Text>
            Please read this disclaimer carefully before using ChatinShield.
          </Text>

          <Text style={styles.subheading}>1. AI-Generated Content</Text>
          <Text style={styles.bodyText}>
            Responses from AI language models may contain inaccurate, incomplete, or misleading information.
            Always verify important information from authoritative sources. Do not rely solely on AI-generated
            content for critical decisions.
          </Text>

          <Text style={styles.subheading}>2. PII Filtering Limitations</Text>
          <Text style={styles.bodyText}>
            While ChatinShield includes PII filtering features, these are based on pattern matching and may not
            catch all sensitive information. Users are responsible for reviewing all content before sending to
            LLM providers. We recommend:
          </Text>
          <Text style={styles.bulletPoint}>• Manually reviewing documents before upload</Text>
          <Text style={styles.bulletPoint}>• Using custom filter patterns for your specific needs</Text>
          <Text style={styles.bulletPoint}>• Not uploading highly sensitive documents without additional safeguards</Text>

          <Text style={styles.subheading}>3. Third-Party Services</Text>
          <Text style={styles.bodyText}>
            This app connects to third-party LLM services (OpenAI, Anthropic, Google, OpenRouter). Your use of
            these services is subject to their respective terms of service and privacy policies. We are not
            responsible for their practices or policies.
          </Text>

          <Text style={styles.subheading}>4. No Warranty</Text>
          <Text style={styles.bodyText}>
            This software is provided "AS IS" without warranty of any kind, express or implied. We do not warrant
            that the app will be error-free, uninterrupted, or meet your specific requirements.
          </Text>

          <Text style={styles.subheading}>5. Limitation of Liability</Text>
          <Text style={styles.bodyText}>
            In no event shall the developers be liable for any damages arising from the use or inability to use
            this app, including but not limited to data loss, privacy breaches, or financial losses.
          </Text>

          <Text style={styles.subheading}>6. API Costs</Text>
          <Text style={styles.bodyText}>
            You are responsible for all costs associated with API usage from third-party LLM providers. Monitor
            your usage to avoid unexpected charges.
          </Text>
        </CollapsibleSection>

        {/* EULA Section */}
        <CollapsibleSection title="End-User License Agreement (EULA)" section="eula">
          <Text style={styles.bodyText}>
            <Text style={styles.boldText}>END-USER LICENSE AGREEMENT{'\n\n'}</Text>
            Last updated: January 4, 2026
          </Text>

          <Text style={styles.subheading}>1. License Grant</Text>
          <Text style={styles.bodyText}>
            Subject to your compliance with this Agreement, we grant you a limited, non-exclusive,
            non-transferable, revocable license to download, install, and use ChatinShield for your
            personal, non-commercial use.
          </Text>

          <Text style={styles.subheading}>2. Restrictions</Text>
          <Text style={styles.bodyText}>You agree NOT to:</Text>
          <Text style={styles.bulletPoint}>• Modify, adapt, or create derivative works of the app</Text>
          <Text style={styles.bulletPoint}>• Reverse engineer, decompile, or disassemble the app</Text>
          <Text style={styles.bulletPoint}>• Remove or alter any copyright, trademark, or proprietary notices</Text>
          <Text style={styles.bulletPoint}>• Use the app for illegal or unauthorized purposes</Text>
          <Text style={styles.bulletPoint}>• Share your installation or API keys with others</Text>
          <Text style={styles.bulletPoint}>• Use the app to transmit harmful or malicious content</Text>

          <Text style={styles.subheading}>3. Intellectual Property</Text>
          <Text style={styles.bodyText}>
            All rights, title, and interest in and to ChatinShield remain with the developers. This license
            does not grant you any ownership rights.
          </Text>

          <Text style={styles.subheading}>4. User Responsibilities</Text>
          <Text style={styles.bodyText}>You are responsible for:</Text>
          <Text style={styles.bulletPoint}>• Maintaining the security of your API keys</Text>
          <Text style={styles.bulletPoint}>• Complying with third-party LLM provider terms of service</Text>
          <Text style={styles.bulletPoint}>• All content you create, upload, or transmit through the app</Text>
          <Text style={styles.bulletPoint}>• Ensuring your use complies with applicable laws and regulations</Text>

          <Text style={styles.subheading}>5. Updates and Modifications</Text>
          <Text style={styles.bodyText}>
            We may update the app and this Agreement from time to time. Continued use of the app after updates
            constitutes acceptance of the revised terms.
          </Text>

          <Text style={styles.subheading}>6. Termination</Text>
          <Text style={styles.bodyText}>
            This license is effective until terminated. Your rights under this license will terminate automatically
            if you fail to comply with any of its terms. Upon termination, you must cease all use and delete all
            copies of the app.
          </Text>

          <Text style={styles.subheading}>7. Governing Law</Text>
          <Text style={styles.bodyText}>
            This Agreement shall be governed by and construed in accordance with the laws of your jurisdiction,
            without regard to conflict of law principles.
          </Text>

          <Text style={styles.subheading}>8. Entire Agreement</Text>
          <Text style={styles.bodyText}>
            This Agreement constitutes the entire agreement between you and the developers regarding the use of
            ChatinShield and supersedes all prior agreements.
          </Text>

          <Text style={styles.bodyText}>
            {'\n'}<Text style={styles.boldText}>By using ChatinShield, you acknowledge that you have read,
            understood, and agree to be bound by this EULA.</Text>
          </Text>
        </CollapsibleSection>

        {/* Support Section */}
        <CollapsibleSection title="Support & Contact" section="support">
          <Text style={styles.bodyText}>
            Need help or have questions? We're here to assist you.
          </Text>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => openURL('https://github.com/yourusername/anymodel-mobile/issues')}
          >
            <Icon name="bug-report" size={20} color="#007AFF" />
            <Text style={styles.linkText}>Report an Issue</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => openURL('https://github.com/yourusername/anymodel-mobile')}
          >
            <Icon name="code" size={20} color="#007AFF" />
            <Text style={styles.linkText}>View on GitHub</Text>
          </TouchableOpacity>

          <Text style={styles.bodyText}>
            {'\n'}<Text style={styles.boldText}>Developer:{'\n'}</Text>
            AnyModel Team
          </Text>

          <Text style={styles.bodyText}>
            {'\n'}<Text style={styles.boldText}>Support:{'\n'}</Text>
            For questions or issues, please use GitHub Issues.
          </Text>
        </CollapsibleSection>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2026 ChatinShield. All rights reserved.
          </Text>
          <Text style={styles.footerText}>
            Built with ❤️ using React Native & Expo
          </Text>
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
    paddingBottom: 40,
  },
  header: {
    backgroundColor: '#007AFF',
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  version: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 10,
  },
  tagline: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.95,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  bodyText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 12,
  },
  boldText: {
    fontWeight: '600',
    color: '#333',
  },
  subheading: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 6,
    paddingLeft: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    flex: 1,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  linkText: {
    fontSize: 15,
    color: '#007AFF',
    marginLeft: 12,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
});
