import os
from typing import Dict, Any
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    """Application configuration"""
    
    # Environment
    DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'
    
    # Server
    HOST = os.getenv('HOST', '0.0.0.0')
    PORT = int(os.getenv('PORT', 8000))
    
    # LLM Configuration
    INCLUDE_MOCK_PROVIDER = os.getenv('INCLUDE_MOCK_PROVIDER', 'False').lower() == 'true'
    
    # API Keys
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
    ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY')
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
    OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY', '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')
    OLLAMA_URL = os.getenv('OLLAMA_URL', 'http://localhost:11434')
    
    @classmethod
    def get_llm_config(cls) -> Dict[str, Any]:
        """Get LLM configuration"""
        return {
            'include_mock': cls.INCLUDE_MOCK_PROVIDER,
            'openai_configured': bool(cls.OPENAI_API_KEY),
            'anthropic_configured': bool(cls.ANTHROPIC_API_KEY),
            'gemini_configured': bool(cls.GEMINI_API_KEY),
            'openrouter_configured': bool(cls.OPENROUTER_API_KEY),
            'ollama_url': cls.OLLAMA_URL
        }
