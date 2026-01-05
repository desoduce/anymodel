# Manual Testing Guide

Since the Jest setup has some configuration conflicts with the current Expo version, here's a comprehensive manual testing guide for the mobile app:

## Pre-Testing Setup

1. **Start Backend Server**:
   ```bash
   cd .. && python main.py
   ```

2. **Start Mobile App**:
   ```bash
   npm start
   ```

3. **Configure API Connection**:
   - Open Settings tab
   - Set API URL to `http://YOUR_IP:8000` (replace YOUR_IP with your computer's IP)
   - Test connection

## Test Cases

### 1. Settings Screen Tests

**Test API Configuration**:
- [ ] Enter valid API URL and test connection
- [ ] Enter invalid API URL and verify error message
- [ ] Save settings and restart app to verify persistence
- [ ] Reset to defaults and verify all settings are cleared

**Test Provider Selection**:
- [ ] Select different LLM providers
- [ ] Select different models for each provider
- [ ] Verify selected provider appears in chat screen

**Test App Preferences**:
- [ ] Toggle "Send message on Enter" switch
- [ ] Toggle "Show provider in responses" switch
- [ ] Verify settings persist after app restart

### 2. Chat Screen Tests

**Test Basic Chat**:
- [ ] Send a simple message and receive response
- [ ] Send multiple messages in sequence
- [ ] Verify message timestamps and ordering
- [ ] Test with different providers and models

**Test Provider Selection**:
- [ ] Tap provider button to change provider
- [ ] Switch between different providers mid-conversation
- [ ] Verify provider info shows in assistant messages

**Test Input Validation**:
- [ ] Try sending empty message (should be blocked)
- [ ] Test sending very long message
- [ ] Test multiline messages

**Test Error Handling**:
- [ ] Send message with no internet connection
- [ ] Send message with invalid API URL
- [ ] Verify appropriate error messages

### 3. Upload Screen Tests

**Test Document Upload**:
- [ ] Pick PDF document and verify it appears in list
- [ ] Pick multiple documents at once
- [ ] Remove individual documents
- [ ] Clear all documents
- [ ] Process documents and verify success/error status

**Test Image Upload**:
- [ ] Pick image from photo library
- [ ] Take photo with camera
- [ ] Verify camera permissions prompt
- [ ] Process images and verify OCR/analysis

**Test File Management**:
- [ ] Verify file size display is correct
- [ ] Test with unsupported file types
- [ ] Test with files larger than 5MB
- [ ] Verify 5-file upload limit

**Test Processing**:
- [ ] Process successful documents
- [ ] Handle processing errors gracefully
- [ ] Verify PII filtering works on test documents
- [ ] Check processing status updates

### 4. Navigation Tests

**Test Tab Navigation**:
- [ ] Switch between Chat, Upload, and Settings tabs
- [ ] Verify tab icons and labels
- [ ] Test tab state persistence

**Test Cross-Screen Integration**:
- [ ] Upload document in Upload tab, then use in Chat tab
- [ ] Change settings and verify they apply in Chat tab
- [ ] Verify uploaded files appear in chat context

### 5. Integration Tests

**Test Full Workflow**:
- [ ] Configure API settings
- [ ] Upload a document
- [ ] Process the document
- [ ] Start chat conversation
- [ ] Send message referencing the uploaded document
- [ ] Verify AI response includes document context
- [ ] Switch providers and repeat with same document

**Test Offline/Online Behavior**:
- [ ] Configure settings while offline
- [ ] Upload files while offline (should queue or error appropriately)
- [ ] Send messages while offline (should show appropriate error)
- [ ] Test app behavior when connection is restored

### 6. Performance Tests

**Test App Responsiveness**:
- [ ] Scroll through long chat conversations
- [ ] Upload large files (within limits)
- [ ] Switch tabs quickly multiple times
- [ ] Test app behavior with low memory

**Test API Performance**:
- [ ] Send multiple messages rapidly
- [ ] Upload multiple files simultaneously
- [ ] Test timeout handling for slow responses

## Expected Results

### ✅ Success Criteria
- All basic functionality works without crashes
- API integration works with backend server
- File upload and processing completes successfully
- Settings save and load correctly
- Provider switching works smoothly
- Error messages are clear and helpful

### 🔧 Common Issues & Solutions

**API Connection Issues**:
- Ensure backend server is running
- Use correct IP address (not localhost on device)
- Check firewall settings

**Permission Issues**:
- Grant camera permissions when prompted
- Grant photo library permissions when prompted
- Restart app if permissions seem stuck

**Build Issues**:
- Run `npx expo doctor` to check project health
- Clear cache with `npx expo start --clear`
- Reinstall dependencies if needed

## Automated Test Commands

While Jest setup needs fixing, you can run basic validation:

```bash
# Check TypeScript compilation
npx tsc --noEmit

# Run linting
npm run lint

# Check Expo project health
npx expo-doctor

# Build for production (test that it builds)
npm run prebuild
```

## Test Data

Use these test files for document upload testing:
- Small PDF (< 1MB)
- Word document with text content
- Image with text (for OCR testing)
- CSV file with data
- Large file (to test size limits)
- Unsupported file type (to test error handling)

## Reporting Issues

When testing, document:
- Device type and OS version
- Error messages (screenshots helpful)
- Steps to reproduce issues
- Expected vs actual behavior
- Network conditions (WiFi, cellular, offline)
