/**
 * Generation Workspace - Progressive generation with live preview
 * Shows sections as they're generated, allows individual control
 */
class GenerationWorkspace extends Component {
    constructor(container) {
        super(container);
        this.generatedSections = new Map(); // sectionId -> {content, status, error}
        this.isGenerating = false;
        this.isPaused = false;
        this.currentSectionIndex = 0;
    }

    render() {
        if (!this.container) return;
        
        // Safe access to store
        if (!window.store) {
            console.error('Store not available');
            return;
        }
        
        const state = window.store.getState();
        const sections = (state && state.sections) ? state.sections : [];
        const reportTitle = (state && state.reportTitle) ? state.reportTitle : 'Report';
        
        const html = `
            <div class="generation-workspace bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <!-- Header -->
                <div class="flex items-center justify-between mb-6">
                    <div>
                        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                            📊 Generating Report: "${reportTitle}"
                        </h2>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            ${this.getProgressText()}
                        </p>
                    </div>
                    <div class="flex gap-2">
                        ${this.isGenerating ? `
                            <button id="pauseGeneration" class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                                ${this.isPaused ? '▶️ Resume' : '⏸️ Pause'}
                            </button>
                        ` : ''}
                        <button id="exportCurrent" class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                            📥 Export Current
                        </button>
                        <button id="closeWorkspace" class="px-4 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                            ✕
                        </button>
                    </div>
                </div>

                <!-- Sections List -->
                <div class="space-y-4 max-h-[70vh] overflow-y-auto">
                    ${sections.map((section, index) => this.renderSectionCard(section, index)).join('')}
                </div>

                <!-- Actions -->
                <div class="mt-6 flex gap-3 justify-end border-t border-gray-200 dark:border-gray-700 pt-4">
                    ${this.isGenerating ? `
                        <button id="cancelGeneration" class="px-4 py-2 border border-red-300 dark:border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400">
                            Cancel Generation
                        </button>
                    ` : `
                        <button id="finalReview" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            🔍 Final Review
                        </button>
                        <button id="exportReport" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                            📄 Export Report
                        </button>
                    `}
                </div>
            </div>
        `;
        
        this.container.innerHTML = html;
    }

    renderSectionCard(section, index) {
        // Safety checks
        if (!section || !section.id) {
            console.warn('Invalid section in renderSectionCard:', section);
            return '';
        }
        
        const sectionData = this.generatedSections.get(section.id) || { status: 'queued' };
        const status = sectionData.status || 'queued';
        const sectionName = section.name || `Section ${index + 1}`;
        
        let statusIcon = '⏸️';
        let statusText = 'Queued';
        let statusColor = 'text-gray-500';
        
        if (status === 'generating') {
            statusIcon = '⏳';
            statusText = 'Generating...';
            statusColor = 'text-blue-600';
        } else if (status === 'complete') {
            statusIcon = '✅';
            statusText = 'Complete';
            statusColor = 'text-green-600';
        } else if (status === 'error') {
            statusIcon = '❌';
            statusText = 'Error';
            statusColor = 'text-red-600';
        } else if (status === 'paused') {
            statusIcon = '⏸️';
            statusText = 'Paused';
            statusColor = 'text-yellow-600';
        }
        
        return `
            <div class="section-card border-2 rounded-lg p-4 ${
                status === 'generating' ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20' :
                status === 'complete' ? 'border-green-300 bg-green-50 dark:bg-green-900/20' :
                status === 'error' ? 'border-red-300 bg-red-50 dark:bg-red-900/20' :
                'border-gray-200 dark:border-gray-700'
            }">
                <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-3">
                        <span class="text-2xl">${statusIcon}</span>
                        <div>
                            <h3 class="font-semibold text-gray-900 dark:text-white">
                                Section ${index + 1}: ${this.escapeHtml(sectionName)}
                            </h3>
                            <p class="text-sm ${statusColor}">${statusText}</p>
                        </div>
                    </div>
                    ${status === 'complete' ? `
                        <div class="flex gap-2">
                            <button class="regenerate-section px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700" data-section-id="${section.id}">
                                🔄 Regenerate
                            </button>
                            <button class="edit-section px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700" data-section-id="${section.id}">
                                ✏️ Edit
                            </button>
                        </div>
                    ` : ''}
                    ${status === 'error' ? `
                        <button class="retry-section px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700" data-section-id="${section.id}">
                            🔄 Retry
                        </button>
                    ` : ''}
                </div>
                
                ${status === 'generating' ? `
                    <div class="flex items-center gap-3 p-4 bg-white dark:bg-gray-700 rounded">
                        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span class="text-gray-600 dark:text-gray-300">Generating content...</span>
                    </div>
                ` : ''}
                
                ${status === 'complete' && sectionData.content ? `
                    <div class="section-preview p-4 bg-white dark:bg-gray-700 rounded max-h-64 overflow-y-auto">
                        <div class="prose dark:prose-invert max-w-none">
                            ${this.formatPreview(sectionData.content)}
                        </div>
                    </div>
                ` : ''}
                
                ${status === 'error' ? `
                    <div class="p-4 bg-red-50 dark:bg-red-900/20 rounded">
                        <p class="text-sm text-red-600 dark:text-red-400">
                            <strong>Error:</strong> ${this.escapeHtml(sectionData.error?.message || 'Unknown error')}
                        </p>
                    </div>
                ` : ''}
                
                ${status === 'queued' ? `
                    <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded">
                        <p class="text-sm text-gray-500 dark:text-gray-400">
                            Waiting to generate...
                        </p>
                    </div>
                ` : ''}
            </div>
        `;
    }

    getProgressText() {
        try {
            if (!window.store) {
                return 'Store not available';
            }
            
            const state = window.store.getState();
            const sections = (state && state.sections) ? state.sections : [];
            const completed = Array.from(this.generatedSections.values())
                .filter(s => s && s.status === 'complete').length;
            const total = Array.isArray(sections) ? sections.length : 0;
        
        if (this.isPaused) {
            return `Paused - ${completed}/${total} sections complete`;
        } else if (this.isGenerating) {
            return `Generating... ${completed}/${total} sections complete`;
        } else if (completed === total) {
            return `Complete - All ${total} sections generated`;
        } else {
            return `Ready to generate ${total} sections`;
        }
    }

    formatPreview(content) {
        // Safety check
        if (!content || typeof content !== 'string') {
            return '<p>No content available</p>';
        }
        
        // Simple markdown to HTML conversion for preview
        // Escape HTML first to prevent XSS
        const escaped = this.escapeHtml(content);
        return escaped
            .replace(/### (.*)/g, '<h3>$1</h3>')
            .replace(/## (.*)/g, '<h2>$1</h2>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>');
    }

    async startGeneration() {
        try {
            if (!window.store) {
                throw new Error('Store not available');
            }
            
            const state = window.store.getState();
            const sections = (state && state.sections) ? state.sections : [];
            
            if (!Array.isArray(sections) || sections.length === 0) {
                alert('No sections to generate');
                return;
            }
            
            // Validate sections have IDs
            const validSections = sections.filter(s => s && s.id);
            if (validSections.length === 0) {
                alert('No valid sections to generate');
                return;
            }
            
            this.isGenerating = true;
            this.isPaused = false;
            this.currentSectionIndex = 0;
            this.generatedSections.clear();
            
            // Initialize all sections as queued
            validSections.forEach(section => {
                if (section && section.id) {
                    this.generatedSections.set(section.id, { status: 'queued' });
                }
            });
            
            this.render();
            
            // Start generating sections one by one
            await this.generateSectionsProgressive(validSections);
        } catch (error) {
            console.error('Error starting generation:', error);
            this.isGenerating = false;
            alert(`Error starting generation: ${error.message}`);
            this.render();
        }
    }

    async generateSectionsProgressive(sections) {
        try {
            if (!Array.isArray(sections) || sections.length === 0) {
                return;
            }
            
            const regularSections = sections.filter(s => s && !s.overviewMode);
            const overviewSections = sections.filter(s => s && s.overviewMode);
            
            // Generate regular sections first
            for (let i = 0; i < regularSections.length; i++) {
                // Check if cancelled
                if (!this.isGenerating) {
                    break;
                }
                
                if (this.isPaused) {
                    await this.waitForResume();
                }
                
                const section = regularSections[i];
                if (section && section.id) {
                    await this.generateSection(section);
                }
            }
            
            // Generate overview sections
            for (let i = 0; i < overviewSections.length; i++) {
                // Check if cancelled
                if (!this.isGenerating) {
                    break;
                }
                
                if (this.isPaused) {
                    await this.waitForResume();
                }
                
                const section = overviewSections[i];
                if (section && section.id) {
                    await this.generateSection(section, true);
                }
            }
            
            this.isGenerating = false;
            this.render();
            
            // Notify completion
            if (window.eventBus && typeof window.eventBus.emit === 'function') {
                window.eventBus.emit('generationComplete', {
                    sections: Array.from(this.generatedSections.entries())
                });
            }
        } catch (error) {
            console.error('Error in progressive generation:', error);
            this.isGenerating = false;
            this.render();
            throw error;
        }
    }

    async generateSection(section, isOverview = false) {
        // Update status
        this.generatedSections.set(section.id, { status: 'generating' });
        this.render();
        
        try {
            // Get section content
            const content = await this.callGenerationService(section, isOverview);
            
            // Update with content
            this.generatedSections.set(section.id, {
                status: 'complete',
                content: content
            });
            
            this.render();
        } catch (error) {
            // Update with error
            this.generatedSections.set(section.id, {
                status: 'error',
                error: error
            });
            
            this.render();
        }
    }

    async callGenerationService(section, isOverview) {
        try {
            // Validate section
            if (!section || !section.id) {
                throw new Error('Invalid section');
            }
            
            // Check service availability
            const openAIService = window.OpenAIService;
            if (!openAIService || typeof openAIService.generateSection !== 'function') {
                throw new Error('OpenAI Service not available or invalid');
            }
            
            // Get documents for this section
            if (!window.store) {
                throw new Error('Store not available');
            }
            
            const state = window.store.getState();
            const globalDocs = (state && state.globalDocuments) ? state.globalDocuments : [];
            const sectionDocs = (section.files && Array.isArray(section.files)) ? section.files : [];
            
            // Process documents
            const documentContents = [];
            
            // Add global docs
            if (Array.isArray(globalDocs)) {
                for (const doc of globalDocs) {
                    if (doc && doc.processed) {
                        documentContents.push(doc.processed);
                    }
                }
            }
            
            // Add section docs
            if (window.DocumentService && typeof window.DocumentService.processFile === 'function') {
                for (const file of sectionDocs) {
                    if (file) {
                        try {
                            const processed = await window.DocumentService.processFile(file);
                            if (processed) {
                                documentContents.push(processed);
                            }
                        } catch (error) {
                            console.error(`Error processing file ${file.name || 'unknown'}:`, error);
                            // Continue with other files
                        }
                    }
                }
            }
            
            // Generate content
            if (isOverview) {
                // For overview sections, include context from other sections
                const otherSections = Array.from(this.generatedSections.entries())
                    .filter(([id, data]) => id !== section.id && data && data.status === 'complete' && data.content)
                    .map(([id, data]) => data.content)
                    .filter(content => content && typeof content === 'string')
                    .join('\n\n');
                
                return await openAIService.generateSection(section, documentContents, '', otherSections);
            } else {
                return await openAIService.generateSection(section, documentContents);
            }
        } catch (error) {
            console.error('Error in callGenerationService:', error);
            throw error;
        }
    }

    async waitForResume() {
        return new Promise((resolve) => {
            const checkResume = () => {
                if (!this.isPaused) {
                    resolve();
                } else {
                    setTimeout(checkResume, 100);
                }
            };
            checkResume();
        });
    }

    attachEventListeners() {
        if (!this.container) return;
        
        // Clean up old listeners first
        this.removeEventListeners();
        
        // Store listeners for cleanup
        this.eventListeners = [];
        
        // Pause/Resume
        const pauseBtn = this.container.querySelector('#pauseGeneration');
        if (pauseBtn) {
            const pauseHandler = () => {
                this.isPaused = !this.isPaused;
                this.render();
            };
            pauseBtn.addEventListener('click', pauseHandler);
            this.eventListeners.push({ element: pauseBtn, event: 'click', handler: pauseHandler });
        }
        
        // Regenerate section
        this.container.querySelectorAll('.regenerate-section').forEach(btn => {
            const regenerateHandler = async (e) => {
                try {
                    const sectionId = e.target?.dataset?.sectionId || e.target.closest('[data-section-id]')?.dataset?.sectionId;
                    if (!sectionId) return;
                    
                    if (!window.store) {
                        alert('Store not available');
                        return;
                    }
                    
                    const state = window.store.getState();
                    const sections = (state && state.sections) ? state.sections : [];
                    const section = sections.find(s => s && s.id === sectionId);
                    if (section) {
                        await this.generateSection(section);
                    }
                } catch (error) {
                    console.error('Error regenerating section:', error);
                    alert(`Error regenerating section: ${error.message}`);
                }
            };
            btn.addEventListener('click', regenerateHandler);
            this.eventListeners.push({ element: btn, event: 'click', handler: regenerateHandler });
        });
        
        // Retry section
        this.container.querySelectorAll('.retry-section').forEach(btn => {
            const retryHandler = async (e) => {
                try {
                    const sectionId = e.target?.dataset?.sectionId || e.target.closest('[data-section-id]')?.dataset?.sectionId;
                    if (!sectionId) return;
                    
                    if (!window.store) {
                        alert('Store not available');
                        return;
                    }
                    
                    const state = window.store.getState();
                    const sections = (state && state.sections) ? state.sections : [];
                    const section = sections.find(s => s && s.id === sectionId);
                    if (section) {
                        await this.generateSection(section);
                    }
                } catch (error) {
                    console.error('Error retrying section:', error);
                    alert(`Error retrying section: ${error.message}`);
                }
            };
            btn.addEventListener('click', retryHandler);
            this.eventListeners.push({ element: btn, event: 'click', handler: retryHandler });
        });
        
        // Edit section
        this.container.querySelectorAll('.edit-section').forEach(btn => {
            const editHandler = (e) => {
                try {
                    const sectionId = e.target?.dataset?.sectionId || e.target.closest('[data-section-id]')?.dataset?.sectionId;
                    if (!sectionId) return;
                    
                    const sectionData = this.generatedSections.get(sectionId);
                    if (sectionData && sectionData.content) {
                        this.openEditor(sectionId, sectionData.content);
                    }
                } catch (error) {
                    console.error('Error opening editor:', error);
                    alert(`Error opening editor: ${error.message}`);
                }
            };
            btn.addEventListener('click', editHandler);
            this.eventListeners.push({ element: btn, event: 'click', handler: editHandler });
        });
        
        // Export current
        const exportBtn = this.container.querySelector('#exportCurrent');
        if (exportBtn) {
            const exportHandler = () => {
                try {
                    this.exportCurrentReport();
                } catch (error) {
                    console.error('Error exporting current report:', error);
                    alert(`Error exporting: ${error.message}`);
                }
            };
            exportBtn.addEventListener('click', exportHandler);
            this.eventListeners.push({ element: exportBtn, event: 'click', handler: exportHandler });
        }
        
        // Final review
        const reviewBtn = this.container.querySelector('#finalReview');
        if (reviewBtn) {
            const reviewHandler = () => {
                try {
                    this.startFinalReview();
                } catch (error) {
                    console.error('Error starting final review:', error);
                    alert(`Error starting review: ${error.message}`);
                }
            };
            reviewBtn.addEventListener('click', reviewHandler);
            this.eventListeners.push({ element: reviewBtn, event: 'click', handler: reviewHandler });
        }
        
        // Export report
        const exportReportBtn = this.container.querySelector('#exportReport');
        if (exportReportBtn) {
            const exportReportHandler = () => {
                try {
                    this.exportFinalReport();
                } catch (error) {
                    console.error('Error exporting final report:', error);
                    alert(`Error exporting: ${error.message}`);
                }
            };
            exportReportBtn.addEventListener('click', exportReportHandler);
            this.eventListeners.push({ element: exportReportBtn, event: 'click', handler: exportReportHandler });
        }
        
        // Close
        const closeBtn = this.container.querySelector('#closeWorkspace');
        if (closeBtn) {
            const closeHandler = () => {
                this.hide();
            };
            closeBtn.addEventListener('click', closeHandler);
            this.eventListeners.push({ element: closeBtn, event: 'click', handler: closeHandler });
        }
        
        // Cancel
        const cancelBtn = this.container.querySelector('#cancelGeneration');
        if (cancelBtn) {
            const cancelHandler = () => {
                if (confirm('Cancel generation? Completed sections will be saved.')) {
                    this.isGenerating = false;
                    this.isPaused = false;
                    this.render();
                }
            };
            cancelBtn.addEventListener('click', cancelHandler);
            this.eventListeners.push({ element: cancelBtn, event: 'click', handler: cancelHandler });
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
        this.isGenerating = false;
        this.isPaused = false;
        if (this.container) {
            this.container.innerHTML = '';
        }
    }

    openEditor(sectionId, content) {
        try {
            if (!sectionId || !content) {
                console.error('Invalid parameters for openEditor');
                return;
            }
            
            // Open editor modal for section content
            const editor = document.createElement('div');
            editor.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
            editor.innerHTML = `
                <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    <h3 class="text-xl font-bold mb-4">Edit Section Content</h3>
                    <textarea id="sectionEditor" class="w-full h-96 p-4 border rounded-lg font-mono text-sm">${this.escapeHtml(String(content))}</textarea>
                    <div class="mt-4 flex gap-2 justify-end">
                        <button id="saveEdit" class="px-4 py-2 bg-blue-600 text-white rounded-lg">Save</button>
                        <button id="cancelEdit" class="px-4 py-2 border rounded-lg">Cancel</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(editor);
            
            const saveBtn = editor.querySelector('#saveEdit');
            const cancelBtn = editor.querySelector('#cancelEdit');
            const textarea = editor.querySelector('#sectionEditor');
            
            if (!saveBtn || !cancelBtn || !textarea) {
                console.error('Editor elements not found');
                editor.remove();
                return;
            }
            
            const saveHandler = () => {
                try {
                    const newContent = textarea.value;
                    const sectionData = this.generatedSections.get(sectionId);
                    if (sectionData) {
                        sectionData.content = newContent;
                        this.generatedSections.set(sectionId, sectionData);
                        this.render();
                    }
                    editor.remove();
                } catch (error) {
                    console.error('Error saving edit:', error);
                    alert(`Error saving: ${error.message}`);
                }
            };
            
            const cancelHandler = () => {
                editor.remove();
            };
            
            saveBtn.addEventListener('click', saveHandler);
            cancelBtn.addEventListener('click', cancelHandler);
            
            // Close on outside click
            editor.addEventListener('click', (e) => {
                if (e.target === editor) {
                    cancelHandler();
                }
            });
        } catch (error) {
            console.error('Error opening editor:', error);
            alert(`Error opening editor: ${error.message}`);
        }
    }

    exportCurrentReport() {
        try {
            const sections = Array.from(this.generatedSections.entries())
                .filter(([id, data]) => data && data.status === 'complete' && data.content)
                .map(([id, data]) => ({
                    id,
                    content: data.content
                }));
            
            if (sections.length === 0) {
                alert('No completed sections to export');
                return;
            }
            
            // Call export service
            if (window.ExportService && typeof window.ExportService.exportReport === 'function') {
                window.ExportService.exportReport(sections);
            } else {
                alert('Export service not available');
            }
        } catch (error) {
            console.error('Error exporting current report:', error);
            alert(`Error exporting: ${error.message}`);
        }
    }

    async startFinalReview() {
        // Start final review process
        const sections = Array.from(this.generatedSections.entries())
            .filter(([id, data]) => data.status === 'complete')
            .map(([id, data]) => ({
                id,
                content: data.content
            }));
        
        // Call review service
        // This would trigger the final review
    }

    exportFinalReport() {
        try {
            const sections = Array.from(this.generatedSections.entries())
                .filter(([id, data]) => data && data.status === 'complete' && data.content)
                .map(([id, data]) => ({
                    id,
                    content: data.content
                }));
            
            if (sections.length === 0) {
                alert('No completed sections to export');
                return;
            }
            
            if (window.ExportService && typeof window.ExportService.exportReport === 'function') {
                window.ExportService.exportReport(sections);
            } else {
                alert('Export service not available');
            }
        } catch (error) {
            console.error('Error exporting final report:', error);
            alert(`Error exporting: ${error.message}`);
        }
    }

    escapeHtml(text) {
        if (text == null || text === undefined) {
            return '';
        }
        const div = document.createElement('div');
        div.textContent = String(text);
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
}

