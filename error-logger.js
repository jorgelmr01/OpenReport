// Comprehensive Error Logger
class ErrorLogger {
    constructor() {
        this.errors = [];
        this.maxErrors = 100; // Keep last 100 errors
        this.loadFromStorage();
        this.setupGlobalErrorHandlers();
    }

    loadFromStorage() {
        try {
            const saved = localStorage.getItem('openbank_error_logs');
            if (saved) {
                this.errors = JSON.parse(saved);
                console.log(`📋 Loaded ${this.errors.length} previous error logs`);
            }
        } catch (error) {
            console.warn('Could not load error logs from storage:', error);
        }
    }

    saveToStorage() {
        try {
            // Keep only last maxErrors
            if (this.errors.length > this.maxErrors) {
                this.errors = this.errors.slice(-this.maxErrors);
            }
            localStorage.setItem('openbank_error_logs', JSON.stringify(this.errors));
        } catch (error) {
            console.warn('Could not save error logs to storage:', error);
        }
    }

    setupGlobalErrorHandlers() {
        // Catch uncaught errors
        window.addEventListener('error', (event) => {
            this.logError({
                type: 'UncaughtError',
                message: event.message,
                filename: event.filename,
                line: event.lineno,
                column: event.colno,
                error: event.error
            });
        });

        // Catch unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.logError({
                type: 'UnhandledPromiseRejection',
                message: event.reason?.message || String(event.reason),
                error: event.reason
            });
        });

        console.log('✅ Global error handlers installed');
    }

    logError(errorInfo) {
        const errorLog = {
            id: Date.now() + Math.random(),
            timestamp: new Date().toISOString(),
            timestampReadable: new Date().toLocaleString(),
            type: errorInfo.type || 'Error',
            message: errorInfo.message || 'Unknown error',
            stack: errorInfo.error?.stack || errorInfo.stack || 'No stack trace',
            context: errorInfo.context || {},
            appState: this.captureAppState(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        };

        // Add to beginning (newest first)
        this.errors.unshift(errorLog);

        // Log to console with styling
        console.group(`❌ Error Logged [${errorLog.type}]`);
        console.error('Message:', errorLog.message);
        console.error('Time:', errorLog.timestampReadable);
        if (errorLog.context && Object.keys(errorLog.context).length > 0) {
            console.error('Context:', errorLog.context);
        }
        if (errorLog.stack) {
            console.error('Stack:', errorLog.stack);
        }
        console.error('Full Log:', errorLog);
        console.groupEnd();

        // Save to storage
        this.saveToStorage();

        return errorLog.id;
    }

    captureAppState() {
        try {
            const state = {
                hasApiKey: !!(apiHandler?.getApiKey()),
                selectedModel: apiHandler?.getModel() || 'unknown',
                sectionsCount: window.app?.sections?.length || 0,
                globalDocsCount: window.app?.globalDocuments?.length || 0,
                hasGeneratedReport: !!(window.app?.generatedReport),
                currentPreset: window.app?.currentPresetName || 'unknown'
            };
            return state;
        } catch (error) {
            return { error: 'Could not capture app state' };
        }
    }

    logApiError(operation, error, details = {}) {
        return this.logError({
            type: 'APIError',
            message: `API Error during ${operation}: ${error.message}`,
            error: error,
            context: {
                operation: operation,
                ...details
            }
        });
    }

    logFileError(operation, filename, error, details = {}) {
        return this.logError({
            type: 'FileProcessingError',
            message: `File error during ${operation} for ${filename}: ${error.message}`,
            error: error,
            context: {
                operation: operation,
                filename: filename,
                ...details
            }
        });
    }

    logGenerationError(stage, error, details = {}) {
        return this.logError({
            type: 'ReportGenerationError',
            message: `Generation error at ${stage}: ${error.message}`,
            error: error,
            context: {
                stage: stage,
                ...details
            }
        });
    }

    logExportError(error, details = {}) {
        return this.logError({
            type: 'ExportError',
            message: `Export error: ${error.message}`,
            error: error,
            context: details
        });
    }

    logUIError(component, action, error, details = {}) {
        return this.logError({
            type: 'UIError',
            message: `UI error in ${component} during ${action}: ${error.message}`,
            error: error,
            context: {
                component: component,
                action: action,
                ...details
            }
        });
    }

    getErrors(limit = 20) {
        return this.errors.slice(0, limit);
    }

    getErrorsByType(type, limit = 20) {
        return this.errors.filter(e => e.type === type).slice(0, limit);
    }

    getRecentErrors(minutes = 30) {
        const cutoff = Date.now() - (minutes * 60 * 1000);
        return this.errors.filter(e => new Date(e.timestamp).getTime() > cutoff);
    }

    clearErrors() {
        this.errors = [];
        this.saveToStorage();
        console.log('🗑️ Error logs cleared');
    }

    exportErrors() {
        const exportData = {
            exportDate: new Date().toISOString(),
            errorCount: this.errors.length,
            errors: this.errors
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `openbank_error_logs_${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);

        console.log('📥 Error logs exported');
    }

    printErrorReport() {
        console.group('📊 Error Report');
        console.log('Total Errors:', this.errors.length);
        
        // Count by type
        const byType = {};
        this.errors.forEach(e => {
            byType[e.type] = (byType[e.type] || 0) + 1;
        });
        console.log('By Type:', byType);

        // Recent errors
        const recent = this.getRecentErrors(30);
        console.log('Last 30 minutes:', recent.length);

        // Latest errors
        console.log('\nLatest 5 Errors:');
        this.errors.slice(0, 5).forEach((e, i) => {
            console.log(`${i + 1}. [${e.type}] ${e.message} (${e.timestampReadable})`);
        });

        console.groupEnd();
    }

    getErrorSummary() {
        const byType = {};
        this.errors.forEach(e => {
            byType[e.type] = (byType[e.type] || 0) + 1;
        });

        return {
            totalErrors: this.errors.length,
            byType: byType,
            recentErrors: this.getRecentErrors(30).length,
            oldestError: this.errors[this.errors.length - 1]?.timestampReadable || 'None',
            newestError: this.errors[0]?.timestampReadable || 'None'
        };
    }
}

// Create global instance
const errorLogger = new ErrorLogger();

// Add helper function to window for easy access
window.getErrorLogs = () => errorLogger.getErrors();
window.printErrorReport = () => errorLogger.printErrorReport();
window.exportErrorLogs = () => errorLogger.exportErrors();
window.clearErrorLogs = () => errorLogger.clearErrors();

console.log('🔍 Error Logger initialized. Use window.printErrorReport() to see logs.');

