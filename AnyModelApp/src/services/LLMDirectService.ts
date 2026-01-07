import axios from 'axios';
import { ChatRequest, ChatResponse } from './ApiService';

export class LLMDirectService {
  // Connect directly to OpenAI
  private async callOpenAI(request: ChatRequest, apiKey: string): Promise<ChatResponse> {
    try {
      if (__DEV__) console.log('🔄 Calling OpenAI API...');
      if (__DEV__) console.log('🎯 DEBUG: Raw request.model value:', JSON.stringify(request.model));
      if (__DEV__) console.log('🎯 DEBUG: request.model type:', typeof request.model);
      if (__DEV__) console.log('🎯 DEBUG: request.model isEmpty?', !request.model);
      
      const modelToUse = request.model || 'gpt-4-turbo'; // Use high-capacity model by default
      if (__DEV__) console.log('🎯 DEBUG: Final modelToUse:', modelToUse);
      if (__DEV__) console.log('Has documents:', !!request.file_contents);
      if (__DEV__) console.log('API key format:', apiKey ? `${apiKey.substring(0, 8)}...` : 'missing');
      
      // Get model-specific token limits with EMERGENCY safety margins
      const maxTokens = this.getModelMaxTokens(modelToUse);
      const reservedForCompletion = 2000;
      const emergencySafetyMargin = 1000; // Much larger safety margin
      const availableTokens = maxTokens - reservedForCompletion - emergencySafetyMargin;
      const maxChars = Math.floor(availableTokens * 1.3); // ULTRA conservative: 1.3 chars per token (reality shows we need much less)
      
      if (__DEV__) console.log(`📊 Token limits for ${modelToUse}:`);
      if (__DEV__) console.log(`Max tokens: ${maxTokens}, Available: ${availableTokens}, Max chars: ${maxChars}`);
      
      // Simple content preparation with strict character limit  
      let content = request.prompt;
      if (request.file_contents && request.file_contents.length > 0) {
        const documentContent = request.file_contents.join('\n\n');
        
        // Fix the prompt to make it clear that document content is already provided
        let enhancedPrompt = request.prompt;
        
        // Replace common phrases that make LLM think it needs to access external files
        enhancedPrompt = enhancedPrompt
          .replace(/read\s+(the\s+)?(excel\s+)?file/gi, 'analyze the provided document content')
          .replace(/access\s+(the\s+)?file/gi, 'analyze the provided document content')
          .replace(/open\s+(the\s+)?file/gi, 'analyze the provided document content')
          .replace(/analyze\s+([^\s]+\.(xlsx?|pdf|docx?))/gi, 'analyze the provided document content')
          .replace(/examine\s+([^\s]+\.(xlsx?|pdf|docx?))/gi, 'examine the provided document content');
        
        content = `${enhancedPrompt}

IMPORTANT: The document content has been extracted and is provided below. You do not need to access any external files. Please analyze the content provided:

===== EXTRACTED DOCUMENT CONTENT =====
${documentContent}
===== END OF DOCUMENT CONTENT =====

Please analyze the above document content and respond to the user's request.`;
      }
      if (__DEV__) console.log('🗂️  Complete content being sent to LLM:');
      if (__DEV__) console.log('='.repeat(50));
      if (__DEV__) console.log(content);
      if (__DEV__) console.log('='.repeat(50));
      
      if (__DEV__) console.log(`Content length check: ${content.length} vs limit ${maxChars}`);
      
      if (content.length > maxChars) {
        if (__DEV__) console.log(`⚠️ Content too long, truncating from ${content.length} to ${maxChars} chars`);
        
        // Smart truncation for PDF extractions
        const isPdfContent = content.includes('PDF Document') && content.includes('EXTRACTED CONTENT');
        
        if (isPdfContent) {
          // For PDFs, keep the header and first portion of extracted content
          const lines = content.split('\n');
          let result = '';
          let charCount = 0;
          const targetLength = maxChars - 300;
          
          // Keep lines until we hit the limit
          for (const line of lines) {
            if (charCount + line.length < targetLength) {
              result += line + '\n';
              charCount += line.length + 1;
            } else {
              break;
            }
          }
          
          content = result + `\n[... PDF content truncated for ${modelToUse} limits. Showing first ${charCount} characters of ${content.length} total. The extracted text above contains the key content from your PDF ...]`;
        } else {
          // Standard truncation
          const truncatedContent = content.substring(0, maxChars - 200);
          content = truncatedContent + `\n\n[... Content truncated to fit ${modelToUse} token limits. Showing ${truncatedContent.length} of original ${content.length} characters ...]`;
        }
        
        if (__DEV__) console.log('🔧 Content truncated successfully');
      } else {
        if (__DEV__) console.log('✅ Content fits within token limits');
      }
      
      if (__DEV__) console.log('📊 Final content length:', content.length, 'characters');
      
      const actualModel = request.model || 'gpt-4-turbo';
      
      // EMERGENCY HARD LIMIT: Final check before API call  
      const finalMaxTokens = this.getModelMaxTokens(actualModel);
      const emergencyMaxChars = (finalMaxTokens - 1500) * 1.0; // EXTREME conservative final limit based on real usage
      
      if (content.length > emergencyMaxChars) {
        if (__DEV__) console.log(`🚨 EMERGENCY TRUNCATION: ${content.length} -> ${emergencyMaxChars} chars`);
        content = content.substring(0, emergencyMaxChars - 100) + "\n[... EMERGENCY TRUNCATION applied to prevent API error ...]";
      }
      
      if (__DEV__) console.log(`🔍 OpenAI API Call Debug:`);
      if (__DEV__) console.log(`Raw request.model: "${request.model}"`);
      if (__DEV__) console.log(`Actual model used: "${actualModel}"`);
      if (__DEV__) console.log(`Final content length: ${content.length} characters`);
      if (__DEV__) console.log(`Estimated tokens: ~${Math.ceil(content.length / 2.0)} tokens`);
      if (__DEV__) console.log(`Model max tokens detected: ${finalMaxTokens}`);
      if (__DEV__) console.log(`Emergency limit applied: ${emergencyMaxChars} characters`);
      // Map UI model names to actual OpenAI API model names  
      const apiModelMap: { [key: string]: string } = {
        'gpt-4-turbo': 'gpt-4-1106-preview', // Map to actual API model name
        'gpt-4': 'gpt-4',
        'gpt-3.5-turbo': 'gpt-3.5-turbo'
      };
      
      const actualApiModel = apiModelMap[actualModel] || actualModel;
      if (__DEV__) console.log(`🚀 SENDING TO OPENAI API`);
      if (__DEV__) console.log(`   UI Model: "${actualModel}"`);
      if (__DEV__) console.log(`   API Model: "${actualApiModel}"`);
      
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: actualApiModel,
        messages: [
          {
            role: 'user',
            content: content
          }
        ],
        max_tokens: 1500, // Reduced to give more room for input
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (__DEV__) console.log('✅ OpenAI API call successful');
      return {
        response: response.data.choices[0].message.content,
        provider: 'openai',
        model: response.data.model,
        cleaned_prompt: request.prompt,
        document_info: request.file_contents ? {
          has_documents: true,
          document_count: request.file_contents.length
        } : undefined
      };
      
    } catch (error: any) {
      if (__DEV__) console.error('❌ OpenAI API Error Details:');
      if (__DEV__) console.error('Status:', error.response?.status);
      if (__DEV__) console.error('Status Text:', error.response?.statusText);
      if (__DEV__) console.error('Error Data:', JSON.stringify(error.response?.data, null, 2));
      if (__DEV__) console.error('Request URL:', error.config?.url);
      if (__DEV__) console.error('Request Headers:', error.config?.headers);
      
      if (error.response?.status === 400) {
        throw new Error(`OpenAI API Error (400): ${error.response?.data?.error?.message || 'Invalid request format'}`);
      } else if (error.response?.status === 401) {
        throw new Error('OpenAI API Error (401): Invalid API key');
      } else if (error.response?.status === 429) {
        throw new Error('OpenAI API Error (429): Rate limit exceeded');
      } else {
        throw new Error(`OpenAI API Error: ${error.message}`);
      }
    }
  }

  // Extract important sections like earnings, salaries, top performers, etc.
  private extractImportantSections(text: string): string {
    const lines = text.split('\n');
    const importantLines: string[] = [];
    
    // Patterns for important financial/business data
    const importantPatterns = [
      /\b(top|highest|best|leading|maximum|max)\b.*\b(earn|salary|revenue|profit|performance|sales)\b/i,
      /\b(earn|salary|revenue|profit|income|wage)\b.*\$[\d,]+/i,
      /\$[\d,]+.*\b(earn|salary|revenue|profit|income)\b/i,
      /\b(rank|position|#\d+|\d+\.|first|second|third)\b.*\$[\d,]+/i,
      /\b(employee|person|individual|worker|staff)\b.*\$[\d,]+/i,
      /\b\d+[\.\)]\s*[A-Za-z\s]+\s*[-:]\s*\$[\d,]+/i, // Numbered lists with money
      /\b[A-Z][a-z]+\s+[A-Z][a-z]+.*\$[\d,]+/i, // Names with salary amounts
      /\btotal|summary|conclusion|result\b/i,
      /\bhighest|lowest|average|median\b/i
    ];
    
    // Extract lines that match important patterns
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (trimmedLine.length > 10) {
        for (const pattern of importantPatterns) {
          if (pattern.test(trimmedLine)) {
            // Include some context (previous and next lines)
            const contextStart = Math.max(0, index - 1);
            const contextEnd = Math.min(lines.length, index + 2);
            const contextLines = lines.slice(contextStart, contextEnd).map(l => l.trim()).filter(l => l.length > 0);
            
            importantLines.push(...contextLines);
            break;
          }
        }
      }
    });
    
    // Remove duplicates and return
    const uniqueLines = [...new Set(importantLines)];
    const result = uniqueLines.slice(0, 10).join('\n'); // Limit to top 10 important lines
    
    if (__DEV__) console.log(`🎯 Extracted ${uniqueLines.length} important lines containing salary/earnings data`);
    return result || 'No specific salary/earnings data patterns found in document';
  }

  // Prepare content with intelligent token management
  private prepareContentWithTokenLimit(request: ChatRequest): string {
    const basePrompt = request.prompt;
    
    if (!request.file_contents || request.file_contents.length === 0) {
      return basePrompt;
    }
    
    // Very conservative token estimation based on real OpenAI usage patterns
    const maxTokens = this.getModelMaxTokens(request.model);
    const reservedTokens = 2000; // For completion
    const safetyMargin = 500; // Extra safety buffer
    const availableTokens = maxTokens - reservedTokens - safetyMargin;
    
    // Use 2.5 chars per token (very conservative) to account for formatting, special tokens, etc.
    const availableChars = Math.floor(availableTokens * 2.5);
    
    const documentContent = request.file_contents.join('\n\n');
    
    if (__DEV__) console.log(`📊 Token Management:`);
    if (__DEV__) console.log(`Model: ${request.model || 'default'}`);
    if (__DEV__) console.log(`Model max tokens: ${maxTokens}`);
    if (__DEV__) console.log(`Reserved tokens: ${reservedTokens + safetyMargin}`);
    if (__DEV__) console.log(`Available for documents: ${availableTokens} tokens (~${availableChars} chars)`);
    if (__DEV__) console.log(`Document content: ${documentContent.length} characters`);
    if (__DEV__) console.log(`Base prompt: ${basePrompt.length} characters`);
    
    // Fix the prompt to make it clear that document content is already provided
    let enhancedPrompt = basePrompt
      .replace(/read\s+(the\s+)?(excel\s+)?file/gi, 'analyze the provided document content')
      .replace(/access\s+(the\s+)?file/gi, 'analyze the provided document content')
      .replace(/open\s+(the\s+)?file/gi, 'analyze the provided document content')
      .replace(/analyze\s+([^\s]+\.(xlsx?|pdf|docx?))/gi, 'analyze the provided document content')
      .replace(/examine\s+([^\s]+\.(xlsx?|pdf|docx?))/gi, 'examine the provided document content');

    if (documentContent.length <= availableChars) {
      // Content fits within limits
      if (__DEV__) console.log(`✅ Document fits within token limits`);
      return `${enhancedPrompt}

IMPORTANT: The document content has been extracted and is provided below. You do not need to access any external files. Please analyze the content provided:

===== EXTRACTED DOCUMENT CONTENT =====
${documentContent}
===== END OF DOCUMENT CONTENT =====

Please analyze the above document content and respond to the user's request.`;
    } else {
      // Content too large - intelligent truncation
      if (__DEV__) console.log(`⚠️ Document too large, applying intelligent truncation`);
      const truncatedContent = this.intelligentDocumentTruncation(documentContent, availableChars);
      
      return `${enhancedPrompt}

IMPORTANT: The document content has been extracted and is provided below. You do not need to access any external files. Please analyze the content provided:

===== EXTRACTED DOCUMENT CONTENT (TRUNCATED) =====
${truncatedContent}
===== END OF DOCUMENT CONTENT =====

Please analyze the above document content and respond to the user's request. Note: Document was truncated to fit token limits.`;
    }
  }

  // Get maximum token limits for different models
  private getModelMaxTokens(model?: string): number {
    const modelName = model || 'gpt-3.5-turbo';
    
    // OpenAI model token limits (IMPORTANT: Check specific models first, then general ones)
    if (__DEV__) console.log(`🔍 Model detection for: "${modelName}"`);
    
    // GPT-4 variants (check specific ones first!)
    if (modelName.includes('gpt-4-turbo') || modelName.includes('gpt-4-1106') || modelName.includes('gpt-4-0125')) {
      if (__DEV__) console.log(`✅ Detected as GPT-4-turbo variant: 128,000 tokens`);
      return 128000;
    }
    if (modelName.includes('gpt-4-32k')) {
      if (__DEV__) console.log(`✅ Detected as GPT-4-32k: 32,768 tokens`);
      return 32768;
    }
    if (modelName.includes('gpt-4')) {
      if (__DEV__) console.log(`✅ Detected as GPT-4 standard: 8,192 tokens`);
      return 8192;
    }
    
    // GPT-3.5 variants
    if (modelName.includes('gpt-3.5-turbo-16k')) {
      if (__DEV__) console.log(`✅ Detected as GPT-3.5-turbo-16k: 16,384 tokens`);
      return 16384;
    }
    if (modelName.includes('gpt-3.5-turbo')) {
      if (__DEV__) console.log(`✅ Detected as GPT-3.5-turbo: 4,096 tokens`);
      return 4096;
    }
    
    // Conservative default
    return 4096;
  }

  // Intelligent document truncation that preserves important content
  private intelligentDocumentTruncation(content: string, maxChars: number): string {
    if (content.length <= maxChars) return content;
    
    if (__DEV__) console.log(`🔧 Truncating document from ${content.length} to ~${maxChars} characters`);
    
    // For PDF extractions, prioritize beginning and keep structure
    const isPdfExtraction = content.includes('PDF Document') || content.includes('EXTRACTED CONTENT');
    
    if (isPdfExtraction) {
      // PDF-specific truncation: Keep extraction summary and beginning of content
      const truncated = content.substring(0, maxChars - 200);
      return truncated + `\n\n[... PDF content truncated to fit model limits. Showing first ${truncated.length} characters of ${content.length} total. For full text analysis, try converting PDF to Word format ...]`;
    }
    
    // Standard truncation strategy: Take from beginning, middle, and end
    const chunkSize = Math.floor(maxChars / 3);
    
    const beginning = content.substring(0, chunkSize);
    const middle = content.substring(
      Math.floor(content.length / 2) - Math.floor(chunkSize / 2),
      Math.floor(content.length / 2) + Math.floor(chunkSize / 2)
    );
    const end = content.substring(content.length - chunkSize);
    
    return `${beginning}\n\n[... middle section truncated ...]\n\n${middle}\n\n[... end section truncated ...]\n\n${end}`;
  }

  // Connect directly to Anthropic Claude
  private async callAnthropic(request: ChatRequest, apiKey: string): Promise<ChatResponse> {
    const content = this.prepareContentWithTokenLimit(request);

    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: request.model || 'claude-3-haiku-20240307',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: content
        }
      ]
    }, {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      }
    });

    return {
      response: response.data.content[0].text,
      provider: 'anthropic',
      model: response.data.model,
      cleaned_prompt: request.prompt,
      document_info: request.file_contents ? {
        has_documents: true,
        document_count: request.file_contents.length
      } : undefined
    };
  }

  // Connect directly to Google Gemini
  private async callGemini(request: ChatRequest, apiKey: string): Promise<ChatResponse> {
    try {
      if (__DEV__) console.log('🔄 Calling Gemini API...');

      const modelToUse = request.model || 'gemini-2.0-flash-exp';
      if (__DEV__) console.log('Model:', modelToUse);

      let content = request.prompt;

      if (request.file_contents && request.file_contents.length > 0) {
        const documentContent = request.file_contents.join('\n\n');

        let enhancedPrompt = request.prompt
          .replace(/read\s+(the\s+)?(excel\s+)?file/gi, 'analyze the provided document content')
          .replace(/access\s+(the\s+)?file/gi, 'analyze the provided document content')
          .replace(/open\s+(the\s+)?file/gi, 'analyze the provided document content')
          .replace(/analyze\s+([^\s]+\.(xlsx?|pdf|docx?))/gi, 'analyze the provided document content')
          .replace(/examine\s+([^\s]+\.(xlsx?|pdf|docx?))/gi, 'examine the provided document content');

        content = `${enhancedPrompt}

IMPORTANT: The document content has been extracted and is provided below. You do not need to access any external files. Please analyze the content provided:

===== EXTRACTED DOCUMENT CONTENT =====
${documentContent}
===== END OF DOCUMENT CONTENT =====

Please analyze the above document content and respond to the user's request.`;
      }

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${apiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: content
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (__DEV__) console.log('✅ Gemini API call successful');

      const responseText = response.data.candidates[0].content.parts[0].text;

      return {
        response: responseText,
        provider: 'gemini',
        model: modelToUse,
        cleaned_prompt: request.prompt,
        document_info: request.file_contents ? {
          has_documents: true,
          document_count: request.file_contents.length
        } : undefined
      };

    } catch (error: any) {
      if (__DEV__) console.error('❌ Gemini API Error Details:');
      if (__DEV__) console.error('Status:', error.response?.status);
      if (__DEV__) console.error('Error Data:', JSON.stringify(error.response?.data, null, 2));

      if (error.response?.status === 400) {
        throw new Error(`Gemini API Error (400): ${error.response?.data?.error?.message || 'Invalid request format'}`);
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error('Gemini API Error: Invalid API key');
      } else if (error.response?.status === 429) {
        throw new Error('Gemini API Error (429): Rate limit exceeded');
      } else {
        throw new Error(`Gemini API Error: ${error.message}`);
      }
    }
  }

  // Connect directly to Ollama
  private async callOllama(request: ChatRequest, ollamaUrl: string): Promise<ChatResponse> {
    let content = request.prompt;
    
    if (request.file_contents && request.file_contents.length > 0) {
      const documentContent = request.file_contents.join('\n\n');
      
      // Fix the prompt to make it clear that document content is already provided
      let enhancedPrompt = request.prompt
        .replace(/read\s+(the\s+)?(excel\s+)?file/gi, 'analyze the provided document content')
        .replace(/access\s+(the\s+)?file/gi, 'analyze the provided document content')
        .replace(/open\s+(the\s+)?file/gi, 'analyze the provided document content')
        .replace(/analyze\s+([^\s]+\.(xlsx?|pdf|docx?))/gi, 'analyze the provided document content')
        .replace(/examine\s+([^\s]+\.(xlsx?|pdf|docx?))/gi, 'examine the provided document content');
      
      content = `${enhancedPrompt}

IMPORTANT: The document content has been extracted and is provided below. You do not need to access any external files. Please analyze the content provided:

===== EXTRACTED DOCUMENT CONTENT =====
${documentContent}
===== END OF DOCUMENT CONTENT =====

Please analyze the above document content and respond to the user's request.`;
    }

    const response = await axios.post(`${ollamaUrl}/api/generate`, {
      model: request.model || 'llama2',
      prompt: content,
      stream: false
    });

    return {
      response: response.data.response,
      provider: 'ollama',
      model: request.model || 'llama2',
      cleaned_prompt: request.prompt,
      document_info: request.file_contents ? {
        has_documents: true,
        document_count: request.file_contents.length
      } : undefined
    };
  }

  // Connect directly to OpenRouter (supports MiniMax and many other models)
  private async callOpenRouter(request: ChatRequest, apiKey: string): Promise<ChatResponse> {
    try {
      const modelToUse = request.model || 'minimax/minimax-01';
      let content = request.prompt;

      if (request.file_contents && request.file_contents.length > 0) {
        const documentContent = request.file_contents.join('\n\n');

        let enhancedPrompt = request.prompt
          .replace(/read\s+(the\s+)?(excel\s+)?file/gi, 'analyze the provided document content')
          .replace(/access\s+(the\s+)?file/gi, 'analyze the provided document content')
          .replace(/open\s+(the\s+)?file/gi, 'analyze the provided document content')
          .replace(/analyze\s+([^\s]+\.(xlsx?|pdf|docx?))/gi, 'analyze the provided document content')
          .replace(/examine\s+([^\s]+\.(xlsx?|pdf|docx?))/gi, 'examine the provided document content');

        content = `${enhancedPrompt}

IMPORTANT: The document content has been extracted and is provided below. You do not need to access any external files. Please analyze the content provided:

===== EXTRACTED DOCUMENT CONTENT =====
${documentContent}
===== END OF DOCUMENT CONTENT =====

Please analyze the above document content and respond to the user's request.`;
      }

      const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
        model: modelToUse,
        messages: [
          {
            role: 'user',
            content: content
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://anymodel.app',
          'X-Title': 'AnyModel App'
        }
      });

      if (__DEV__) console.log('✅ OpenRouter API call successful');

      return {
        response: response.data.choices[0].message.content,
        provider: 'openrouter',
        model: modelToUse,
        cleaned_prompt: request.prompt,
        document_info: request.file_contents ? {
          has_documents: true,
          document_count: request.file_contents.length
        } : undefined
      };

    } catch (error: any) {
      if (__DEV__) console.error('❌ OpenRouter API Error:', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        throw new Error('OpenRouter API Error: Invalid API key');
      } else if (error.response?.status === 429) {
        throw new Error('OpenRouter API Error: Rate limit exceeded');
      } else if (error.response?.status === 400) {
        throw new Error(`OpenRouter API Error: ${error.response?.data?.error?.message || 'Bad request'}`);
      } else {
        throw new Error(`OpenRouter API Error: ${error.message}`);
      }
    }
  }

  // Main method to send message directly to providers
  async sendMessageDirect(request: ChatRequest): Promise<ChatResponse> {
    const apiKeys = request.api_keys;

    if (!apiKeys) {
      throw new Error('No API keys found. Please go to Settings and add your API keys.');
    }

    // Clean the prompt (basic filtering)
    const cleanedRequest = {
      ...request,
      prompt: this.cleanPrompt(request.prompt)
    };

    switch (request.llm_provider) {
      case 'openai':
        if (!apiKeys.openai) {
          throw new Error('OpenAI API key not found. Please go to Settings and add your OpenAI API key.');
        }
        return await this.callOpenAI(cleanedRequest, apiKeys.openai);

      case 'anthropic':
        if (!apiKeys.anthropic) {
          throw new Error('Anthropic API key not found. Please go to Settings and add your Anthropic API key.');
        }
        return await this.callAnthropic(cleanedRequest, apiKeys.anthropic);

      case 'gemini':
        if (!apiKeys.gemini) {
          throw new Error('Gemini API key not found. Please go to Settings and add your Gemini API key.');
        }
        return await this.callGemini(cleanedRequest, apiKeys.gemini);

      case 'ollama':
        const ollamaUrl = apiKeys.ollama_url || 'http://localhost:11434';
        return await this.callOllama(cleanedRequest, ollamaUrl);

      case 'openrouter':
        if (!apiKeys.openrouter) {
          throw new Error('OpenRouter API key not found. Please go to Settings and add your OpenRouter API key.');
        }
        return await this.callOpenRouter(cleanedRequest, apiKeys.openrouter);

      default:
        throw new Error(`Unsupported provider: ${request.llm_provider}`);
    }
  }

  // Basic prompt cleaning (simplified version of backend logic)
  private cleanPrompt(prompt: string): string {
    // Remove excessive whitespace
    let cleaned = prompt.trim().replace(/\s+/g, ' ');
    
    // Basic length limit
    if (cleaned.length > 8000) {
      cleaned = cleaned.substring(0, 8000) + '...';
    }
    
    // Basic injection filtering
    const suspiciousPatterns = [
      /ignore.{0,10}previous.{0,10}instructions/i,
      /system.{0,10}prompt/i,
      /jailbreak/i
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(cleaned)) {
        if (__DEV__) console.warn('Potentially suspicious prompt detected');
        break;
      }
    }
    
    return cleaned;
  }
}

export default new LLMDirectService();
