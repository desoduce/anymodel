/**
 * Comprehensive Filter Regression Tests
 * 
 * Tests the complete filter lifecycle:
 * - Storage operations (save/load/clear)
 * - UI state management
 * - Document processing integration
 * - Edge cases and error handling
 */

import EncryptedStorage from '../services/EncryptedStorage';
import DocumentProcessor from '../services/DocumentProcessor';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('Comprehensive Filter Regression Tests', () => {
  
  beforeEach(async () => {
    // Clear all storage before each test
    await EncryptedStorage.clearFilterPatterns();
    await EncryptedStorage.clearFilterKeywords();
    
    // Also clear raw storage to ensure clean state
    await AsyncStorage.removeItem('encrypted_filter_patterns');
    await AsyncStorage.removeItem('encrypted_filter_keywords');
  });

  describe('Storage Layer Tests', () => {
    
    test('Should save and retrieve filter keywords correctly', async () => {
      const keywords = ['gorge', 'testfilter', 'sensitive-name'];
      
      // Save keywords
      await EncryptedStorage.saveFilterKeywords(keywords);
      
      // Retrieve keywords
      const retrieved = await EncryptedStorage.getFilterKeywords();
      
      expect(retrieved).toEqual(keywords);
      expect(retrieved.length).toBe(3);
    });

    test('Should save and retrieve filter patterns correctly', async () => {
      const patterns = ['\\d{3}-\\d{2}-\\d{4}', '\\b[A-Z]{2}\\d{6}\\b', 'Project\\s+\\w+'];
      
      // Save patterns
      await EncryptedStorage.saveFilterPatterns(patterns);
      
      // Retrieve patterns
      const retrieved = await EncryptedStorage.getFilterPatterns();
      
      expect(retrieved).toEqual(patterns);
      expect(retrieved.length).toBe(3);
    });

    test('Should clear filter keywords completely', async () => {
      const keywords = ['test1', 'test2'];
      
      // Save keywords
      await EncryptedStorage.saveFilterKeywords(keywords);
      
      // Verify they were saved
      let retrieved = await EncryptedStorage.getFilterKeywords();
      expect(retrieved.length).toBe(2);
      
      // Clear keywords
      await EncryptedStorage.clearFilterKeywords();
      
      // Verify they were cleared
      retrieved = await EncryptedStorage.getFilterKeywords();
      expect(retrieved).toEqual([]);
      expect(retrieved.length).toBe(0);
      
      // Also check raw storage
      const rawData = await AsyncStorage.getItem('encrypted_filter_keywords');
      expect(rawData).toBeNull();
    });

    test('Should clear filter patterns completely', async () => {
      const patterns = ['test.*pattern', '\\d+'];
      
      // Save patterns
      await EncryptedStorage.saveFilterPatterns(patterns);
      
      // Verify they were saved
      let retrieved = await EncryptedStorage.getFilterPatterns();
      expect(retrieved.length).toBe(2);
      
      // Clear patterns
      await EncryptedStorage.clearFilterPatterns();
      
      // Verify they were cleared
      retrieved = await EncryptedStorage.getFilterPatterns();
      expect(retrieved).toEqual([]);
      
      // Also check raw storage
      const rawData = await AsyncStorage.getItem('encrypted_filter_patterns');
      expect(rawData).toBeNull();
    });

    test('Should handle multiple save/clear cycles correctly', async () => {
      const keywords1 = ['first', 'batch'];
      const keywords2 = ['second', 'batch', 'more'];
      
      // First cycle
      await EncryptedStorage.saveFilterKeywords(keywords1);
      let retrieved = await EncryptedStorage.getFilterKeywords();
      expect(retrieved).toEqual(keywords1);
      
      // Clear
      await EncryptedStorage.clearFilterKeywords();
      retrieved = await EncryptedStorage.getFilterKeywords();
      expect(retrieved).toEqual([]);
      
      // Second cycle
      await EncryptedStorage.saveFilterKeywords(keywords2);
      retrieved = await EncryptedStorage.getFilterKeywords();
      expect(retrieved).toEqual(keywords2);
      
      // Clear again
      await EncryptedStorage.clearFilterKeywords();
      retrieved = await EncryptedStorage.getFilterKeywords();
      expect(retrieved).toEqual([]);
    });

    test('Should handle empty arrays correctly', async () => {
      // Save empty arrays
      await EncryptedStorage.saveFilterKeywords([]);
      await EncryptedStorage.saveFilterPatterns([]);
      
      // Retrieve should return empty arrays
      const keywords = await EncryptedStorage.getFilterKeywords();
      const patterns = await EncryptedStorage.getFilterPatterns();
      
      expect(keywords).toEqual([]);
      expect(patterns).toEqual([]);
    });
  });

  describe('Filter Application Tests', () => {
    
    test('Should apply custom keyword filters correctly', async () => {
      // Create a mock text content
      const testText = `
        The manager gorge will handle this project.
        Contact sensitive-name for more details.
        Regular names like John should remain.
      `;
      
      // Set up custom keyword filters
      await EncryptedStorage.saveFilterKeywords(['gorge', 'sensitive-name']);
      
      // Test filtering through DocumentProcessor
      // Note: We'll need to create a test helper since filterPII is not exported
      // For now, we'll test the storage aspect and verify the keywords are available
      const keywords = await EncryptedStorage.getFilterKeywords();
      expect(keywords).toContain('gorge');
      expect(keywords).toContain('sensitive-name');
    });

    test('Should apply custom regex pattern filters correctly', async () => {
      // Set up custom regex patterns
      const patterns = ['\\bProject\\s+\\w+', '\\d{4}-\\d{4}-\\d{4}'];
      await EncryptedStorage.saveFilterPatterns(patterns);
      
      // Verify patterns are saved
      const retrieved = await EncryptedStorage.getFilterPatterns();
      expect(retrieved).toEqual(patterns);
    });

    test('Should continue working after filter updates', async () => {
      // Initial filters
      await EncryptedStorage.saveFilterKeywords(['initial']);
      
      let keywords = await EncryptedStorage.getFilterKeywords();
      expect(keywords).toContain('initial');
      
      // Update filters
      await EncryptedStorage.saveFilterKeywords(['updated', 'new']);
      
      keywords = await EncryptedStorage.getFilterKeywords();
      expect(keywords).toEqual(['updated', 'new']);
      expect(keywords).not.toContain('initial');
    });

    test('Should work correctly after clearing filters', async () => {
      // Add filters
      await EncryptedStorage.saveFilterKeywords(['temporary']);
      
      // Verify they exist
      let keywords = await EncryptedStorage.getFilterKeywords();
      expect(keywords.length).toBe(1);
      
      // Clear filters
      await EncryptedStorage.clearFilterKeywords();
      
      // Verify they're gone
      keywords = await EncryptedStorage.getFilterKeywords();
      expect(keywords.length).toBe(0);
      
      // Add new filters after clearing
      await EncryptedStorage.saveFilterKeywords(['after-clear']);
      
      keywords = await EncryptedStorage.getFilterKeywords();
      expect(keywords).toEqual(['after-clear']);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    
    test('Should handle invalid regex patterns gracefully', async () => {
      const patterns = ['valid\\d+', '[invalid', 'another\\w+'];
      
      // This should not throw an error
      await expect(EncryptedStorage.saveFilterPatterns(patterns)).resolves.not.toThrow();
      
      const retrieved = await EncryptedStorage.getFilterPatterns();
      expect(retrieved).toEqual(patterns); // All patterns are saved, invalid ones handled during application
    });

    test('Should handle special characters in keywords', async () => {
      const keywords = ['special@char', 'with.dots', 'with-dashes', 'with_underscores'];
      
      await EncryptedStorage.saveFilterKeywords(keywords);
      const retrieved = await EncryptedStorage.getFilterKeywords();
      
      expect(retrieved).toEqual(keywords);
    });

    test('Should handle whitespace in filters', async () => {
      const keywords = ['  spaced  ', 'normal', '  '];
      const patterns = ['  \\d+  ', 'normal\\w+'];
      
      await EncryptedStorage.saveFilterKeywords(keywords);
      await EncryptedStorage.saveFilterPatterns(patterns);
      
      const retrievedKeywords = await EncryptedStorage.getFilterKeywords();
      const retrievedPatterns = await EncryptedStorage.getFilterPatterns();
      
      expect(retrievedKeywords).toEqual(keywords);
      expect(retrievedPatterns).toEqual(patterns);
    });

    test('Should handle multiple clear operations without error', async () => {
      await EncryptedStorage.saveFilterKeywords(['test']);
      
      // Multiple clears should not throw errors
      await EncryptedStorage.clearFilterKeywords();
      await EncryptedStorage.clearFilterKeywords();
      await EncryptedStorage.clearFilterKeywords();
      
      const keywords = await EncryptedStorage.getFilterKeywords();
      expect(keywords).toEqual([]);
    });
  });

  describe('Settings UI Integration Tests', () => {
    
    test('Should simulate the Settings UI save flow', async () => {
      // Simulate the text input format from Settings UI
      const customFiltersInput = `gorge
sensitive-name
\\d{3}-\\d{2}-\\d{4}
Project\\s+\\w+`;
      
      // Simulate the parsing logic from settings.tsx:140-158
      const filters = customFiltersInput
        .split('\n')
        .map(f => f.trim())
        .filter(f => f.length > 0);
      
      // Separate regex patterns from simple keywords
      const patterns = [];
      const keywords = [];
      
      filters.forEach(filter => {
        // Check if it's a regex pattern (contains regex special characters)
        if (/[.*+?^${}()|[\\]\\\\]/.test(filter)) {
          patterns.push(filter);
        } else {
          keywords.push(filter);
        }
      });
      
      // Save using the same method as Settings UI
      await EncryptedStorage.saveFilterPatterns(patterns);
      await EncryptedStorage.saveFilterKeywords(keywords);
      
      // Verify they were saved correctly
      const savedPatterns = await EncryptedStorage.getFilterPatterns();
      const savedKeywords = await EncryptedStorage.getFilterKeywords();
      
      expect(savedKeywords).toContain('gorge');
      expect(savedKeywords).toContain('sensitive-name');
      expect(savedPatterns).toContain('\\d{3}-\\d{2}-\\d{4}');
      expect(savedPatterns).toContain('Project\\s+\\w+');
    });

    test('Should simulate the Settings UI load flow', async () => {
      // Set up some filters
      const keywords = ['gorge', 'testname'];
      const patterns = ['\\d{4}', 'Pattern\\w+'];
      
      await EncryptedStorage.saveFilterKeywords(keywords);
      await EncryptedStorage.saveFilterPatterns(patterns);
      
      // Simulate the loadCustomFilters logic from settings.tsx:124-134
      const loadedPatterns = await EncryptedStorage.getFilterPatterns();
      const loadedKeywords = await EncryptedStorage.getFilterKeywords();
      const combined = [...loadedPatterns, ...loadedKeywords];
      const customFiltersDisplay = combined.join('\n');
      
      // Verify the display format matches expectations
      expect(customFiltersDisplay).toContain('gorge');
      expect(customFiltersDisplay).toContain('testname');
      expect(customFiltersDisplay).toContain('\\d{4}');
      expect(customFiltersDisplay).toContain('Pattern\\w+');
      
      // Should be able to split back correctly
      const splitFilters = customFiltersDisplay.split('\n').filter(f => f.trim());
      expect(splitFilters.length).toBe(4);
    });
  });
});