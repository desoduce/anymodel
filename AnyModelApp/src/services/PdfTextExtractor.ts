/**
 * PDF Text Extraction Module for React Native
 * 
 * Provides on-device PDF text extraction using multiple strategies:
 * 1. pdf-lib for form fields and structured data
 * 2. Binary parsing for simple text-based PDFs
 * 3. Stream-based text extraction for compatible PDFs
 * 
 * All processing happens locally for privacy protection.
 */

import { PDFDocument } from 'pdf-lib';

export interface PdfExtractionResult {
  success: boolean;
  text: string;
  metadata: {
    pages: number;
    fileSizeKB: number;
    formFields: number;
    extractionMethod: string;
    textLength: number;
  };
  error?: string;
}

export class PdfTextExtractor {
  /**
   * Extract text from PDF file using multiple strategies
   */
  async extractText(fileUri: string): Promise<PdfExtractionResult> {
    try {
      if (__DEV__) console.log('🔍 Starting PDF text extraction...');
      
      // Load file data
      const response = await fetch(fileUri);
      const arrayBuffer = await response.arrayBuffer();
      const fileSizeKB = Math.round(arrayBuffer.byteLength / 1024);
      
      // Try multiple extraction methods
      const methods = [
        { name: 'Form Fields', fn: () => this.extractFromFormFields(arrayBuffer) },
        { name: 'Binary Parsing', fn: () => this.extractFromBinaryContent(arrayBuffer) },
        { name: 'Stream Objects', fn: () => this.extractFromStreams(arrayBuffer) },
        { name: 'Plain Text Search', fn: () => this.extractPlainText(arrayBuffer) }
      ];
      
      for (const method of methods) {
        try {
          if (__DEV__) console.log(`📄 Trying ${method.name}...`);
          const result = await method.fn();
          
          if (__DEV__) console.log(`📊 ${method.name} Results:`);
          if (__DEV__) console.log(`   Success: ${result.success}`);
          if (__DEV__) console.log(`   Text length: ${result.text?.length || 0}`);
          if (__DEV__) console.log(`   Text preview: "${result.text?.substring(0, 100)}..."`);
          
          if (result.success && result.text && result.text.trim().length > 0) {
            if (__DEV__) console.log(`✅ Success with ${method.name}: ${result.text.length} characters`);
            return {
              success: true,
              text: result.text,
              metadata: {
                pages: result.metadata?.pages || 0,
                fileSizeKB,
                formFields: result.metadata?.formFields || 0,
                extractionMethod: method.name,
                textLength: result.text.length
              }
            };
          }
        } catch (error) {
          if (__DEV__) console.log(`⚠️ ${method.name} failed:`, error);
          continue;
        }
      }
      
      // If all methods failed, return basic PDF info
      return {
        success: false,
        text: '',
        metadata: {
          pages: await this.getPageCount(arrayBuffer),
          fileSizeKB,
          formFields: 0,
          extractionMethod: 'None',
          textLength: 0
        },
        error: 'No extractable text found. This may be an image-based or complex PDF.'
      };
      
    } catch (error) {
      return {
        success: false,
        text: '',
        metadata: {
          pages: 0,
          fileSizeKB: 0,
          formFields: 0,
          extractionMethod: 'Failed',
          textLength: 0
        },
        error: `PDF processing failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  
  /**
   * Method 1: Extract text from PDF form fields using pdf-lib
   */
  private async extractFromFormFields(arrayBuffer: ArrayBuffer): Promise<Partial<PdfExtractionResult>> {
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    const pages = pdfDoc.getPageCount();
    
    let extractedText = '';
    
    fields.forEach((field) => {
      const fieldName = field.getName();
      let fieldValue = '';
      
      try {
        // Try to get text from different field types
        const fieldType = field.constructor.name;
        
        if (fieldType.includes('TextField')) {
          fieldValue = (field as any).getText?.() || '';
        } else if (fieldType.includes('Dropdown')) {
          fieldValue = (field as any).getSelected?.()?.join(', ') || '';
        } else if (fieldType.includes('CheckBox')) {
          fieldValue = (field as any).isChecked?.() ? 'Checked' : 'Unchecked';
        } else if (fieldType.includes('RadioGroup')) {
          fieldValue = (field as any).getSelected?.() || '';
        }
        
        if (fieldValue) {
          extractedText += `${fieldName}: ${fieldValue}\n`;
        }
      } catch (e) {
        // Skip field if we can't read it
      }
    });
    
    return {
      success: extractedText.length > 0,
      text: extractedText,
      metadata: {
        pages,
        fileSizeKB: 0, // Will be set by parent method
        formFields: fields.length,
        extractionMethod: 'Form Fields',
        textLength: extractedText.length
      }
    };
  }
  
  /**
   * Method 2: Extract text using binary content parsing
   * Looks for text objects in the PDF binary structure
   */
  private async extractFromBinaryContent(arrayBuffer: ArrayBuffer): Promise<Partial<PdfExtractionResult>> {
    const uint8Array = new Uint8Array(arrayBuffer);
    const textDecoder = new TextDecoder('latin1'); // Use latin1 for better binary compatibility
    const pdfContent = textDecoder.decode(uint8Array);
    
    let extractedText = '';
    const pages = this.countPagesFromBinary(pdfContent);
    
    // Look for text between BT (Begin Text) and ET (End Text) markers
    const textBlocks = pdfContent.match(/BT\s+.*?ET/gs) || [];
    
    for (const block of textBlocks) {
      // Extract text content from various PDF text operators - MORE PATTERNS
      const textMatches = [
        ...block.matchAll(/\((.*?)\)\s*Tj/g),      // Simple text show
        ...block.matchAll(/\((.*?)\)\s*TJ/g),      // Text show with spacing  
        ...block.matchAll(/\[(.*?)\]\s*TJ/g),      // Array text show
        ...block.matchAll(/\[(.*?)\]\s*Tj/g),      // Array text show variant
        ...block.matchAll(/"(.*?)"\s*Tj/g),       // Quoted text
        ...block.matchAll(/'(.*?)'\s*Tj/g),       // Single quoted text
        ...block.matchAll(/\s(\d+\.?\d*)\s+(\d+\.?\d*)\s+Td\s+\((.*?)\)/g), // Text with positioning
        ...block.matchAll(/\((.*?)\)\s*'\s*/g),    // Text with apostrophe
        ...block.matchAll(/\((.*?)\)\s*Tm/g),      // Text matrix
      ];
      
      for (const match of textMatches) {
        let text = match[match.length - 1]; // Get the last capture group (the text)
        if (text) {
          text = this.cleanExtractedText(text);
          if (text.length > 1) {
            extractedText += text + ' ';
          }
        }
      }
    }
    
    // Look for simple parenthetical text throughout the PDF
    const simpleTextMatches = pdfContent.match(/\([^)]{2,100}\)/g) || [];
    for (const match of simpleTextMatches) {
      const text = match.slice(1, -1).trim();
      if (text.length > 2 && /[a-zA-Z0-9]/.test(text)) {
        const cleanedText = this.cleanExtractedText(text);
        if (cleanedText.length > 2) {
          extractedText += cleanedText + ' ';
        }
      }
    }
    
    // Look for text after common PDF operators
    const operatorPatterns = [
      /\/F\d+\s+\d+\s+Tf\s+\((.*?)\)/g,         // Font changes with text
      /BT\s+.*?\((.*?)\).*?ET/gs,               // Basic text blocks
      /q\s+.*?\((.*?)\).*?Q/gs,                 // Graphics state with text
    ];
    
    for (const pattern of operatorPatterns) {
      const matches = pdfContent.matchAll(pattern);
      for (const match of matches) {
        const text = this.cleanExtractedText(match[1]);
        if (text.length > 2) {
          extractedText += text + ' ';
        }
      }
    }
    
    extractedText = extractedText.trim();
    
    return {
      success: extractedText.length > 5, // Lower threshold
      text: extractedText,
      metadata: {
        pages,
        fileSizeKB: 0,
        formFields: 0,
        extractionMethod: 'Binary Parsing',
        textLength: extractedText.length
      }
    };
  }
  
  /**
   * Method 3: Extract text from PDF stream objects
   * Attempts to find and decompress text streams
   */
  private async extractFromStreams(arrayBuffer: ArrayBuffer): Promise<Partial<PdfExtractionResult>> {
    const uint8Array = new Uint8Array(arrayBuffer);
    const textDecoder = new TextDecoder('latin1');
    const pdfContent = textDecoder.decode(uint8Array);
    
    let extractedText = '';
    const pages = this.countPagesFromBinary(pdfContent);
    
    // Look for stream objects that might contain text
    const streamMatches = pdfContent.match(/stream[\s\S]*?endstream/g) || [];
    
    for (const streamMatch of streamMatches) {
      const streamContent = streamMatch.replace(/^stream\s*/, '').replace(/\s*endstream$/, '');
      
      // Multiple extraction patterns for different PDF encodings
      const textPatterns = [
        /\(((?:[^()\\]|\\.)*)\)/g,                    // Parentheses with escape handling
        /\[((?:[^\[\]\\]|\\.)*)\]/g,                  // Brackets with escape handling
        /\/F\d+\s+[\d.]+\s+Tf[^(]*\((.*?)\)/g,       // Font + text
        /BT[^E]*?\((.*?)\)[^E]*?ET/g,                 // Text blocks
        /Tj\s*\((.*?)\)/g,                            // Text show operator
        /TJ\s*\[(.*?)\]/g,                            // Text show with array
        /Td\s+\((.*?)\)/g,                            // Text positioning
        /TD\s+\((.*?)\)/g,                            // Text positioning variant
      ];
      
      for (const pattern of textPatterns) {
        const matches = streamContent.matchAll(pattern);
        for (const match of matches) {
          const text = this.cleanExtractedText(match[1]);
          if (text.length > 1 && /[a-zA-Z0-9]/.test(text)) {
            extractedText += text + ' ';
          }
        }
      }
      
      // Look for unencoded readable text in streams
      const readableText = streamContent.match(/[A-Za-z][A-Za-z0-9\s.,!?-]{5,}/g) || [];
      for (const text of readableText) {
        const cleanText = this.cleanExtractedText(text);
        if (cleanText.length > 5) {
          extractedText += cleanText + ' ';
        }
      }
    }
    
    extractedText = extractedText.trim();
    
    return {
      success: extractedText.length > 3,
      text: extractedText,
      metadata: {
        pages,
        fileSizeKB: 0,
        formFields: 0,
        extractionMethod: 'Stream Objects',
        textLength: extractedText.length
      }
    };
  }
  
  /**
   * Method 4: Plain text search - looks for readable text patterns
   * Specifically designed for common document types like income statements
   */
  private async extractPlainText(arrayBuffer: ArrayBuffer): Promise<Partial<PdfExtractionResult>> {
    const uint8Array = new Uint8Array(arrayBuffer);
    const textDecoder = new TextDecoder('latin1');
    const pdfContent = textDecoder.decode(uint8Array);
    
    let extractedText = '';
    const pages = this.countPagesFromBinary(pdfContent);
    
    // Look for common document patterns that indicate readable content
    const commonPatterns = [
      // Financial/Income patterns
      /\b(Income|Revenue|Salary|Wages|Tax|Amount|Total|Year|Month|Date|Name|Address|SSN|EIN)\b[^a-zA-Z]*[\d.,\s$-]+/gi,
      
      // General readable text blocks (words followed by numbers/amounts)
      /\b[A-Z][a-zA-Z\s]{2,20}:\s*[\d.,\s$-]+/g,
      
      // Address patterns
      /\d+\s+[A-Z][a-zA-Z\s]{5,30}\b/g,
      
      // Name patterns (Title Case words)
      /\b[A-Z][a-zA-Z]{2,}\s+[A-Z][a-zA-Z]{2,}(?:\s+[A-Z][a-zA-Z]{2,})?\b/g,
      
      // Date patterns
      /\b(?:January|February|March|April|May|June|July|August|September|October|November|December|\d{1,2}\/\d{1,2}\/\d{2,4}|\d{1,2}-\d{1,2}-\d{2,4})\b/gi,
      
      // Common form field patterns
      /\b[A-Z][a-zA-Z\s]{3,25}:\s*[^\n\r]{1,50}/g,
      
      // Sentences (words with spaces and punctuation)
      /\b[A-Z][a-z]{2,}(?:\s+[a-zA-Z]{1,20}){2,8}[.!?]/g,
    ];
    
    // Extract text using each pattern
    for (const pattern of commonPatterns) {
      const matches = pdfContent.match(pattern) || [];
      for (const match of matches) {
        const cleanText = this.cleanExtractedText(match);
        if (cleanText.length > 3 && this.isValidEnglishText(cleanText)) {
          extractedText += cleanText + ' ';
        }
      }
    }
    
    // Also look for sequences of readable words
    const wordSequences = pdfContent.match(/\b[A-Za-z]{2,}(?:\s+[A-Za-z0-9.,\-$]{1,15}){3,}/g) || [];
    for (const sequence of wordSequences) {
      const cleanText = this.cleanExtractedText(sequence);
      if (cleanText.length > 10) {
        extractedText += cleanText + ' ';
      }
    }
    
    // Remove duplicates by splitting into sentences and deduplicating
    const sentences = extractedText.split(/[.!?]\s+/);
    const uniqueSentences = [...new Set(sentences.filter(s => s.trim().length > 5))];
    extractedText = uniqueSentences.join('. ').trim();
    
    return {
      success: extractedText.length > 10,
      text: extractedText,
      metadata: {
        pages,
        fileSizeKB: 0,
        formFields: 0,
        extractionMethod: 'Plain Text Search',
        textLength: extractedText.length
      }
    };
  }

  /**
   * Get page count from PDF binary content
   */
  private countPagesFromBinary(pdfContent: string): number {
    const countMatch = pdfContent.match(/\/Count\s+(\d+)/);
    if (countMatch) {
      return parseInt(countMatch[1], 10);
    }
    
    // Fallback: count page objects
    const pageMatches = pdfContent.match(/\/Type\s*\/Page[^s]/g) || [];
    return pageMatches.length || 1;
  }
  
  /**
   * Get page count using pdf-lib
   */
  private async getPageCount(arrayBuffer: ArrayBuffer): Promise<number> {
    try {
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      return pdfDoc.getPageCount();
    } catch {
      return 0;
    }
  }

  /**
   * Clean and normalize extracted PDF text
   */
  private cleanExtractedText(text: string): string {
    if (!text) return '';
    
    return text
      .replace(/\\n/g, '\n')           // Convert literal newlines
      .replace(/\\r/g, '\r')           // Convert literal carriage returns  
      .replace(/\\t/g, '\t')           // Convert literal tabs
      .replace(/\\(.)/g, '$1')         // Remove escape characters
      .replace(/\s+/g, ' ')            // Normalize whitespace
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '') // Remove control chars
      .trim();
  }

  /**
   * Check if text appears to be valid English content
   * Filters out garbled binary artifacts from PDF parsing
   */
  private isValidEnglishText(text: string): boolean {
    // Remove whitespace for analysis
    const cleanText = text.replace(/\s/g, '');
    
    if (cleanText.length < 2) return false;
    
    // Count English letters vs other characters
    const englishLetters = cleanText.match(/[a-zA-Z]/g)?.length || 0;
    const totalChars = cleanText.length;
    
    // More lenient thresholds - must be at least 40% English letters for short text
    // Must be at least 30% English letters for longer text
    const threshold = totalChars < 10 ? 0.4 : 0.3;
    const englishRatio = englishLetters / totalChars;
    
    if (englishRatio < threshold) return false;
    
    // Check for excessive binary artifacts (more lenient)
    const binaryArtifacts = text.match(/[\x00-\x08\x0E-\x1F\x7F-\xFF]/g)?.length || 0;
    const binaryRatio = binaryArtifacts / text.length;
    if (binaryRatio > 0.3) return false; // Allow up to 30% binary characters
    
    // Check for reasonable word patterns (not just random letters)
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const validWords = words.filter(word => {
      // Allow more flexible word patterns including numbers and common punctuation
      return /^[a-zA-Z0-9][a-zA-Z0-9\-.',:;()]*[a-zA-Z0-9]?$/.test(word) && word.length <= 30;
    });
    
    // At least 40% of words should look valid (more lenient)
    const wordValidityRatio = words.length > 0 ? validWords.length / words.length : 0;
    return wordValidityRatio >= 0.4;
  }
}

// Export a singleton instance for easy use
export const pdfTextExtractor = new PdfTextExtractor();