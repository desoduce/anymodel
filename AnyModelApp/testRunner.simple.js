/**
 * Simple test runner that doesn't require Jest
 */

// Mock required React Native modules for Node.js environment
const mockAsyncStorage = {
  storage: {},
  setItem: async function(key, value) {
    console.log(`📦 AsyncStorage.setItem: ${key}`);
    this.storage[key] = value;
    return Promise.resolve();
  },
  getItem: async function(key) {
    const value = this.storage[key] || null;
    console.log(`📦 AsyncStorage.getItem: ${key} = ${value ? 'found' : 'null'}`);
    return Promise.resolve(value);
  },
  removeItem: async function(key) {
    console.log(`📦 AsyncStorage.removeItem: ${key}`);
    delete this.storage[key];
    return Promise.resolve();
  }
};

// Simple module mock system
const moduleCache = {};

const originalRequire = require;
require = function(id) {
  // Mock React Native modules
  if (id === '@react-native-async-storage/async-storage') {
    return { default: mockAsyncStorage };
  }
  if (id === 'expo-crypto') {
    return { randomUUID: async () => 'test-uuid-' + Date.now() };
  }
  if (id === 'react-native-keychain') {
    return {
      getInternetCredentials: async () => ({ password: 'test-key-12345' }),
      setInternetCredentials: async () => true
    };
  }
  
  return originalRequire(id);
};

async function runSimpleFilterTest() {
  console.log('🧪 Running Simple Filter Test (No React Native dependencies)...\n');
  
  try {
    // Test the EncryptedStorage directly
    console.log('1. Testing EncryptedStorage directly...');
    const EncryptedStorage = originalRequire('./src/services/EncryptedStorage.ts').default;
    
    // Test save/load cycle
    console.log('2. Testing save/load keywords...');
    await EncryptedStorage.saveFilterKeywords(['gorge', 'test-keyword']);
    const keywords = await EncryptedStorage.getFilterKeywords();
    console.log('Retrieved keywords:', keywords);
    
    // Test patterns
    console.log('3. Testing save/load patterns...');
    await EncryptedStorage.saveFilterPatterns(['\\d{3}-\\d{2}-\\d{4}']);
    const patterns = await EncryptedStorage.getFilterPatterns();
    console.log('Retrieved patterns:', patterns);
    
    // Test clear
    console.log('4. Testing clear functionality...');
    await EncryptedStorage.clearFilterKeywords();
    const clearedKeywords = await EncryptedStorage.getFilterKeywords();
    console.log('Keywords after clear:', clearedKeywords);
    
    console.log('\n✅ EncryptedStorage baseline tests completed');
    
    return {
      keywordSave: keywords.includes('gorge'),
      patternSave: patterns.length > 0,
      clearWorks: clearedKeywords.length === 0
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return { error: error.message };
  }
}

runSimpleFilterTest()
  .then(results => {
    console.log('\n📊 Test Results:');
    console.log(`Keyword Save: ${results.keywordSave ? '✅' : '❌'}`);
    console.log(`Pattern Save: ${results.patternSave ? '✅' : '❌'}`);
    console.log(`Clear Works: ${results.clearWorks ? '✅' : '❌'}`);
    
    if (results.error) {
      console.log(`Error: ${results.error}`);
    }
  })
  .catch(console.error);
