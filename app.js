// Main Application Logic
class ReportGeneratorApp {
    constructor() {
        this.sections = [];
        this.globalDocuments = [];
        this.currentPresetName = 'Untitled Preset';
        this.reportTitle = '';
        this.chatHistory = [];
        this.lastSuggestions = [];
        this.generatedReport = null;
        this.savedPresets = this.loadPresetsFromStorage();
        
        this.init();
    }

    init() {
        this.loadApiKeyFromStorage();
        this.setupEventListeners();
        this.testApiConnection();
    }

    loadApiKeyFromStorage() {
        const apiKey = apiHandler.getApiKey();
        const model = apiHandler.getModel();
        
        if (apiKey) {
            document.getElementById('apiKey').value = apiKey;
        }
        
        if (model) {
            document.getElementById('modelSelect').value = model;
        }

        // Load report title
        const savedTitle = localStorage.getItem('report_title') || '';
        document.getElementById('reportTitle').value = savedTitle;
        this.reportTitle = savedTitle;
    }

    setupEventListeners() {
        // API Key Management
        document.getElementById('apiKey').addEventListener('change', (e) => {
            apiHandler.setApiKey(e.target.value);
            this.testApiConnection();
        });

        document.getElementById('toggleApiKey').addEventListener('click', () => {
            const input = document.getElementById('apiKey');
            input.type = input.type === 'password' ? 'text' : 'password';
        });

        document.getElementById('modelSelect').addEventListener('change', (e) => {
            apiHandler.setModel(e.target.value);
        });

        // Report Title
        document.getElementById('reportTitle').addEventListener('change', (e) => {
            this.reportTitle = e.target.value;
            localStorage.setItem('report_title', e.target.value);
        });

        // Global Documents
        const globalFileUploadArea = document.getElementById('globalFileUploadArea');
        const globalFileInput = document.getElementById('globalFileInput');
        const globalUploadedFiles = document.getElementById('globalUploadedFiles');

        globalFileUploadArea.addEventListener('click', (e) => {
            if (e.target !== globalFileUploadArea && !globalFileUploadArea.contains(e.target)) return;
            globalFileInput.click();
        });

        globalFileInput.addEventListener('change', (e) => {
            this.handleGlobalFileUpload(e.target.files);
            e.target.value = ''; // Reset input
        });

        // Drag and drop for global files
        globalFileUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            globalFileUploadArea.classList.add('dragover');
        });

        globalFileUploadArea.addEventListener('dragleave', () => {
            globalFileUploadArea.classList.remove('dragover');
        });

        globalFileUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            globalFileUploadArea.classList.remove('dragover');
            this.handleGlobalFileUpload(e.dataTransfer.files);
        });

        // Preset Management
        document.getElementById('newPreset').addEventListener('click', () => this.newPreset());
        document.getElementById('savePreset').addEventListener('click', () => this.savePreset());
        document.getElementById('loadPreset').addEventListener('click', () => this.loadPresetFile());
        document.getElementById('presetFileInput').addEventListener('change', (e) => this.loadPresetFromFile(e));

        // Section Management
        document.getElementById('addSection').addEventListener('click', () => this.addSection());

        // Update estimates when sections change
        this.setupEstimateUpdates();

        // AI Assistant
        document.getElementById('toggleAssistant').addEventListener('click', () => this.openAssistantModal());
        document.getElementById('closeAssistant').addEventListener('click', () => this.closeAssistantModal());
        document.getElementById('sendChat').addEventListener('click', () => this.sendChatMessage());
        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendChatMessage();
            }
        });
        document.getElementById('clearChat').addEventListener('click', () => this.clearChat());
        document.getElementById('applySuggestions').addEventListener('click', () => this.applySuggestions());

        // Report Generation
        document.getElementById('generateReport').addEventListener('click', () => this.generateReport());

        // Preview Modal
        document.getElementById('closePreview').addEventListener('click', () => this.closePreviewModal());
        document.getElementById('closePreviewBtn').addEventListener('click', () => this.closePreviewModal());
        document.getElementById('exportReport').addEventListener('click', () => this.exportReport());

        // Success Overlay
        document.getElementById('downloadWordBtn').addEventListener('click', () => this.exportReportDirect());
        document.getElementById('viewPreviewBtn').addEventListener('click', () => {
            this.hideSuccessOverlay();
            this.showPreviewModal();
        });
        document.getElementById('closeSuccessBtn').addEventListener('click', () => this.hideSuccessOverlay());

        // Close modals on outside click
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.classList.remove('show');
            }
        });
    }

    async testApiConnection() {
        const statusIndicator = document.getElementById('apiStatus');
        const apiKey = apiHandler.getApiKey();

        if (!apiKey) {
            statusIndicator.className = 'status-indicator';
            statusIndicator.title = 'API key not set';
            return;
        }

        try {
            await apiHandler.testConnection();
            statusIndicator.className = 'status-indicator success';
            statusIndicator.title = 'API connection successful';
        } catch (error) {
            statusIndicator.className = 'status-indicator error';
            statusIndicator.title = `API connection failed: ${error.message}`;
        }
    }

    // Section Management
    setupEstimateUpdates() {
        // Update estimates when relevant changes occur
        const updateEstimate = () => this.updateTokenEstimate();
        
        // Debounce to avoid too frequent updates
        let debounceTimer;
        const debouncedUpdate = () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(updateEstimate, 500);
        };

        // Will be called after section changes
        this.onSectionChange = debouncedUpdate;
    }

    updateTokenEstimate() {
        if (this.sections.length === 0) {
            document.getElementById('tokenEstimate').style.display = 'none';
            return;
        }

        // Process documents to get content for estimation
        const globalDocs = this.globalDocuments.map(f => ({
            content: 'X'.repeat(f.size) // Estimate based on file size
        }));

        const breakdown = tokenManager.calculateGenerationCost(this.sections, globalDocs);
        const model = apiHandler.getModel();
        const cost = tokenManager.estimateCost(breakdown.total, model);
        const rateLimit = tokenManager.checkRateLimits(breakdown.total, model);

        // Update UI
        document.getElementById('tokenEstimate').style.display = 'block';
        document.getElementById('estimatedTokens').textContent = tokenManager.formatTokenCount(breakdown.total);
        document.getElementById('estimatedCost').textContent = `$${cost.totalCost} (input: $${cost.inputCost} + output: $${cost.outputCost})`;
        
        const rateLimitSpan = document.getElementById('rateLimitStatus');
        if (rateLimit.withinLimit) {
            rateLimitSpan.innerHTML = `<span class="rate-limit-ok">✓ Within limit (${rateLimit.percentage}% of ${tokenManager.formatTokenCount(rateLimit.limit)})</span>`;
        } else {
            rateLimitSpan.innerHTML = `<span class="rate-limit-error">⚠ Exceeds limit! (${rateLimit.percentage}% of ${tokenManager.formatTokenCount(rateLimit.limit)})</span>`;
        }
    }

    addSection(sectionData = null) {
        const section = {
            id: Date.now() + Math.random(),
            name: sectionData?.name || '',
            description: sectionData?.description || '',
            manualText: sectionData?.manualText || '',
            overviewMode: sectionData?.overviewMode || false,
            files: sectionData?.files || [],
            processedDocuments: []
        };

        this.sections.push(section);
        this.renderSections();
        this.updateTokenEstimate();
    }

    removeSection(sectionId) {
        this.sections = this.sections.filter(s => s.id !== sectionId);
        this.renderSections();
        this.updateTokenEstimate();
    }

    renderSections() {
        const container = document.getElementById('sectionsContainer');
        let emptyState = document.getElementById('emptyState');

        if (this.sections.length === 0) {
            // Show empty state
            if (!emptyState) {
                emptyState = document.createElement('div');
                emptyState.id = 'emptyState';
                emptyState.className = 'empty-state';
                emptyState.innerHTML = `
                    <h2>No sections yet</h2>
                    <p>Click "Add Section" to start building your report, or use the AI Assistant to auto-configure sections.</p>
                `;
                container.appendChild(emptyState);
            }
            emptyState.style.display = 'block';
            return;
        }

        // Hide/remove empty state
        if (emptyState) {
            emptyState.style.display = 'none';
        }

        // Clear only section cards, not the empty state
        const sectionCards = container.querySelectorAll('.section-card');
        sectionCards.forEach(card => card.remove());

        // Add all sections
        this.sections.forEach((section, index) => {
            const sectionCard = this.createSectionCard(section, index);
            container.appendChild(sectionCard);
        });
    }

    createSectionCard(section, index) {
        const card = document.createElement('div');
        card.className = 'section-card';
        if (section.overviewMode) {
            card.classList.add('overview-mode');
        }
        card.dataset.sectionId = section.id;

        card.innerHTML = `
            <div class="section-header">
                <div class="section-title-container">
                    <div class="section-number">${index + 1}</div>
                    <input type="text" class="section-title-input" placeholder="Section Name" value="${this.escapeHtml(section.name)}">
                    ${section.overviewMode ? '<span class="overview-badge">📋 Overview Mode</span>' : ''}
                </div>
                <div class="section-actions">
                    <button class="btn btn-small btn-secondary move-up" ${index === 0 ? 'disabled' : ''}>↑</button>
                    <button class="btn btn-small btn-secondary move-down" ${index === this.sections.length - 1 ? 'disabled' : ''}>↓</button>
                    <button class="btn btn-small btn-secondary delete-section" style="color: var(--error-color);">Delete</button>
                </div>
            </div>
            <div class="section-body">
                <div class="overview-mode-toggle">
                    <label class="toggle-container">
                        <input type="checkbox" class="overview-checkbox" ${section.overviewMode ? 'checked' : ''}>
                        <span class="toggle-label">
                            <strong>📋 Overview Mode</strong>
                            <span class="toggle-description">Generate this section LAST using content from other sections (ideal for Executive Summary, Introduction, Conclusions)</span>
                        </span>
                    </label>
                </div>
                <div class="section-body">
                <div class="form-group">
                    <label>Description / Instructions</label>
                    <textarea placeholder="Describe what should be included in this section...">${this.escapeHtml(section.description)}</textarea>
                </div>
                <div class="form-group">
                    <label>Upload Documents (PDF, DOCX, TXT, Excel)</label>
                    <div class="file-upload-area">
                        <div class="file-upload-icon">📁</div>
                        <div class="file-upload-text">
                            <strong>Click to upload</strong> or drag and drop<br>
                            <small>PDF, DOCX, TXT, XLSX files (max 10MB each)</small>
                        </div>
                        <input type="file" class="file-input" multiple accept=".pdf,.docx,.txt,.xlsx,.xls,.csv" style="display: none;">
                    </div>
                    <div class="uploaded-files"></div>
                </div>
                <div class="form-group">
                    <label>Manual Text Input (optional)</label>
                    <textarea placeholder="Paste or type additional information here...">${this.escapeHtml(section.manualText)}</textarea>
                </div>
            </div>
        `;

        // Event listeners
        const titleInput = card.querySelector('.section-title-input');
        titleInput.addEventListener('change', (e) => {
            section.name = e.target.value;
        });

        const overviewCheckbox = card.querySelector('.overview-checkbox');
        overviewCheckbox.addEventListener('change', (e) => {
            e.stopPropagation(); // Prevent event bubbling
            const isChecked = e.target.checked;
            section.overviewMode = isChecked;
            
            const titleContainer = card.querySelector('.section-title-container');
            const existingBadge = titleContainer.querySelector('.overview-badge');
            
            if (isChecked) {
                card.classList.add('overview-mode');
                // Add badge if not exists
                if (!existingBadge) {
                    const badge = document.createElement('span');
                    badge.className = 'overview-badge';
                    badge.textContent = '📋 Overview Mode';
                    titleContainer.appendChild(badge);
                }
            } else {
                card.classList.remove('overview-mode');
                // Remove badge
                if (existingBadge) {
                    existingBadge.remove();
                }
            }
            this.updateTokenEstimate();
        });

        const descriptionTextarea = card.querySelectorAll('textarea')[0];
        descriptionTextarea.addEventListener('change', (e) => {
            section.description = e.target.value;
        });

        const manualTextarea = card.querySelectorAll('textarea')[1];
        manualTextarea.addEventListener('change', (e) => {
            section.manualText = e.target.value;
        });

        const deleteBtn = card.querySelector('.delete-section');
        deleteBtn.addEventListener('click', () => {
            if (confirm(`Delete section "${section.name}"?`)) {
                this.removeSection(section.id);
            }
        });

        const moveUpBtn = card.querySelector('.move-up');
        moveUpBtn.addEventListener('click', () => this.moveSection(index, index - 1));

        const moveDownBtn = card.querySelector('.move-down');
        moveDownBtn.addEventListener('click', () => this.moveSection(index, index + 1));

        // File upload handling
        const fileUploadArea = card.querySelector('.file-upload-area');
        const fileInput = card.querySelector('.file-input');
        const uploadedFilesContainer = card.querySelector('.uploaded-files');

        fileUploadArea.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files, section, uploadedFilesContainer);
        });

        // Drag and drop
        fileUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileUploadArea.classList.add('dragover');
        });

        fileUploadArea.addEventListener('dragleave', () => {
            fileUploadArea.classList.remove('dragover');
        });

        fileUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            fileUploadArea.classList.remove('dragover');
            this.handleFileUpload(e.dataTransfer.files, section, uploadedFilesContainer);
        });

        // Render existing files
        this.renderUploadedFiles(section, uploadedFilesContainer);

        return card;
    }

    async handleFileUpload(files, section, container) {
        for (let file of files) {
            try {
                docProcessor.validateFile(file);
                
                const fileData = {
                    file: file,
                    name: file.name,
                    size: file.size,
                    processed: false
                };

                section.files.push(fileData);
                this.renderUploadedFiles(section, container);
                this.updateTokenEstimate();
            } catch (error) {
                errorLogger?.logFileError('upload', file.name, error, { 
                    section: section.name,
                    isGlobal: false 
                });
                alert(error.message);
            }
        }
    }

    renderUploadedFiles(section, container) {
        container.innerHTML = '';
        
        section.files.forEach((fileData, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            
            fileItem.innerHTML = `
                <div class="file-info">
                    <span class="file-icon">${docProcessor.getFileIcon(fileData.name)}</span>
                    <span class="file-name">${this.escapeHtml(fileData.name)}</span>
                    <span class="file-size">(${docProcessor.formatFileSize(fileData.size)})</span>
                </div>
                <button class="btn-remove" title="Remove file">×</button>
            `;

            const removeBtn = fileItem.querySelector('.btn-remove');
            removeBtn.addEventListener('click', () => {
                section.files.splice(index, 1);
                this.renderUploadedFiles(section, container);
                this.updateTokenEstimate();
            });

            container.appendChild(fileItem);
        });
    }

    moveSection(fromIndex, toIndex) {
        if (toIndex < 0 || toIndex >= this.sections.length) return;
        
        const [section] = this.sections.splice(fromIndex, 1);
        this.sections.splice(toIndex, 0, section);
        this.renderSections();
    }

    // Global Documents Management
    async handleGlobalFileUpload(files) {
        for (let file of files) {
            try {
                docProcessor.validateFile(file);
                
                const fileData = {
                    file: file,
                    name: file.name,
                    size: file.size,
                    processed: false
                };

                this.globalDocuments.push(fileData);
            } catch (error) {
                errorLogger?.logFileError('upload', file.name, error, { isGlobal: true });
                alert(error.message);
            }
        }
        this.renderGlobalFiles();
        this.updateTokenEstimate();
    }

    renderGlobalFiles() {
        const container = document.getElementById('globalUploadedFiles');
        container.innerHTML = '';
        
        this.globalDocuments.forEach((fileData, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            
            fileItem.innerHTML = `
                <div class="file-info">
                    <span class="file-icon">${docProcessor.getFileIcon(fileData.name)}</span>
                    <span class="file-name">${this.escapeHtml(fileData.name)}</span>
                    <span class="file-size">(${docProcessor.formatFileSize(fileData.size)})</span>
                </div>
                <button class="btn-remove" title="Remove file">×</button>
            `;

            const removeBtn = fileItem.querySelector('.btn-remove');
            removeBtn.addEventListener('click', () => {
                this.globalDocuments.splice(index, 1);
                this.renderGlobalFiles();
                this.updateTokenEstimate();
            });

            container.appendChild(fileItem);
        });
    }

    // Preset Management (localStorage-based)
    loadPresetsFromStorage() {
        try {
            const saved = localStorage.getItem('openbank_presets');
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            return {};
        }
    }

    savePresetsToStorage() {
        try {
            localStorage.setItem('openbank_presets', JSON.stringify(this.savedPresets));
        } catch (error) {
            console.error('Error saving presets:', error);
        }
    }

    newPreset() {
        if (this.sections.length > 0 || this.globalDocuments.length > 0) {
            if (!confirm('Starting a new preset will clear all current sections and documents. Continue?')) {
                return;
            }
        }
        
        this.sections = [];
        this.globalDocuments = [];
        this.currentPresetName = 'Untitled Preset';
        document.getElementById('presetName').textContent = this.currentPresetName;
        this.renderSections();
        this.renderGlobalFiles();
    }

    savePreset() {
        const presetName = prompt('Enter a name for this preset:', this.currentPresetName);
        if (!presetName) return;

        this.currentPresetName = presetName;
        document.getElementById('presetName').textContent = this.currentPresetName;

        const preset = {
            name: presetName,
            reportTitle: this.reportTitle,
            model: apiHandler.getModel(),
            sections: this.sections.map(s => ({
                name: s.name,
                description: s.description,
                manualText: s.manualText,
                overviewMode: s.overviewMode
            })),
            createdAt: new Date().toISOString()
        };

        // Save to localStorage
        this.savedPresets[presetName] = preset;
        this.savePresetsToStorage();

        // Also offer download as backup
        const downloadChoice = confirm(`Preset "${presetName}" saved successfully!\n\nWould you like to download a backup copy?`);
        if (downloadChoice) {
            const blob = new Blob([JSON.stringify(preset, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${presetName.replace(/[^a-z0-9]/gi, '_')}.json`;
            link.click();
            URL.revokeObjectURL(url);
        }
    }

    async loadPresetFile(event) {
        // Show available presets from localStorage
        const presetNames = Object.keys(this.savedPresets);
        
        if (presetNames.length > 0) {
            let message = 'Saved Presets:\n\n';
            presetNames.forEach((name, index) => {
                message += `${index + 1}. ${name}\n`;
            });
            message += '\nEnter preset number to load, or click Cancel to load from file:';
            
            const choice = prompt(message);
            
            if (choice && !isNaN(choice)) {
                const index = parseInt(choice) - 1;
                if (index >= 0 && index < presetNames.length) {
                    const presetName = presetNames[index];
                    const preset = this.savedPresets[presetName];
                    this.applyPreset(preset);
                    return;
                }
            }
        }
        
        // Load from file
        document.getElementById('presetFileInput').click();
    }

    async loadPresetFromFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const preset = JSON.parse(text);

            if (!preset.sections || !Array.isArray(preset.sections)) {
                throw new Error('Invalid preset format');
            }

            this.applyPreset(preset);
        } catch (error) {
            alert(`Error loading preset: ${error.message}`);
        }

        event.target.value = '';
    }

    applyPreset(preset) {
        this.sections = [];
        preset.sections.forEach(s => this.addSection(s));

        this.currentPresetName = preset.name || 'Loaded Preset';
        document.getElementById('presetName').textContent = this.currentPresetName;

        // Load report title if exists
        if (preset.reportTitle) {
            this.reportTitle = preset.reportTitle;
            document.getElementById('reportTitle').value = preset.reportTitle;
            localStorage.setItem('report_title', preset.reportTitle);
        }

        if (preset.model) {
            document.getElementById('modelSelect').value = preset.model;
            apiHandler.setModel(preset.model);
        }

        alert('Preset loaded successfully!');
    }

    // AI Assistant / Chatbot
    openAssistantModal() {
        document.getElementById('assistantModal').classList.add('show');
    }

    closeAssistantModal() {
        document.getElementById('assistantModal').classList.remove('show');
    }

    async sendChatMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (!message) return;

        if (!apiHandler.getApiKey()) {
            alert('Please set your API key first');
            return;
        }

        // Add user message to chat
        this.chatHistory.push({ role: 'user', content: message });
        this.addChatMessage(message, 'user');
        input.value = '';

        // Show loading
        const loadingMsg = this.addChatMessage('Thinking...', 'assistant');

        try {
            const response = await apiHandler.generateChatResponse(this.chatHistory);
            
            // Remove loading message
            loadingMsg.remove();
            
            // Add assistant response
            this.chatHistory.push({ role: 'assistant', content: response });
            this.addChatMessage(response, 'assistant');

            // Parse and store suggestions
            const suggestions = apiHandler.parseChatSuggestions(response);
            if (suggestions.length > 0) {
                this.lastSuggestions = suggestions;
                document.getElementById('applySuggestions').style.display = 'block';
            }
        } catch (error) {
            loadingMsg.remove();
            this.addChatMessage(`Error: ${error.message}`, 'assistant');
        }
    }

    addChatMessage(content, role) {
        const messagesContainer = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${role}-message`;
        
        // Convert markdown-style formatting to HTML
        const formattedContent = this.formatChatMessage(content);
        messageDiv.innerHTML = formattedContent;
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        return messageDiv;
    }

    formatChatMessage(content) {
        // Simple markdown-to-HTML conversion
        let html = content
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>');
        
        return `<p>${html}</p>`;
    }

    clearChat() {
        this.chatHistory = [];
        this.lastSuggestions = [];
        document.getElementById('chatMessages').innerHTML = `
            <div class="chat-message assistant-message">
                <p>Hello! I'm your AI assistant. Describe the report you want to create, and I'll suggest sections with instructions for you.</p>
                <p>For example: "I need a quarterly financial report" or "Create a market analysis report for the tech industry"</p>
            </div>
        `;
        document.getElementById('applySuggestions').style.display = 'none';
    }

    applySuggestions() {
        if (this.lastSuggestions.length === 0) {
            alert('No suggestions available');
            return;
        }

        const confirmMsg = `This will add ${this.lastSuggestions.length} sections to your report. Continue?`;
        if (!confirm(confirmMsg)) return;

        this.lastSuggestions.forEach(suggestion => {
            this.addSection(suggestion);
        });

        this.closeAssistantModal();
        alert(`Added ${this.lastSuggestions.length} sections successfully!`);
    }

    // Report Generation
    async generateReport() {
        if (this.sections.length === 0) {
            alert('Please add at least one section before generating the report');
            return;
        }

        if (!apiHandler.getApiKey()) {
            alert('Please set your API key first');
            return;
        }

        // Validate sections
        for (let section of this.sections) {
            if (!section.name.trim()) {
                alert('All sections must have a name');
                return;
            }
        }

        document.getElementById('progressContainer').style.display = 'block';
        this.updateProgress(0, 'Preparing to generate report...');

        try {
            const generatedSections = [];

            // Process and optimize global documents first
            const globalDocumentContents = [];
            if (this.globalDocuments.length > 0) {
                this.updateProgress(5, 'Processing and optimizing global documents...');
                for (let fileData of this.globalDocuments) {
                    try {
                        const processed = await docProcessor.processFile(fileData.file);
                        globalDocumentContents.push(processed);
                    } catch (error) {
                        console.error(`Error processing global file ${fileData.name}:`, error);
                        alert(`Error processing global document ${fileData.name}: ${error.message}`);
                    }
                }
                
                // Optimize global documents
                const optimized = tokenManager.summarizeDocuments(globalDocumentContents);
                globalDocumentContents.length = 0;
                globalDocumentContents.push(...optimized);
                
                const totalTokens = globalDocumentContents.reduce((sum, doc) => 
                    sum + tokenManager.estimateTokens(doc.content), 0);
                console.log(`Global documents optimized: ${tokenManager.formatTokenCount(totalTokens)}`);
            }

            // Separate regular and overview sections
            const regularSections = this.sections.filter(s => !s.overviewMode);
            const overviewSections = this.sections.filter(s => s.overviewMode);
            
            const totalSectionCount = this.sections.length;

            // Stage 1: Generate regular sections
            for (let i = 0; i < regularSections.length; i++) {
                const section = regularSections[i];
                const progress = 10 + ((i) / (totalSectionCount + 1)) * 70;
                
                this.updateProgress(progress, `Generating section ${i + 1} of ${regularSections.length}: ${section.name}`);

                // Process section-specific documents
                const documentContents = [...globalDocumentContents]; // Include global docs

                for (let fileData of section.files) {
                    try {
                        this.updateProgress(progress, `Processing document: ${fileData.name}`);
                        const processed = await docProcessor.processFile(fileData.file);
                        documentContents.push(processed);
                    } catch (error) {
                        console.error(`Error processing file ${fileData.name}:`, error);
                        alert(`Error processing ${fileData.name}: ${error.message}`);
                    }
                }

                // Add manual text if provided
                if (section.manualText.trim()) {
                    documentContents.push({
                        name: 'Manual Input',
                        content: section.manualText
                    });
                }

                // Optimize context for this section
                const optimizedContext = tokenManager.optimizeSectionContext(
                    documentContents,
                    section.description
                );
                
                console.log(`Section "${section.name}": ${tokenManager.formatTokenCount(optimizedContext.totalTokens)} (${optimizedContext.documentsIncluded}/${documentContents.length} docs)`);
                
                if (optimizedContext.documentsSkipped > 0) {
                    console.warn(`⚠ ${optimizedContext.documentsSkipped} documents partially excluded due to token limits`);
                }

                // Generate section content with optimized context
                const content = await apiHandler.generateSectionContent(
                    section.name,
                    section.description,
                    optimizedContext.documents
                );

                generatedSections.push({
                    name: section.name,
                    content: content
                });
            }

            // Stage 1.5: Generate overview sections with context from regular sections
            for (let i = 0; i < overviewSections.length; i++) {
                const section = overviewSections[i];
                const progress = 80 + ((i) / (overviewSections.length + 1)) * 10;
                
                this.updateProgress(progress, `Generating overview section: ${section.name}`);

                // Process section-specific documents
                const documentContents = [...globalDocumentContents];

                for (let fileData of section.files) {
                    try {
                        const processed = await docProcessor.processFile(fileData.file);
                        documentContents.push(processed);
                    } catch (error) {
                        console.error(`Error processing file ${fileData.name}:`, error);
                    }
                }

                if (section.manualText.trim()) {
                    documentContents.push({
                        name: 'Manual Input',
                        content: section.manualText
                    });
                }

                // Add context from already generated sections
                const contextSummary = generatedSections.map(s => 
                    `## ${s.name}\n${s.content.substring(0, 1000)}...`
                ).join('\n\n');
                
                documentContents.push({
                    name: 'Context from Other Sections',
                    content: contextSummary
                });

                const optimizedContext = tokenManager.optimizeSectionContext(
                    documentContents,
                    section.description
                );

                const content = await apiHandler.generateSectionContent(
                    section.name,
                    section.description,
                    optimizedContext.documents
                );

                generatedSections.push({
                    name: section.name,
                    content: content
                });
            }

            // Stage 2: Review and unify the report
            this.updateProgress(95, 'Reviewing and unifying the report...');
            
            // Use user-provided title, fallback to preset name, then default
            const reportTitle = this.reportTitle.trim() || 
                               (this.currentPresetName !== 'Untitled Preset' ? this.currentPresetName : 'Report');

            const finalReport = await apiHandler.reviewAndUnifyReport(generatedSections, reportTitle);

            this.generatedReport = {
                title: reportTitle,
                content: finalReport
            };

            this.updateProgress(100, 'Report generated successfully!');
            
            console.log('✅ Report generation complete!');
            console.log('📊 Generated report:', {
                title: this.generatedReport.title,
                contentLength: this.generatedReport.content.length,
                sections: generatedSections.length
            });
            
            // Verify report was actually stored
            if (!this.generatedReport || !this.generatedReport.content) {
                throw new Error('Report generation completed but content is missing');
            }
            
            setTimeout(() => {
                document.getElementById('progressContainer').style.display = 'none';
                this.showSuccessOverlay();
            }, 500);

        } catch (error) {
            console.error('❌ CRITICAL ERROR generating report:', error);
            console.error('Error stack:', error.stack);
            
            // Log comprehensive error
            errorLogger?.logGenerationError('report_generation', error, {
                sectionsCount: this.sections.length,
                globalDocsCount: this.globalDocuments.length,
                model: apiHandler.getModel()
            });
            
            document.getElementById('progressContainer').style.display = 'none';
            
            // Show detailed error
            const errorMessage = `❌ Error generating report: ${error.message}\n\nPlease:\n1. Check browser console (F12) for details\n2. Verify your API key is valid\n3. Check your internet connection\n4. Try with fewer/smaller documents\n\nError logged for debugging.`;
            alert(errorMessage);
        }
    }

    updateProgress(percentage, text) {
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        
        progressBar.style.width = `${percentage}%`;
        progressText.textContent = text;
    }

    // Success Overlay
    showSuccessOverlay() {
        console.log('📢 Showing success overlay');
        const overlay = document.getElementById('successOverlay');
        overlay.style.display = 'flex';
    }

    hideSuccessOverlay() {
        console.log('📢 Hiding success overlay');
        const overlay = document.getElementById('successOverlay');
        overlay.style.display = 'none';
    }

    // Preview and Export
    showPreviewModal() {
        if (!this.generatedReport) {
            console.error('❌ No generated report to preview');
            alert('Error: No report content to preview. Please try generating again.');
            return;
        }

        console.log('👁️ Opening preview modal with report:', this.generatedReport.title);

        try {
            const previewContent = document.getElementById('previewContent');
            previewContent.innerHTML = exportHandler.generatePreview(
                this.generatedReport.content,
                this.generatedReport.title
            );

            const modal = document.getElementById('previewModal');
            modal.classList.add('show');
            modal.style.display = 'flex';
            
            console.log('✅ Preview modal opened successfully');
        } catch (error) {
            console.error('❌ Error opening preview:', error);
            errorLogger?.logUIError('PreviewModal', 'open', error);
            alert(`Error showing preview: ${error.message}\n\nError logged for debugging.`);
        }
    }

    closePreviewModal() {
        const modal = document.getElementById('previewModal');
        modal.classList.remove('show');
        modal.style.display = 'none';
    }

    async exportReportDirect() {
        if (!this.generatedReport) {
            console.error('❌ No report to export');
            alert('No report to export. Please generate a report first.');
            return;
        }

        try {
            console.log('📄 Starting Word export...');
            document.getElementById('loadingOverlay').style.display = 'flex';
            document.getElementById('loadingText').textContent = 'Exporting to Word...';
            
            await exportHandler.exportToWord(
                this.generatedReport.content,
                this.generatedReport.title
            );

            document.getElementById('loadingOverlay').style.display = 'none';
            this.hideSuccessOverlay();
            
            console.log('✅ Export successful!');
            alert('✅ Report exported successfully! Check your downloads folder.');
        } catch (error) {
            console.error('❌ Export error:', error);
            errorLogger?.logExportError(error, { reportTitle: this.generatedReport?.title });
            document.getElementById('loadingOverlay').style.display = 'none';
            alert(`❌ Error exporting report: ${error.message}\n\nError logged for debugging. Check console (F12) for details.`);
        }
    }

    async exportReport() {
        if (!this.generatedReport) {
            alert('No report to export');
            return;
        }

        try {
            document.getElementById('loadingOverlay').style.display = 'flex';
            document.getElementById('loadingText').textContent = 'Exporting to Word...';
            
            await exportHandler.exportToWord(
                this.generatedReport.content,
                this.generatedReport.title
            );

            document.getElementById('loadingOverlay').style.display = 'none';
            this.closePreviewModal();
            alert('✅ Report exported successfully! Check your downloads folder.');
        } catch (error) {
            console.error('❌ Export error:', error);
            document.getElementById('loadingOverlay').style.display = 'none';
            alert(`❌ Error exporting report: ${error.message}`);
        }
    }

    // Utility functions
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ReportGeneratorApp();
});

