# LLM Relay Agent

A web service that provides a unified interface to interact with multiple Large Language Models (LLMs) including OpenAI, Anthropic Claude, and local Ollama models.

## Features

- **Multi-LLM Support**: Connect to OpenAI GPT, Anthropic Claude, and Ollama models
- **Multiple File Upload**: Upload and analyze up to 5 documents simultaneously
- **Document Processing**: Extract text from PDF, Word, Excel, CSV, and text files
- **PII Filtering**: Automatic detection and filtering of sensitive information
- **Prompt Cleaning**: Automatic sanitization and validation of user prompts
- **Web Interface**: Clean, responsive web UI for easy interaction
- **REST API**: Programmatic access via HTTP endpoints
- **Provider Selection**: Choose your preferred LLM provider and model
- **Error Handling**: Comprehensive error handling and user feedback

## Setup

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
- **Models**: GPT-4, GPT-3.5-turbo, etc.
- **Setup**: Set `OPENAI_API_KEY` in environment

### Anthropic Claude
- **Models**: Claude-3 Opus, Sonnet, Haiku
- **Setup**: Set `ANTHROPIC_API_KEY` in environment

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

## Environment Variables

```bash
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
OLLAMA_URL=http://localhost:11434
DEBUG=True
```

## Development

The application is built with:
- **FastAPI**: Web framework
- **Jinja2**: Template engine
- **OpenAI Python SDK**: OpenAI integration
- **Anthropic SDK**: Claude integration
- **Requests**: HTTP client for Ollama

## Security Features

- Input sanitization and validation
- API key protection
- Request size limits
- Injection attempt filtering
- Error handling without information leakage
