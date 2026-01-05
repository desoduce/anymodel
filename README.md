# AnyModel - Multi-LLM Platform

A comprehensive platform that provides unified access to multiple Large Language Models (LLMs) including OpenAI, Anthropic Claude, Google Gemini, and local Ollama models. Available as both a web service and mobile application.

## Features

### Backend (Web Service)
- **Multi-LLM Support**: Connect to OpenAI GPT, Anthropic Claude, Google Gemini, and Ollama models
- **Multiple File Upload**: Upload and analyze up to 5 documents simultaneously
- **Document Processing**: Extract text from PDF, Word, Excel, CSV, and text files
- **PII Filtering**: Automatic detection and filtering of sensitive information
- **Prompt Cleaning**: Automatic sanitization and validation of user prompts
- **Web Interface**: Clean, responsive web UI for easy interaction
- **REST API**: Programmatic access via HTTP endpoints
- **Provider Selection**: Choose your preferred LLM provider and model
- **Error Handling**: Comprehensive error handling and user feedback

### Mobile App (Standalone)
- **Native iOS & Android**: Built with React Native and Expo
- **Modern Chat Interface**: Bubble-style chat with quick reply buttons and typing indicators (default)
- **Multiple Chat Styles**: Switch between Classic, Modern, Gamified, and Professional chat experiences
- **Direct LLM Integration**: Connects directly to OpenAI, Anthropic, Google Gemini, and Ollama APIs
- **Document Camera**: Capture documents directly with your camera
- **OCR Text Recognition**: Extract text from images using Tesseract.js OCR engine
- **Local Processing**: Document analysis and PII filtering on device
- **Advanced Document Processing**: Full text extraction from Word, Excel, images, and text files; PDF analysis with enhancement options
- **Secure API Keys**: Enter and store LLM provider keys locally with encryption
- **Custom PII Filtering**: Configure your own filters with regex patterns and keywords
- **No Backend Required**: Works independently without server dependency
- **Cross-Platform**: Single codebase for iOS and Android
- **App Store Ready**: Configured for submission to Apple App Store and Google Play

## Setup

### Backend Server

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure Environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Run the Application**:
   ```bash
   python main.py
   ```

4. **Access the Interface**:
   - Web UI: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Mobile App

⚠️ **Important**: All mobile app commands must be run from the `AnyModelApp/` directory.

1. **Navigate to Mobile App Directory**:
   ```bash
   cd AnyModelApp
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start Development Server**:
   ```bash
   npm start
   ```

4. **Run on Device**:
   - Install Expo Go app on your phone
   - Scan QR code from terminal
   - Or run `npm run ios` / `npm run android` for simulators

5. **Configure API Keys**:
   - Open Settings tab in the app
   - Enter your API keys for LLM providers (OpenAI, Anthropic, Gemini, Ollama)
   - Test API keys and select default LLM provider
   - **No backend server required** - app connects directly to LLM providers

## Project Structure

```
anymodel/                 ← Python backend (optional)
├── main.py              ← FastAPI server for web interface
├── requirements.txt     ← Python dependencies  
├── README.md            ← This file
└── AnyModelApp/         ← Standalone mobile app
    ├── package.json     ← Mobile app dependencies
    ├── app.json         ← Mobile app configuration
    ├── src/             ← Mobile app source code (connects directly to LLMs)
    └── app/             ← Mobile app screens
```

**Note**: The mobile app works independently and doesn't require the Python backend server.

## API Endpoints

### POST /api/upload
Upload multiple documents for processing.

**Request**: Multipart form data with up to 5 files
**Response**:
```json
{
    "success": true,
    "results": [
        {
            "success": true,
            "filtered_text": "Document content with PII filtered",
            "metadata": {
                "filename": "document.pdf",
                "size": 15432,
                "type": "pdf"
            },
            "pii_detected": true,
            "filtering_stats": {...}
        }
    ],
    "summary": {
        "total_files": 2,
        "successful": 1,
        "failed": 1
    }
}
```

### POST /api/chat
Send a prompt to an LLM and get a response, optionally with document contents.

**Request Body**:
```json
{
    "prompt": "Your question here",
    "llm_provider": "openai",
    "model": "gpt-3.5-turbo",
    "file_contents": ["document 1 content", "document 2 content"]
}
```

**Response**:
```json
{
    "response": "LLM response",
    "provider": "openai",
    "model": "gpt-3.5-turbo",
    "cleaned_prompt": "Sanitized prompt with documents",
    "document_info": {
        "has_documents": true,
        "document_count": 2
    }
}
```

### GET /api/providers
Get available LLM providers and their models.

## Supported Providers

### OpenAI
- **Models**: GPT-4 Turbo, GPT-4, GPT-3.5-turbo
- **Setup**: Set `OPENAI_API_KEY` in environment
- **API Key**: Get from https://platform.openai.com/api-keys

### Anthropic Claude
- **Models**: Claude-3 Opus, Sonnet, Haiku
- **Setup**: Set `ANTHROPIC_API_KEY` in environment
- **API Key**: Get from https://console.anthropic.com/settings/keys

### Google Gemini
- **Models**: Gemini 2.0 Flash (default), Gemini 1.5 Pro, Gemini 1.5 Flash
- **Setup**: Set `GEMINI_API_KEY` in environment
- **API Key**: Get from https://makersuite.google.com/app/apikey
- **Free Tier**: All models available with generous rate limits (15 RPM for Flash, 2 RPM for Pro)

### Ollama (Local)
- **Models**: Any locally installed Ollama model
- **Setup**: Run Ollama locally and set `OLLAMA_URL`

### Mock Provider
- **Purpose**: Testing and development
- **Setup**: Always available

## Prompt Cleaning

The system automatically cleans user prompts to:
- Remove potentially harmful content
- Normalize whitespace
- Filter injection attempts
- Limit excessive length
- Validate meaningful content

## API Key Configuration

### Backend Server (Environment Variables)

```bash
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GEMINI_API_KEY=your_gemini_key
OLLAMA_URL=http://localhost:11434
DEBUG=True
```

### Mobile App (In-App Configuration)

Users enter API keys directly in the mobile app:

1. **Open Settings Tab** in the mobile app
2. **Enter API Keys**:
   - OpenAI API Key: `sk-...` (from https://platform.openai.com/api-keys)
   - Anthropic API Key: `sk-ant-...` (from https://console.anthropic.com/settings/keys)
   - Gemini API Key: `AI...` (from https://makersuite.google.com/app/apikey) - **FREE**
   - Ollama URL: `http://localhost:11434` (or your server IP)
3. **Tap Save Settings**
4. **Test Connection** to verify setup

**Security**: API keys are encrypted and stored locally on the device. Keys are sent directly to providers and never shared with the backend server. Users can edit keys anytime and clear all keys with one tap.

## Development

### Backend Stack
- **FastAPI**: Web framework
- **Jinja2**: Template engine
- **OpenAI Python SDK**: OpenAI integration
- **Anthropic SDK**: Claude integration
- **Google Generative AI**: Gemini integration
- **Requests**: HTTP client for Ollama

### Mobile App Stack
- **React Native**: Cross-platform mobile framework
- **Expo**: Development platform and build service
- **TypeScript**: Type-safe JavaScript development
- **React Navigation**: Navigation library
- **Expo Camera**: Camera integration
- **Expo Document Picker**: File selection
- **AsyncStorage**: Local data persistence
- **Tesseract.js**: OCR text recognition engine
- **Mammoth.js**: Word document processing  
- **XLSX**: Excel spreadsheet processing

## Mobile App Submission

The mobile app is ready for app store submission with:

### iOS App Store
- Configured bundle identifier: `com.anymodel.aichat`
- Required permissions for camera and file access
- App Store Connect configuration
- Build command: `cd AnyModelApp && npm run build:ios`
- Submit command: `cd AnyModelApp && npm run submit:ios`

### Google Play Store  
- Configured package name: `com.anymodel.aichat`
- Android permissions for camera and storage
- Google Play Console configuration
- Build command: `cd AnyModelApp && npm run build:android`
- Submit command: `cd AnyModelApp && npm run submit:android`

See `AnyModelApp/app-store-setup.md` for detailed submission instructions and `AnyModelApp/API-KEYS-SETUP.md` for API key configuration guide.

## Security Features

- Input sanitization and validation
- API key protection
- Request size limits
- Injection attempt filtering
- Error handling without information leakage
