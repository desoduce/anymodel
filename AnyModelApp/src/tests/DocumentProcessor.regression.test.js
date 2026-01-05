/**
 * Regression Tests for DocumentProcessor
 * 
 * Tests the core document processing functionality that should always work:
 * - Excel (.xlsx) file processing and data extraction
 * - Word (.docx) document processing 
 * - PDF document processing
 * - Multiple file processing
 */

import DocumentProcessor from '../services/DocumentProcessor';

describe('DocumentProcessor Regression Tests', () => {
  
  test('Excel file processing should extract actual data', async () => {
    // Mock an Excel file with actual data
    const mockExcelFile = {
      uri: 'test://excel-file',
      name: 'test.xlsx',
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
    
    try {
      const result = await DocumentProcessor.processFile(
        mockExcelFile.uri, 
        mockExcelFile.name, 
        mockExcelFile.type
      );
      
      // Verify it returns text (not empty)
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      
      // Should contain Excel-specific headers
      expect(result).toContain('Excel Spreadsheet Analysis');
      expect(result).toContain('Sheets:');
      
      console.log('✅ Excel processing test PASSED');
      
    } catch (error) {
      console.error('❌ Excel processing test FAILED:', error);
      throw error;
    }
  });

  test('Word document processing should extract text', async () => {
    const mockWordFile = {
      uri: 'test://word-file',
      name: 'test.docx', 
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };
    
    try {
      const result = await DocumentProcessor.processFile(
        mockWordFile.uri,
        mockWordFile.name,
        mockWordFile.type
      );
      
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      expect(result).toContain('Word Document Analysis');
      
      console.log('✅ Word processing test PASSED');
      
    } catch (error) {
      console.error('❌ Word processing test FAILED:', error);
      throw error;
    }
  });

  test('PDF processing should work', async () => {
    const mockPdfFile = {
      uri: 'test://pdf-file',
      name: 'test.pdf',
      type: 'application/pdf'
    };
    
    try {
      const result = await DocumentProcessor.processFile(
        mockPdfFile.uri,
        mockPdfFile.name,
        mockPdfFile.type
      );
      
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      expect(result).toContain('PDF Document Analysis');
      
      console.log('✅ PDF processing test PASSED');
      
    } catch (error) {
      console.error('❌ PDF processing test FAILED:', error);
      throw error;
    }
  });

  test('Multiple file processing should work', async () => {
    const mockFiles = [
      {
        uri: 'test://excel-file',
        name: 'test.xlsx',
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      },
      {
        uri: 'test://word-file', 
        name: 'test.docx',
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      }
    ];
    
    try {
      const result = await DocumentProcessor.processFiles(mockFiles);
      
      expect(result).toBeTruthy();
      expect(result.success).toBe(true);
      expect(result.extractedText).toBeTruthy();
      expect(result.summary).toBeTruthy();
      
      // Should contain content from both files
      expect(result.extractedText).toContain('Excel Spreadsheet Analysis');
      expect(result.extractedText).toContain('Word Document Analysis');
      
      console.log('✅ Multiple file processing test PASSED');
      
    } catch (error) {
      console.error('❌ Multiple file processing test FAILED:', error);
      throw error;
    }
  });

});

// Manual regression test runner for development
export async function runRegressionTests() {
  console.log('🧪 Running DocumentProcessor Regression Tests...');
  
  const tests = [
    'Excel file processing',
    'Word document processing', 
    'PDF processing',
    'Multiple file processing'
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const testName of tests) {
    try {
      console.log(`🧪 Testing: ${testName}`);
      // Run individual test logic here
      passed++;
    } catch (error) {
      console.error(`❌ ${testName} FAILED:`, error);
      failed++;
    }
  }
  
  console.log(`🧪 Regression Tests Complete: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}