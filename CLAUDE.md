# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Backend Development (Python FastAPI)
- **Start server**: `python main.py` (runs on port 8000)
- **Install dependencies**: `pip install -r requirements.txt`
- **Environment setup**: Copy `.env.example` to `.env` and configure API keys

### Mobile App Development (React Native/Expo)
All mobile app commands must be run from the `AnyModelApp/` directory:
- **Install dependencies**: `cd AnyModelApp && npm install`
- **Start development**: `cd AnyModelApp && npm start`
- **Run iOS simulator**: `cd AnyModelApp && npm run ios`
- **Run Android simulator**: `cd AnyModelApp && npm run android`
- **Type checking**: `cd AnyModelApp && npm run test:types`
- **Linting**: `cd AnyModelApp && npm run lint`
- **Full test suite**: `cd AnyModelApp && npm run test`
- **Build for production**: `cd AnyModelApp && npm run build:ios` or `npm run build:android`

### Testing
- **Backend**: No automated test suite configured
- **Mobile**: `cd AnyModelApp && npm run test` (runs type checking + linting)
- **Manual testing guide**: See `AnyModelApp/tests-simple.md`

## Architecture Overview

This is a multi-LLM platform with two separate applications:

### Backend (FastAPI Web Service)
- **Entry point**: `main.py` - FastAPI server with web UI and REST API
- **LLM Integration**: `llm_connectors.py` - Unified interface for OpenAI, Anthropic Claude, Google Gemini, and Ollama
- **Document Processing**: `document_processor.py` - Extracts text from PDF, DOCX, Excel, CSV files
- **PII Protection**: `prompt_cleaner.py` - Filters sensitive information from prompts and documents
- **Configuration**: `config.py` - Environment-based configuration management

### Mobile App (React Native/Expo)
- **Standalone architecture**: Works independently without backend server
- **Direct LLM connections**: Connects directly to OpenAI, Anthropic, Google Gemini, and Ollama APIs
- **Document processing**: On-device text extraction and PII filtering
- **Navigation**: Uses Expo Router with tab-based navigation
- **Storage**: AsyncStorage for API keys and settings (encrypted with react-native-keychain)

## Key Architectural Patterns

### LLM Provider System
- **Base class**: `BaseLLMProvider` - Abstract interface for all LLM providers
- **Provider classes**: `OpenAIProvider`, `AnthropicProvider`, `GeminiProvider`, `OllamaProvider`, `MockProvider`
- **Connector**: `LLMConnector` - Manages all providers and routes requests
- **Dynamic configuration**: Providers auto-configure based on environment/API keys

### Document Processing Pipeline
1. **File upload** → `DocumentProcessor.process_file()`
2. **Type detection** → Content-type and extension-based routing
3. **Text extraction** → Type-specific extractors (PDF, DOCX, Excel, CSV, TXT)
4. **PII filtering** → `filterPII()` removes sensitive information
5. **Response** → Filtered text with metadata and statistics

### PII Protection System
- **Server-side**: `prompt_cleaner.py` filters prompts and document content
- **Mobile-side**: Advanced filtering in `DocumentProcessor.ts` with `filterPII()` function
- **Default filters**: SSNs, phone numbers, emails, addresses, credit cards automatically detected
- **Custom filter system**: Users can add regex patterns and keywords via Settings UI
- **Local storage**: Custom filters stored using `EncryptedStorage.ts` with base64 encoding
- **Real-time filtering**: Filters applied during document processing without caching
- **Preserves context**: Replaces PII with `[FILTERED]` markers rather than removing

### API Structure
- **REST endpoints**: `/api/upload`, `/api/chat`, `/api/providers`
- **Request/Response models**: Pydantic models for type safety
- **Error handling**: Comprehensive HTTP exception handling
- **File limits**: Maximum 5 files per upload request

## Environment Configuration

### Required for Backend
```
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AI...
OLLAMA_URL=http://localhost:11434
DEBUG=True
```

### Mobile App Configuration
- API keys entered through in-app settings
- No backend dependency - connects directly to LLM providers
- API keys stored locally with base64 encoding using AsyncStorage

## Development Notes

### Backend Dependencies
- FastAPI for web framework and API
- Async support throughout (OpenAI/Anthropic/Gemini async clients)
- google-generativeai for Google Gemini integration
- PyPDF2, python-docx, openpyxl for document processing
- Pandas for Excel/CSV handling

### Mobile Dependencies
- Expo SDK ~53.0 with React Native 0.79.5
- TypeScript for type safety
- React Navigation for routing
- Multiple document processing libraries (mammoth, xlsx, pdfjs-dist, pdf-lib)
- Advanced PDF text extraction with multiple extraction strategies (form fields, binary parsing, stream objects)
- Google MLKit OCR for on-device text recognition (requires development build)

### Deployment
- **Mobile**: Ready for App Store/Google Play submission
- **Backend**: Standard FastAPI deployment (uvicorn)
- **Bundle identifiers**: `com.anymodel.aichat` for both iOS and Android

## Recent Development Updates

### v1.4.0 - Storage Simplification (January 2026)
- **Removed Encryption**: Replaced AES-256 encryption with base64 encoding for API key storage
- **Simplified Codebase**: Removed crypto-js and react-native-keychain dependencies
- **Reduced Complexity**: Eliminated ~100 lines of encryption key management code
- **More Reliable**: No keychain availability issues or session-only key data loss
- **Smaller Bundle**: Removed unused cryptographic dependencies
- **Updated Documentation**: Removed encryption claims from About page
- **Files**: `EncryptedStorage.ts`, `app/(tabs)/about.tsx`, `package.json`

### v1.1.0 - Settings & Filter System

### Settings Management Overhaul
- **Unified Save System**: Single "Save Settings" button now handles all settings (API keys, preferences, custom filters)
- **Eliminated UX Confusion**: Removed redundant "Save Filters" button 
- **Enhanced Feedback**: Success messages show detailed save confirmation including filter counts
- **File**: `app/(tabs)/settings.tsx` - Major refactoring of save flow

### Custom Filter System Improvements  
- **Real-time Updates**: Filter UI immediately reflects saved state via `loadCustomFilters()` calls
- **Fixed Caching Issue**: Empty filters now properly clear old filters from storage
- **Auto-categorization**: Automatic detection of regex patterns vs simple keywords
- **Always Save Logic**: `saveCustomFiltersHelper()` always executes to handle empty filter clearing
- **Files**: `settings.tsx`, `EncryptedStorage.ts`, `DocumentProcessor.ts`

### Code Quality & Performance
- **Debug Cleanup**: Removed verbose console.log statements while preserving error logging
- **TypeScript Compliance**: All updates pass strict TypeScript compilation
- **Regression Testing**: Comprehensive test plans created for all major changes
- **Files**: Cleaned up logging in `settings.tsx`, `EncryptedStorage.ts`, `DocumentProcessor.ts`

### Bug Fixes
- **Custom Filter Persistence**: Fixed issue where cleared filters wouldn't take effect until app restart
- **Storage Synchronization**: Settings UI now always reflects actual stored data
- **Error Handling**: Improved error logging and user feedback throughout filter system

### Chat UI/UX Enhancements (Latest)
- **Modern Chat Style (Default)**: Bubble-style chat interface with enhanced user experience
- **Chat Style System**: A/B testing framework allowing switching between Classic, Modern, Gamified, Professional styles
- **Quick Reply Buttons**: Functional quick responses ("Tell me more", "Thanks!", "Explain") for faster interactions
- **Improved Header Design**: App branding + provider-specific icons replacing confusing UI elements
- **Layout Differences**: Modern style features bubble tails, typing indicators, enhanced spacing, shadow effects
- **Theme Integration**: Chat styles respect light/dark theme preferences while providing distinct interaction patterns
- **Files**: `app/(tabs)/index.tsx`, `app/(tabs)/settings.tsx`, `src/types/index.ts`