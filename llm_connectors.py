import os
import asyncio
from typing import Dict, List, Optional, Any
import openai
import anthropic
import requests
from abc import ABC, abstractmethod

class BaseLLMProvider(ABC):
    """Base class for LLM providers"""
    
    @abstractmethod
    async def generate_response(self, prompt: str, model: Optional[str] = None) -> Dict[str, Any]:
        pass
    
    @abstractmethod
    def get_available_models(self) -> List[str]:
        pass
    
    @abstractmethod
    def is_configured(self) -> bool:
        pass

class OpenAIProvider(BaseLLMProvider):
    """OpenAI API provider"""
    
    def __init__(self):
        self.client = None
        api_key = os.getenv('OPENAI_API_KEY')
        if api_key:
            self.client = openai.AsyncOpenAI(api_key=api_key)
    
    def is_configured(self) -> bool:
        return self.client is not None
    
    def get_available_models(self) -> List[str]:
        return [
            "gpt-4-turbo-preview",
            "gpt-4-turbo",
            "gpt-4",
            "gpt-4-0613",
            "gpt-3.5-turbo",
            "gpt-3.5-turbo-16k",
            "gpt-3.5-turbo-1106"
        ]
    
    async def generate_response(self, prompt: str, model: Optional[str] = None) -> Dict[str, Any]:
        if not self.is_configured():
            raise Exception("OpenAI API key not configured")
        
        model = model or "gpt-3.5-turbo"
        
        try:
            response = await self.client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=2000,
                temperature=0.7
            )
            
            return {
                "content": response.choices[0].message.content,
                "model": model,
                "provider": "openai"
            }
        except Exception as e:
            raise Exception(f"OpenAI API error: {str(e)}")

class AnthropicProvider(BaseLLMProvider):
    """Anthropic Claude provider"""
    
    def __init__(self):
        self.client = None
        api_key = os.getenv('ANTHROPIC_API_KEY')
        if api_key:
            self.client = anthropic.AsyncAnthropic(api_key=api_key)
    
    def is_configured(self) -> bool:
        return self.client is not None
    
    def get_available_models(self) -> List[str]:
        return [
            "claude-3-opus-20240229",
            "claude-3-sonnet-20240229",
            "claude-3-haiku-20240307"
        ]
    
    async def generate_response(self, prompt: str, model: Optional[str] = None) -> Dict[str, Any]:
        if not self.is_configured():
            raise Exception("Anthropic API key not configured")
        
        model = model or "claude-3-sonnet-20240229"
        
        try:
            response = await self.client.messages.create(
                model=model,
                max_tokens=2000,
                messages=[{"role": "user", "content": prompt}]
            )
            
            return {
                "content": response.content[0].text,
                "model": model,
                "provider": "anthropic"
            }
        except Exception as e:
            raise Exception(f"Anthropic API error: {str(e)}")

class OllamaProvider(BaseLLMProvider):
    """Local Ollama provider"""
    
    def __init__(self):
        self.base_url = os.getenv('OLLAMA_URL', 'http://localhost:11434')
    
    def is_configured(self) -> bool:
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=2)
            return response.status_code == 200
        except:
            return False
    
    def get_available_models(self) -> List[str]:
        if not self.is_configured():
            return []
        
        try:
            response = requests.get(f"{self.base_url}/api/tags")
            if response.status_code == 200:
                models = response.json().get('models', [])
                return [model['name'] for model in models]
        except:
            pass
        
        return ["llama2", "mistral", "codellama"]  # Default models
    
    async def generate_response(self, prompt: str, model: Optional[str] = None) -> Dict[str, Any]:
        if not self.is_configured():
            raise Exception("Ollama not available")
        
        model = model or "llama2"
        
        try:
            payload = {
                "model": model,
                "prompt": prompt,
                "stream": False
            }
            
            response = requests.post(
                f"{self.base_url}/api/generate",
                json=payload,
                timeout=60
            )
            
            if response.status_code != 200:
                raise Exception(f"Ollama error: {response.text}")
            
            result = response.json()
            return {
                "content": result.get("response", ""),
                "model": model,
                "provider": "ollama"
            }
        except Exception as e:
            raise Exception(f"Ollama API error: {str(e)}")

class MockProvider(BaseLLMProvider):
    """Mock provider for testing"""
    
    def is_configured(self) -> bool:
        return True
    
    def get_available_models(self) -> List[str]:
        return ["mock-model-1", "mock-model-2"]
    
    async def generate_response(self, prompt: str, model: Optional[str] = None) -> Dict[str, Any]:
        model = model or "mock-model-1"
        
        # Simulate processing time
        await asyncio.sleep(0.5)
        
        return {
            "content": f"Mock response to: {prompt[:50]}{'...' if len(prompt) > 50 else ''}",
            "model": model,
            "provider": "mock"
        }

class LLMConnector:
    """Main connector class that manages all LLM providers"""
    
    def __init__(self, include_mock: bool = False):
        self.providers = {
            "openai": OpenAIProvider(),
            "anthropic": AnthropicProvider(),
            "ollama": OllamaProvider()
        }
        
        # Only include mock provider if explicitly requested (for testing)
        if include_mock:
            self.providers["mock"] = MockProvider()
    
    def get_available_providers(self) -> Dict[str, List[str]]:
        """Get all available providers and their models"""
        available = {}
        
        for name, provider in self.providers.items():
            if provider.is_configured():
                available[name] = provider.get_available_models()
        
        return available
    
    async def generate_response(self, prompt: str, provider: str, model: Optional[str] = None) -> Dict[str, Any]:
        """Generate response using specified provider"""
        if provider not in self.providers:
            raise Exception(f"Unknown provider: {provider}")
        
        llm_provider = self.providers[provider]
        
        if not llm_provider.is_configured():
            raise Exception(f"Provider {provider} is not configured")
        
        return await llm_provider.generate_response(prompt, model)
