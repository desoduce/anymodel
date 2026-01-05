# App Store Submission Setup

## Prerequisites for Submission

### For iOS App Store:

1. **Apple Developer Account** ($99/year)
   - Sign up at https://developer.apple.com
   - Get your Team ID from the developer console

2. **App Store Connect Setup**:
   - Create new app in App Store Connect
   - Get your App Store Connect App ID
   - Configure app metadata, screenshots, description

3. **Update eas.json**:
   ```json
   "submit": {
     "production": {
       "ios": {
         "appleId": "your-apple-id@example.com",
         "ascAppId": "your-app-store-connect-app-id",
         "appleTeamId": "your-apple-team-id"
       }
     }
   }
   ```

### For Google Play Store:

1. **Google Play Console Account** ($25 one-time fee)
   - Sign up at https://play.google.com/console

2. **Service Account Setup**:
   - Create service account in Google Cloud Console
   - Download JSON key file
   - Grant permissions in Play Console

3. **Update eas.json**:
   ```json
   "submit": {
     "production": {
       "android": {
         "serviceAccountKeyPath": "./google-play-service-account.json",
         "track": "production"
       }
     }
   }
   ```

## Required Assets

### App Icons
- **iOS**: 1024x1024 PNG (no transparency)
- **Android**: 512x512 PNG

### Screenshots (Required for App Store)
- **iOS**: 
  - iPhone 6.7" (1290x2796)
  - iPhone 6.1" (1179x2556)
  - iPad Pro 12.9" (2048x2732)
- **Android**:
  - Phone (minimum 1080x1920)
  - Tablet (minimum 1200x1920)

### App Store Listing Copy

**Title**: AnyModel - AI Chat Assistant

**Subtitle**: Multi-LLM Chat with Document Analysis

**Description**:
```
AnyModel is a powerful AI chat assistant that connects you to multiple Large Language Models (LLMs) including OpenAI GPT, Anthropic Claude, and Ollama models.

KEY FEATURES:
• Multi-LLM Support: Switch between OpenAI, Anthropic, and local Ollama models
• Document Analysis: Upload PDFs, Word docs, images, and text files for AI analysis
• Camera Integration: Capture documents directly with your camera
• Secure Processing: Built-in PII filtering and prompt sanitization
• Cross-Provider Chat: Compare responses from different AI models
• Offline Settings: Configure providers and models for offline use

PERFECT FOR:
• Students analyzing documents and research papers
• Professionals working with reports and presentations
• Developers comparing AI model outputs
• Anyone who wants flexible access to multiple AI providers

PRIVACY & SECURITY:
• Documents are processed securely with PII filtering
• API keys are stored locally on your device
• No data is stored on our servers
• Full control over your AI interactions

Get started by connecting to your preferred AI provider and start chatting with the world's most advanced language models!
```

**Keywords**: AI, Chat, LLM, OpenAI, Claude, Ollama, Documents, PDF, Analysis

**Category**: Productivity

**Age Rating**: 4+ (All ages)

## Build Commands

### Development Build
```bash
# Start development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android
```

### Production Build
```bash
# Build for iOS App Store
npm run build:ios

# Build for Google Play Store
npm run build:android
```

### Submit to Stores
```bash
# Submit to iOS App Store
npm run submit:ios

# Submit to Google Play Store
npm run submit:android
```

## Testing Before Submission

1. **Test on Physical Devices**:
   - Install Expo Go app on your phone
   - Scan QR code from development server
   - Test all features thoroughly

2. **Test API Connection**:
   - Ensure backend server is accessible
   - Test with production API URL
   - Verify all LLM providers work

3. **Test File Upload**:
   - Try different file types (PDF, Word, images)
   - Test camera capture functionality
   - Verify document processing works

4. **Test Error Handling**:
   - Test with invalid API URL
   - Test with network disconnected
   - Verify proper error messages

## Pre-Submission Checklist

- [ ] Update app version in app.json
- [ ] Test on iOS and Android devices
- [ ] Verify all permissions are correctly declared
- [ ] Test with production API server
- [ ] Create app store screenshots
- [ ] Write app store description
- [ ] Set up App Store Connect/Google Play Console
- [ ] Configure EAS build profiles
- [ ] Test building production builds
- [ ] Verify app icons and splash screens
- [ ] Test file upload and camera features
- [ ] Review app store guidelines compliance

## Common Issues

1. **Build Failures**:
   - Check expo-doctor: `npx expo doctor`
   - Clear cache: `npx expo start --clear`
   - Update dependencies: `npm update`

2. **Permission Issues**:
   - Verify all required permissions in app.json
   - Test permission prompts on device

3. **API Connection Issues**:
   - Update API URL in settings
   - Ensure backend server is accessible from mobile
   - Check CORS configuration on backend

## Support

For build and submission support:
- Expo Documentation: https://docs.expo.dev
- EAS Build Guide: https://docs.expo.dev/build/introduction/
- App Store Guidelines: https://developer.apple.com/app-store/guidelines/
- Google Play Policies: https://play.google.com/about/developer-content-policy/
