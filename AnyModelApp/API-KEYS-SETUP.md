# API Keys Setup Guide

The mobile app allows users to enter their own API keys for different LLM providers. This guide explains how to obtain and configure API keys.

## Getting API Keys

### OpenAI API Key

1. **Sign up for OpenAI Account**:
   - Go to https://platform.openai.com
   - Create an account or sign in

2. **Get API Key**:
   - Navigate to https://platform.openai.com/api-keys
   - Click "Create new secret key"
   - Copy the key (starts with `sk-...`)
   - **Important**: Save it immediately - you won't see it again

3. **Add Credits** (if needed):
   - Go to https://platform.openai.com/account/billing
   - Add payment method and credits

### Anthropic Claude API Key

1. **Sign up for Anthropic Account**:
   - Go to https://console.anthropic.com
   - Create an account or sign in

2. **Get API Key**:
   - Navigate to https://console.anthropic.com/settings/keys
   - Click "Create Key"
   - Copy the key (starts with `sk-ant-...`)

3. **Add Credits**:
   - Go to https://console.anthropic.com/settings/billing
   - Add payment method and credits

### Ollama (Local Models)

1. **Install Ollama**:
   ```bash
   # macOS
   brew install ollama
   
   # Linux
   curl -fsSL https://ollama.ai/install.sh | sh
   
   # Windows
   # Download from https://ollama.ai/download
   ```

2. **Start Ollama Server**:
   ```bash
   ollama serve
   ```

3. **Download Models**:
   ```bash
   # Download popular models
   ollama pull llama2
   ollama pull codellama
   ollama pull mistral
   ```

4. **Configure URL**:
   - Default: `http://localhost:11434`
   - Network access: `http://YOUR_COMPUTER_IP:11434`

## Entering API Keys in Mobile App

### Step 1: Open Settings
1. Launch the AnyModel app
2. Tap the "Settings" tab at the bottom

### Step 2: Configure API Keys
1. Scroll to the "API Keys" section
2. Tap the eye icon to show/hide keys for security
3. Enter your API keys (they are fully editable):
   - **OpenAI API Key**: Paste your `sk-...` key
   - **Anthropic API Key**: Paste your `sk-ant-...` key  
   - **Ollama URL**: Enter the URL to your Ollama server

### Step 3: Save Settings
1. Tap "Save Settings" at the bottom
2. You'll see a confirmation message

### Step 4: Test Connection
1. Tap "Test Connection" to verify your setup
2. The app will show how many providers are available

### Step 5: Select Default Provider
1. Tap "Default Provider" to choose your preferred LLM
2. Tap "Default Model" to choose the specific model
3. Save settings again

## Security & Privacy

### Data Protection
- **Encrypted Storage**: API keys are encrypted using device-specific keys stored in Keychain (iOS) or Keystore (Android)
- **Local Storage**: Keys never leave your device except to make API calls to providers
- **No Cloud Backup**: Encrypted keys are not backed up to cloud services
- **Secure Transmission**: All API calls use HTTPS encryption
- **Memory Protection**: Keys are encrypted in memory and storage

### Best Practices
- **Don't Share Keys**: Never share your API keys with others
- **Rotate Regularly**: Regenerate keys periodically for security
- **Monitor Usage**: Check your provider dashboards for unexpected usage
- **Revoke if Compromised**: Immediately revoke and regenerate if keys are exposed

### Key Management
- Keys are hidden by default (shown as dots)
- Tap the eye icon to toggle visibility
- **Fully Editable**: You can edit keys anytime by tapping the field
- **Clear All Keys**: Red "Clear All API Keys" button removes all stored keys
- Only show keys when entering/verifying them

## Using Different Providers

### OpenAI Models
Available models (requires OpenAI API key):
- **GPT-4**: Most capable, higher cost
- **GPT-3.5-turbo**: Fast and cost-effective
- **GPT-4-turbo**: Latest improvements

### Anthropic Claude Models
Available models (requires Anthropic API key):
- **Claude-3 Opus**: Most capable
- **Claude-3 Sonnet**: Balanced performance
- **Claude-3 Haiku**: Fastest and most affordable

### Ollama Models
Local models (requires Ollama server):
- **Llama 2**: Meta's open-source model
- **Code Llama**: Specialized for code
- **Mistral**: Alternative open-source option
- **Custom Models**: Any model you install locally

## Troubleshooting

### Invalid API Key Errors
- **Check Format**: Ensure key starts with correct prefix (`sk-` or `sk-ant-`)
- **Verify Key**: Test key directly on provider website
- **Check Billing**: Ensure you have credits/active billing

### Connection Issues
- **Network**: Ensure internet connection is stable
- **URL Format**: Check Ollama URL format (`http://IP:11434`)
- **Firewall**: Ensure Ollama server is accessible from mobile device

### Provider Unavailable
- **Test Connection**: Use "Test Connection" button in settings
- **Check Status**: Visit provider status pages
- **Try Alternative**: Switch to different provider temporarily

## Cost Management

### OpenAI Costs
- **Set Limits**: Configure spending limits in OpenAI dashboard
- **Monitor Usage**: Check usage on https://platform.openai.com/usage
- **Choose Models**: GPT-3.5-turbo is more cost-effective than GPT-4

### Anthropic Costs  
- **Monitor Credits**: Check balance in Anthropic console
- **Usage Tracking**: Review usage patterns
- **Model Selection**: Claude Haiku is most cost-effective

### Ollama (Free)
- **Local Hosting**: Run on your own hardware
- **No API Costs**: Completely free after initial setup
- **Model Storage**: Models are stored locally

## Enhanced Security Features

### Encryption Details
The app uses military-grade encryption to protect your API keys:

1. **Device-Specific Keys**: Each device generates unique encryption keys
2. **Keychain/Keystore**: Encryption keys stored in iOS Keychain or Android Keystore
3. **Double Encryption**: Data is encrypted before storage and keys are encrypted separately
4. **No Plaintext**: Keys are never stored in plaintext anywhere on the device

### Clear All Keys Function
- **One-Click Security**: Instantly remove all stored API keys
- **No Recovery**: Once cleared, keys cannot be recovered (you'll need to re-enter them)
- **Confirmation Required**: Prevents accidental deletion with confirmation dialog
- **Complete Removal**: Clears both encrypted data and encryption keys

### Edit Existing Keys
- **Seamless Editing**: Tap any key field to modify existing keys
- **Auto-Save**: Changes are encrypted and saved when you tap "Save Settings"  
- **Live Validation**: App verifies key format as you type
- **Rollback**: Changes aren't saved until you confirm

## FAQ

**Q: Can I use the app without API keys?**
A: No, you need at least one provider configured with valid API keys.

**Q: Can I switch providers mid-conversation?**
A: Yes, tap the provider button in chat to switch anytime.

**Q: Are my API keys shared with AnyModel servers?**
A: No, keys are stored locally and sent directly to the LLM providers.

**Q: What happens if I lose my API keys?**
A: You'll need to regenerate them from the provider websites and re-enter them.

**Q: Can I use multiple providers simultaneously?**
A: Yes, configure keys for all providers you want to use.

**Q: How do I remove API keys?**
A: Use the "Clear All API Keys" button in the API Keys section, or manually clear individual fields and save.

## Support

If you need help with API key setup:
1. Check provider documentation (OpenAI, Anthropic, Ollama)
2. Verify your account status and billing
3. Test keys directly on provider websites
4. Check the app's "Test Connection" feature
