class ChatAssistant extends Component {
    constructor(container) {
        super(container);
        // Load messages from store or set default
        const history = window.store.getState().chatHistory;
        this.messages = history && history.length > 0 ? history : [
            { role: 'assistant', content: 'Hello! I can help you structure your report. Tell me what kind of report you need (e.g., "Quarterly Financial Report" or "Market Analysis").' }
        ];
    }

    async sendMessage(text) {
        if (!text.trim()) return;

        // Add user message
        this.messages.push({ role: 'user', content: text });
        this.updateStore();
        this.renderMessages();

        try {
            // Show loading
            const loadingId = Date.now();
            this.messages.push({ role: 'assistant', content: 'Thinking...', id: loadingId, isLoading: true });
            this.renderMessages();

            // Call API
            const response = await window.OpenAIService.chat([
                { role: 'system', content: 'You are a helpful assistant for a report generator app. Suggest sections based on user request. Format suggestions as JSON array of objects with "name" and "description" keys.' },
                ...this.messages.filter(m => !m.isLoading).map(m => ({ role: m.role, content: m.content }))
            ]);

            // Remove loading
            this.messages = this.messages.filter(m => !m.isLoading);

            // Try to parse JSON suggestions
            try {
                const jsonMatch = response.match(/\[.*\]/s);
                if (jsonMatch) {
                    const suggestions = JSON.parse(jsonMatch[0]);
                    this.messages.push({
                        role: 'assistant',
                        content: `I've generated ${suggestions.length} sections for you. Click "Apply" to add them to your report.`,
                        suggestions: suggestions
                    });
                } else {
                    this.messages.push({ role: 'assistant', content: response });
                }
            } catch (e) {
                this.messages.push({ role: 'assistant', content: response });
            }

            this.updateStore();
            this.renderMessages();

        } catch (error) {
            this.messages = this.messages.filter(m => !m.isLoading);
            this.messages.push({ role: 'assistant', content: `Error: ${error.message}` });
            this.updateStore();
            this.renderMessages();
        }
    }

    updateStore() {
        // Filter out loading messages before saving
        const cleanMessages = this.messages.filter(m => !m.isLoading);
        window.store.setState({ chatHistory: cleanMessages });
    }

    applySuggestions(suggestions) {
        const currentSections = window.store.getState().sections;
        const newSections = suggestions.map(s => ({
            id: Date.now() + Math.random(),
            name: s.name,
            description: s.description,
            files: [],
            overviewMode: false
        }));

        window.store.setState({ sections: [...currentSections, ...newSections] });
        alert(`Added ${newSections.length} sections!`);
        window.store.setState({ currentView: 'builder' });
    }

    render() {
        this.container.innerHTML = `
            <div class="max-w-3xl mx-auto h-[calc(100vh-4rem)] flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div class="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h2 class="font-bold text-gray-900 flex items-center gap-2">
                        <i data-lucide="bot" class="w-5 h-5 text-red-600"></i> AI Assistant
                    </h2>
                    <button class="text-sm text-gray-500 hover:text-red-600" onclick="window.store.setState({ currentView: 'builder' })">
                        Close
                    </button>
                </div>
                
                <div id="chat-messages" class="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                    <!-- Messages -->
                </div>

                <div class="p-4 bg-white border-t border-gray-100">
                    <div class="flex gap-2">
                        <input type="text" id="chat-input" class="flex-1 rounded-lg border-gray-200 focus:ring-red-500 focus:border-red-500" placeholder="Describe your report...">
                        <button id="send-btn" class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                            <i data-lucide="send" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.renderMessages();

        const input = this.container.querySelector('#chat-input');
        const sendBtn = this.container.querySelector('#send-btn');

        const send = () => {
            this.sendMessage(input.value);
            input.value = '';
        };

        sendBtn.addEventListener('click', send);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') send();
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    renderMessages() {
        const list = this.container.querySelector('#chat-messages');
        if (!list) return;

        list.innerHTML = this.messages.map((msg, index) => `
            <div class="flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}">
                <div class="max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                ? 'bg-red-600 text-white rounded-br-none'
                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
            }">
                    <p class="text-sm leading-relaxed">${this.escapeHtml(msg.content)}</p>
                    ${msg.suggestions ? `
                        <button class="apply-suggestions-btn mt-3 w-full bg-gray-900 text-white text-xs py-2 rounded-lg hover:bg-gray-800 transition-colors" data-index="${index}">
                            Apply Suggestions
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');

        list.querySelectorAll('.apply-suggestions-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.applySuggestions(this.messages[index].suggestions);
            });
        });

        list.scrollTop = list.scrollHeight;
        if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
    }
}
