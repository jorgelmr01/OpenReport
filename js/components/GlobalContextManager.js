class GlobalContextManager extends Component {
    constructor(container) {
        super(container);
        this.state = {
            isDragging: false
        };
    }

    onMount() {
        this.render();
    }

    calculateStats() {
        const globalDocs = window.store.getState().globalDocuments || [];
        let totalTokens = 0;

        globalDocs.forEach(doc => {
            totalTokens += window.TokenService.estimateTokens(doc.content);
        });

        const model = window.store.getState().model || 'gpt-4o';
        const estimatedCost = window.TokenService.estimateCost(totalTokens, model);

        return {
            count: globalDocs.length,
            tokens: totalTokens,
            cost: estimatedCost
        };
    }

    async optimizeDocument(index) {
        const doc = window.store.getState().globalDocuments[index];
        if (!doc) return;

        if (!confirm(`Optimize "${doc.name}"? This will summarize the document to reduce token usage. The original full content will be replaced.`)) return;

        // Show loading state
        const originalBtn = this.container.querySelector(`.optimize-btn[data-index="${index}"]`);
        if (originalBtn) {
            originalBtn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i>';
            if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
        }

        try {
            const summary = await window.OpenAIService.generateSummary(doc.content);
            const optimizedDoc = {
                ...doc,
                content: `[SUMMARY OF ${doc.name}]\n${summary}`,
                originalSize: doc.content.length,
                isOptimized: true
            };

            const currentDocs = window.store.getState().globalDocuments;
            const newDocs = [...currentDocs];
            newDocs[index] = optimizedDoc;

            window.store.setState({ globalDocuments: newDocs });
            alert(`Optimization complete! Reduced from ${window.TokenService.formatCount(window.TokenService.estimateTokens(doc.content))} to ${window.TokenService.formatCount(window.TokenService.estimateTokens(optimizedDoc.content))} tokens.`);
        } catch (error) {
            console.error('Optimization failed:', error);
            alert(`Optimization failed: ${error.message}`);
        } finally {
            this.render();
        }
    }

    render() {
        const globalDocs = window.store.getState().globalDocuments || [];
        const stats = this.calculateStats();

        this.container.innerHTML = `
            <div class="max-w-4xl mx-auto p-6 animate-fade-in">
                <div class="mb-8 flex justify-between items-start">
                    <div>
                        <h2 class="text-2xl font-bold text-gray-900">Global Context</h2>
                        <p class="text-gray-500 mt-1">Upload documents here that should be available to the AI for ALL sections of your report.</p>
                    </div>
                    
                    <!-- Stats Card -->
                    <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex gap-6">
                        <div>
                            <p class="text-xs font-semibold text-gray-500 uppercase">Context Size</p>
                            <p class="text-lg font-bold text-gray-900">${window.TokenService.formatCount(stats.tokens)} <span class="text-xs font-normal text-gray-400">tokens</span></p>
                        </div>
                        <div class="border-l border-gray-100 pl-6">
                            <p class="text-xs font-semibold text-gray-500 uppercase">Est. Cost / Run</p>
                            <p class="text-lg font-bold text-gray-900">$${stats.cost}</p>
                        </div>
                    </div>
                </div>

                <!-- Upload Area -->
                <div class="mb-8">
                    <div id="drop-zone" class="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center hover:border-red-500 hover:bg-red-50 transition-all cursor-pointer ${this.state.isDragging ? 'border-red-500 bg-red-50' : ''}">
                        <div class="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i data-lucide="upload-cloud" class="w-8 h-8"></i>
                        </div>
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">Upload Global Documents</h3>
                        <p class="text-gray-500 mb-6 max-w-md mx-auto">Drag and drop files here, or click to browse. Supported formats: PDF, DOCX, XLSX, TXT, MD.</p>
                        <button class="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm hover:shadow-md inline-flex items-center gap-2">
                            <i data-lucide="file-plus" class="w-4 h-4"></i>
                            Select Files
                        </button>
                        <input type="file" multiple class="hidden" id="file-input" accept=".pdf,.docx,.xlsx,.txt,.md,.json">
                    </div>
                </div>

                <!-- File List -->
                <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div class="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <h3 class="font-semibold text-gray-900">Uploaded Documents (${globalDocs.length})</h3>
                        ${globalDocs.length > 0 ? `
                            <button id="clear-all-btn" class="text-sm text-red-600 hover:text-red-700 hover:underline">
                                Clear All
                            </button>
                        ` : ''}
                    </div>
                    
                    ${globalDocs.length === 0 ? `
                        <div class="p-12 text-center text-gray-400">
                            <i data-lucide="files" class="w-12 h-12 mx-auto mb-3 opacity-50"></i>
                            <p>No global documents uploaded yet.</p>
                        </div>
                    ` : `
                        <div class="divide-y divide-gray-100">
                            ${globalDocs.map((doc, index) => `
                                <div class="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                                    <div class="flex items-center gap-4">
                                        <div class="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                                            <i data-lucide="${this.getFileIcon(doc.name)}" class="w-5 h-5"></i>
                                        </div>
                                        <div>
                                            <h4 class="font-medium text-gray-900 truncate max-w-md flex items-center gap-2">
                                                ${doc.name}
                                                ${doc.isOptimized ? '<span class="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold">Optimized</span>' : ''}
                                            </h4>
                                            <p class="text-xs text-gray-500">${this.formatSize(doc.content.length)} • ${window.TokenService.formatCount(window.TokenService.estimateTokens(doc.content))} tokens</p>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-1">
                                        ${!doc.isOptimized ? `
                                            <button class="optimize-btn p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" data-index="${index}" title="Optimize (Summarize) to save costs">
                                                <i data-lucide="zap" class="w-4 h-4"></i>
                                            </button>
                                        ` : ''}
                                        <button class="delete-btn p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" data-index="${index}" title="Remove file">
                                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
        this.bindEvents();
    }

    getFileIcon(filename) {
        if (filename.endsWith('.pdf')) return 'file-text';
        if (filename.endsWith('.xlsx')) return 'sheet';
        if (filename.endsWith('.docx')) return 'file-type-2';
        return 'file';
    }

    formatSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    bindEvents() {
        const dropZone = this.container.querySelector('#drop-zone');
        const fileInput = this.container.querySelector('#file-input');
        const selectBtn = dropZone.querySelector('button');

        // Drag & Drop
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        dropZone.addEventListener('dragenter', () => this.setState({ isDragging: true }));
        dropZone.addEventListener('dragover', () => this.setState({ isDragging: true }));
        dropZone.addEventListener('dragleave', () => this.setState({ isDragging: false }));

        dropZone.addEventListener('drop', (e) => {
            this.setState({ isDragging: false });
            const files = e.dataTransfer.files;
            this.handleFiles(files);
        });

        // Click to upload
        dropZone.addEventListener('click', () => fileInput.click());
        selectBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });

        // Delete buttons
        this.container.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.dataset.index);
                this.deleteFile(index);
            });
        });

        // Optimize buttons
        this.container.querySelectorAll('.optimize-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.dataset.index);
                this.optimizeDocument(index);
            });
        });

        // Clear all
        const clearBtn = this.container.querySelector('#clear-all-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to remove all global documents?')) {
                    window.store.setState({ globalDocuments: [] });
                    this.render();
                }
            });
        }
    }

    async handleFiles(fileList) {
        const files = Array.from(fileList);
        if (files.length === 0) return;

        // Show loading state (simple alert for now, could be better UI)
        const originalText = this.container.querySelector('h3').textContent;
        this.container.querySelector('h3').textContent = `Processing ${files.length} files...`;

        const newDocs = [];
        for (const file of files) {
            try {
                const processed = await window.DocumentService.processFile(file);
                newDocs.push(processed);
            } catch (error) {
                console.error('File processing error:', error);
                alert(`Error processing ${file.name}: ${error.message}`);
            }
        }

        const currentDocs = window.store.getState().globalDocuments || [];
        window.store.setState({
            globalDocuments: [...currentDocs, ...newDocs]
        });

        this.render();
    }

    deleteFile(index) {
        const currentDocs = window.store.getState().globalDocuments || [];
        const newDocs = currentDocs.filter((_, i) => i !== index);
        window.store.setState({ globalDocuments: newDocs });
        this.render();
    }
}
