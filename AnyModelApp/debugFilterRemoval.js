/**
 * Debug test for filter removal issue
 */

import EncryptedStorage from './src/services/EncryptedStorage.ts';

async function debugFilterRemoval() {
  console.log('🔍 Debugging Filter Removal Issue...\n');

  try {
    // Test 1: Add filters
    console.log('1. Adding test filters...');
    await EncryptedStorage.saveFilterKeywords(['gorge', 'testfilter']);
    await EncryptedStorage.saveFilterPatterns(['\\btest\\d+\\b']);
    
    let keywords = await EncryptedStorage.getFilterKeywords();
    let patterns = await EncryptedStorage.getFilterPatterns();
    
    console.log('   Keywords after adding:', keywords);
    console.log('   Patterns after adding:', patterns);
    
    if (keywords.length === 0 && patterns.length === 0) {
      console.log('❌ Filters were not saved properly!');
      return;
    }
    
    // Test 2: Clear filters
    console.log('\n2. Clearing filters...');
    await EncryptedStorage.clearFilterKeywords();
    await EncryptedStorage.clearFilterPatterns();
    
    // Test 3: Verify they're cleared immediately
    console.log('\n3. Checking if filters cleared immediately...');
    keywords = await EncryptedStorage.getFilterKeywords();
    patterns = await EncryptedStorage.getFilterPatterns();
    
    console.log('   Keywords after clearing:', keywords);
    console.log('   Patterns after clearing:', patterns);
    
    if (keywords.length > 0 || patterns.length > 0) {
      console.log('❌ PROBLEM FOUND: Filters not cleared properly!');
      console.log('   Keywords still present:', keywords);
      console.log('   Patterns still present:', patterns);
      
      // Debug storage keys
      console.log('\n🔍 Debugging storage keys...');
      
      // Check what's actually in AsyncStorage
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      
      const keywordsRaw = await AsyncStorage.default.getItem(EncryptedStorage.FILTER_KEYWORDS_STORAGE_KEY);
      const patternsRaw = await AsyncStorage.default.getItem(EncryptedStorage.FILTER_PATTERNS_STORAGE_KEY);
      
      console.log('   Raw keywords in storage:', keywordsRaw);
      console.log('   Raw patterns in storage:', patternsRaw);
      
      if (keywordsRaw === null && patternsRaw === null) {
        console.log('✅ Storage is actually clear - might be a caching issue in EncryptedStorage');
      } else {
        console.log('❌ Storage still contains data - clearFilter functions not working');
      }
      
    } else {
      console.log('✅ Filters cleared successfully!');
    }
    
    // Test 4: Test if filtering still happens after clearing
    console.log('\n4. Testing if filtering still applies after clearing...');
    
    // Import DocumentProcessor and test with a document containing "gorge"
    const { default: DocumentProcessor } = await import('./src/services/DocumentProcessor.ts');
    
    // This is tricky since we can't directly test filterPII, but we can check if the behavior changes
    console.log('   Note: To fully test this, upload a document with "gorge" and see if it gets filtered');
    
    console.log('\n🎯 Filter Removal Debug Complete');
    
  } catch (error) {
    console.error('❌ Debug test failed:', error);
  }
}

// Also test multiple clear operations
async function testMultipleClearOperations() {
  console.log('\n🔄 Testing Multiple Clear Operations...');
  
  try {
    // Add filters
    await EncryptedStorage.saveFilterKeywords(['persistent']);
    
    // Clear multiple times
    await EncryptedStorage.clearFilterKeywords();
    await EncryptedStorage.clearFilterKeywords(); // Should not fail
    await EncryptedStorage.clearFilterKeywords(); // Should not fail
    
    const result = await EncryptedStorage.getFilterKeywords();
    console.log('Keywords after multiple clears:', result);
    
    if (result.length === 0) {
      console.log('✅ Multiple clear operations work correctly');
    } else {
      console.log('❌ Multiple clear operations failed');
    }
    
  } catch (error) {
    console.error('❌ Multiple clear test failed:', error);
  }
}

// Run debug tests
debugFilterRemoval()
  .then(() => testMultipleClearOperations())
  .then(() => {
    console.log('\n🏁 All debugging tests complete');
    console.log('💡 If filters still persist after clearing, the issue might be:');
    console.log('   1. Caching in EncryptedStorage class');
    console.log('   2. Multiple instances of EncryptedStorage');
    console.log('   3. Timing issues with async operations');
    console.log('   4. The UI not calling the clear functions properly');
  })
  .catch(error => {
    console.error('💥 Debug tests crashed:', error);
  });