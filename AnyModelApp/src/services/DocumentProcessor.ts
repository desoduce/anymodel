import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { pdfTextExtractor } from './PdfTextExtractor';
import ocrService, { OCRResult } from './OCRService';
import EncryptedStorage from './EncryptedStorage';

// PII filtering function that uses custom filters from encrypted storage
async function filterPII(text: string): Promise<string> {
  let filteredText = text;
  
  try {
    // Get custom filters from encrypted storage
    const customKeywords = await EncryptedStorage.getFilterKeywords();
    const customPatterns = await EncryptedStorage.getFilterPatterns();
    
    // Apply custom keyword filters (simple string matching, case-insensitive)
    for (const keyword of customKeywords) {
      if (keyword && keyword.trim()) {
        const escapedKeyword = keyword.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape special chars
        const regex = new RegExp(escapedKeyword, 'gi');
        filteredText = filteredText.replace(regex, '[FILTERED]');
      }
    }
    
    // Apply custom regex pattern filters
    for (const pattern of customPatterns) {
      if (pattern && pattern.trim()) {
        try {
          const regex = new RegExp(pattern.trim(), 'gi');
          filteredText = filteredText.replace(regex, '[FILTERED]');
        } catch (regexError) {
          if (__DEV__) console.warn('Invalid regex pattern, skipping:', pattern, regexError);
        }
      }
    }
    
  } catch (storageError) {
    if (__DEV__) console.warn('Error loading custom filters, using default filters only:', storageError);
  }
  
  // Apply default PII filtering (always applied)
  filteredText = filteredText
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN-FILTERED]')
    .replace(/\b\d{3}-\d{3}-\d{4}\b/g, '[PHONE-FILTERED]')
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL-FILTERED]')
    // ZIP code filtering - only when associated with addresses (BEFORE address filtering to preserve context)
    // Pattern 1: ZIP code column headers - filter entire column including header (e.g., "Zip Code: 12345", "Zip:94231", "ZIP-CODE: 90210", "Postal Code: 12345")
    .replace(/\b(zip[\s\-]?code|postal[\s\-]?code|zip)[\s:]*(\d{5}(-\d{4})?)\b/gi, '[ZIP-COLUMN-FILTERED]')
    // Pattern 1b: Explicit ZIP code references in sentences (e.g., "zip code 12345", "the zip code is 12345")  
    .replace(/\b((?:the\s+)?zip[\s\-]?code[\s]*(is\s*)?)\s*(\d{5}(-\d{4})?)\b/gi, '$1[ZIP-FILTERED]')
    // Pattern 2: Full address with ZIP (e.g., "123 Main Street, City 12345")
    .replace(/(\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Circle|Cir|Court|Ct|Place|Pl)\b[^,\n]*?,?\s*[A-Za-z]*\s+)(\d{5}(-\d{4})?)\b/gi, '$1[ZIP-FILTERED]')
    // Pattern 3: ZIP before street address (e.g., "12345 Main Street")  
    .replace(/\b(\d{5}(-\d{4})?)\s+([A-Za-z]+\s+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Circle|Cir|Court|Ct|Place|Pl))\b/gi, '[ZIP-FILTERED] $3')
    // PO BOX address filtering (e.g., "PO Box 12345", "P.O. Box 567", "Post Office Box 890")
    .replace(/\b(P\.?O\.?\s+Box|Post\s+Office\s+Box)\s+\d+\b/gi, '[PO-BOX-FILTERED]')
    // Apartment/Unit address filtering (e.g., "123 Main St Apt 4B", "456 Oak Ave Unit 12", "789 Pine Rd #5A")
    .replace(/\b(\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Circle|Cir|Court|Ct|Place|Pl|Real|Way|Pkwy|Parkway|Terrace|Ter)\b)\s+(?:Apt|Apartment|Unit|Ste|Suite|#)\s*[A-Za-z0-9]+\b/gi, '[UNIT-ADDRESS-FILTERED]')
    // Complete address filtering - comprehensive pattern to catch all address + ZIP combinations
    .replace(/\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Circle|Cir|Court|Ct|Place|Pl|Real|Way|Pkwy|Parkway|Terrace|Ter|ave|st|rd|dr|ln|blvd)\b[^|]*?(?:[A-Za-z\s]+,\s*[A-Za-z]{2})?\s*\d{5}(?:-\d{4})?\b/gi, '[ADDRESS-FILTERED]')
    // Fallback: addresses with city/state but no ZIP
    .replace(/\b(\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Circle|Cir|Court|Ct|Place|Pl|Real|Way|Pkwy|Parkway|Terrace|Ter|ave|st|rd|dr|ln|blvd)\b[^,\n]*?,?\s*)([A-Za-z\s]+),\s*([A-Za-z]{2})\b/gi, '[ADDRESS-FILTERED]')
    // City, State, ZIP filtering (e.g., "New York, NY 10001" or "Los Angeles, CA 90210-1234")
    .replace(/\b([A-Za-z\s]+),\s*([A-Z]{2})\s+(\d{5}(-\d{4})?)\b/gi, '[LOCATION-FILTERED]')
    // City, State filtering (e.g., "Sunnyvale, CA")
    .replace(/\b([A-Za-z\s]+),\s*([A-Z]{2})\b/gi, '[CITY-STATE-FILTERED]')
    // Address filtering (based on backend patterns) - AFTER other filtering
    .replace(/\b\d+\s+[A-Za-z\s]+(Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Circle|Cir|Court|Ct|Place|Pl|Real|Way|Pkwy|Parkway|Terrace|Ter)\b/gi, '[ADDRESS-FILTERED]')
    .replace(/\b\d+\s+[A-Za-z\s]+(St|Ave|Rd|Dr|Ln|Blvd|Cir|Ct|Pl)\\.?\b/gi, '[ADDRESS-FILTERED]');
  
  return filteredText;
}

export interface DocumentResult {
  success: boolean;
  text: string;
  filename: string;
  fileSize?: number;
  error?: string;
}

class DocumentProcessor {
  async processFiles(files: { uri: string; name: string; type: string }[]): Promise<{ success: boolean; results: { success: boolean; filtered_text?: string; error?: string; filename: string; metadata?: any; pii_detected?: boolean; filtering_stats?: any }[]; summary: { total_files: number; successful: number; failed: number } }> {
    try {
      
      const results = [];
      
      for (const file of files) {
        try {
          const extractedText = await this.processFile(file.uri, file.name, file.type);
          results.push({ 
            success: true,
            filtered_text: extractedText,
            filename: file.name,
            pii_detected: false,
            metadata: { length: extractedText.length }
          });
        } catch (error) {
          const errorMessage = `Error processing ${file.name}: ${error instanceof Error ? error.message : String(error)}`;
          results.push({ 
            success: false,
            error: errorMessage,
            filename: file.name
          });
        }
      }
      
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      return {
        success: true,
        results,
        summary: {
          total_files: files.length,
          successful,
          failed
        }
      };
      
    } catch (error) {
      if (__DEV__) console.error('❌ Batch file processing failed:', error);
      return {
        success: false,
        results: [],
        summary: {
          total_files: files.length,
          successful: 0,
          failed: files.length
        }
      };
    }
  }

  async processFile(uri: string, filename: string, mimeType: string): Promise<string> {
    try {
      
      let extractedText = '';

      // Route to appropriate handler based on MIME type or file extension
      if (this.isWordDocument(mimeType, filename)) {
        extractedText = await this.extractDocxText(uri, filename);
      } else if (this.isPdfDocument(mimeType, filename)) {
        extractedText = await this.extractPdfText(uri);
      } else if (this.isSpreadsheetFile(mimeType, filename)) {
        extractedText = await this.extractSpreadsheetText(uri, filename, mimeType);
      } else if (this.isTextFile(mimeType, filename)) {
        extractedText = await this.extractTextFile(uri, filename);
      } else if (this.isImageFile(mimeType, filename)) {
        extractedText = await this.processImageFile(uri, filename);
      } else {
        throw new Error(`Unsupported file type: ${mimeType}`);
      }

      // Apply PII filtering to the extracted text
      const filteredText = await filterPII(extractedText);
      
      return filteredText;
      
    } catch (error) {
      if (__DEV__) console.error('❌ Document processing failed:', error);
      throw error;
    }
  }

  private isWordDocument(mimeType: string, filename: string): boolean {
    const wordMimeTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    const wordExtensions = ['.docx', '.doc'];
    
    return wordMimeTypes.includes(mimeType) || 
           wordExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  }

  private isPdfDocument(mimeType: string, filename: string): boolean {
    return mimeType === 'application/pdf' || filename.toLowerCase().endsWith('.pdf');
  }

  private isSpreadsheetFile(mimeType: string, filename: string): boolean {
    const spreadsheetMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    const spreadsheetExtensions = ['.xlsx', '.xls', '.csv'];
    
    return spreadsheetMimeTypes.includes(mimeType) || 
           spreadsheetExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  }

  private isTextFile(mimeType: string, filename: string): boolean {
    return mimeType.startsWith('text/') || filename.toLowerCase().endsWith('.txt');
  }

  private isImageFile(mimeType: string, filename: string): boolean {
    return mimeType.startsWith('image/') || 
           ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'].some(ext => 
             filename.toLowerCase().endsWith(ext));
  }

  private async extractDocxText(uri: string, filename: string): Promise<string> {
    try {
      
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();
      
      const result = await mammoth.extractRawText({ arrayBuffer });
      
      if (result.value && result.value.trim()) {
        return `Word Document Analysis
========================================
File: ${filename}
Content: ${result.value.length} characters

📄 EXTRACTED TEXT:
${result.value.trim()}

✅ Word document processing completed successfully!`;
      } else {
        return `Word Document (${filename}) - No text content found`;
      }
      
    } catch (error) {
      if (__DEV__) console.error('📄 Word document processing failed:', error);
      throw new Error(`Failed to process Word document: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async extractPdfText(uri: string): Promise<string> {
    try {
      const result = await pdfTextExtractor.extractText(uri);
      
      if (result.success && result.text && result.text.trim()) {
        return `PDF Document Analysis
========================================
Pages: ${result.metadata.pages}
Content: ${result.text.length} characters

📄 EXTRACTED TEXT:
${result.text.trim()}

✅ PDF processing completed successfully!`;
      } else {
        return 'PDF Document - No extractable text found (may contain images or be password protected)';
      }
      
    } catch (error) {
      if (__DEV__) console.error('📄 PDF processing failed:', error);
      throw new Error(`Failed to process PDF: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async extractSpreadsheetText(uri: string, filename: string, mimeType: string): Promise<string> {
    try {
      
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();
      
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      let text = `Excel Spreadsheet Analysis
========================================
File: ${filename}
Sheets: ${workbook.SheetNames.length}

`;
      
      // Process each sheet
      workbook.SheetNames.forEach((sheetName, index) => {
        if (__DEV__) console.log(`🔍 Processing sheet: "${sheetName}"`);
        const worksheet = workbook.Sheets[sheetName];
        
        if (!worksheet) {
          if (__DEV__) console.log(`⚠️ Worksheet "${sheetName}" is null or undefined`);
          text += `📊 Sheet ${index + 1}: "${sheetName}" - Could not access worksheet

`;
          return;
        }
        
        if (__DEV__) console.log(`✅ Worksheet "${sheetName}" found, converting to CSV...`);
        const csvData = XLSX.utils.sheet_to_csv(worksheet);
        if (__DEV__) console.log(`📊 CSV data length for "${sheetName}": ${csvData.length}`);
        
        if (csvData.trim()) {
          text += `📊 Sheet ${index + 1}: "${sheetName}"
${csvData}

`;
          if (__DEV__) console.log(`✅ Added ${csvData.length} characters from sheet "${sheetName}"`);
        } else {
          if (__DEV__) console.log(`⚠️ Sheet "${sheetName}" converted to empty CSV`);
          text += `📊 Sheet ${index + 1}: "${sheetName}" - Empty

`;
        }
      });
      
      return text.trim();
      
    } catch (error) {
      if (__DEV__) console.error('📊 Spreadsheet processing failed:', error);
      throw new Error(`Failed to process spreadsheet: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async extractTextFile(uri: string, filename: string): Promise<string> {
    try {
      
      const response = await fetch(uri);
      const text = await response.text();
      
      return `Text File Analysis
========================================
File: ${filename}
Content: ${text.length} characters

📝 FILE CONTENT:
${text}

✅ Text file processing completed!`;
      
    } catch (error) {
      if (__DEV__) console.error('📝 Text file processing failed:', error);
      throw new Error(`Failed to process text file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async processImageFile(uri: string, filename: string): Promise<string> {
    try {
      
      const ocrResult: OCRResult = await ocrService.extractTextFromUri(uri);
      
      if (ocrResult.success && ocrResult.text && ocrResult.text.trim()) {
        return `Image OCR Analysis
========================================
File: ${filename}
OCR Confidence: ${ocrResult.confidence}%
Processing Time: ${ocrResult.processingTime}ms

🖼️ EXTRACTED TEXT:
${ocrResult.text.trim()}

✅ OCR processing completed successfully!`;
      } else {
        return `Image File: ${filename}
OCR processing completed but no readable text found.

💡 This image may contain:
- Graphics, charts, or diagrams without text
- Text that's too small or blurry to recognize
- Handwritten text (OCR works best with printed text)`;
      }
      
    } catch (error) {
      if (__DEV__) console.error('🖼️ Image OCR processing failed:', error);
      return `Image File: ${filename}
OCR processing failed: ${error instanceof Error ? error.message : String(error)}

💡 Try using a clearer image or convert to PDF for better text recognition.`;
    }
  }

  getSupportedTypes(): string[] {
    return [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/webp'
    ];
  }
}

export default new DocumentProcessor();