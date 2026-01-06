/**
 * Simple test to verify AES-256 encryption works correctly
 * Run with: node test-encryption.js
 */

const CryptoJS = require('crypto-js');

console.log('Testing AES-256 Encryption...\n');

// Simulate encryption key
const testKey = 'test-encryption-key-12345';

// Test data (API keys)
const testApiKeys = {
  openai: 'sk-test-openai-key-123456789',
  anthropic: 'sk-ant-test-claude-key-987654321',
  gemini: 'AI-test-gemini-key-abc123',
  ollama_url: 'http://localhost:11434',
  openrouter: 'sk-or-test-openrouter-key-xyz789'
};

console.log('1. Original Data:');
console.log(JSON.stringify(testApiKeys, null, 2));
console.log('');

// Encrypt
const jsonData = JSON.stringify(testApiKeys);
const encrypted = CryptoJS.AES.encrypt(jsonData, testKey).toString();
console.log('2. Encrypted Data (AES-256):');
console.log(encrypted.substring(0, 100) + '...');
console.log(`Length: ${encrypted.length} characters`);
console.log('');

// Decrypt
const decrypted = CryptoJS.AES.decrypt(encrypted, testKey);
const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
const decryptedData = JSON.parse(decryptedString);

console.log('3. Decrypted Data:');
console.log(JSON.stringify(decryptedData, null, 2));
console.log('');

// Verify
const matches = JSON.stringify(testApiKeys) === JSON.stringify(decryptedData);
console.log('4. Verification:');
console.log(`   Encryption/Decryption: ${matches ? '✅ PASSED' : '❌ FAILED'}`);
console.log(`   OpenAI Key Match: ${testApiKeys.openai === decryptedData.openai ? '✅' : '❌'}`);
console.log(`   Anthropic Key Match: ${testApiKeys.anthropic === decryptedData.anthropic ? '✅' : '❌'}`);
console.log(`   Gemini Key Match: ${testApiKeys.gemini === decryptedData.gemini ? '✅' : '❌'}`);
console.log('');

// Test with wrong key
console.log('5. Testing with Wrong Key:');
try {
  const wrongKey = 'wrong-key-should-fail';
  const badDecrypt = CryptoJS.AES.decrypt(encrypted, wrongKey);
  const badString = badDecrypt.toString(CryptoJS.enc.Utf8);
  if (!badString) {
    console.log('   ✅ Correctly failed to decrypt with wrong key');
  } else {
    console.log('   ❌ WARNING: Decrypted with wrong key (should not happen)');
  }
} catch (error) {
  console.log('   ✅ Correctly threw error with wrong key');
}

console.log('\n✅ AES-256 Encryption Test Complete!');
