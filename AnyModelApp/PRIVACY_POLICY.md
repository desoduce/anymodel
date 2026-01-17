# Privacy Policy for ChatinShield

**Last Updated: January 4, 2026**

## Introduction

ChatinShield ("we," "our," or "the app") is committed to protecting your privacy. This Privacy Policy explains how we handle your information when you use our mobile application.

**Important:** ChatinShield is designed with privacy-first principles. We do not operate backend servers, do not collect user data, and do not track your activity. All processing happens locally on your device.

## Information We Collect

### Information We DO NOT Collect

- **No Personal Information**: We do not collect, store, or transmit any personally identifiable information (PII)
- **No Account Data**: No user accounts, usernames, emails, or passwords
- **No Analytics**: No usage analytics, tracking pixels, or telemetry
- **No Location Data**: We do not access or track your location
- **No Device Information**: We do not collect device identifiers, IP addresses, or system information
- **No Chat History**: Your conversations are never sent to our servers or stored by us
- **No Documents**: Uploaded files are processed locally and never stored on our servers

### Information Stored Locally on Your Device

The following information is stored **only on your device** using encrypted storage:

1. **API Keys**: API keys you provide for third-party LLM services (OpenAI, Anthropic, Google Gemini, OpenRouter)
   - Encrypted using device-level encryption
   - Never transmitted to our servers
   - Only sent directly to the LLM provider you choose

2. **App Settings**: Your preferences such as:
   - Default LLM provider
   - Default model selection
   - Theme preferences (light/dark)
   - Chat style preferences
   - Custom PII filter patterns

3. **Custom Filter Patterns**: User-defined regex patterns and keywords for PII filtering
   - Encrypted and stored locally
   - Used only for on-device content filtering

4. **Processed Documents**: Temporarily cached on your device for the current session
   - Automatically cleared when you close the app
   - Never uploaded to our servers

## How We Use Information

Since we don't collect information, we don't use it. All data processing happens locally on your device:

- **Document Processing**: Files you upload are processed entirely on your device
- **PII Filtering**: Sensitive information filtering occurs on-device before sending to LLM providers
- **Chat Interactions**: Messages are sent directly from your device to your chosen LLM provider

## Third-Party Services

ChatinShield connects to third-party AI service providers. When you use these services, you are subject to their privacy policies:

### LLM Providers We Support

1. **OpenAI** (ChatGPT, GPT-4, etc.)
   - Privacy Policy: https://openai.com/privacy
   - You send prompts and receive responses directly
   - Subject to OpenAI's data usage policies

2. **Anthropic** (Claude)
   - Privacy Policy: https://www.anthropic.com/privacy
   - You send prompts and receive responses directly
   - Subject to Anthropic's data usage policies

3. **Google** (Gemini)
   - Privacy Policy: https://policies.google.com/privacy
   - You send prompts and receive responses directly
   - Subject to Google's data usage policies

4. **OpenRouter**
   - Privacy Policy: https://openrouter.ai/privacy
   - Acts as a gateway to multiple LLM providers
   - Subject to OpenRouter's data usage policies

**Important:** When you use ChatinShield to interact with these services, your data goes directly to them. We do not intercept, store, or process this data. Please review each provider's privacy policy to understand how they handle your information.

## Data Security

We implement several security measures to protect your information:

### On-Device Security

- **Encrypted Storage**: API keys and custom filters are encrypted using industry-standard encryption
- **Secure Keychain**: On iOS, we use the system Keychain for sensitive data storage
- **No Debug Logging**: Production builds have zero console output to prevent data leakage
- **File Size Limits**: 10MB per file, 50MB total to prevent memory-based attacks
- **No Hardcoded Secrets**: No API keys or secrets in the application code

### Network Security

- **Direct Connections**: All API calls go directly to LLM providers over HTTPS
- **No Intermediary Servers**: We don't operate servers that process your data
- **API Key Protection**: Your API keys are never logged or transmitted to our servers

## Your Data Rights

Since we don't collect data, there's no data to access, modify, or delete from our systems. However:

### Local Data Control

- **Delete Local Data**: You can clear all locally stored data at any time:
  - Go to Settings → Clear All Keys
  - Uninstall the app to remove all local data

- **Export Not Applicable**: Since chat history isn't stored, there's nothing to export

- **Data Portability**: Your API keys are yours; you can use them with any other application

## Children's Privacy

ChatinShield is not directed to children under 13. We do not knowingly collect information from children. If you are a parent or guardian and believe your child has used this app, please contact us.

**Recommended Age Rating**: 13+ due to AI-generated content that may not be suitable for children.

## PII Filtering

ChatinShield includes built-in PII filtering to help protect your sensitive information:

### What We Filter

The app attempts to filter the following before sending to LLM providers:
- Social Security Numbers (SSN)
- Credit card numbers
- Email addresses
- Phone numbers
- Street addresses
- Custom patterns you define

### Limitations

**IMPORTANT**: PII filtering is not perfect. It uses pattern matching and may not catch all sensitive information. You are responsible for:
- Reviewing documents before upload
- Not including highly sensitive information
- Understanding that filtered data is replaced with `[FILTERED]` markers but context may remain

## Changes to This Privacy Policy

We may update this Privacy Policy from time to time. Changes will be reflected in the app and on our website with an updated "Last Updated" date.

Significant changes will be notified through:
- App update release notes
- In-app notification on first launch after update

## International Users

ChatinShield can be used worldwide. If you are located outside the United States:
- Your data stays on your device (we don't collect it)
- API calls to LLM providers may cross international borders
- Check your chosen LLM provider's policies regarding international data transfers

## GDPR Compliance (European Users)

Under the General Data Protection Regulation (GDPR):
- **Data Controller**: You are the data controller of your own data
- **No Data Processing by Us**: We don't process personal data as defined by GDPR
- **Your Rights**: You have full control over your locally stored data
- **No Cookies**: We don't use cookies or tracking technologies

## California Privacy Rights (CCPA)

Under the California Consumer Privacy Act (CCPA):
- **No Sale of Data**: We don't collect or sell personal information
- **No Sharing**: We don't share personal information with third parties (except your direct connections to LLM providers)
- **No Tracking**: We don't track users across websites or apps

## Contact Us

If you have questions about this Privacy Policy or our privacy practices, please contact us through the App Store or Google Play Store.

## Consent

By using ChatinShield, you consent to this Privacy Policy and understand that:
- We don't collect your personal information
- Your data is stored locally on your device
- You are responsible for managing your API keys and data
- Third-party LLM providers have their own privacy policies

---

## Summary

**What you need to know:**
- ✅ We don't collect your data
- ✅ Everything is stored locally on your device
- ✅ Your API keys are encrypted
- ✅ No tracking or analytics
- ✅ You send data directly to LLM providers (not through our servers)
- ⚠️ LLM providers have their own privacy policies - review them
- ⚠️ PII filtering helps but isn't perfect - review documents before upload

**Your privacy is our priority. We built ChatinShield to keep your data in your control.**
