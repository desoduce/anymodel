import MlkitOcr, { MlkitOcrResult } from 'react-native-mlkit-ocr';
import * as ImageManipulator from 'expo-image-manipulator';

export interface OCRResult {
  success: boolean;
  text?: string;
  error?: string;
  confidence?: number;
  processingTime?: number;
  blocks?: TextBlock[];
}

export interface TextBlock {
  text: string;
  confidence: number;
  frame?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface OCROptions {
  language?: string;
  maxImageSize?: number;
  compressQuality?: number;
}

/**
 * OCR Service - On-device text recognition using Google MLKit
 * 
 * Provides fast, privacy-focused text extraction from images using
 * Google's MLKit Text Recognition API running locally on device.
 */
class OCRService {
  /**
   * Extract text from image URI using MLKit OCR
   */
  async extractTextFromUri(uri: string, options?: OCROptions): Promise<OCRResult> {
    const startTime = Date.now();
    if (__DEV__) console.log('🔍 Starting MLKit OCR for:', uri);
    
    try {
      // Check if OCR is available
      const available = await this.isOCRAvailable();
      if (!available) {
        return {
          success: false,
          error: 'MLKit OCR is not available on this device or platform',
          processingTime: Date.now() - startTime
        };
      }

      // Prepare image if needed (resize/compress)
      let imageUri = uri;
      if (options?.maxImageSize || options?.compressQuality) {
        imageUri = await this.prepareImage(uri, options);
      }

      // Perform OCR using MLKit
      const result: MlkitOcrResult = await MlkitOcr.detectFromUri(imageUri);
      const processingTime = Date.now() - startTime;

      if (!result || !result.length) {
        if (__DEV__) console.log('📄 OCR completed - no text detected');
        return {
          success: true,
          text: '',
          blocks: [],
          processingTime,
          confidence: 0
        };
      }

      // Process MLKit results
      const textBlocks: TextBlock[] = [];
      let fullText = '';
      let totalConfidence = 0;

      result.forEach((block) => {
        const blockText = block.text || '';
        if (blockText.trim()) {
          fullText += blockText + '\n';
          
          // Calculate confidence (MLKit provides confidence per text element)
          const confidence = this.calculateBlockConfidence(block);
          totalConfidence += confidence;
          
          textBlocks.push({
            text: blockText,
            confidence,
            frame: block.bounding ? {
              x: block.bounding.left || 0,
              y: block.bounding.top || 0,
              width: block.bounding.width || 0,
              height: block.bounding.height || 0
            } : undefined
          });
        }
      });

      const avgConfidence = textBlocks.length > 0 ? totalConfidence / textBlocks.length : 0;
      const cleanText = fullText.trim();

      if (__DEV__) console.log(`✅ OCR completed: ${cleanText.length} characters, ${textBlocks.length} blocks, ${avgConfidence.toFixed(2)}% confidence`);

      return {
        success: true,
        text: cleanText,
        blocks: textBlocks,
        confidence: avgConfidence,
        processingTime
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      if (__DEV__) console.error('❌ OCR processing failed:', error);
      
      return {
        success: false,
        error: `OCR processing failed: ${error instanceof Error ? error.message : String(error)}`,
        processingTime
      };
    }
  }

  /**
   * Check if OCR is available on the device
   */
  async isOCRAvailable(): Promise<boolean> {
    try {
      // Try to access MLKit - this will fail gracefully if not available
      // In Expo managed workflow, this requires a development build
      return typeof MlkitOcr.detectFromUri === 'function';
    } catch (error) {
      if (__DEV__) console.log('MLKit OCR not available:', error);
      return false;
    }
  }

  /**
   * Prepare image for OCR processing (resize/compress if needed)
   */
  private async prepareImage(uri: string, options: OCROptions): Promise<string> {
    try {
      const manipulationActions = [];
      
      if (options.maxImageSize) {
        manipulationActions.push({ resize: { width: options.maxImageSize } });
      }
      
      const result = await ImageManipulator.manipulateAsync(uri, manipulationActions, {
        compress: options.compressQuality || 0.8,
        format: ImageManipulator.SaveFormat.JPEG,
      });
      
      return result.uri;
    } catch (error) {
      if (__DEV__) console.warn('Image preparation failed, using original:', error);
      return uri;
    }
  }

  /**
   * Calculate confidence for a text block from MLKit result
   */
  private calculateBlockConfidence(block: any): number {
    // MLKit doesn't always provide confidence scores
    // We'll estimate based on text characteristics
    const text = block.text || '';
    if (!text.trim()) return 0;
    
    // Simple heuristic: longer text with more alphanumeric chars = higher confidence
    const alphanumericRatio = (text.match(/[a-zA-Z0-9]/g) || []).length / text.length;
    const lengthFactor = Math.min(text.length / 10, 1); // Normalize to 0-1
    
    return Math.round((alphanumericRatio * 0.7 + lengthFactor * 0.3) * 100);
  }

  /**
   * Get OCR service information
   */
  getServiceInfo(): { 
    name: string; 
    version: string; 
    status: string;
    supportedFormats: string[];
    features: string[];
  } {
    return {
      name: 'Google MLKit OCR',
      version: '0.3.0',
      status: 'Available (requires development build)',
      supportedFormats: ['JPEG', 'PNG', 'WEBP', 'BMP'],
      features: [
        'On-device text recognition',
        'Privacy-focused (no data sent to servers)',
        'Real-time processing',
        'Multiple language support',
        'Text block positioning',
        'Confidence scoring'
      ]
    };
  }
}

export default new OCRService();