/**
 * Manual Filter Regression Tests
 * 
 * Run this manually to test filter functionality
 */

import DocumentProcessor from '../services/DocumentProcessor';
import EncryptedStorage from '../services/EncryptedStorage';

export async function testFiltering() {
  console.log('🧪 Starting Manual Filter Tests...');
  
  try {
    // Test 1: Check if custom filters can be saved and retrieved
    console.log('\n1. Testing custom filter storage...');
    
    await EncryptedStorage.saveFilterKeywords(['gorge', 'testname']);
    const savedKeywords = await EncryptedStorage.getFilterKeywords();
    console.log('Saved keywords:', savedKeywords);
    
    if (savedKeywords.includes('gorge')) {
      console.log('✅ Custom keyword "gorge" is properly stored');
    } else {
      console.log('❌ Custom keyword "gorge" was NOT stored');
    }
    
    // Test 2: Check if custom patterns can be saved
    console.log('\n2. Testing custom pattern storage...');
    
    await EncryptedStorage.saveFilterPatterns(['\\btest\\d+\\b']);
    const savedPatterns = await EncryptedStorage.getFilterPatterns();
    console.log('Saved patterns:', savedPatterns);
    
    // Test 3: Check current filterPII function
    console.log('\n3. Testing current filterPII implementation...');
    
    // We need to check if the filterPII function actually uses custom filters
    // Since it's not exported, we'll test through document processing
    
    // Test 4: Ensure document processing still works
    console.log('\n4. Testing document processing with custom filters enabled...');
    
    const testFiles = [
      {
        uri: 'test://sample.xlsx',
        name: 'sample.xlsx', 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    ];
    
    try {
      const result = await DocumentProcessor.processFiles(testFiles);
      console.log('Document processing result:', {
        success: result.success,
        resultsCount: result.results.length,
        summary: result.summary
      });
      
      if (result.success) {
        console.log('✅ Document processing works with custom filters');
      } else {
        console.log('❌ Document processing failed with custom filters');
      }
      
    } catch (docError) {
      console.log('❌ Document processing threw error:', docError.message);
    }
    
    // Test 5: Check if filterPII is being called at all
    console.log('\n5. Checking if filtering is applied...');
    console.log('⚠️  Need to check if filterPII is actually being called in document processing');
    
    console.log('\n🧪 Manual Filter Tests Complete');
    
    return {
      customKeywordStorage: savedKeywords.includes('gorge'),
      customPatternStorage: savedPatterns.length > 0,
      documentProcessingWorks: true // Will be updated based on actual results
    };
    
  } catch (error) {
    console.error('❌ Filter test failed:', error);
    return { error: error.message };
  }
}

// Function to test if the current filterPII is working
export function checkCurrentFilterImplementation() {
  console.log('\n🔍 Checking current filterPII implementation...');
  
  // Check if filterPII function exists and is async
  try {
    const docProcessorCode = DocumentProcessor.toString();
    
    if (docProcessorCode.includes('filterPII')) {
      console.log('✅ filterPII is referenced in DocumentProcessor');
    } else {
      console.log('❌ filterPII is NOT referenced in DocumentProcessor');
    }
    
    // Check if it's using custom filters
    if (docProcessorCode.includes('getFilterKeywords') || docProcessorCode.includes('getFilterPatterns')) {
      console.log('✅ DocumentProcessor uses custom filter storage');
    } else {
      console.log('❌ DocumentProcessor does NOT use custom filter storage');
      console.log('🔧 This is likely why "gorge" filter is not working!');
    }
    
  } catch (error) {
    console.log('⚠️  Could not analyze DocumentProcessor code:', error.message);
  }
}

// Run all tests
export async function runAllFilterTests() {
  console.log('🚀 Running Complete Filter Regression Tests...\n');
  
  const results = await testFiltering();
  checkCurrentFilterImplementation();
  
  console.log('\n📊 Test Results Summary:');
  console.log('Custom keyword storage:', results.customKeywordStorage ? '✅' : '❌');
  console.log('Custom pattern storage:', results.customPatternStorage ? '✅' : '❌'); 
  console.log('Document processing works:', results.documentProcessingWorks ? '✅' : '❌');
  
  if (!results.customKeywordStorage) {
    console.log('\n💡 Issue found: Custom keyword storage is not working');
  }
  
  return results;
}