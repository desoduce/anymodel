# AnyModel - AI Chat Assistant Mobile App

A powerful mobile application that provides a unified interface to interact with multiple Large Language Models (LLMs) including OpenAI GPT, Anthropic Claude, and Ollama models.

## Features

- **Multi-LLM Support**: Connect to OpenAI, Anthropic Claude, and Ollama
- **Document Processing**: Upload and analyze PDFs, Word docs, Excel files, images, and text files
- **Advanced PII Filtering**: Automatic detection and filtering of sensitive information (SSN, credit cards, addresses, etc.)
- **Custom Filter System**: Add your own regex patterns and keywords to filter specific sensitive data
- **Unified Settings Management**: Single save button for all settings including API keys and custom filters
- **Camera Integration**: Take photos of documents for AI analysis
- **File Management**: Upload multiple files with comprehensive format support
- **Secure Encrypted Storage**: API keys and custom patterns stored with device-level encryption
- **Theme Support**: Light, dark, and system theme options
- **Streamlined UX**: Intuitive interface with consistent save operations
- **Cross-Platform**: Built with React Native and Expo for iOS and Android

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- EAS CLI (`npm install -g @expo/eas-cli`)
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

## Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npx expo start
   ```

3. **Run on Device/Simulator**:
   ```bash
   # iOS Simulator
   npx expo run:ios
   
   # Android Emulator
   npx expo run:android
   
   # Physical Device (scan QR code with Expo Go app)
   npx expo start --tunnel
   ```

## Backend Setup

The mobile app requires the AnyModel backend server to be running. See the main project README for backend setup instructions.

**Important**: Update the API URL in the app settings or in `src/services/ApiService.ts`:

```typescript
const API_BASE_URL = __DEV__ ? 'http://localhost:8000' : 'https://your-production-api.com';
```

## Building for Production

### Using EAS Build (Recommended)

1. **Install EAS CLI**:
   ```bash
   npm install -g @expo/eas-cli
   ```

2. **Login to Expo**:
   ```bash
   eas login
   ```

3. **Configure Build**:
   ```bash
   eas build:configure
   ```

4. **Build for iOS**:
   ```bash
   # Development build
   eas build --platform ios --profile development
   
   # Production build
   eas build --platform ios --profile production
   ```

5. **Build for Android**:
   ```bash
   # Development build
   eas build --platform android --profile development
   
   # Production build
   eas build --platform android --profile production
   ```

### Local Build

1. **Generate Native Code**:
   ```bash
   npx expo prebuild
   ```

2. **Build iOS**:
   ```bash
   npx expo run:ios --configuration Release
   ```

3. **Build Android**:
   ```bash
   npx expo run:android --variant release
   ```

## App Store Submission

### iOS App Store

1. **Update Configuration**:
   - Update `bundleIdentifier` in `app.json`
   - Add your Apple Team ID to `eas.json`
   - Update app icons and metadata

2. **Build for Production**:
   ```bash
   eas build --platform ios --profile production
   ```

3. **Submit to App Store**:
   ```bash
   eas submit --platform ios
   ```

### Google Play Store

1. **Update Configuration**:
   - Update `package` in `app.json`
   - Add service account key to `eas.json`
   - Update app icons and metadata

2. **Build for Production**:
   ```bash
   eas build --platform android --profile production
   ```

3. **Submit to Play Store**:
   ```bash
   eas submit --platform android
   ```

## Configuration

### Custom Filter Patterns

The app includes a custom filter patterns feature that allows users to add their own regex patterns for filtering sensitive data:

1. **Access Custom Patterns**:
   - Go to Settings tab
   - Scroll to "Custom Filter Patterns" section
   - Toggle "Show/Hide Patterns" to access the editor

2. **Add Patterns**:
   - Enter one regex pattern per line
   - Examples:
     ```regex
     @[A-Za-z0-9_]+                    # Filter @username mentions
     [A-Za-z0-9_]{3,20}               # Filter general usernames
     \b(CONFIDENTIAL|SECRET)\b        # Filter sensitive keywords
     [A-Z]{2}\d{6}                    # Filter license numbers
     \d{3}-\d{2}-\d{4}               # Filter SSN (already built-in)
     ```
   - Click "Save Patterns" to store securely

3. **Pattern Security**:
   - Patterns are encrypted and stored locally
   - Applied automatically during document processing
   - Invalid regex patterns are ignored with warnings

### Built-in PII Filtering

The app automatically filters common PII types:
- Social Security Numbers (SSN)
- Credit card numbers
- Email addresses
- Phone numbers
- Street addresses
- ZIP codes

### File Upload Limits

**Security & Performance Protection**:
- **Individual File Limit**: 10MB per file
- **Total Upload Limit**: 50MB across all attached documents
- **User Notifications**: Clear error messages show:
  - Which files exceed size limits
  - Current vs. adding file sizes
  - Suggestions to remove files

**Implementation**:
- Validation occurs before processing (prevents memory issues)
- File sizes checked in `app/(tabs)/index.tsx`
- Configurable constants: `MAX_FILE_SIZE`, `MAX_TOTAL_SIZE`

**Why These Limits**:
- Prevents app crashes on low-memory devices
- Protects against accidental large file uploads
- Ensures reasonable API response times
- Reduces bandwidth consumption

### Production Security Best Practices

**Console Logging**:
- All `console.log/warn/error/info` statements wrapped in `__DEV__` checks
- Production builds have zero console output
- Prevents sensitive data exposure in production logs
- To add new logs: `if (__DEV__) console.log('debug info');`

**API Key Management**:
- Never hardcode API keys in source code
- Use environment variables for configuration
- **Production-Grade Encryption**: User API keys encrypted with AES-256 using crypto-js
- Encryption keys stored in iOS Keychain / Android Keystore
- API keys never logged or transmitted to backend

**Environment Configuration**:
```bash
# Copy example file
cp .env.example .env

# Edit with your values
EXPO_PUBLIC_API_URL=https://your-production-api.com
```

### App Store Metadata

Update the following in `app.json`:

- `name`: App display name
- `description`: App description for store listings
- `version`: App version number
- `ios.bundleIdentifier`: iOS bundle identifier
- `android.package`: Android package name
- `icon`: App icon path
- `splash`: Splash screen configuration

### Required Permissions

The app requests the following permissions:

**iOS**:
- Camera usage (for document capture)
- Photo library access (for image selection)
- Document picker access (for file uploads)

**Android**:
- Camera permission
- Storage read/write permissions
- Internet permission

### Environment Variables

Create a `.env` file for sensitive configuration:

```env
EXPO_PUBLIC_API_URL=https://your-api-server.com
EXPO_PUBLIC_DEFAULT_PROVIDER=openai
```

## Recent Improvements

### Version 1.3.0 - Production Security & Hardening

**🔒 Critical Security Fixes**:
- **Removed Hardcoded API Keys**: All default API keys removed - users must provide their own
- **Production Logging**: All console.log statements wrapped in `__DEV__` checks (220+ instances)
  - Logs only execute in development mode
  - Production builds have no console output
  - Prevents sensitive data leakage in production
- **File Size Limits**: Added upload protection to prevent memory issues
  - 10MB maximum per individual file
  - 50MB maximum total for all attached documents
  - Clear user-friendly error messages with file details
- **Environment Configuration**: Production API URL now uses environment variables
  - Created `.env.example` template
  - API URL configurable via `EXPO_PUBLIC_API_URL`
  - Backend is optional - app works standalone

**🛡️ Security Improvements**:
- **AES-256 Encryption**: Upgraded from base64 to production-grade AES-256 encryption for API keys
  - Uses crypto-js library for strong encryption
  - Encryption keys stored in iOS Keychain / Android Keystore
  - All sensitive data encrypted before storage
- No hardcoded secrets in codebase
- Minimal console output in production
- File upload DOS protection
- Environment-based configuration

**📋 Developer Tools**:
- Automated script for wrapping console logs (`scripts/wrap-console-logs.js`)
- Example environment file (`.env.example`)
- Updated `.gitignore` to exclude sensitive files

### Version 1.2.0 - About Page & Legal Documentation

**📄 New About Page**:
- **Comprehensive Information**: Dedicated About tab with app information, features, and legal documentation
- **Collapsible Sections**: Organized into expandable sections for better readability
- **Privacy & Security Details**: Clear explanation of data handling and privacy practices
- **Legal Documentation**: Complete Disclaimer and EULA (End-User License Agreement)
- **Support Links**: Easy access to GitHub, email support, and issue reporting

**🎨 UI Improvements**:
- **Collapsible API Keys**: Settings panel now features collapsible LLM API keys section
- **OpenRouter Default**: OpenRouter is now the default LLM provider for new users
- **Better Organization**: Settings organized into logical collapsible groups

**📋 Documentation**:
- Updated README with comprehensive setup and deployment instructions
- Added legal disclaimers and EULA for App Store compliance
- Improved privacy policy documentation

### Version 1.1.0 - Settings & Filter Enhancements

**🎯 Unified Settings Management (Option B Implementation)**:
- **Single Save Button**: Main "Save Settings" button now saves everything (API keys, settings, and custom filters)
- **Eliminated Confusion**: Removed redundant "Save Filters" button - users no longer need to remember which save button to use
- **Enhanced Feedback**: Success messages show detailed save confirmation including filter counts
- **UI Consistency**: Streamlined interface with clear messaging about save operations

**🔧 Custom Filter System Improvements**:
- **Real-time UI Updates**: Filter UI now immediately reflects actual saved state after save/clear operations
- **Auto-categorization**: Automatically detects and separates regex patterns from simple keywords
- **Better Error Handling**: Improved error logging and user feedback
- **Persistent Storage**: Filters reliably persist across app restarts using encrypted storage

**🧹 Code Quality Improvements**:
- **Debug Cleanup**: Removed verbose console logging while preserving error reporting
- **TypeScript Compliance**: All changes pass TypeScript compilation
- **Comprehensive Testing**: Detailed regression test plans ensure no functionality loss

**✅ Fixed**: Custom filters now update immediately without requiring app restart.

## Troubleshooting

### Common Issues

1. **Metro bundler issues**:
   ```bash
   npx expo start --clear
   ```

2. **iOS build issues**:
   ```bash
   cd ios && pod install && cd ..
   ```

3. **Android build issues**:
   ```bash
   cd android && ./gradlew clean && cd ..
   ```

4. **Network issues on iOS Simulator**:
   - Use `http://localhost:8000` instead of `http://127.0.0.1:8000`
   - Ensure your backend server accepts connections from all interfaces

### Build Optimization

1. **Reduce Bundle Size**:
   - Remove unused dependencies
   - Use tree shaking for libraries
   - Optimize images and assets

2. **Performance Optimization**:
   - Use FlatList for large datasets
   - Implement lazy loading for screens
   - Optimize API calls with caching

## Development

### Project Structure

```
src/
├── components/        # Reusable UI components
├── screens/          # Screen components
├── services/         # API and service layers
├── types/           # TypeScript type definitions
└── utils/           # Utility functions

app/
├── (tabs)/          # Tab navigation screens
├── _layout.tsx      # Root layout
└── +not-found.tsx   # 404 page
```

### Adding New Features

1. Create screen components in `src/screens/`
2. Add navigation routes in `app/(tabs)/`
3. Update type definitions in `src/types/`
4. Add API endpoints in `src/services/ApiService.ts`

### Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run E2E tests (if configured)
npm run test:e2e
```

## Legal

### License

MIT License - see LICENSE file for details.

### Privacy Policy

Our Privacy Policy explains how we handle your information (spoiler: we don't collect it).

Read the full policy: [PRIVACY_POLICY.md](PRIVACY_POLICY.md)

**Key Points:**
- We don't collect your personal data
- Everything is stored locally on your device
- No tracking or analytics
- You send data directly to LLM providers (not through our servers)

### Terms of Service

Our Terms of Service outline the rules for using ChatinShield.

Read the full terms: [TERMS_OF_SERVICE.md](TERMS_OF_SERVICE.md)

**Key Points:**
- Use the app lawfully and responsibly
- You must provide your own API keys
- AI content may be inaccurate - verify important information
- PII filtering is helpful but not perfect
- Third-party LLM providers have their own terms

## Support

For support and questions:
- Create an issue in the GitHub repository
- Check the troubleshooting section above
- Review Expo and React Native documentation
