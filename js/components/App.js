class App extends Component {
    onMount() {
        // Initialize child components
        this.sidebar = new Sidebar(this.container.querySelector('#sidebar-container'));
        this.sidebar.mount();

        this.mainContent = this.container.querySelector('#main-content');

        // Subscribe to view changes
        window.store.subscribe(state => {
            if (state.currentView !== this.currentView) {
                this.currentView = state.currentView;
                this.renderView(state.currentView);
            }
        });

        // Initial render
        this.currentView = window.store.getState().currentView;
        this.renderView(this.currentView);

        // Show Welcome Modal
        const welcomeContainer = document.createElement('div');
        document.body.appendChild(welcomeContainer);
        this.welcomeModal = new WelcomeModal(welcomeContainer, () => {
            welcomeContainer.remove();
        });
        this.welcomeModal.mount();
    }

    render() {
        this.container.innerHTML = `
            <div id="sidebar-container"></div>
            <main class="flex-1 bg-gray-50 dark:bg-gray-900 h-full overflow-hidden flex flex-col relative transition-colors">
                <!-- Top Bar -->
                <header class="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-8 z-10 transition-colors">
                    <div class="flex items-center gap-4">
                        <h2 id="page-title" class="text-lg font-semibold text-gray-800 dark:text-white">Dashboard</h2>
                    </div>
                    <div class="flex items-center gap-4">
                        <button id="theme-toggle" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors">
                            <i data-lucide="moon" class="w-5 h-5"></i>
                        </button>
                        <div class="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                            <input type="password" id="api-key-input" class="bg-transparent border-none text-sm focus:ring-0 w-32 text-gray-800 dark:text-white placeholder-gray-500" placeholder="API Key">
                            <button id="save-api-key" class="p-1 hover:bg-white dark:hover:bg-gray-600 rounded shadow-sm transition-all text-gray-500 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400">
                                <i data-lucide="check" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                </header>

                <!-- Content Area -->
                <div id="main-content" class="flex-1 overflow-y-auto p-8">
                    <!-- Dynamic Content -->
                </div>
            </main>
        `;

        // Bind API Key events
        const apiKeyInput = this.container.querySelector('#api-key-input');
        apiKeyInput.value = window.store.getState().apiKey;

        this.container.querySelector('#save-api-key').addEventListener('click', () => {
            window.store.setState({ apiKey: apiKeyInput.value });
            alert('API Key Saved');
        });

        // Theme Toggle
        const themeToggle = this.container.querySelector('#theme-toggle');
        const updateThemeIcon = (isDark) => {
            themeToggle.innerHTML = isDark ? '<i data-lucide="sun" class="w-5 h-5"></i>' : '<i data-lucide="moon" class="w-5 h-5"></i>';
            if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
        };

        // Init Theme
        const savedTheme = localStorage.getItem('theme') || 'light';
        if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark');
            updateThemeIcon(true);
        }

        themeToggle.addEventListener('click', () => {
            const isDark = document.documentElement.classList.toggle('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            updateThemeIcon(isDark);
        });
    }

    renderView(view) {
        if (!this.mainContent) return;

        // Destroy previous component if exists
        if (this.currentViewComponent) {
            if (typeof this.currentViewComponent.destroy === 'function') {
                this.currentViewComponent.destroy();
            }
            this.currentViewComponent = null;
        }

        this.mainContent.innerHTML = ''; // Clear current view
        const pageTitle = this.container.querySelector('#page-title');

        switch (view) {
            case 'setup':
                pageTitle.textContent = 'Dashboard';
                this.renderSetup(this.mainContent);
                break;
            case 'builder':
                pageTitle.textContent = 'Report Structure';
                this.currentViewComponent = new SectionManager(this.mainContent);
                this.currentViewComponent.mount();
                break;
            case 'context':
                pageTitle.textContent = 'Global Documents';
                this.currentViewComponent = new GlobalContextManager(this.mainContent);
                this.currentViewComponent.mount();
                break;
            case 'chat':
                pageTitle.textContent = 'AI Assistant';
                this.currentViewComponent = new ChatAssistant(this.mainContent);
                this.currentViewComponent.mount();
                break;
            case 'preview':
                pageTitle.textContent = 'Generate & Export';
                this.currentViewComponent = new PreviewModal(this.mainContent);
                this.currentViewComponent.mount();
                break;
            case 'settings':
                pageTitle.textContent = 'Settings';
                this.renderSettings(this.mainContent);
                break;
        }
    }

    renderSetup(container) {
        const state = window.store.getState();
        container.innerHTML = `
            <div class="max-w-2xl mx-auto space-y-6">
                <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 class="text-lg font-semibold mb-4">Report Settings</h3>
                    <div class="space-y-4">
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                                <div class="text-sm text-gray-500 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                                    ${state.apiKey ? '••••••••' + state.apiKey.slice(-4) : 'Not Set'}
                                </div>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Model</label>
                                <select id="model-select" class="w-full rounded-lg border-gray-200 focus:ring-red-500 focus:border-red-500"
                                    onchange="window.store.setState({ model: this.value })">
                                    <option value="gpt-4o-mini" ${state.model === 'gpt-4o-mini' ? 'selected' : ''}>GPT-4o Mini (30x Cheaper)</option>
                                    <option value="gpt-4o" ${state.model === 'gpt-4o' ? 'selected' : ''}>GPT-4o (Best Quality)</option>
                                    <option value="gpt-4.1" ${state.model === 'gpt-4.1' ? 'selected' : ''}>GPT-4.1 (Latest)</option>
                                    <option value="gpt-4-turbo" ${state.model === 'gpt-4-turbo' ? 'selected' : ''}>GPT-4 Turbo</option>
                                    <option value="o1-preview" ${state.model === 'o1-preview' ? 'selected' : ''}>o1 Preview (Reasoning)</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Max Budget ($)</label>
                                <input type="number" id="budget-input" min="0.1" step="0.1" 
                                    class="w-full rounded-lg border-gray-200 focus:ring-red-500 focus:border-red-500"
                                    value="${state.maxBudget || 5.0}"
                                    onchange="window.store.setState({ maxBudget: parseFloat(this.value) })">
                            </div>
                        </div>
                        
                        <div class="border-t border-gray-100 pt-4">
                            <label class="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" id="web-search-toggle" 
                                    ${state.searchProvider === 'openai' ? 'checked' : ''}
                                    class="rounded text-red-600 focus:ring-red-500 w-5 h-5"
                                    onchange="window.store.setState({ searchProvider: this.checked ? 'openai' : 'none' })">
                                <div>
                                    <span class="text-sm font-medium text-gray-700">Enable Web Search</span>
                                    <p class="text-xs text-gray-500">Uses OpenAI's built-in web search tool ($10/1k calls)</p>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                <div class="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                    <div class="flex gap-4">
                        <div class="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                            <i data-lucide="rocket" class="w-5 h-5 text-blue-600"></i>
                        </div>
                        <div>
                            <h4 class="font-semibold text-blue-900">Quick Start Guide</h4>
                            <ol class="text-sm text-blue-700 mt-2 space-y-1 list-decimal list-inside">
                                <li>Enter your API Key in the top right</li>
                                <li>Go to <strong>Report Structure</strong> to add sections</li>
                                <li>Or use <strong>AI Assistant</strong> to help you plan</li>
                                <li>Upload documents to provide context</li>
                                <li>Click <strong>Generate & Export</strong> when ready!</li>
                            </ol>
                        </div>
                    </div>
                </div>

                <div class="bg-amber-50 p-4 rounded-xl border border-amber-100">
                    <div class="flex gap-3">
                        <i data-lucide="lightbulb" class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"></i>
                        <div class="text-sm text-amber-800">
                            <strong>Tip:</strong> Use the <strong>Settings</strong> page to customize AI prompts, select industry profiles, and fine-tune generation parameters.
                        </div>
                    </div>
                </div>
            </div>
        `;
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        }
    }

    renderSettings(container) {
        // Get current profile and its prompt
        const currentProfile = window.profileManager?.getCurrentProfile();
        const profilePrompt = currentProfile?.getSystemPrompt?.() || '';
        const customPrompt = window.configManager?.getSystemPrompt('general') || '';
        const temperature = window.configManager?.getSectionSettings()?.temperature ?? 0.7;
        const maxTokens = window.configManager?.getSectionSettings()?.maxTokens ?? 4000;

        container.innerHTML = `
            <div class="max-w-4xl mx-auto space-y-6">
                <!-- Profile Selection with Live Preview -->
                <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
                        <i data-lucide="user-circle" class="w-5 h-5 text-red-600"></i>
                        Industry Profile
                    </h3>
                    <p class="text-sm text-gray-500 mb-4">Select a profile to customize AI behavior. The profile affects the system prompt below.</p>
                    
                    <div class="mb-4">
                        <select id="profile-select" class="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm">
                            ${(window.profileManager?.getAllProfiles() || []).map(p => `
                                <option value="${p.id}" ${currentProfile?.id === p.id ? 'selected' : ''}>
                                    ${p.icon || ''} ${p.name}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    
                    <div class="bg-blue-50 border border-blue-100 rounded-lg p-4">
                        <div class="flex items-center gap-2 mb-2">
                            <i data-lucide="info" class="w-4 h-4 text-blue-600"></i>
                            <span class="text-sm font-medium text-blue-900">Profile Default Prompt</span>
                        </div>
                        <p id="profile-prompt-preview" class="text-xs text-blue-800 font-mono whitespace-pre-wrap max-h-24 overflow-y-auto">${this.escapeHtml(profilePrompt)}</p>
                    </div>
                </div>

                <!-- AI System Prompt (Editable) -->
                <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 class="text-lg font-semibold mb-2 flex items-center gap-2">
                        <i data-lucide="message-square" class="w-5 h-5 text-red-600"></i>
                        Custom System Prompt
                    </h3>
                    <p class="text-sm text-gray-500 mb-4">Override or extend the profile's default prompt. Leave empty to use the profile default.</p>
                    
                    <textarea id="system-prompt-input" rows="8" 
                        class="w-full rounded-lg border-gray-200 focus:ring-red-500 focus:border-red-500 text-sm font-mono"
                        placeholder="Enter custom system prompt or leave empty to use profile default...">${this.escapeHtml(customPrompt)}</textarea>
                    
                    <div class="flex gap-3 mt-3">
                        <button id="save-prompt-btn" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                            Save Custom Prompt
                        </button>
                        <button id="copy-profile-prompt-btn" class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm transition-colors">
                            Copy Profile Default
                        </button>
                        <button id="clear-prompt-btn" class="text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg text-sm transition-colors">
                            Clear
                        </button>
                    </div>
                </div>

                <!-- Generation Settings -->
                <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
                        <i data-lucide="sliders" class="w-5 h-5 text-red-600"></i>
                        Generation Settings
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Temperature: <span id="temp-value" class="text-red-600 font-bold">${temperature}</span>
                            </label>
                            <input type="range" id="temperature-input" min="0" max="1" step="0.1" 
                                value="${temperature}"
                                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600">
                            <div class="flex justify-between text-xs text-gray-400 mt-1">
                                <span>Focused (0)</span>
                                <span>Creative (1)</span>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Max Tokens per Section</label>
                            <input type="number" id="max-tokens-input" 
                                value="${maxTokens}"
                                min="500" max="16000" step="500"
                                class="w-full rounded-lg border-gray-200 focus:ring-red-500 focus:border-red-500">
                            <p class="text-xs text-gray-400 mt-1">Recommended: 2000-6000</p>
                        </div>
                    </div>
                </div>

                <!-- Export/Import Config -->
                <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
                        <i data-lucide="download" class="w-5 h-5 text-red-600"></i>
                        Configuration
                    </h3>
                    <div class="flex flex-wrap gap-3">
                        <button id="export-config-btn" class="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors">
                            <i data-lucide="download" class="w-4 h-4"></i> Export Config
                        </button>
                        <button id="import-config-btn" class="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors">
                            <i data-lucide="upload" class="w-4 h-4"></i> Import Config
                        </button>
                        <button id="reset-config-btn" class="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm transition-colors">
                            <i data-lucide="refresh-cw" class="w-4 h-4"></i> Reset to Defaults
                        </button>
                    </div>
                    <input type="file" id="import-config-input" class="hidden" accept=".json">
                </div>

                <!-- Debug Options -->
                <div class="bg-gray-50 p-6 rounded-xl border border-gray-100">
                    <h3 class="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-700">
                        <i data-lucide="bug" class="w-5 h-5"></i>
                        Advanced Options
                    </h3>
                    <div class="space-y-3">
                        <label class="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" id="log-prompts-check" 
                                ${window.configManager?.getAdvancedSettings()?.logAllPrompts ? 'checked' : ''}
                                class="rounded text-red-600 focus:ring-red-500">
                            <span class="text-sm text-gray-700">Log all prompts to console (for debugging)</span>
                        </label>
                        <label class="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" id="show-tokens-check" 
                                ${window.configManager?.getAdvancedSettings()?.showTokenCounts ? 'checked' : ''}
                                class="rounded text-red-600 focus:ring-red-500">
                            <span class="text-sm text-gray-700">Show token counts</span>
                        </label>
                    </div>
                </div>
            </div>
        `;

        // Bind Profile Selection
        const profileSelect = container.querySelector('#profile-select');
        const profilePreview = container.querySelector('#profile-prompt-preview');
        if (profileSelect && window.profileManager) {
            profileSelect.addEventListener('change', (e) => {
                window.profileManager.setCurrentProfile(e.target.value);
                const newProfile = window.profileManager.getCurrentProfile();
                if (newProfile && profilePreview) {
                    profilePreview.textContent = newProfile.getSystemPrompt?.() || '';
                }
                this.showNotification(`Profile changed to: ${newProfile?.name || e.target.value}`);
            });
        }

        // Temperature slider with live value update
        const tempInput = container.querySelector('#temperature-input');
        const tempValue = container.querySelector('#temp-value');
        if (tempInput && tempValue) {
            tempInput.addEventListener('input', (e) => {
                tempValue.textContent = e.target.value;
            });
            tempInput.addEventListener('change', (e) => {
                if (window.configManager) {
                    window.configManager.setSectionSettings({ temperature: parseFloat(e.target.value) });
                    this.showNotification('Temperature saved!');
                }
            });
        }

        // Max tokens
        const maxTokensInput = container.querySelector('#max-tokens-input');
        if (maxTokensInput) {
            maxTokensInput.addEventListener('change', (e) => {
                if (window.configManager) {
                    window.configManager.setSectionSettings({ maxTokens: parseInt(e.target.value) });
                    this.showNotification('Max tokens saved!');
                }
            });
        }

        // Save prompt button
        const savePromptBtn = container.querySelector('#save-prompt-btn');
        if (savePromptBtn) {
            savePromptBtn.addEventListener('click', () => {
                const prompt = container.querySelector('#system-prompt-input').value;
                if (window.configManager) {
                    window.configManager.setSystemPrompt('general', prompt);
                    this.showNotification('Custom prompt saved!');
                }
            });
        }

        // Copy profile prompt button
        const copyProfileBtn = container.querySelector('#copy-profile-prompt-btn');
        if (copyProfileBtn) {
            copyProfileBtn.addEventListener('click', () => {
                const promptInput = container.querySelector('#system-prompt-input');
                const profile = window.profileManager?.getCurrentProfile();
                if (promptInput && profile) {
                    promptInput.value = profile.getSystemPrompt?.() || '';
                    this.showNotification('Profile prompt copied to editor!');
                }
            });
        }

        // Clear prompt button
        const clearBtn = container.querySelector('#clear-prompt-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                const promptInput = container.querySelector('#system-prompt-input');
                if (promptInput) {
                    promptInput.value = '';
                    if (window.configManager) {
                        window.configManager.setSystemPrompt('general', '');
                    }
                    this.showNotification('Custom prompt cleared!');
                }
            });
        }

        // Export config
        const exportBtn = container.querySelector('#export-config-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                if (window.configManager) {
                    window.configManager.exportConfig();
                }
            });
        }

        // Import config
        const importBtn = container.querySelector('#import-config-btn');
        const importInput = container.querySelector('#import-config-input');
        if (importBtn && importInput) {
            importBtn.addEventListener('click', () => importInput.click());
            importInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        try {
                            if (window.configManager) {
                                window.configManager.importConfig(event.target.result);
                                this.showNotification('Configuration imported!');
                                this.renderSettings(container);
                            }
                        } catch (error) {
                            alert('Error importing config: ' + error.message);
                        }
                    };
                    reader.readAsText(file);
                }
            });
        }

        // Reset config
        const resetBtn = container.querySelector('#reset-config-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (confirm('Reset all settings to defaults?')) {
                    if (window.configManager) {
                        window.configManager.resetToDefaults();
                        this.showNotification('Settings reset to defaults!');
                        this.renderSettings(container);
                    }
                }
            });
        }

        // Advanced options
        const logPromptsCheck = container.querySelector('#log-prompts-check');
        if (logPromptsCheck) {
            logPromptsCheck.addEventListener('change', (e) => {
                if (window.configManager) {
                    window.configManager.setAdvancedSettings({ logAllPrompts: e.target.checked });
                }
            });
        }

        const showTokensCheck = container.querySelector('#show-tokens-check');
        if (showTokensCheck) {
            showTokensCheck.addEventListener('change', (e) => {
                if (window.configManager) {
                    window.configManager.setAdvancedSettings({ showTokenCounts: e.target.checked });
                }
            });
        }

        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in';
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }
}
