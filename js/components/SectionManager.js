class SectionManager extends Component {
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    onMount() {
        this.addSubscription(
            window.store.subscribe(state => {
                this.sections = state.sections;
                // Only render if container is still valid
                if (this.container && document.body.contains(this.container)) {
                    this.renderList();
                }
            })
        );
    }

    addSection() {
        const newSection = {
            id: Date.now(),
            name: 'New Section',
            description: '',
            files: [],
            overviewMode: false
        };
        const sections = [...window.store.getState().sections, newSection];
        window.store.setState({ sections });
    }

    deleteSection(id) {
        const sections = window.store.getState().sections.filter(s => s.id !== id);
        window.store.setState({ sections });
    }

    updateSection(id, updates) {
        const sections = window.store.getState().sections.map(s =>
            s.id === id ? { ...s, ...updates } : s
        );
        window.store.setState({ sections });
    }

    handleFileUpload(sectionId, files) {
        const section = window.store.getState().sections.find(s => s.id === sectionId);
        if (!section) return;

        Array.from(files).forEach(async file => {
            try {
                const processed = await window.DocumentService.processFile(file);
                const updatedFiles = [...section.files, processed];
                this.updateSection(sectionId, { files: updatedFiles });
            } catch (error) {
                alert(error.message);
            }
        });
    }

    render() {
        this.container.innerHTML = `
            <div class="max-w-4xl mx-auto">
                <!-- Header Controls -->
                <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6">
                    <div class="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                        <div class="flex-1 w-full">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Report Title</label>
                            <input type="text" id="report-title" 
                                class="w-full text-lg font-semibold border-gray-200 rounded-lg focus:ring-red-500 focus:border-red-500 placeholder-gray-400" 
                                placeholder="e.g., Q3 Financial Report"
                                value="${window.store.getState().reportTitle}">
                        </div>
                        <div class="flex gap-2 w-full md:w-auto">
                            <div class="relative">
                                <button id="presets-btn" class="flex items-center justify-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                                    <i data-lucide="bookmark" class="w-4 h-4"></i> Presets
                                </button>
                                <!-- Dropdown (toggle via JS) -->
                                <div id="presets-dropdown" class="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 hidden z-50 p-2">
                                    <div class="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 py-1">My Presets</div>
                                    <div id="local-presets-list" class="space-y-1 mb-2 max-h-48 overflow-y-auto">
                                        <!-- Presets go here -->
                                    </div>
                                    <button id="save-new-preset-btn" class="w-full text-left px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2">
                                        <i data-lucide="plus" class="w-3 h-3"></i> Save Current as Preset
                                    </button>
                                    <div class="h-px bg-gray-100 my-2"></div>
                                    <button id="browse-templates-btn" class="w-full text-left px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg flex items-center gap-2">
                                        <i data-lucide="library" class="w-3 h-3"></i> Browse Templates
                                    </button>
                                    <button id="export-file-btn" class="w-full text-left px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg flex items-center gap-2">
                                        <i data-lucide="share-2" class="w-3 h-3"></i> Share Template (Export)
                                    </button>
                                    <label class="w-full text-left px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg flex items-center gap-2 cursor-pointer">
                                        <i data-lucide="download-cloud" class="w-3 h-3"></i> Import Template
                                        <input type="file" id="import-file-input" class="hidden" accept=".json">
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="flex justify-between items-center mb-6">
                    <div>
                        <h2 class="text-2xl font-bold text-gray-900">Report Sections</h2>
                        <p class="text-gray-500">Define the structure and content of your report.</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="flex bg-white rounded-lg border border-gray-200 p-1 mr-2">
                            <button id="undo-btn" class="p-1.5 rounded hover:bg-gray-100 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed" title="Undo">
                                <i data-lucide="undo" class="w-4 h-4"></i>
                            </button>
                            <button id="redo-btn" class="p-1.5 rounded hover:bg-gray-100 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed" title="Redo">
                                <i data-lucide="redo" class="w-4 h-4"></i>
                            </button>
                        </div>
                        <button id="add-section-btn" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm">
                            <i data-lucide="plus" class="w-4 h-4"></i> Add Section
                        </button>
                    </div>
                </div>

                <div id="sections-list" class="space-y-4 pb-20">
                    <!-- Sections will be rendered here -->
                </div>
            </div>
        `;

        this.renderPresetsList();
        this.renderList();
        this.bindEvents();
    }

    bindEvents() {
        // Helper to safely add listener
        const addListener = (selector, event, handler) => {
            const el = this.container.querySelector(selector);
            if (el) el.addEventListener(event, handler);
        };

        addListener('#add-section-btn', 'click', () => this.addSection());

        // Undo/Redo
        const undoBtn = this.container.querySelector('#undo-btn');
        const redoBtn = this.container.querySelector('#redo-btn');

        if (undoBtn && redoBtn) {
            const state = window.store.getState();
            undoBtn.disabled = !state.canUndo;
            redoBtn.disabled = !state.canRedo;

            undoBtn.onclick = () => window.store.undo();
            redoBtn.onclick = () => window.store.redo();
        }

        // Title Input
        const titleInput = this.container.querySelector('#report-title');
        if (titleInput) {
            titleInput.addEventListener('change', (e) => {
                window.store.setState({ reportTitle: e.target.value });
            });
        }

        // Presets dropdown toggle
        const presetsBtn = this.container.querySelector('#presets-btn');
        const presetsDropdown = this.container.querySelector('#presets-dropdown');
        if (presetsBtn && presetsDropdown) {
            presetsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                presetsDropdown.classList.toggle('hidden');
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!presetsDropdown.contains(e.target) && e.target !== presetsBtn) {
                    presetsDropdown.classList.add('hidden');
                }
            });
        }

        // Presets actions
        addListener('#save-new-preset-btn', 'click', (e) => {
            e.stopPropagation();
            this.saveLocalPreset();
            presetsDropdown?.classList.add('hidden');
        });
        addListener('#browse-templates-btn', 'click', (e) => {
            e.stopPropagation();
            this.renderTemplateModal();
            presetsDropdown?.classList.add('hidden');
        });
        addListener('#export-file-btn', 'click', (e) => {
            e.stopPropagation();
            this.exportPresetFile();
            presetsDropdown?.classList.add('hidden');
        });

        const importInput = this.container.querySelector('#import-file-input');
        if (importInput) {
            importInput.addEventListener('change', (e) => {
                this.importPresetFile(e);
                presetsDropdown?.classList.add('hidden');
            });
        }
    }

    renderTemplateModal() {
        // Create modal container
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in';
        modal.innerHTML = `
            <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col m-4 animate-slide-up">
                <div class="p-6 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h3 class="text-xl font-bold text-gray-900">Template Library</h3>
                        <p class="text-sm text-gray-500">Choose a starting point for your report.</p>
                    </div>
                    <button class="close-modal p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <i data-lucide="x" class="w-5 h-5 text-gray-500"></i>
                    </button>
                </div>
                <div class="p-6 overflow-y-auto grid gap-4">
                    ${window.Templates ? window.Templates.map((t, i) => `
                        <div class="border border-gray-200 rounded-xl p-4 hover:border-red-500 hover:shadow-md transition-all cursor-pointer group" onclick="window.app.currentViewComponent.loadTemplate(${i})">
                            <div class="flex justify-between items-start mb-2">
                                <h4 class="font-semibold text-gray-900 group-hover:text-red-600">${t.name}</h4>
                                <span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">${t.sections.length} Sections</span>
                            </div>
                            <p class="text-sm text-gray-500 mb-3">${t.description}</p>
                            <div class="text-xs text-gray-400">Includes: ${t.sections.map(s => s.name).slice(0, 3).join(', ')}${t.sections.length > 3 ? '...' : ''}</div>
                        </div>
                    `).join('') : '<p class="text-center text-gray-500">No templates loaded.</p>'}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();

        // Close events
        const close = () => modal.remove();
        modal.querySelector('.close-modal').addEventListener('click', close);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) close();
        });

        // Expose loadTemplate to window for the onclick handler (hacky but works for vanilla)
        // Better: bind events properly, but string interpolation is easier here
    }

    loadTemplate(index) {
        const template = window.Templates[index];
        if (!template) return;

        if (!confirm(`Load template "${template.name}"? This will replace your current sections.`)) return;

        const sections = template.sections.map(s => ({
            ...s,
            id: Date.now() + Math.random(),
            files: []
        }));

        window.store.setState({
            reportTitle: template.reportTitle || '',
            sections: sections
        });

        // Update title input manually
        const titleInput = this.container.querySelector('#report-title');
        if (titleInput) titleInput.value = template.reportTitle || '';

        // Close modal
        document.querySelector('.fixed.inset-0').remove();
    }

    renderPresetsList() {
        const list = this.container.querySelector('#local-presets-list');
        if (!list) return;

        const presets = JSON.parse(localStorage.getItem('openreport_presets') || '[]');

        if (presets.length === 0) {
            list.innerHTML = '<div class="text-xs text-gray-400 px-2 italic">No saved presets</div>';
            return;
        }

        list.innerHTML = presets.map((p, i) => `
            <div class="flex justify-between items-center group px-2 py-1 hover:bg-gray-50 rounded cursor-pointer">
                <span class="text-sm text-gray-700 truncate flex-1" onclick="window.app.currentViewComponent.loadPreset(${i})">${p.name}</span>
                <button class="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity" onclick="window.app.currentViewComponent.deletePreset(${i}, event)">
                    <i data-lucide="trash-2" class="w-3 h-3"></i>
                </button>
            </div>
        `).join('');
        if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
    }

    saveLocalPreset() {
        const state = window.store.getState();
        if (state.sections.length === 0) {
            this.showNotification('Add some sections first!', 'error');
            return;
        }

        const name = prompt('Enter a name for this preset:', state.reportTitle || 'My Report Template');
        if (!name) return;

        const preset = {
            name: name,
            description: 'User saved preset',
            reportTitle: state.reportTitle,
            sections: state.sections.map(s => ({
                name: s.name,
                description: s.description,
                overviewMode: s.overviewMode,
                files: [] // Don't save files in presets
            })),
            savedAt: new Date().toISOString()
        };

        try {
            const presets = JSON.parse(localStorage.getItem('openreport_presets') || '[]');
            presets.push(preset);
            localStorage.setItem('openreport_presets', JSON.stringify(presets));

            this.renderPresetsList();
            this.showNotification(`Preset "${name}" saved!`, 'success');
        } catch (e) {
            console.error('Error saving preset:', e);
            this.showNotification('Error saving preset. Storage may be full.', 'error');
        }
    }
    
    showNotification(message, type = 'success') {
        const colors = {
            success: 'bg-green-600',
            error: 'bg-red-600',
            info: 'bg-blue-600'
        };
        const notification = document.createElement('div');
        notification.className = `fixed bottom-4 right-4 ${colors[type] || colors.info} text-white px-6 py-3 rounded-lg shadow-lg z-50`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    loadPreset(index) {
        const presets = JSON.parse(localStorage.getItem('openreport_presets') || '[]');
        const preset = presets[index];
        if (!preset) return;

        if (!confirm(`Load preset "${preset.name}"? This will replace your current sections.`)) return;

        const sections = preset.sections.map(s => ({
            ...s,
            id: Date.now() + Math.random(),
            files: []
        }));

        window.store.setState({
            reportTitle: preset.reportTitle || '',
            sections: sections
        });
    }

    deletePreset(index, event) {
        event.stopPropagation();
        if (!confirm('Delete this preset?')) return;

        const presets = JSON.parse(localStorage.getItem('openreport_presets') || '[]');
        presets.splice(index, 1);
        localStorage.setItem('openreport_presets', JSON.stringify(presets));
        this.renderPresetsList();
    }

    exportPresetFile() {
        const state = window.store.getState();
        const preset = {
            name: state.reportTitle || 'Exported Template',
            description: 'Exported from OpenReport',
            reportTitle: state.reportTitle,
            sections: state.sections.map(s => ({
                name: s.name,
                description: s.description,
                overviewMode: s.overviewMode,
                files: []
            }))
        };

        const blob = new Blob([JSON.stringify(preset, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${preset.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    importPresetFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const preset = JSON.parse(e.target.result);
                if (!preset.sections || !Array.isArray(preset.sections)) throw new Error('Invalid template format');

                if (!confirm(`Import template "${preset.name}"? This will replace your current sections.`)) return;

                const sections = preset.sections.map(s => ({
                    ...s,
                    id: Date.now() + Math.random(),
                    files: []
                }));

                window.store.setState({
                    reportTitle: preset.reportTitle || '',
                    sections: sections
                });
            } catch (error) {
                alert('Error importing template: ' + error.message);
            }
        };
        reader.readAsText(file);
        event.target.value = ''; // Reset input
    }

    renderList() {
        const list = this.container.querySelector('#sections-list');
        if (!list) return;

        const sections = window.store.getState().sections;

        if (sections.length === 0) {
            // ... (Empty state remains same) ...
            list.innerHTML = `
                <div class="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-200">
                    <div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i data-lucide="layers" class="w-8 h-8 text-gray-400"></i>
                    </div>
                    <h3 class="text-lg font-medium text-gray-900">No sections yet</h3>
                    <p class="text-gray-500 mb-4">Start building your report by adding a section.</p>
                    <button class="text-red-600 font-medium hover:text-red-700" onclick="document.getElementById('add-section-btn').click()">
                        + Add your first section
                    </button>
                </div>
            `;
            if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
            return;
        }

        list.innerHTML = '';
        sections.forEach((section, index) => {
            const el = this.createElement(this.getSectionTemplate(section, index));
            list.appendChild(el);
            this.bindSectionEvents(el, section);
            this.bindDragEvents(el, index);
        });
        if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
    }

    getSectionTemplate(section, index) {
        return `
            <div class="section-item bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 group animate-slide-up" draggable="true" data-index="${index}">
                <div class="p-4 border-b border-gray-100 flex items-center gap-4 bg-gray-50/50 rounded-t-xl cursor-move handle">
                    <div class="w-8 h-8 bg-white rounded-lg border border-gray-200 flex items-center justify-center font-bold text-gray-500 text-sm">
                        ${index + 1}
                    </div>
                    <input type="text" class="section-name-input flex-1 bg-transparent border-none focus:ring-0 font-semibold text-gray-900 placeholder-gray-400" 
                        value="${this.escapeHtml(section.name)}" placeholder="Section Name">
                    
                    <div class="flex items-center gap-2">
                        <label class="flex items-center gap-2 text-xs text-gray-500 cursor-pointer hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100">
                            <input type="checkbox" class="overview-mode-check rounded text-red-600 focus:ring-red-500" ${section.overviewMode ? 'checked' : ''}>
                            Overview Mode
                        </label>
                        <button class="delete-btn p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
                <div class="p-4 space-y-4">
                    <div>
                        <label class="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Instructions for AI</label>
                        <div class="bg-white">
                            <div class="quill-editor" style="height: 150px;">${section.description.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gm, "")}</div>
                        </div>
                    </div>
                    
                    <!-- Files Area -->
                    <div class="space-y-2">
                        <div class="flex flex-wrap gap-2 file-list">
                            ${section.files.map(f => `
                                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                    <i data-lucide="file" class="w-3 h-3"></i> ${f.name}
                                </span>
                            `).join('')}
                        </div>
                        <div class="relative group/upload">
                            <div class="flex items-center justify-center w-full">
                                <label class="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-200 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                                    <div class="flex flex-col items-center justify-center pt-5 pb-6">
                                        <i data-lucide="upload-cloud" class="w-6 h-6 text-gray-400 mb-2"></i>
                                        <p class="text-xs text-gray-500">Drop files here or click to upload</p>
                                    </div>
                                    <input type="file" class="hidden file-input" multiple />
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    bindDragEvents(el, index) {
        // ... (Drag events remain same) ...
        el.addEventListener('dragstart', (e) => {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', index);
            el.classList.add('opacity-50', 'border-red-500');
        });

        el.addEventListener('dragend', () => {
            el.classList.remove('opacity-50', 'border-red-500');
            this.container.querySelectorAll('.section-item').forEach(item => {
                item.classList.remove('border-t-4', 'border-red-500');
            });
        });

        el.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            el.classList.add('border-t-4', 'border-red-500');
        });

        el.addEventListener('dragleave', () => {
            el.classList.remove('border-t-4', 'border-red-500');
        });

        el.addEventListener('drop', (e) => {
            e.stopPropagation();
            const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
            const toIndex = index;

            if (fromIndex !== toIndex) {
                const sections = [...window.store.getState().sections];
                const [movedSection] = sections.splice(fromIndex, 1);
                sections.splice(toIndex, 0, movedSection);
                window.store.setState({ sections });
            }
            return false;
        });
    }

    bindSectionEvents(el, section) {
        // Name Input
        el.querySelector('.section-name-input').addEventListener('change', (e) => {
            this.updateSection(section.id, { name: e.target.value });
        });

        // Quill Editor
        const editorContainer = el.querySelector('.quill-editor');
        const quill = new Quill(editorContainer, {
            theme: 'snow',
            modules: {
                toolbar: [
                    ['bold', 'italic', 'underline'],
                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                    ['clean']
                ]
            },
            placeholder: 'Instructions for this section...'
        });

        // Set initial content (Quill sanitizes HTML, so we might need to be careful if description has HTML)
        // Assuming description is plain text or simple HTML from previous edits
        // If it's the first load, it might be plain text. Quill handles this well.
        // However, we are storing HTML now.

        // Debounce update
        let timeout;
        quill.on('text-change', () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                // Store the HTML content
                this.updateSection(section.id, { description: quill.root.innerHTML });
            }, 1000); // 1 second debounce
        });

        // Overview Mode
        el.querySelector('.overview-mode-check').addEventListener('change', (e) => {
            this.updateSection(section.id, { overviewMode: e.target.checked });
        });

        // Delete
        el.querySelector('.delete-btn').addEventListener('click', () => {
            if (confirm('Delete this section?')) this.deleteSection(section.id);
        });

        // File Upload
        const fileInput = el.querySelector('.file-input');
        fileInput.addEventListener('change', (e) => {
            this.handleFileUpload(section.id, e.target.files);
        });
    }
}
