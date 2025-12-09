/**
 * Configuration Manager - Manages all user-configurable settings
 * Provides full transparency and control over all AI prompts and instructions
 */
class ConfigManager {
    constructor() {
        this.defaultConfig = this.getDefaultConfig();
        this.config = this.loadConfig();
    }

    getDefaultConfig() {
        return {
            // System Prompts
            systemPrompt: {
                general: `You are a professional report writer. Generate high-quality, professional content based on provided instructions and documents.

Write in a formal, professional tone. Be concise, clear, and data-driven. Focus only on the information provided in the documents and instructions.`,
                
                sectionGeneration: `Generate content for the specified section based on the provided instructions and documents.

Key requirements:
- Follow the section instructions precisely
- Use information from provided documents
- Maintain professional tone
- Be accurate and factual
- Structure content clearly`,
                
                reviewAndUnify: `You are a senior editor. Review and unify a multi-section report to ensure:

1. Consistent tone and writing style throughout
2. No contradictions between sections
3. Smooth transitions between sections
4. Professional language
5. Coherent narrative flow
6. Proper formatting and structure

Make necessary adjustments to create a polished, cohesive final report. Do not add any information not present in the original sections.`
            },

            // Section Generation Settings
            sectionSettings: {
                includeDocumentContext: true,
                includeManualText: true,
                maxContextLength: 8000,
                temperature: 0.7,
                maxTokens: 4000
            },

            // Review Settings
            reviewSettings: {
                enabled: true,
                temperature: 0.5,
                maxTokens: 8000,
                focusAreas: [
                    'tone_consistency',
                    'no_contradictions',
                    'smooth_transitions',
                    'professional_language',
                    'coherent_flow'
                ]
            },

            // Document Processing
            documentSettings: {
                maxTokensPerDocument: 3000,
                maxTokensPerSection: 8000,
                truncationStrategy: 'beginning', // 'beginning', 'end', 'smart'
                extractTables: true,
                extractImages: false
            },

            // Output Settings
            outputSettings: {
                defaultFormat: 'docx',
                includeTableOfContents: true,
                includePageNumbers: true,
                includeHeader: true,
                includeFooter: true,
                customHeader: '',
                customFooter: ''
            },

            // AI Assistant Settings
            assistantSettings: {
                systemPrompt: `You are an AI assistant helping users configure report structures. When users describe their report needs, suggest appropriate sections with clear instructions.

Respond with specific section suggestions in the following format:

Section 1: [Section Name]
Instructions: [Clear instructions for what this section should contain]

Section 2: [Section Name]
Instructions: [Clear instructions for what this section should contain]

Be specific and practical. Tailor your suggestions to the type of report the user describes.`,
                temperature: 0.8,
                maxTokens: 2000
            },

            // Advanced Settings
            advancedSettings: {
                showTokenCounts: true,
                showCostEstimates: true,
                enableDebugMode: false,
                logAllPrompts: false,
                retryOnError: true,
                maxRetries: 3
            }
        };
    }

    loadConfig() {
        try {
            const saved = localStorage.getItem('openreport_config');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Merge with defaults to ensure all keys exist
                return this.mergeConfig(this.defaultConfig, parsed);
            }
        } catch (error) {
            console.error('Error loading config:', error);
        }
        return JSON.parse(JSON.stringify(this.defaultConfig)); // Deep copy
    }

    mergeConfig(defaultConfig, userConfig) {
        try {
            // Safety checks
            if (!defaultConfig || typeof defaultConfig !== 'object') {
                return this.getDefaultConfig();
            }
            
            if (!userConfig || typeof userConfig !== 'object') {
                return JSON.parse(JSON.stringify(defaultConfig));
            }
            
            // Prevent circular references
            const seen = new WeakSet();
            
            const merge = (defaultObj, userObj) => {
                if (seen.has(userObj)) {
                    return defaultObj; // Circular reference detected
                }
                seen.add(userObj);
                
                const merged = JSON.parse(JSON.stringify(defaultObj));
                
                for (const key in userObj) {
                    if (!userObj.hasOwnProperty(key)) continue;
                    
                    if (typeof userObj[key] === 'object' && !Array.isArray(userObj[key]) && userObj[key] !== null) {
                        merged[key] = merge(merged[key] || {}, userObj[key]);
                    } else {
                        merged[key] = userObj[key];
                    }
                }
                
                seen.delete(userObj);
                return merged;
            };
            
            return merge(defaultConfig, userConfig);
        } catch (error) {
            console.error('Error merging config:', error);
            return JSON.parse(JSON.stringify(this.defaultConfig));
        }
    }

    saveConfig() {
        try {
            if (!this.config) {
                console.error('Config is null or undefined');
                return false;
            }
            
            const configString = JSON.stringify(this.config);
            if (configString.length > 5 * 1024 * 1024) { // 5MB limit
                console.error('Config too large to save');
                return false;
            }
            
            localStorage.setItem('openreport_config', configString);
            
            if (window.eventBus && typeof window.eventBus.emit === 'function') {
                window.eventBus.emit('configChanged', this.config);
            }
            return true;
        } catch (error) {
            console.error('Error saving config:', error);
            // Handle quota exceeded
            if (error.name === 'QuotaExceededError') {
                console.error('LocalStorage quota exceeded. Consider clearing old data.');
            }
            return false;
        }
    }

    // Getter methods
    getSystemPrompt(type = 'general') {
        return this.config.systemPrompt[type] || this.config.systemPrompt.general;
    }

    getSectionSettings() {
        return this.config.sectionSettings;
    }

    getReviewSettings() {
        return this.config.reviewSettings;
    }

    getDocumentSettings() {
        return this.config.documentSettings;
    }

    getOutputSettings() {
        return this.config.outputSettings;
    }

    getAssistantSettings() {
        return this.config.assistantSettings;
    }

    getAdvancedSettings() {
        return this.config.advancedSettings;
    }

    // Setter methods
    setSystemPrompt(type, prompt) {
        if (!type || typeof type !== 'string') {
            throw new Error('Invalid prompt type');
        }
        
        if (prompt == null || typeof prompt !== 'string') {
            throw new Error('Prompt must be a string');
        }
        
        if (!this.config.systemPrompt) {
            this.config.systemPrompt = {};
        }
        
        this.config.systemPrompt[type] = prompt;
        this.saveConfig();
    }

    setSectionSettings(settings) {
        this.config.sectionSettings = { ...this.config.sectionSettings, ...settings };
        this.saveConfig();
    }

    setReviewSettings(settings) {
        this.config.reviewSettings = { ...this.config.reviewSettings, ...settings };
        this.saveConfig();
    }

    setDocumentSettings(settings) {
        this.config.documentSettings = { ...this.config.documentSettings, ...settings };
        this.saveConfig();
    }

    setOutputSettings(settings) {
        this.config.outputSettings = { ...this.config.outputSettings, ...settings };
        this.saveConfig();
    }

    setAssistantSettings(settings) {
        this.config.assistantSettings = { ...this.config.assistantSettings, ...settings };
        this.saveConfig();
    }

    setAdvancedSettings(settings) {
        this.config.advancedSettings = { ...this.config.advancedSettings, ...settings };
        this.saveConfig();
    }

    // Reset to defaults
    resetToDefaults() {
        this.config = JSON.parse(JSON.stringify(this.defaultConfig));
        this.saveConfig();
        return true;
    }

    // Export/Import config
    exportConfig() {
        const exportData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            config: this.config
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `openreport_config_${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }

    importConfig(jsonString) {
        try {
            if (!jsonString || typeof jsonString !== 'string') {
                throw new Error('Invalid JSON string');
            }
            
            const imported = JSON.parse(jsonString);
            
            // Validate structure
            if (!imported || typeof imported !== 'object') {
                throw new Error('Invalid config structure');
            }
            
            if (imported.config) {
                // Validate config structure
                if (typeof imported.config !== 'object') {
                    throw new Error('Config must be an object');
                }
                
                this.config = this.mergeConfig(this.defaultConfig, imported.config);
                
                // Validate merged config
                if (!this.config || typeof this.config !== 'object') {
                    throw new Error('Merged config is invalid');
                }
                
                this.saveConfig();
                return true;
            }
            
            // Try importing config directly if no wrapper
            if (imported.systemPrompt || imported.sectionSettings) {
                this.config = this.mergeConfig(this.defaultConfig, imported);
                this.saveConfig();
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Error importing config:', error);
            if (error instanceof SyntaxError) {
                throw new Error('Invalid JSON format');
            }
            throw error;
        }
    }

    // Get full config for display
    getFullConfig() {
        return JSON.parse(JSON.stringify(this.config));
    }
}

// Create global instance with error handling
try {
    window.ConfigManager = ConfigManager;
    window.configManager = new ConfigManager();
} catch (error) {
    console.error('Error initializing ConfigManager:', error);
    // Create fallback with defaults
    window.configManager = {
        getSystemPrompt: () => 'You are a professional report writer.',
        getSectionSettings: () => ({ temperature: 0.7, maxTokens: 4000 }),
        getReviewSettings: () => ({ enabled: true, temperature: 0.5 }),
        getDocumentSettings: () => ({ maxTokensPerDocument: 3000 }),
        getOutputSettings: () => ({ defaultFormat: 'docx' }),
        getAssistantSettings: () => ({ systemPrompt: 'You are an AI assistant.', temperature: 0.8 }),
        getAdvancedSettings: () => ({ showTokenCounts: true, logAllPrompts: false }),
        saveConfig: () => false,
        resetToDefaults: () => false
    };
}

