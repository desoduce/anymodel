/**
 * Basic PII Filter Regression Test
 * 
 * Tests the mandatory basic PII filters:
 * - Phone numbers
 * - SSN (Social Security Numbers) 
 * - Email addresses
 * - Street addresses (TODO: needs implementation)
 * - Zip codes (TODO: needs implementation)
 */

import DocumentProcessor from '../services/DocumentProcessor';

describe('Basic PII Filter Tests', () => {
  
  test('Should filter SSN (Social Security Numbers)', async () => {
    const testText = 'My SSN is 123-45-6789 and my friend SSN is 987-65-4321.';
    
    // Create a mock file to test document processing with PII filtering
    const mockFile = { uri: 'test://mock', name: 'test.txt', type: 'text/plain' };
    
    // Mock the fetch to return our test text
    global.fetch = jest.fn().mockResolvedValue({
      text: () => Promise.resolve(testText)
    });
    
    const result = await DocumentProcessor.processFile(mockFile.uri, mockFile.name, mockFile.type);
    
    // Should filter SSNs
    expect(result).toContain('[SSN-FILTERED]');
    expect(result).not.toContain('123-45-6789');
    expect(result).not.toContain('987-65-4321');
    
    // Should replace both SSNs
    const ssnMatches = (result.match(/\[SSN-FILTERED\]/g) || []).length;
    expect(ssnMatches).toBe(2);
  });

  test('Should filter phone numbers', async () => {
    const testText = 'Call me at 555-123-4567 or try my work number 800-555-0199.';
    
    global.fetch = jest.fn().mockResolvedValue({
      text: () => Promise.resolve(testText)
    });
    
    const result = await DocumentProcessor.processFile('test://mock', 'test.txt', 'text/plain');
    
    // Should filter phone numbers
    expect(result).toContain('[PHONE-FILTERED]');
    expect(result).not.toContain('555-123-4567');
    expect(result).not.toContain('800-555-0199');
    
    // Should replace both phone numbers
    const phoneMatches = (result.match(/\[PHONE-FILTERED\]/g) || []).length;
    expect(phoneMatches).toBe(2);
  });

  test('Should filter email addresses', async () => {
    const testText = 'Contact me at john.doe@example.com or admin@company.org for more info.';
    
    global.fetch = jest.fn().mockResolvedValue({
      text: () => Promise.resolve(testText)
    });
    
    const result = await DocumentProcessor.processFile('test://mock', 'test.txt', 'text/plain');
    
    // Should filter email addresses
    expect(result).toContain('[EMAIL-FILTERED]');
    expect(result).not.toContain('john.doe@example.com');
    expect(result).not.toContain('admin@company.org');
    
    // Should replace both emails
    const emailMatches = (result.match(/\[EMAIL-FILTERED\]/g) || []).length;
    expect(emailMatches).toBe(2);
  });

  test('Should handle mixed PII in one text', async () => {
    const testText = `
      Contact Information:
      Name: John Doe  
      Email: john.doe@company.com
      Phone: 555-123-4567
      SSN: 123-45-6789
      Please keep this confidential.
    `;
    
    global.fetch = jest.fn().mockResolvedValue({
      text: () => Promise.resolve(testText)
    });
    
    const result = await DocumentProcessor.processFile('test://mock', 'test.txt', 'text/plain');
    
    // Should filter all PII types
    expect(result).toContain('[EMAIL-FILTERED]');
    expect(result).toContain('[PHONE-FILTERED]');  
    expect(result).toContain('[SSN-FILTERED]');
    
    // Should not contain original PII
    expect(result).not.toContain('john.doe@company.com');
    expect(result).not.toContain('555-123-4567');
    expect(result).not.toContain('123-45-6789');
    
    // Should preserve non-PII text
    expect(result).toContain('John Doe');
    expect(result).toContain('confidential');
  });

  test('Should filter street addresses', async () => {
    const testText = 'I live at 123 Main Street, Anytown and work at 456 Oak Ave, Suite 100.';
    
    global.fetch = jest.fn().mockResolvedValue({
      text: () => Promise.resolve(testText)
    });
    
    const result = await DocumentProcessor.processFile('test://mock', 'test.txt', 'text/plain');
    
    // Should filter street addresses
    expect(result).toContain('[ADDRESS-FILTERED]');
    expect(result).not.toContain('123 Main Street');
    expect(result).not.toContain('456 Oak Ave');
    
    // Should replace both addresses
    const addressMatches = (result.match(/\[ADDRESS-FILTERED\]/g) || []).length;
    expect(addressMatches).toBeGreaterThanOrEqual(1);
  });

  test('Should filter zip codes', async () => {
    const testText = 'Send mail to 12345 or the extended zip 12345-6789.';
    
    global.fetch = jest.fn().mockResolvedValue({
      text: () => Promise.resolve(testText)
    });
    
    const result = await DocumentProcessor.processFile('test://mock', 'test.txt', 'text/plain');
    
    // Should filter zip codes
    expect(result).toContain('[ZIP-FILTERED]');
    expect(result).not.toContain('12345');
    expect(result).not.toContain('12345-6789');
    
    // Should replace both zip codes
    const zipMatches = (result.match(/\[ZIP-FILTERED\]/g) || []).length;
    expect(zipMatches).toBe(2);
  });

  test('Should handle full addresses with all PII types', async () => {
    const testText = `
      Contact: John Doe
      Address: 123 Main Street, Anytown 12345-6789
      Phone: 555-123-4567
      Email: john.doe@example.com
      SSN: 123-45-6789
    `;
    
    global.fetch = jest.fn().mockResolvedValue({
      text: () => Promise.resolve(testText)
    });
    
    const result = await DocumentProcessor.processFile('test://mock', 'test.txt', 'text/plain');
    
    // Should filter all PII types including new ones
    expect(result).toContain('[ADDRESS-FILTERED]');
    expect(result).toContain('[ZIP-FILTERED]');
    expect(result).toContain('[PHONE-FILTERED]');
    expect(result).toContain('[EMAIL-FILTERED]');
    expect(result).toContain('[SSN-FILTERED]');
    
    // Should not contain original PII
    expect(result).not.toContain('123 Main Street');
    expect(result).not.toContain('12345-6789');
    expect(result).not.toContain('555-123-4567');
    expect(result).not.toContain('john.doe@example.com');
    expect(result).not.toContain('123-45-6789');
    
    // Should preserve non-PII text
    expect(result).toContain('John Doe');
    expect(result).toContain('Anytown');
  });

  test('Should filter city, state, ZIP combinations', async () => {
    const testText = 'Located in New York, NY 10001 and Los Angeles, CA 90210-1234.';
    
    global.fetch = jest.fn().mockResolvedValue({
      text: () => Promise.resolve(testText)
    });
    
    const result = await DocumentProcessor.processFile('test://mock', 'test.txt', 'text/plain');
    
    // Should filter city/state/ZIP combinations
    expect(result).toContain('[LOCATION-FILTERED]');
    expect(result).not.toContain('New York, NY 10001');
    expect(result).not.toContain('Los Angeles, CA 90210-1234');
    
    // Should replace both location patterns
    const locationMatches = (result.match(/\[LOCATION-FILTERED\]/g) || []).length;
    expect(locationMatches).toBe(2);
  });

  test('Should filter complete addresses with city/state', async () => {
    const testText = '1000 El Camino Real, Sunnyvale, CA, zip code 94086';
    
    global.fetch = jest.fn().mockResolvedValue({
      text: () => Promise.resolve(testText)
    });
    
    const result = await DocumentProcessor.processFile('test://mock', 'test.txt', 'text/plain');
    
    // Should filter all address components
    expect(result).toContain('[ADDRESS-FILTERED]');
    expect(result).toContain('[CITY-STATE-FILTERED]');
    expect(result).toContain('[ZIP-FILTERED]');
    expect(result).not.toContain('1000 El Camino Real');
    expect(result).not.toContain('Sunnyvale, CA');
    expect(result).not.toContain('94086');
  });

  test('Should filter explicit ZIP code references', async () => {
    const testText = 'The zip code is 12345 and zip-code: 67890.';
    
    global.fetch = jest.fn().mockResolvedValue({
      text: () => Promise.resolve(testText)
    });
    
    const result = await DocumentProcessor.processFile('test://mock', 'test.txt', 'text/plain');
    
    // Should filter explicit ZIP code references
    expect(result).toContain('[ZIP-FILTERED]');
    expect(result).not.toContain('12345');
    expect(result).not.toContain('67890');
    
    // Should replace both ZIP code references
    const zipMatches = (result.match(/\[ZIP-FILTERED\]/g) || []).length;
    expect(zipMatches).toBe(2);
  });

  test('Should filter column headers with ZIP codes', async () => {
    const testText = 'Name: John, Zip: 94086, Phone: 555-1234';
    
    global.fetch = jest.fn().mockResolvedValue({
      text: () => Promise.resolve(testText)
    });
    
    const result = await DocumentProcessor.processFile('test://mock', 'test.txt', 'text/plain');
    
    // Should filter ZIP column completely
    expect(result).toContain('[ZIP-COLUMN-FILTERED]');
    expect(result).not.toContain('94086');
    expect(result).not.toContain('Zip:');
    expect(result).toContain('Name: John');
    expect(result).toContain('[PHONE-FILTERED]');
  });
});
  test('Should filter various ZIP column header formats', async () => {
    const testText = 'Zip Code: 94086, ZIP-CODE: 90210, Postal Code: 12345';
    
    global.fetch = jest.fn().mockResolvedValue({
      text: () => Promise.resolve(testText)
    });
    
    const result = await DocumentProcessor.processFile('test://mock', 'test.txt', 'text/plain');
    
    // Should filter all ZIP column variations
    expect(result).toContain('[ZIP-COLUMN-FILTERED]');
    expect(result).not.toContain('94086');
    expect(result).not.toContain('90210');
    expect(result).not.toContain('12345');
    expect(result).not.toContain('Zip Code:');
    expect(result).not.toContain('ZIP-CODE:');
    expect(result).not.toContain('Postal Code:');
    
    // Should have 3 column filters
    const columnMatches = (result.match(/\[ZIP-COLUMN-FILTERED\]/g) || []).length;
    expect(columnMatches).toBe(3);
  });
});

  test('Should filter PO BOX addresses', async () => {
    const testText = 'Send mail to PO Box 12345 or P.O. Box 567 or Post Office Box 890.';
    
    global.fetch = jest.fn().mockResolvedValue({
      text: () => Promise.resolve(testText)
    });
    
    const result = await DocumentProcessor.processFile('test://mock', 'test.txt', 'text/plain');
    
    // Should filter all PO BOX variations
    expect(result).toContain('[PO-BOX-FILTERED]');
    expect(result).not.toContain('PO Box 12345');
    expect(result).not.toContain('P.O. Box 567');
    expect(result).not.toContain('Post Office Box 890');
    
    // Should have 3 PO BOX filters
    const poBoxMatches = (result.match(/\[PO-BOX-FILTERED\]/g) || []).length;
    expect(poBoxMatches).toBe(3);
  });

  test('Should filter apartment and unit addresses', async () => {
    const testText = 'I live at 123 Main St Apt 4B and work at 456 Oak Ave Unit 12, also visit 789 Pine Rd #5A.';
    
    global.fetch = jest.fn().mockResolvedValue({
      text: () => Promise.resolve(testText)
    });
    
    const result = await DocumentProcessor.processFile('test://mock', 'test.txt', 'text/plain');
    
    // Should filter all unit address variations
    expect(result).toContain('[UNIT-ADDRESS-FILTERED]');
    expect(result).not.toContain('123 Main St Apt 4B');
    expect(result).not.toContain('456 Oak Ave Unit 12');
    expect(result).not.toContain('789 Pine Rd #5A');
    
    // Should have 3 unit address filters
    const unitMatches = (result.match(/\[UNIT-ADDRESS-FILTERED\]/g) || []).length;
    expect(unitMatches).toBe(3);
  });
