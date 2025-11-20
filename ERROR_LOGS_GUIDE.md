# Error Logging System Guide

## Overview

The app now has a comprehensive error logging system that captures **every error** with full context and saves them for debugging.

---

## How It Works

### Automatic Error Capture

**Every error is automatically logged with:**
- ⏰ Timestamp (readable and ISO format)
- 📝 Error type and message
- 📚 Full stack trace
- 🎯 Context (what was happening)
- 🖥️ App state (sections, docs, API key status)
- 🌐 Browser info (user agent, viewport)
- 📍 URL and location

### Error Types Captured

1. **APIError** - OpenAI API issues
2. **FileProcessingError** - Document upload/processing
3. **ReportGenerationError** - Report generation failures
4. **ExportError** - Word export issues
5. **UIError** - Interface problems
6. **UncaughtError** - JavaScript errors
7. **UnhandledPromiseRejection** - Async failures

---

## How to Use

### In Browser Console (F12)

#### View Error Report
```javascript
window.printErrorReport()
```

**Shows:**
```
📊 Error Report
Total Errors: 15
By Type: {APIError: 3, FileProcessingError: 5, ExportError: 2, ...}
Last 30 minutes: 5

Latest 5 Errors:
1. [APIError] Chat API error: Rate limit exceeded (Nov 20, 2025 3:45 PM)
2. [FileProcessingError] Error processing report.pdf: File too large (Nov 20, 2025 3:40 PM)
...
```

#### Get All Errors
```javascript
window.getErrorLogs()
```
Returns array of all error objects with full details.

#### Export Error Logs
```javascript
window.exportErrorLogs()
```
Downloads JSON file with all errors for sharing/debugging.

#### Clear Error Logs
```javascript
window.clearErrorLogs()
```
Removes all stored errors (fresh start).

---

## Error Log Structure

Each error contains:

```json
{
  "id": 1700000000000.123,
  "timestamp": "2025-11-20T15:45:30.123Z",
  "timestampReadable": "11/20/2025, 3:45:30 PM",
  "type": "APIError",
  "message": "Chat API error: Rate limit exceeded",
  "stack": "Error: Chat API error...\n    at apiHandler.chat...",
  "context": {
    "operation": "chat",
    "model": "gpt-4o",
    "messageCount": 5
  },
  "appState": {
    "hasApiKey": true,
    "selectedModel": "gpt-4o",
    "sectionsCount": 10,
    "globalDocsCount": 3,
    "hasGeneratedReport": false,
    "currentPreset": "Quarterly Report"
  },
  "userAgent": "Mozilla/5.0...",
  "url": "file:///C:/Users/.../index.html",
  "viewport": {
    "width": 1920,
    "height": 1080
  }
}
```

---

## Storage

- **Stored in:** Browser localStorage
- **Key:** `openbank_error_logs`
- **Max errors:** 100 (keeps most recent)
- **Persists:** Across sessions
- **Size:** Automatically managed

---

## When Errors Occur

### What You See
```
❌ Error generating report: Rate limit exceeded

Please:
1. Check browser console (F12) for details
2. Verify your API key is valid
3. Check your internet connection
4. Try with fewer/smaller documents

Error logged for debugging.
```

### What Gets Logged
```
❌ Error Logged [APIError]
Message: Rate limit exceeded
Time: 11/20/2025, 3:45:30 PM
Context: {operation: "chat", model: "gpt-4o", messageCount: 5}
Stack: Error: Rate limit exceeded
    at apiHandler.chat (api-handler.js:89)
    at app.generateReport (app.js:826)
    ...
Full Log: {id: ..., timestamp: ..., ...}
```

---

## Common Use Cases

### 1. Debugging User Issues

**User says:** "The app crashed during generation"

**You do:**
```javascript
// In console
window.printErrorReport()
// Look at recent errors
window.getErrorLogs().slice(0, 5)
// Export for detailed analysis
window.exportErrorLogs()
```

### 2. Finding Patterns

**Want to see all API errors:**
```javascript
errorLogger.getErrorsByType('APIError')
```

**Want to see recent errors (last 30 min):**
```javascript
errorLogger.getRecentErrors(30)
```

### 3. Sharing Debug Info

**Export and send:**
```javascript
window.exportErrorLogs()
// Sends openbank_error_logs_[timestamp].json
```

---

## Error Logging in Code

### API Errors
```javascript
errorLogger.logApiError('operation', error, {
  model: 'gpt-4o',
  requestSize: 1000
});
```

### File Errors
```javascript
errorLogger.logFileError('upload', fileName, error, {
  fileType: 'pdf',
  fileSize: 12345
});
```

### Generation Errors
```javascript
errorLogger.logGenerationError('stage', error, {
  sectionsCount: 10,
  model: 'gpt-4o'
});
```

### Export Errors
```javascript
errorLogger.logExportError(error, {
  reportTitle: 'My Report'
});
```

### UI Errors
```javascript
errorLogger.logUIError('Component', 'action', error, {
  customData: 'value'
});
```

---

## Privacy & Security

**What's Logged:**
- ✅ Error messages and types
- ✅ Stack traces
- ✅ App state (section count, doc count)
- ✅ Timestamps
- ✅ Browser info

**What's NOT Logged:**
- ❌ API keys (only if present, not value)
- ❌ File contents
- ❌ User documents
- ❌ Report content
- ❌ Personal information

**All logs are:**
- Stored locally only
- Never sent to servers
- User-controlled (can clear anytime)
- Exportable for debugging

---

## Maintenance

### Auto-Cleanup
- Keeps last 100 errors automatically
- Older errors automatically removed
- No manual cleanup needed

### Manual Cleanup
```javascript
// Clear all logs
window.clearErrorLogs()

// Or delete from localStorage
localStorage.removeItem('openbank_error_logs')
```

---

## For Developers

### Global Instance
```javascript
// Available globally
errorLogger

// Also available on window
window.errorLogger === errorLogger // true
```

### Helper Functions
```javascript
window.getErrorLogs()        // Get all errors
window.printErrorReport()    // Print summary
window.exportErrorLogs()     // Download JSON
window.clearErrorLogs()      // Clear all
```

### Accessing Programmatically
```javascript
// Get summary
const summary = errorLogger.getErrorSummary();
console.log(summary);
// {
//   totalErrors: 15,
//   byType: {...},
//   recentErrors: 5,
//   oldestError: "...",
//   newestError: "..."
// }

// Get specific errors
const apiErrors = errorLogger.getErrorsByType('APIError');
const recentErrors = errorLogger.getRecentErrors(30); // Last 30 minutes
```

---

## Examples

### Example 1: User Reports "Export Failed"
```javascript
// Open console (F12)
window.printErrorReport()

// See latest errors
window.getErrorLogs().slice(0, 3)

// Look for ExportError
errorLogger.getErrorsByType('ExportError')

// Export for sharing
window.exportErrorLogs()
```

### Example 2: Check API Issues
```javascript
// Get all API errors
const apiErrors = errorLogger.getErrorsByType('APIError');

// Check messages
apiErrors.forEach(e => {
  console.log(e.message, e.context);
});
```

### Example 3: Monitor Error Rate
```javascript
// Errors in last hour
const lastHour = errorLogger.getRecentErrors(60);
console.log(`${lastHour.length} errors in last hour`);

// By type
const summary = errorLogger.getErrorSummary();
console.log(summary.byType);
```

---

## Benefits

✅ **Complete error history** - Never lose error information
✅ **Context-rich** - Know exactly what was happening
✅ **Easy debugging** - Export and share logs
✅ **Pattern detection** - Find recurring issues
✅ **No manual work** - Automatic capture
✅ **Privacy-safe** - No sensitive data logged
✅ **Persistent** - Survives page refreshes
✅ **Auto-managed** - No storage bloat

---

## Quick Reference

| Command | What It Does |
|---------|--------------|
| `window.printErrorReport()` | Show error summary |
| `window.getErrorLogs()` | Get all errors |
| `window.exportErrorLogs()` | Download JSON |
| `window.clearErrorLogs()` | Clear all errors |
| `errorLogger.getErrorsByType('APIError')` | Get specific type |
| `errorLogger.getRecentErrors(30)` | Errors from last 30 min |
| `errorLogger.getErrorSummary()` | Get statistics |

---

**The error logger is now active and catching everything! If you encounter any issues, just open the console and run `window.printErrorReport()` to see what happened.** 🔍

