/**
 * Safety Utilities - Helper functions for safe operations
 */
class SafetyUtils {
    /**
     * Safely get value from nested object
     */
    static safeGet(obj, path, defaultValue = null) {
        try {
            if (!obj || typeof obj !== 'object') {
                return defaultValue;
            }
            
            const keys = path.split('.');
            let current = obj;
            
            for (const key of keys) {
                if (current == null || typeof current !== 'object') {
                    return defaultValue;
                }
                current = current[key];
            }
            
            return current !== undefined ? current : defaultValue;
        } catch (error) {
            console.warn('Error in safeGet:', error);
            return defaultValue;
        }
    }

    /**
     * Safely access window object
     */
    static safeWindow(property, defaultValue = null) {
        try {
            if (typeof window === 'undefined') {
                return defaultValue;
            }
            
            const value = window[property];
            return value !== undefined ? value : defaultValue;
        } catch (error) {
            console.warn(`Error accessing window.${property}:`, error);
            return defaultValue;
        }
    }

    /**
     * Safely call function
     */
    static safeCall(fn, ...args) {
        try {
            if (typeof fn === 'function') {
                return fn(...args);
            }
            return null;
        } catch (error) {
            console.error('Error in safeCall:', error);
            return null;
        }
    }

    /**
     * Validate section object
     */
    static validateSection(section) {
        if (!section || typeof section !== 'object') {
            return { valid: false, error: 'Section is not an object' };
        }
        
        if (!section.id) {
            return { valid: false, error: 'Section missing ID' };
        }
        
        if (!section.name || typeof section.name !== 'string') {
            return { valid: false, error: 'Section missing name' };
        }
        
        return { valid: true };
    }

    /**
     * Validate array of sections
     */
    static validateSections(sections) {
        if (!Array.isArray(sections)) {
            return { valid: false, error: 'Sections must be an array' };
        }
        
        const errors = [];
        sections.forEach((section, index) => {
            const validation = this.validateSection(section);
            if (!validation.valid) {
                errors.push(`Section ${index}: ${validation.error}`);
            }
        });
        
        if (errors.length > 0) {
            return { valid: false, errors };
        }
        
        return { valid: true };
    }

    /**
     * Safe localStorage operations
     */
    static safeLocalStorage(action, key, value = null) {
        try {
            if (typeof localStorage === 'undefined') {
                return { success: false, error: 'localStorage not available' };
            }
            
            switch (action) {
                case 'get':
                    const item = localStorage.getItem(key);
                    return { success: true, value: item ? JSON.parse(item) : null };
                    
                case 'set':
                    localStorage.setItem(key, JSON.stringify(value));
                    return { success: true };
                    
                case 'remove':
                    localStorage.removeItem(key);
                    return { success: true };
                    
                default:
                    return { success: false, error: 'Invalid action' };
            }
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                return { success: false, error: 'Storage quota exceeded' };
            }
            return { success: false, error: error.message };
        }
    }

    /**
     * Debounce function
     */
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Throttle function
     */
    static throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Safe async operation with retry
     */
    static async safeAsyncWithRetry(operation, maxRetries = 3, delay = 1000) {
        let lastError;
        
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                if (i < maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
                }
            }
        }
        
        throw lastError;
    }

    /**
     * Check if object has required properties
     */
    static hasRequiredProperties(obj, requiredProps) {
        if (!obj || typeof obj !== 'object') {
            return { valid: false, missing: requiredProps };
        }
        
        const missing = requiredProps.filter(prop => !(prop in obj));
        
        return {
            valid: missing.length === 0,
            missing: missing
        };
    }
}

// Export
window.SafetyUtils = SafetyUtils;

