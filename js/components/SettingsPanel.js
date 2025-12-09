/**
 * Settings Panel - Comprehensive settings UI with full transparency
 */
class SettingsPanel extends Component {
    constructor(container) {
        super(container);
        this.configManager = window.configManager;
        this.activeTab = 'prompts';
        this.eventListeners = [];
        
        // Safety check
        if (!this.configManager) {
            console.error('ConfigManager not available');
        }
    }

    render() {
        if (!this.container) return;
        
        if (!this.configManager) {
            this.container.innerHTML = '<div class="p-4 text-red-600">ConfigManager not available. Please refresh the page.</div>';
            return;
        }
        
        const html = `
            <div class="settings-panel-container bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <div class="flex items-center justify-between mb-6">
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                        ⚙️ Settings & Configuration
                    </h2>
                    <button id="closeSettings" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        ✕
                    </button>
                </div>

                <!-- Tabs -->
                <div class="flex border-b border-gray-200 dark:border-gray-700 mb-6">
                    ${this.renderTab('prompts', 'AI Prompts', '💬')}
                    ${this.renderTab('sections', 'Section Settings', '📝')}
                    ${this.renderTab('review', 'Review Settings', '🔍')}
                    ${this.renderTab('documents', 'Document Processing', '📄')}
                    ${this.renderTab('output', 'Output Format', '📤')}
                    ${this.renderTab('assistant', 'AI Assistant', '🤖')}
                    ${this.renderTab('advanced', 'Advanced', '🔧')}
                </div>

                <!-- Tab Content -->
                <div class="settings-content">
                    ${this.renderTabContent()}
                </div>

                <!-- Actions -->
                <div class="mt-6 flex gap-3 justify-end border-t border-gray-200 dark:border-gray-700 pt-4">
                    <button id="resetDefaults" class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                        Reset to Defaults
                    </button>
                    <button id="exportConfig" class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                        Export Config
                    </button>
                    <button id="importConfig" class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                        Import Config
                    </button>
                    <input type="file" id="importConfigFile" accept=".json" style="display: none;">
                    <button id="saveSettings" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Save All Settings
                    </button>
                </div>
            </div>
        `;
        this.container.innerHTML = html;
        this.element = this.container.querySelector('.settings-panel-container') || this.container;
    }

    mount(selector) {
        if (selector) {
            this.container = document.querySelector(selector);
        }
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'settings-panel-wrapper';
            document.body.appendChild(this.container);
        }
        this.render();
        this.attachEventListeners();
    }

    onMount() {
        this.attachEventListeners();
    }

    renderTab(id, label, icon) {
        const isActive = this.activeTab === id;
        return `
            <button 
                class="tab-button px-4 py-2 border-b-2 transition-colors ${
                    isActive 
                        ? 'border-blue-600 text-blue-600 dark:text-blue-400' 
                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }"
                data-tab="${id}"
            >
                ${icon} ${label}
            </button>
        `;
    }

    renderTabContent() {
        switch (this.activeTab) {
            case 'prompts':
                return this.renderPromptsTab();
            case 'sections':
                return this.renderSectionsTab();
            case 'review':
                return this.renderReviewTab();
            case 'documents':
                return this.renderDocumentsTab();
            case 'output':
                return this.renderOutputTab();
            case 'assistant':
                return this.renderAssistantTab();
            case 'advanced':
                return this.renderAdvancedTab();
            default:
                return '';
        }
    }

    renderPromptsTab() {
        const config = this.configManager.getFullConfig();
        return `
            <div class="space-y-6">
                <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                    <p class="text-sm text-yellow-800 dark:text-yellow-200">
                        <strong>💡 Full Transparency:</strong> These prompts are sent directly to the AI. 
                        Edit them to control exactly how the AI behaves. Changes take effect immediately.
                    </p>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        General System Prompt
                    </label>
                    <textarea 
                        id="systemPromptGeneral" 
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono text-sm"
                        rows="6"
                    >${this.escapeHtml(config.systemPrompt.general)}</textarea>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Used as the base system prompt for all AI interactions
                    </p>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Section Generation Prompt
                    </label>
                    <textarea 
                        id="systemPromptSection" 
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono text-sm"
                        rows="6"
                    >${this.escapeHtml(config.systemPrompt.sectionGeneration)}</textarea>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Used when generating individual sections
                    </p>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Review & Unify Prompt
                    </label>
                    <textarea 
                        id="systemPromptReview" 
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono text-sm"
                        rows="6"
                    >${this.escapeHtml(config.systemPrompt.reviewAndUnify)}</textarea>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Used in the final review stage to unify all sections
                    </p>
                </div>
            </div>
        `;
    }

    renderSectionsTab() {
        const settings = this.configManager.getSectionSettings();
        return `
            <div class="space-y-4">
                <div>
                    <label class="flex items-center">
                        <input 
                            type="checkbox" 
                            id="includeDocumentContext" 
                            ${settings.includeDocumentContext ? 'checked' : ''}
                            class="mr-2"
                        >
                        <span class="text-sm text-gray-700 dark:text-gray-300">
                            Include document context in sections
                        </span>
                    </label>
                </div>

                <div>
                    <label class="flex items-center">
                        <input 
                            type="checkbox" 
                            id="includeManualText" 
                            ${settings.includeManualText ? 'checked' : ''}
                            class="mr-2"
                        >
                        <span class="text-sm text-gray-700 dark:text-gray-300">
                            Include manual text input in sections
                        </span>
                    </label>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Max Context Length (tokens): ${settings.maxContextLength}
                    </label>
                    <input 
                        type="range" 
                        id="maxContextLength" 
                        min="1000" 
                        max="16000" 
                        step="500"
                        value="${settings.maxContextLength}"
                        class="w-full"
                    >
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Temperature: ${settings.temperature}
                    </label>
                    <input 
                        type="range" 
                        id="sectionTemperature" 
                        min="0" 
                        max="2" 
                        step="0.1"
                        value="${settings.temperature}"
                        class="w-full"
                    >
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Higher = more creative, Lower = more focused
                    </p>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Max Tokens per Section: ${settings.maxTokens}
                    </label>
                    <input 
                        type="number" 
                        id="sectionMaxTokens" 
                        min="500" 
                        max="8000"
                        value="${settings.maxTokens}"
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                    >
                </div>
            </div>
        `;
    }

    renderReviewTab() {
        const settings = this.configManager.getReviewSettings();
        return `
            <div class="space-y-4">
                <div>
                    <label class="flex items-center">
                        <input 
                            type="checkbox" 
                            id="reviewEnabled" 
                            ${settings.enabled ? 'checked' : ''}
                            class="mr-2"
                        >
                        <span class="text-sm text-gray-700 dark:text-gray-300">
                            Enable final review and unification
                        </span>
                    </label>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Temperature: ${settings.temperature}
                    </label>
                    <input 
                        type="range" 
                        id="reviewTemperature" 
                        min="0" 
                        max="2" 
                        step="0.1"
                        value="${settings.temperature}"
                        class="w-full"
                    >
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Max Tokens: ${settings.maxTokens}
                    </label>
                    <input 
                        type="number" 
                        id="reviewMaxTokens" 
                        min="1000" 
                        max="16000"
                        value="${settings.maxTokens}"
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                    >
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 mb-3">
                        Focus Areas:
                    </label>
                    ${['tone_consistency', 'no_contradictions', 'smooth_transitions', 'professional_language', 'coherent_flow'].map(area => `
                        <label class="flex items-center mb-2">
                            <input 
                                type="checkbox" 
                                class="focusArea" 
                                value="${area}"
                                ${settings.focusAreas.includes(area) ? 'checked' : ''}
                                class="mr-2"
                            >
                            <span class="text-sm text-gray-700 dark:text-gray-300">
                                ${area.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                        </label>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderDocumentsTab() {
        const settings = this.configManager.getDocumentSettings();
        return `
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Max Tokens per Document: ${settings.maxTokensPerDocument}
                    </label>
                    <input 
                        type="range" 
                        id="maxTokensPerDocument" 
                        min="500" 
                        max="10000" 
                        step="500"
                        value="${settings.maxTokensPerDocument}"
                        class="w-full"
                    >
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Max Tokens per Section: ${settings.maxTokensPerSection}
                    </label>
                    <input 
                        type="range" 
                        id="maxTokensPerSection" 
                        min="2000" 
                        max="16000" 
                        step="500"
                        value="${settings.maxTokensPerSection}"
                        class="w-full"
                    >
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Truncation Strategy
                    </label>
                    <select 
                        id="truncationStrategy"
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                    >
                        <option value="beginning" ${settings.truncationStrategy === 'beginning' ? 'selected' : ''}>
                            Keep Beginning
                        </option>
                        <option value="end" ${settings.truncationStrategy === 'end' ? 'selected' : ''}>
                            Keep End
                        </option>
                        <option value="smart" ${settings.truncationStrategy === 'smart' ? 'selected' : ''}>
                            Smart (AI-selected)
                        </option>
                    </select>
                </div>

                <div>
                    <label class="flex items-center">
                        <input 
                            type="checkbox" 
                            id="extractTables" 
                            ${settings.extractTables ? 'checked' : ''}
                            class="mr-2"
                        >
                        <span class="text-sm text-gray-700 dark:text-gray-300">
                            Extract tables from documents
                        </span>
                    </label>
                </div>

                <div>
                    <label class="flex items-center">
                        <input 
                            type="checkbox" 
                            id="extractImages" 
                            ${settings.extractImages ? 'checked' : ''}
                            class="mr-2"
                        >
                        <span class="text-sm text-gray-700 dark:text-gray-300">
                            Extract images from documents
                        </span>
                    </label>
                </div>
            </div>
        `;
    }

    renderOutputTab() {
        const settings = this.configManager.getOutputSettings();
        return `
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Default Export Format
                    </label>
                    <select 
                        id="defaultFormat"
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                    >
                        <option value="docx" ${settings.defaultFormat === 'docx' ? 'selected' : ''}>Word (.docx)</option>
                        <option value="pdf" ${settings.defaultFormat === 'pdf' ? 'selected' : ''}>PDF</option>
                        <option value="html" ${settings.defaultFormat === 'html' ? 'selected' : ''}>HTML</option>
                        <option value="markdown" ${settings.defaultFormat === 'markdown' ? 'selected' : ''}>Markdown</option>
                    </select>
                </div>

                <div class="space-y-2">
                    <label class="flex items-center">
                        <input 
                            type="checkbox" 
                            id="includeTOC" 
                            ${settings.includeTableOfContents ? 'checked' : ''}
                            class="mr-2"
                        >
                        <span class="text-sm text-gray-700 dark:text-gray-300">Include Table of Contents</span>
                    </label>

                    <label class="flex items-center">
                        <input 
                            type="checkbox" 
                            id="includePageNumbers" 
                            ${settings.includePageNumbers ? 'checked' : ''}
                            class="mr-2"
                        >
                        <span class="text-sm text-gray-700 dark:text-gray-300">Include Page Numbers</span>
                    </label>

                    <label class="flex items-center">
                        <input 
                            type="checkbox" 
                            id="includeHeader" 
                            ${settings.includeHeader ? 'checked' : ''}
                            class="mr-2"
                        >
                        <span class="text-sm text-gray-700 dark:text-gray-300">Include Header</span>
                    </label>

                    <label class="flex items-center">
                        <input 
                            type="checkbox" 
                            id="includeFooter" 
                            ${settings.includeFooter ? 'checked' : ''}
                            class="mr-2"
                        >
                        <span class="text-sm text-gray-700 dark:text-gray-300">Include Footer</span>
                    </label>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Custom Header Text
                    </label>
                    <input 
                        type="text" 
                        id="customHeader"
                        value="${this.escapeHtml(settings.customHeader)}"
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                        placeholder="Leave empty for default"
                    >
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Custom Footer Text
                    </label>
                    <input 
                        type="text" 
                        id="customFooter"
                        value="${this.escapeHtml(settings.customFooter)}"
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                        placeholder="Leave empty for default"
                    >
                </div>
            </div>
        `;
    }

    renderAssistantTab() {
        const settings = this.configManager.getAssistantSettings();
        return `
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        AI Assistant System Prompt
                    </label>
                    <textarea 
                        id="assistantSystemPrompt" 
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono text-sm"
                        rows="8"
                    >${this.escapeHtml(settings.systemPrompt)}</textarea>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Controls how the AI Assistant suggests report structures
                    </p>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Temperature: ${settings.temperature}
                    </label>
                    <input 
                        type="range" 
                        id="assistantTemperature" 
                        min="0" 
                        max="2" 
                        step="0.1"
                        value="${settings.temperature}"
                        class="w-full"
                    >
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Max Tokens: ${settings.maxTokens}
                    </label>
                    <input 
                        type="number" 
                        id="assistantMaxTokens" 
                        min="500" 
                        max="4000"
                        value="${settings.maxTokens}"
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                    >
                </div>
            </div>
        `;
    }

    renderAdvancedTab() {
        const settings = this.configManager.getAdvancedSettings();
        return `
            <div class="space-y-4">
                <div>
                    <label class="flex items-center">
                        <input 
                            type="checkbox" 
                            id="showTokenCounts" 
                            ${settings.showTokenCounts ? 'checked' : ''}
                            class="mr-2"
                        >
                        <span class="text-sm text-gray-700 dark:text-gray-300">Show token counts</span>
                    </label>
                </div>

                <div>
                    <label class="flex items-center">
                        <input 
                            type="checkbox" 
                            id="showCostEstimates" 
                            ${settings.showCostEstimates ? 'checked' : ''}
                            class="mr-2"
                        >
                        <span class="text-sm text-gray-700 dark:text-gray-300">Show cost estimates</span>
                    </label>
                </div>

                <div>
                    <label class="flex items-center">
                        <input 
                            type="checkbox" 
                            id="enableDebugMode" 
                            ${settings.enableDebugMode ? 'checked' : ''}
                            class="mr-2"
                        >
                        <span class="text-sm text-gray-700 dark:text-gray-300">Enable debug mode</span>
                    </label>
                </div>

                <div>
                    <label class="flex items-center">
                        <input 
                            type="checkbox" 
                            id="logAllPrompts" 
                            ${settings.logAllPrompts ? 'checked' : ''}
                            class="mr-2"
                        >
                        <span class="text-sm text-gray-700 dark:text-gray-300">Log all prompts to console</span>
                    </label>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        When enabled, all prompts sent to AI will be logged to browser console (F12)
                    </p>
                </div>

                <div>
                    <label class="flex items-center">
                        <input 
                            type="checkbox" 
                            id="retryOnError" 
                            ${settings.retryOnError ? 'checked' : ''}
                            class="mr-2"
                        >
                        <span class="text-sm text-gray-700 dark:text-gray-300">Retry on error</span>
                    </label>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Max Retries: ${settings.maxRetries}
                    </label>
                    <input 
                        type="number" 
                        id="maxRetries" 
                        min="0" 
                        max="10"
                        value="${settings.maxRetries}"
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                    >
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        if (!this.container) return;
        
        // Clean up old listeners
        this.removeEventListeners();
        
        const element = this.element || this.container;
        
        // Tab switching
        element.querySelectorAll('.tab-button').forEach(btn => {
            const tabHandler = (e) => {
                const tab = e.target?.dataset?.tab || e.target.closest('[data-tab]')?.dataset?.tab;
                if (tab) {
                    this.activeTab = tab;
                    this.render();
                    this.attachEventListeners();
                }
            };
            btn.addEventListener('click', tabHandler);
            this.eventListeners.push({ element: btn, event: 'click', handler: tabHandler });
        });

        // Close button
        const closeBtn = element.querySelector('#closeSettings');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.saveAllSettings();
                this.hide();
            });
        }

        // Save button
        const saveBtn = element.querySelector('#saveSettings');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveAllSettings();
                this.showNotification('Settings saved successfully!');
            });
        }

        // Reset defaults
        const resetBtn = element.querySelector('#resetDefaults');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (confirm('Reset all settings to defaults? This cannot be undone.')) {
                    this.configManager.resetToDefaults();
                    this.render();
                    this.attachEventListeners();
                    this.showNotification('Settings reset to defaults');
                }
            });
        }

        // Export config
        const exportBtn = element.querySelector('#exportConfig');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.configManager.exportConfig();
                this.showNotification('Configuration exported!');
            });
        }

        // Import config
        const importBtn = element.querySelector('#importConfig');
        const importFile = element.querySelector('#importConfigFile');
        if (importBtn && importFile) {
            importBtn.addEventListener('click', () => importFile.click());
            importFile.addEventListener('change', async (e) => {
                try {
                    const file = e.target.files[0];
                    if (!file) return;
                    
                    // Validate file type
                    if (!file.name.endsWith('.json')) {
                        alert('Please select a JSON file');
                        e.target.value = '';
                        return;
                    }
                    
                    // Validate file size (max 5MB)
                    if (file.size > 5 * 1024 * 1024) {
                        alert('File too large. Maximum size is 5MB.');
                        e.target.value = '';
                        return;
                    }
                    
                    const text = await file.text();
                    if (!text || text.trim().length === 0) {
                        alert('File is empty');
                        e.target.value = '';
                        return;
                    }
                    
                    try {
                        this.configManager.importConfig(text);
                        this.render();
                        this.attachEventListeners();
                        this.showNotification('Configuration imported successfully!');
                    } catch (importError) {
                        alert(`Error importing configuration: ${importError.message}`);
                    }
                } catch (error) {
                    console.error('Error reading file:', error);
                    alert(`Error reading file: ${error.message}`);
                } finally {
                    // Reset file input
                    e.target.value = '';
                }
            });
        }

        // Real-time updates for prompts
        ['systemPromptGeneral', 'systemPromptSection', 'systemPromptReview', 'assistantSystemPrompt'].forEach(id => {
            const el = element.querySelector(`#${id}`);
            if (el) {
                el.addEventListener('input', () => {
                    this.savePrompt(id);
                });
            }
        });

        // Settings updates
        this.attachSettingsListeners();
    }

    attachSettingsListeners() {
        // Section settings
        const sectionSettings = {
            includeDocumentContext: () => this.configManager.setSectionSettings({
                includeDocumentContext: element.querySelector('#includeDocumentContext').checked
            }),
            includeManualText: () => this.configManager.setSectionSettings({
                includeManualText: element.querySelector('#includeManualText').checked
            }),
            maxContextLength: () => {
                const val = parseInt(element.querySelector('#maxContextLength').value);
                const label = element.querySelector('#maxContextLength').closest('div').querySelector('label');
                if (label) label.textContent = `Max Context Length (tokens): ${val}`;
                this.configManager.setSectionSettings({ maxContextLength: val });
            },
            sectionTemperature: () => {
                const val = parseFloat(element.querySelector('#sectionTemperature').value);
                const label = element.querySelector('#sectionTemperature').closest('div').querySelector('label');
                if (label) label.textContent = `Temperature: ${val}`;
                this.configManager.setSectionSettings({ temperature: val });
            },
            sectionMaxTokens: () => this.configManager.setSectionSettings({
                maxTokens: parseInt(element.querySelector('#sectionMaxTokens').value)
            })
        };

        Object.entries(sectionSettings).forEach(([id, handler]) => {
            const el = element.querySelector(`#${id}`);
            if (el) el.addEventListener('input', handler);
        });

        // Similar for other tabs...
    }

    savePrompt(id) {
        const element = this.element || this.container;
        const value = element.querySelector(`#${id}`).value;
        
        if (id === 'systemPromptGeneral') {
            this.configManager.setSystemPrompt('general', value);
        } else if (id === 'systemPromptSection') {
            this.configManager.setSystemPrompt('sectionGeneration', value);
        } else if (id === 'systemPromptReview') {
            this.configManager.setSystemPrompt('reviewAndUnify', value);
        } else if (id === 'assistantSystemPrompt') {
            this.configManager.setAssistantSettings({ systemPrompt: value });
        }
    }

    saveAllSettings() {
        // Prompts are saved in real-time, but save other settings here
        // This is called when closing or clicking save
        this.configManager.saveConfig();
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    show() {
        if (this.container) {
            this.container.style.display = 'block';
        }
    }

    hide() {
        if (this.container) {
            this.container.style.display = 'none';
        }
    }

    removeEventListeners() {
        if (this.eventListeners && Array.isArray(this.eventListeners)) {
            this.eventListeners.forEach(({ element, event, handler }) => {
                if (element && typeof element.removeEventListener === 'function') {
                    element.removeEventListener(event, handler);
                }
            });
            this.eventListeners = [];
        }
    }

    destroy() {
        this.removeEventListeners();
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

