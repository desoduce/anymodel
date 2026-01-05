/**
 * Manual Basic PII Filter Test
 * 
 * This script manually tests the basic PII filters to ensure they're working.
 */

console.log('🧪 Testing Basic PII Filters...\n');

// Test data with various PII types
const testCases = [
  {
    name: 'SSN (Social Security Numbers)',
    input: 'My SSN is 123-45-6789 and my friend SSN is 987-65-4321.',
    expectedFilter: '[SSN-FILTERED]',
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g
  },
  {
    name: 'Phone Numbers',
    input: 'Call me at 555-123-4567 or try my work number 800-555-0199.',
    expectedFilter: '[PHONE-FILTERED]',
    pattern: /\b\d{3}-\d{3}-\d{4}\b/g
  },
  {
    name: 'Email Addresses',
    input: 'Contact me at john.doe@example.com or admin@company.org for more info.',
    expectedFilter: '[EMAIL-FILTERED]',
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
  },
  {
    name: 'Street Addresses',
    input: 'I live at 123 Main Street and work at 456 Oak Avenue, also visit 789 Elm Road.',
    expectedFilter: '[ADDRESS-FILTERED]',
    pattern: /\b\d+\s+[A-Za-z\s]+(Street|Avenue|Road)\b/g
  },
  {
    name: 'Zip Codes (Context-Aware)',
    input: 'Send mail to 123 Oak Street 12345 or visit 456 Elm Ave, City 98765-4321.',
    expectedFilter: '[ZIP-FILTERED]',
    pattern: /\b\d{5}(-\d{4})?\b/g
  },
  {
    name: 'ZIP False Positives (Should NOT Filter)',
    input: 'Income is $45000, sold 12345 units, price is 98765.',
    expectedFilter: null, // Should NOT contain [ZIP-FILTERED]
    shouldNotFilter: true
  },
  {
    name: 'Mixed PII',
    input: 'John Doe, SSN: 123-45-6789, Phone: 555-123-4567, Email: john@example.com',
    expectedPatterns: ['[SSN-FILTERED]', '[PHONE-FILTERED]', '[EMAIL-FILTERED]']
  },
  {
    name: 'Full Address with ZIP',
    input: 'My address is 123 Main Street, Anytown 12345-6789',
    expectedPatterns: ['[ADDRESS-FILTERED]', '[ZIP-FILTERED]']
  },
  {
    name: 'City, State, ZIP (Location)',
    input: 'Located in New York, NY 10001 and Los Angeles, CA 90210-1234.',
    expectedFilter: '[LOCATION-FILTERED]',
    pattern: /\b[A-Za-z\s]+,\s*[A-Z]{2}\s+\d{5}(-\d{4})?\b/g
  },
  {
    name: 'Complete Address with City/State',
    input: '1000 El Camino Real, Sunnyvale, CA, zip code 94086',
    expectedPatterns: ['[ADDRESS-FILTERED]', '[LOCATION-FILTERED]']
  },
  {
    name: 'Explicit ZIP Code References',
    input: 'The zip code is 12345 and zip-code: 67890.',
    expectedFilter: '[ZIP-FILTERED]',
    pattern: /\bzip[\s\-]?code[\s:]*\s*\d{5}(-\d{4})?\b/gi
  },
  {
    name: 'ZIP Column Headers (Various)',
    input: 'Name: John, Zip Code: 94086, ZIP-CODE: 90210, Postal Code: 12345, Zip: 67890',
    expectedFilter: '[ZIP-COLUMN-FILTERED]',
    pattern: /\b(zip[\s\-]?code|postal[\s\-]?code|zip)[\s:]*\d{5}(-\d{4})?\b/gi
  },
  {
    name: 'Text ZIP References (Not Columns)',
    input: 'Please note the zip code is 12345 for this location.',
    expectedFilter: '[ZIP-FILTERED]',
    pattern: /\bthe\s+zip[\s\-]?code[\s:]*(is\s*)?\s*\d{5}(-\d{4})?\b/gi
  },
  {
    name: 'Real Data with ZIP Column (No Space)',
    input: 'Name: John Address: [ADDRESS-FILTERED], [CITY-STATE-FILTERED] Zip:94231 Income: $170,000 Age: 50',
    expectedFilter: '[ZIP-COLUMN-FILTERED]',
    pattern: /\bzip:\s*\d{5}(-\d{4})?\b/gi
  },
  {
    name: 'Complete Address with ZIP Code',
    input: '1000 El Camino Real, Sunnyvale, CA 95054',
    expectedPatterns: ['[ADDRESS-FILTERED]', '[LOCATION-FILTERED]']
  },
  {
    name: 'PO BOX Addresses',
    input: 'Send mail to PO Box 12345 or P.O. Box 567 or Post Office Box 890.',
    expectedFilter: '[PO-BOX-FILTERED]',
    pattern: /\b(P\.?O\.?\s+Box|Post\s+Office\s+Box)\s+\d+\b/gi
  },
  {
    name: 'Apartment/Unit Addresses',
    input: 'I live at 123 Main St Apt 4B and work at 456 Oak Ave Unit 12, also visit 789 Pine Rd #5A.',
    expectedFilter: '[UNIT-ADDRESS-FILTERED]',
    pattern: /\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Circle|Cir|Court|Ct|Place|Pl|Real|Way|Pkwy|Parkway|Terrace|Ter)\b\s+(?:Apt|Apartment|Unit|Ste|Suite|#)\s*[A-Za-z0-9]+\b/gi
  },
  {
    name: 'Real User Data - Complete Address with ZIP',
    input: 'Name: John, Address: 123 park ave, San jose, ca 94231, Income: $170000',
    expectedFilter: '[ADDRESS-FILTERED]',
    pattern: /123 park ave, San jose, ca 94231/gi
  },
  {
    name: 'User Table Format - Addresses with ZIP',
    input: 'Jonh | 123 park ave, San jose, ca 94231 | 170000 | 50',
    expectedFilter: '[ADDRESS-FILTERED]',
    pattern: /123 park ave, San jose, ca 94231/gi
  }
];

// Simulate the filterPII function from DocumentProcessor
function simulateFilterPII(text) {
  let filteredText = text;
  
  // Apply basic PII filtering (from DocumentProcessor.ts lines 42-50)
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
    .replace(/\b\d+\s+[A-Za-z\s]+(St|Ave|Rd|Dr|Ln|Blvd|Cir|Ct|Pl)\.?\b/gi, '[ADDRESS-FILTERED]');
  
  return filteredText;
}

// Run tests
let passedTests = 0;
let totalTests = 0;

testCases.forEach((testCase, index) => {
  console.log(`\n📋 Test ${index + 1}: ${testCase.name}`);
  console.log(`Input: "${testCase.input}"`);
  
  const result = simulateFilterPII(testCase.input);
  console.log(`Output: "${result}"`);
  
  if (testCase.shouldNotFilter) {
    // Test for false positives - should NOT filter
    totalTests++;
    if (!result.includes('[ZIP-FILTERED]')) {
      console.log(`✅ PASS: Correctly did NOT filter (no false positives)`);
      passedTests++;
    } else {
      console.log(`❌ FAIL: Incorrectly filtered (false positive detected)`);
    }
  } else if (testCase.expectedFilter) {
    // Single filter type test
    totalTests++;
    if (result.includes(testCase.expectedFilter)) {
      console.log(`✅ PASS: Contains ${testCase.expectedFilter}`);
      passedTests++;
    } else {
      console.log(`❌ FAIL: Missing ${testCase.expectedFilter}`);
    }
    
    // Check that original PII is removed (only if pattern is defined)
    if (testCase.pattern) {
      totalTests++;
      const originalMatches = testCase.input.match(testCase.pattern);
      if (originalMatches) {
        const stillHasPII = originalMatches.some(match => result.includes(match));
        if (!stillHasPII) {
          console.log(`✅ PASS: Original PII removed`);
          passedTests++;
        } else {
          console.log(`❌ FAIL: Original PII still present`);
        }
      }
    }
  } else if (testCase.expectedPatterns) {
    // Multi-filter test
    testCase.expectedPatterns.forEach(pattern => {
      totalTests++;
      if (result.includes(pattern)) {
        console.log(`✅ PASS: Contains ${pattern}`);
        passedTests++;
      } else {
        console.log(`❌ FAIL: Missing ${pattern}`);
      }
    });
  }
});

// Summary
console.log(`\n\n📊 Test Results Summary:`);
console.log(`✅ Passed: ${passedTests}/${totalTests}`);
console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);

if (passedTests === totalTests) {
  console.log(`\n🎉 ALL BASIC PII FILTERS ARE WORKING CORRECTLY!`);
} else {
  console.log(`\n⚠️  SOME BASIC PII FILTERS ARE NOT WORKING!`);
}

// Check what's missing
console.log(`\n📝 Coverage Analysis:`);
console.log(`✅ SSN filtering: Implemented`);
console.log(`✅ Phone number filtering: Implemented`); 
console.log(`✅ Email filtering: Implemented`);
console.log(`✅ Address filtering: NEWLY IMPLEMENTED`);
console.log(`✅ Zip code filtering: NEWLY IMPLEMENTED`);

console.log(`\n💡 Status:`);
if (passedTests === totalTests) {
  console.log(`- All mandate PII filters are now working correctly`);
  console.log(`- Address and Zip code filtering has been added`);
  console.log(`- Ready for full compliance testing`);
} else {
  console.log(`- Some filters may need adjustment`);
  console.log(`- Review failed test cases above`);
}
console.log(`- Consider testing through actual document processing to confirm integration`);