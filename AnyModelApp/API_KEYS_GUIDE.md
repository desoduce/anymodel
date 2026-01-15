# API Keys Setup Guide

Welcome to ChatinShield! This guide will help you obtain API keys from various AI providers so you can start using the app.

## Why Do I Need API Keys?

ChatinShield is a **client application** that connects directly to AI service providers. We don't operate AI services ourselves, which means:

- **You're in control**: Your data goes directly to the provider you choose
- **You pay only for what you use**: No subscriptions or markups
- **Maximum privacy**: We never see your conversations or API keys
- **Flexibility**: Use multiple providers and switch between them

## Recommended: Start with OpenRouter

**OpenRouter** is the easiest way to get started. It provides access to multiple AI models (including GPT-4, Claude, Gemini) through a single API key.

### OpenRouter Setup (Recommended for Beginners)

1. Visit [https://openrouter.ai/](https://openrouter.ai/)
2. Click "Sign In" in the top right
3. Sign in with Google, GitHub, or email
4. Go to [https://openrouter.ai/keys](https://openrouter.ai/keys)
5. Click "Create Key"
6. Give it a name (e.g., "ChatinShield")
7. Copy your API key (starts with `sk-or-v1-...`)
8. Paste it into ChatinShield Settings → API Keys → OpenRouter

**Benefits**:
- Access to 100+ models from one key
- Pay-as-you-go pricing (starts at $0.06 per million tokens)
- $1 free credit to start
- No subscriptions required

---

## Provider-Specific Guides

### OpenAI (ChatGPT, GPT-4)

**What you get**: Access to GPT-4, GPT-4 Turbo, GPT-3.5, and DALL-E

**Pricing**: Pay-as-you-go starting at ~$0.50 per million tokens

**Setup Steps**:

1. Go to [https://platform.openai.com/signup](https://platform.openai.com/signup)
2. Create an account (you'll need a phone number for verification)
3. Add payment method: [https://platform.openai.com/account/billing/overview](https://platform.openai.com/account/billing/overview)
4. Visit API Keys: [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
5. Click "Create new secret key"
6. Give it a name (e.g., "ChatinShield Mobile")
7. Copy the key (starts with `sk-...`) - **You can only see it once!**
8. Paste into ChatinShield Settings → API Keys → OpenAI

**Important Notes**:
- OpenAI requires a paid account (minimum $5 credit)
- Free trial credits expired in 2023
- Keep your key secret - don't share it

---

### Anthropic (Claude)

**What you get**: Access to Claude 3 Opus, Sonnet, and Haiku models

**Pricing**: Pay-as-you-go starting at ~$3 per million tokens for Opus

**Setup Steps**:

1. Go to [https://console.anthropic.com/](https://console.anthropic.com/)
2. Sign up with email
3. Add payment method (required for API access)
4. Visit [https://console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
5. Click "Create Key"
6. Name your key (e.g., "ChatinShield")
7. Copy the API key (starts with `sk-ant-...`)
8. Paste into ChatinShield Settings → API Keys → Anthropic

**Important Notes**:
- No free tier available
- Excellent for complex reasoning and long conversations
- Strong privacy commitments

---

### Google Gemini

**What you get**: Access to Gemini Pro and Gemini Pro Vision

**Pricing**: Free tier available! Then pay-as-you-go

**Setup Steps**:

1. Go to [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Select or create a Google Cloud project
5. Copy your API key (starts with `AIza...`)
6. Paste into ChatinShield Settings → API Keys → Google Gemini

**Important Notes**:
- **Free tier**: 60 requests per minute
- Great for experimentation
- Google account required

---

### Local AI (Ollama) - Advanced Users

**What you get**: Run AI models locally on your computer (no API costs!)

**Requirements**:
- A computer with at least 8GB RAM
- Technical knowledge of terminal/command line

**Setup Steps**:

1. Install Ollama from [https://ollama.ai/](https://ollama.ai/)
2. Open terminal and run: `ollama pull llama2` (or another model)
3. Start Ollama server: `ollama serve`
4. Find your computer's local IP address:
   - Mac: System Preferences → Network
   - Windows: Run `ipconfig` in terminal
5. In ChatinShield Settings → API Keys → Ollama URL, enter:
   - If phone and computer on same WiFi: `http://YOUR_IP:11434`
   - Example: `http://192.168.1.100:11434`

**Important Notes**:
- Completely free and private
- Models run on your hardware
- Requires technical setup
- Your phone and computer must be on the same network

---

## Security Best Practices

### Keep Your Keys Safe

- **Never share** your API keys with anyone
- **Don't post** them on social media, GitHub, or forums
- **Rotate keys** if you suspect they've been compromised
- **Use different keys** for different apps

### ChatinShield Security Features

- All API keys encrypted with AES-256
- Keys stored only on your device (iOS Keychain / Android Keystore)
- We never see or store your keys
- Direct connections to providers (no intermediary servers)

### If Your Key is Compromised

1. Immediately delete it from the provider's dashboard
2. Create a new key
3. Update ChatinShield settings with the new key
4. Check your provider's usage logs for unauthorized access

---

## Cost Management Tips

### Start Small
- Begin with free tiers (Google Gemini, Ollama)
- Use OpenRouter's $1 free credit to test
- Set spending limits in provider dashboards

### Monitor Usage
- Check provider dashboards regularly
- OpenAI: [https://platform.openai.com/usage](https://platform.openai.com/usage)
- Anthropic: [https://console.anthropic.com/settings/usage](https://console.anthropic.com/settings/usage)
- OpenRouter: [https://openrouter.ai/activity](https://openrouter.ai/activity)

### Choose Cost-Effective Models
- GPT-3.5 Turbo is 10x cheaper than GPT-4
- Claude Haiku is cheaper than Opus
- Gemini Pro has a generous free tier

---

## Troubleshooting

### "Invalid API Key" Error

**Possible causes**:
- Key was copied incorrectly (check for extra spaces)
- Key was deleted from provider dashboard
- Payment method expired (OpenAI, Anthropic)
- Free tier limits exceeded (Google Gemini)

**Solutions**:
1. Copy the key again carefully
2. Create a new key from provider dashboard
3. Verify payment method is valid
4. Check usage limits

### "Network Error" or "Connection Failed"

**Possible causes**:
- No internet connection
- Provider API is down
- Ollama server not running (for local AI)
- Firewall blocking requests

**Solutions**:
1. Check your internet connection
2. Visit provider status pages
3. For Ollama: Verify `ollama serve` is running
4. Disable VPN temporarily to test

### Can't Find API Key Section in Provider Dashboard

**Solutions**:
- **OpenAI**: [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- **Anthropic**: [https://console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
- **Google**: [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
- **OpenRouter**: [https://openrouter.ai/keys](https://openrouter.ai/keys)

### Models Not Showing Up

**Cause**: API key not saved properly

**Solution**:
1. Enter your API key in Settings
2. Tap "Save Settings"
3. Wait for success message
4. Return to chat screen
5. Tap provider dropdown to see available models

---

## Frequently Asked Questions

### Do I need all four API keys?

**No!** You only need **one** API key to use ChatinShield. We recommend starting with:
- **OpenRouter** (easiest, access to many models)
- **Google Gemini** (free tier available)

### How much will this cost me?

**Depends on usage**:
- Light use (10-20 chats/day): ~$1-5 per month
- Moderate use (50 chats/day): ~$10-20 per month
- Heavy use: ~$50+ per month

**Free options**:
- Google Gemini free tier
- Ollama (local AI, completely free)

### Is it safe to enter my API keys?

**Yes!** ChatinShield:
- Encrypts keys with AES-256
- Stores them only on your device
- Never sends them to our servers
- Uses industry-standard security

### Can I use the app without API keys?

**No.** ChatinShield is a client app that requires API keys to function. This design ensures:
- Maximum privacy (we never see your data)
- No subscriptions or markups
- You control your costs

### Which provider is best?

**Depends on your needs**:
- **Best overall**: OpenAI GPT-4 (smart but expensive)
- **Best value**: Claude Sonnet (great quality, reasonable price)
- **Best free tier**: Google Gemini
- **Best for privacy**: Ollama (completely local)
- **Best for variety**: OpenRouter (100+ models)

---

## Getting Help

### In-App Support
- Settings → About → "Support"

### Provider Support
- **OpenAI**: [https://help.openai.com/](https://help.openai.com/)
- **Anthropic**: [https://support.anthropic.com/](https://support.anthropic.com/)
- **Google**: [https://ai.google.dev/](https://ai.google.dev/)
- **OpenRouter**: [https://openrouter.ai/docs](https://openrouter.ai/docs)

---

**Ready to start?** Head to ChatinShield Settings → API Keys and enter your first API key!
