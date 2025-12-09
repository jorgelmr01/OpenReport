class WelcomeModal extends Component {
    constructor(container, onClose) {
        super(container);
        this.onClose = onClose;
    }

    onMount() {
        // No specific mount logic needed for now
    }

    getProfiles() {
        if (typeof window.profileManager !== 'undefined') {
            return window.profileManager.getAllProfiles();
        }
        return [];
    }

    render() {
        const profiles = this.getProfiles();
        
        this.container.innerHTML = `
            <div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.6); z-index: 9999; display: flex; align-items: center; justify-content: center;">
                <div class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row" style="background-color: white; border-radius: 1rem; max-width: 56rem; width: 100%; display: flex; overflow: hidden;">
                    
                    <!-- Left Side: Branding -->
                    <div class="bg-gradient-to-br from-red-600 to-red-700 p-8 md:w-1/3 flex flex-col justify-between text-white relative overflow-hidden" style="background: linear-gradient(135deg, #dc2626, #b91c1c);">
                        <div class="relative z-10">
                            <div class="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center mb-6 backdrop-blur-md border border-white/30" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3);">
                                <span class="text-3xl font-bold">O</span>
                            </div>
                            <h2 class="text-3xl font-bold mb-3">OpenReport</h2>
                            <p class="text-red-100 text-sm leading-relaxed opacity-90">
                                AI-powered professional report generator. Create industry-standard documents in minutes.
                            </p>
                        </div>
                        
                        <div class="relative z-10 mt-8 space-y-3">
                            <div class="flex items-center gap-3 text-sm text-white/90">
                                <i data-lucide="shield-check" class="w-4 h-4"></i> 100% Client-Side
                            </div>
                            <div class="flex items-center gap-3 text-sm text-white/90">
                                <i data-lucide="zap" class="w-4 h-4"></i> GPT-4o Powered
                            </div>
                            <div class="flex items-center gap-3 text-sm text-white/90">
                                <i data-lucide="file-text" class="w-4 h-4"></i> Word Export
                            </div>
                        </div>

                        <!-- Decorative -->
                        <div class="absolute -bottom-16 -right-16 w-48 h-48 bg-red-500/30 rounded-full" style="background: rgba(239,68,68,0.3);"></div>
                        <div class="absolute top-1/2 -left-12 w-24 h-24 bg-red-500/20 rounded-full" style="background: rgba(239,68,68,0.2);"></div>
                    </div>

                    <!-- Right Side: Actions -->
                    <div class="p-8 md:w-2/3 bg-white overflow-y-auto" style="max-height: 80vh;">
                        <h3 class="text-2xl font-bold text-gray-900 mb-2">Welcome!</h3>
                        <p class="text-gray-500 mb-6">Choose a template to get started quickly.</p>

                        <div class="grid grid-cols-1 gap-3 mb-6">
                            <!-- Quick Start Templates -->
                            <button class="action-btn group flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-red-500 hover:bg-red-50 transition-all text-left" data-action="template" data-index="0">
                                <div class="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-red-100 group-hover:text-red-600 transition-colors flex-shrink-0">
                                    <i data-lucide="bar-chart-3" class="w-6 h-6"></i>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <h4 class="font-semibold text-gray-900 group-hover:text-red-700">Financial Report</h4>
                                    <p class="text-xs text-gray-500 mt-0.5 truncate">P&L Analysis, Balance Sheet, Cash Flow, Outlook</p>
                                </div>
                                <i data-lucide="chevron-right" class="w-5 h-5 text-gray-300 group-hover:text-red-500"></i>
                            </button>

                            <button class="action-btn group flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-red-500 hover:bg-red-50 transition-all text-left" data-action="template" data-index="1">
                                <div class="w-12 h-12 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-red-100 group-hover:text-red-600 transition-colors flex-shrink-0">
                                    <i data-lucide="shield-alert" class="w-6 h-6"></i>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <h4 class="font-semibold text-gray-900 group-hover:text-red-700">Risk Assessment</h4>
                                    <p class="text-xs text-gray-500 mt-0.5 truncate">Market Risk, Credit Risk, Operational Risk</p>
                                </div>
                                <i data-lucide="chevron-right" class="w-5 h-5 text-gray-300 group-hover:text-red-500"></i>
                            </button>

                            <button class="action-btn group flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-red-500 hover:bg-red-50 transition-all text-left" data-action="template" data-index="2">
                                <div class="w-12 h-12 rounded-lg bg-green-50 text-green-600 flex items-center justify-center group-hover:bg-red-100 group-hover:text-red-600 transition-colors flex-shrink-0">
                                    <i data-lucide="clipboard-list" class="w-6 h-6"></i>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <h4 class="font-semibold text-gray-900 group-hover:text-red-700">Project Status</h4>
                                    <p class="text-xs text-gray-500 mt-0.5 truncate">Summary, Accomplishments, Milestones, Issues</p>
                                </div>
                                <i data-lucide="chevron-right" class="w-5 h-5 text-gray-300 group-hover:text-red-500"></i>
                            </button>
                        </div>

                        <!-- Start Fresh -->
                        <div class="border-t border-gray-100 pt-6">
                            <button class="action-btn w-full group flex items-center gap-4 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-red-400 hover:bg-red-50 transition-all text-left" data-action="custom">
                                <div class="w-12 h-12 rounded-lg bg-gray-50 text-gray-400 flex items-center justify-center group-hover:bg-red-100 group-hover:text-red-600 transition-colors flex-shrink-0">
                                    <i data-lucide="plus" class="w-6 h-6"></i>
                                </div>
                                <div class="flex-1">
                                    <h4 class="font-semibold text-gray-700 group-hover:text-red-700">Start from Scratch</h4>
                                    <p class="text-xs text-gray-500 mt-0.5">Build your own custom report structure</p>
                                </div>
                            </button>
                        </div>

                        <div class="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
                            <button class="text-sm text-gray-400 hover:text-gray-600 transition-colors" id="skip-btn">Skip for now</button>
                            <div class="text-xs text-gray-300">v2.0</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();

        // Bind Events
        this.container.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                if (action === 'template') {
                    const index = parseInt(btn.dataset.index);
                    this.loadTemplate(index);
                } else {
                    this.close();
                }
            });
        });

        this.container.querySelector('#skip-btn').addEventListener('click', () => this.close());
    }

    loadTemplate(index) {
        const template = window.Templates[index];
        if (!template) return;

        const sections = template.sections.map(s => ({
            ...s,
            id: Date.now() + Math.random(),
            files: []
        }));

        window.store.setState({
            reportTitle: template.reportTitle || '',
            sections: sections,
            currentView: 'builder'
        });

        this.close();
    }

    close() {
        this.container.innerHTML = '';
        if (this.onClose) this.onClose();
    }
}
