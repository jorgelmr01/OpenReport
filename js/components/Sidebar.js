class Sidebar extends Component {
    onMount() {
        const state = window.store.getState();
        this.updateActiveItem(state.currentView);

        window.store.subscribe(state => {
            this.updateActiveItem(state.currentView);

            // Update Cost
            const costDisplay = this.container.querySelector('#cost-display');
            const budgetBar = this.container.querySelector('#budget-bar');
            if (costDisplay && state.sessionCost !== undefined) {
                costDisplay.textContent = `$${state.sessionCost.toFixed(4)}`;
                const percent = Math.min((state.sessionCost / state.maxBudget) * 100, 100);
                if (budgetBar) budgetBar.style.width = `${percent}%`;
            }
        });
    }

    updateActiveItem(view) {
        const items = this.container.querySelectorAll('.nav-item');
        items.forEach(item => {
            if (item.dataset.view === view) {
                item.classList.add('bg-red-50', 'text-red-600', 'border-r-4', 'border-red-600');
                item.classList.remove('text-gray-600', 'hover:bg-gray-50');
            } else {
                item.classList.remove('bg-red-50', 'text-red-600', 'border-r-4', 'border-red-600');
                item.classList.add('text-gray-600', 'hover:bg-gray-50');
            }
        });
    }

    render() {
        this.container.innerHTML = `
            <div class="h-full flex flex-col bg-white border-r border-gray-200 w-64 shadow-sm z-10">
                <div class="p-6 border-b border-gray-100">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold">
                            O
                        </div>
                        <h1 class="text-xl font-bold text-gray-900 tracking-tight">OpenReport</h1>
                    </div>
                    <p class="text-xs text-gray-400 mt-1">Versatile Report Generator</p>
                </div>

                <nav class="flex-1 py-4 space-y-1">
                    ${this.renderNavItem('setup', 'home', 'Dashboard')}
                    ${this.renderNavItem('builder', 'layers', 'Report Structure')}
                    ${this.renderNavItem('context', 'folder-open', 'Global Documents')}
                    ${this.renderNavItem('chat', 'bot', 'AI Assistant')}
                    ${this.renderNavItem('preview', 'play', 'Generate & Export')}
                    
                    <div class="h-px bg-gray-100 my-3 mx-6"></div>
                    
                    ${this.renderNavItem('settings', 'sliders', 'Settings')}
                </nav>

                <div class="p-4 border-t border-gray-100">
                    <div class="bg-gray-50 rounded-lg p-3">
                        <p class="text-xs font-semibold text-gray-500 uppercase mb-2">Token Usage</p>
                        <div class="flex justify-between items-end">
                            <span class="text-lg font-bold text-gray-900" id="cost-display">$0.0000</span>
                            <span class="text-xs text-gray-400 mb-1">Session Cost</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                            <div id="budget-bar" class="bg-red-500 h-1.5 rounded-full transition-all duration-500" style="width: 0%"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Bind events
        this.container.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                window.store.setState({ currentView: item.dataset.view });
            });
        });
    }

    renderNavItem(view, icon, label) {
        return `
            <button class="nav-item w-full flex items-center gap-3 px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors" data-view="${view}">
                <i data-lucide="${icon}" class="w-5 h-5"></i>
                ${label}
            </button>
        `;
    }
}
