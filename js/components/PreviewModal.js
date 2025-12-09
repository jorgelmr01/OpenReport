class PreviewModal extends Component {
    onMount() {
        this.addSubscription(
            window.store.subscribe(state => {
                if (state.currentView === 'preview') {
                    this.render();
                }
            })
        );
    }

    async generateReport() {
        const state = window.store.getState();
        if (state.sections.length === 0) {
            alert('Add sections first!');
            return;
        }

        const mode = this.generationMode || 'deep'; // 'deep' or 'fast'

        if (mode === 'fast') {
            await this.generateOneShotReport();
        } else {
            await this.generateDeepReport();
        }
    }

    async generateOneShotReport() {
        window.store.setState({ isGenerating: true, progress: 10, progressText: 'Generating Fast Draft...' });
        const state = window.store.getState();

        try {
            const sections = state.sections;
            const reportTitle = state.reportTitle || 'Report';

            // Prepare Global Context
            const globalDocs = state.globalDocuments || [];
            let globalContext = '';
            if (globalDocs.length > 0) {
                globalContext = globalDocs.map(doc => `--- GLOBAL DOCUMENT: ${doc.name} ---\n${doc.content}`).join('\n\n');
            }

            // Construct the Mega-Prompt
            const systemPrompt = `You are a professional report writer for Openbank MX. Write a complete report titled "${reportTitle}".
            
            GLOBAL CONTEXT:
            ${globalContext}
            
            INSTRUCTIONS:
            Write the report section by section. Use Markdown.
            For each section, use a Level 1 Header (# Section Name).
            
            SECTIONS TO WRITE:
            ${sections.map((s, i) => `${i + 1}. ${s.name}: ${s.description}`).join('\n')}
            
            Style: Professional, concise.
            `;

            const content = await window.OpenAIService.chat([
                { role: 'system', content: systemPrompt },
                { role: 'user', content: "Generate the full report now." }
            ], { model: state.model });

            window.store.setState({
                generatedReport: content,
                isGenerating: false,
                progress: 100,
                progressText: 'Done!'
            });

        } catch (error) {
            alert(`Generation Error: ${error.message}`);
            window.store.setState({ isGenerating: false, progress: 0, progressText: 'Failed' });
        }
    }

    async generateDeepReport() {
        const state = window.store.getState();
        window.store.setState({ isGenerating: true, progress: 0, progressText: 'Starting Deep Dive...' });

        try {
            const sections = state.sections;
            const generatedSections = [];

            // 1. Generate Global Context (The "Brief")
            window.store.setState({ progress: 5, progressText: 'Planning report structure...' });
            const reportTitle = window.store.getState().reportTitle || 'Report';
            let globalContext = await window.OpenAIService.generateReportBrief(reportTitle, sections);

            // Append Global Documents to Context
            const globalDocs = window.store.getState().globalDocuments || [];
            if (globalDocs.length > 0) {
                const globalDocsContent = globalDocs.map(doc => `--- GLOBAL DOCUMENT: ${doc.name} ---\n${doc.content}`).join('\n\n');
                globalContext += `\n\nADDITIONAL GLOBAL CONTEXT DOCUMENTS:\n${globalDocsContent}`;
            }

            // 2. Generate Regular Sections (Parallel)
            // Smart Concurrency: 5 for mini, 3 for others
            const model = state.model || 'gpt-4o';
            const CONCURRENCY = model.includes('mini') ? 5 : 3;

            let completed = 0;

            // Helper for concurrency
            const runBatch = async (items, fn) => {
                const results = [];
                for (let i = 0; i < items.length; i += CONCURRENCY) {
                    const batch = items.slice(i, i + CONCURRENCY);
                    const batchResults = await Promise.all(batch.map((item, index) => fn(item, i + index)));
                    results.push(...batchResults);
                }
                return results;
            };

            const generateSectionTask = async (section, index) => {
                window.store.setState({
                    progressText: `Writing: ${section.name} (Batch ${Math.floor(index / CONCURRENCY) + 1})`
                });

                // Get content from files
                const contextDocs = [...section.files];

                // Generate with context
                const content = await window.OpenAIService.generateSection(section, contextDocs, globalContext, '');

                completed++;
                window.store.setState({
                    progress: 10 + ((completed / sections.length) * 90)
                });

                return { ...section, content };
            };

            generatedSections.push(...(await runBatch(sections, generateSectionTask)));

            // 3. Combine
            const fullReport = generatedSections.map(s => `# ${s.name}\n\n${s.content}`).join('\n\n---\n\n');

            window.store.setState({
                generatedReport: fullReport,
                isGenerating: false,
                progress: 100,
                progressText: 'Done!'
            });

        } catch (error) {
            alert(`Generation Error: ${error.message}`);
            window.store.setState({ isGenerating: false, progress: 0, progressText: 'Failed' });
        }
    }

    render() {
        this.container.innerHTML = `
            <div class="max-w-4xl mx-auto h-full flex flex-col">
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <h2 class="text-2xl font-bold text-gray-900">Preview & Export</h2>
                        <p class="text-gray-500">Generate your report and download it.</p>
                    </div>
                    <div class="flex gap-2 items-center">
                        <div class="flex items-center gap-2 mr-4 bg-gray-100 p-1 rounded-lg">
                            <button id="mode-deep" class="px-3 py-1.5 rounded-md text-sm font-medium transition-all bg-white text-gray-900 shadow-sm">
                                Deep Dive
                            </button>
                            <button id="mode-fast" class="px-3 py-1.5 rounded-md text-sm font-medium transition-all text-gray-500 hover:text-gray-900">
                                Fast Draft
                            </button>
                        </div>
                        <button id="generate-btn" class="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm">
                            <i data-lucide="sparkles" class="w-4 h-4"></i> Generate Report
                        </button>
                        <button id="export-btn" class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                            <i data-lucide="download" class="w-4 h-4"></i> Export to Word
                        </button>
                    </div>
                </div>

                <!-- Progress Bar -->
                <div id="progress-area" class="mb-6 hidden">
                    <div class="flex justify-between text-sm mb-1">
                        <span id="progress-text" class="font-medium text-gray-700">Generating...</span>
                        <span id="progress-percent" class="text-gray-500">0%</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div id="progress-bar" class="bg-red-600 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                    </div>
                </div>

                <!-- Content Area -->
                <div id="preview-content" class="flex-1 overflow-y-auto bg-white rounded-xl border border-gray-200 p-8 shadow-sm prose prose-red max-w-none">
                    <div class="flex flex-col items-center justify-center h-full text-gray-400">
                        <i data-lucide="file-text" class="w-16 h-16 mb-4 opacity-50"></i>
                        <p class="text-lg">Generated report will appear here</p>
                    </div>
                </div>
            </div>
        `;

        const generateBtn = this.container.querySelector('#generate-btn');
        const exportBtn = this.container.querySelector('#export-btn');
        const previewContent = this.container.querySelector('#preview-content');
        const progressArea = this.container.querySelector('#progress-area');
        const progressBar = this.container.querySelector('#progress-bar');
        const progressText = this.container.querySelector('#progress-text');

        const modeDeepBtn = this.container.querySelector('#mode-deep');
        const modeFastBtn = this.container.querySelector('#mode-fast');

        // Default mode
        this.generationMode = this.generationMode || 'deep';
        const updateModeUI = () => {
            if (this.generationMode === 'deep') {
                modeDeepBtn.classList.add('bg-white', 'text-gray-900', 'shadow-sm');
                modeDeepBtn.classList.remove('text-gray-500');
                modeFastBtn.classList.remove('bg-white', 'text-gray-900', 'shadow-sm');
                modeFastBtn.classList.add('text-gray-500');
            } else {
                modeFastBtn.classList.add('bg-white', 'text-gray-900', 'shadow-sm');
                modeFastBtn.classList.remove('text-gray-500');
                modeDeepBtn.classList.remove('bg-white', 'text-gray-900', 'shadow-sm');
                modeDeepBtn.classList.add('text-gray-500');
            }
        };
        updateModeUI();

        modeDeepBtn.addEventListener('click', () => {
            this.generationMode = 'deep';
            updateModeUI();
        });

        modeFastBtn.addEventListener('click', () => {
            this.generationMode = 'fast';
            updateModeUI();
        });

        generateBtn.addEventListener('click', () => this.generateReport());

        exportBtn.addEventListener('click', () => {
            const state = window.store.getState();
            if (state.generatedReport) {
                const title = state.reportTitle || 'OpenReport';
                window.ExportService.exportToWord(state.generatedReport, title);
            }
        });

        const state = window.store.getState();
        if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();

        // Handle Progress
        if (state.isGenerating) {
            progressArea.classList.remove('hidden');
            progressBar.style.width = `${state.progress}%`;
            progressText.textContent = state.progressText;
        } else if (state.progress === 100) {
            progressArea.classList.add('hidden');
        }

        // Handle Content
        if (state.generatedReport) {
            // Split content by JSON blocks to find charts
            const parts = state.generatedReport.split(/```json\s*({[\s\S]*?})\s*```/g);

            let html = '';
            let chartScripts = [];

            parts.forEach((part, index) => {
                try {
                    // Try to parse as JSON
                    if (part.trim().startsWith('{') && part.trim().endsWith('}')) {
                        const data = JSON.parse(part);
                        if (data.type === 'chart') {
                            const canvasId = `chart-${index}`;
                            html += `
                                <div class="my-8 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                                    <h4 class="text-center font-bold text-gray-700 mb-4">${data.title}</h4>
                                    <div class="relative h-64 w-full">
                                        <canvas id="${canvasId}"></canvas>
                                    </div>
                                </div>
                            `;
                            chartScripts.push(() => {
                                const ctx = document.getElementById(canvasId).getContext('2d');
                                new Chart(ctx, {
                                    type: data.chartType,
                                    data: {
                                        labels: data.labels,
                                        datasets: data.datasets.map(ds => ({
                                            ...ds,
                                            backgroundColor: ['#DC2626', '#1F2937', '#4B5563', '#9CA3AF', '#F3F4F6'], // Openbank colors
                                            borderColor: '#ffffff',
                                            borderWidth: 2
                                        }))
                                    },
                                    options: {
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: { position: 'bottom' }
                                        }
                                    }
                                });
                            });
                            return;
                        }
                    }
                } catch (e) {
                    // Not JSON or invalid, treat as text
                }

                // Regular Markdown processing
                // Regular Markdown processing
                // Split into blocks by double newline to identify paragraphs
                const blocks = part.split(/\n\n+/);

                blocks.forEach(block => {
                    const trimmed = block.trim();
                    if (!trimmed) return;

                    if (trimmed.startsWith('# ')) {
                        html += `<h1 class="text-3xl font-bold mt-8 mb-4 text-gray-900">${trimmed.replace('# ', '')}</h1>`;
                    } else if (trimmed.startsWith('## ')) {
                        html += `<h2 class="text-2xl font-bold mt-6 mb-3 text-gray-800 border-b pb-2 border-gray-100">${trimmed.replace('## ', '')}</h2>`;
                    } else if (trimmed.startsWith('### ')) {
                        html += `<h3 class="text-xl font-bold mt-5 mb-2 text-gray-800">${trimmed.replace('### ', '')}</h3>`;
                    } else if (trimmed.startsWith('- ')) {
                        // Handle lists
                        const items = trimmed.split('\n').map(line => line.replace(/^- /, '').trim());
                        html += `<ul class="list-disc pl-5 mb-4 space-y-1 text-gray-700">
                            ${items.map(item => `<li>${item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</li>`).join('')}
                        </ul>`;
                    } else {
                        // Regular paragraph
                        // Replace single newlines with spaces to unwrap text, but keep bold formatting
                        const content = trimmed.replace(/\n/g, ' ').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                        html += `<p class="mb-4 leading-relaxed text-gray-700 text-lg">${content}</p>`;
                    }
                });
            });

            previewContent.innerHTML = html;

            // Initialize charts after render
            setTimeout(() => {
                chartScripts.forEach(init => init());
            }, 100);

            exportBtn.disabled = false;
        }
    }
}
