#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const filesToProcess = [
  './contexts/ThemeContext.tsx',
  './app/(tabs)/settings.tsx',
  './app/(tabs)/index.tsx',
  './src/services/LLMDirectService.ts',
  './src/services/PdfTextExtractor.ts',
  './src/services/DocumentStore.ts',
  './src/services/ApiService.ts',
  './src/services/DocumentProcessor.ts',
  './src/services/OCRService.ts',
  './src/services/EncryptedStorage.ts',
];

function wrapConsoleLogs(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  // Pattern to match console.log/warn/error/info that are NOT already wrapped in __DEV__
  // This regex looks for console statements that don't have __DEV__ before them
  const lines = content.split('\n');
  const newLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Check if this line has a console statement
    const consoleMatch = trimmedLine.match(/^console\.(log|warn|error|info|debug)\(/);

    if (consoleMatch) {
      // Check if previous line already has __DEV__
      const prevLine = i > 0 ? lines[i - 1].trim() : '';
      if (!prevLine.includes('if (__DEV__)') && !prevLine.includes('if(__DEV__)')) {
        // Get the indentation of the current line
        const indent = line.match(/^\s*/)[0];

        // Add __DEV__ wrapper
        newLines.push(`${indent}if (__DEV__) ${line.trim()}`);
        modified = true;
        continue;
      }
    }

    newLines.push(line);
  }

  if (modified) {
    fs.writeFileSync(fullPath, newLines.join('\n'), 'utf8');
    console.log(`✓ Wrapped console statements in ${filePath}`);
    return true;
  } else {
    console.log(`  No changes needed in ${filePath}`);
    return false;
  }
}

let totalModified = 0;
console.log('Wrapping console.log statements in __DEV__ checks...\n');

filesToProcess.forEach(file => {
  if (wrapConsoleLogs(file)) {
    totalModified++;
  }
});

console.log(`\nComplete! Modified ${totalModified} files.`);
