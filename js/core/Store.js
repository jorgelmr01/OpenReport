class Store {
    constructor() {
        this.observers = [];
        const savedApiKey = localStorage.getItem('openai_api_key') || '';
        const savedModel = localStorage.getItem('openai_model') || 'gpt-4o';
        const savedBudget = parseFloat(localStorage.getItem('openai_max_budget')) || 5.0;
        const savedSearchProvider = localStorage.getItem('openai_search_provider') || 'none';
        const savedSession = JSON.parse(localStorage.getItem('openreport_session') || '{}');

        this.state = {
            apiKey: savedApiKey,
            model: savedModel,
            maxBudget: savedBudget,
            searchProvider: savedSearchProvider,
            currentView: 'setup',
            reportTitle: savedSession.reportTitle || '',
            sections: savedSession.sections || [],
            globalDocuments: [],
            generationStatus: 'idle',
            generatedReport: null,
            chatHistory: savedSession.chatHistory || [],
            sessionCost: 0
        };

        // Undo/Redo History
        this.history = [];
        this.historyIndex = -1;
        this.maxHistory = 50;

        // Initialize history with current state
        this.addToHistory();
    }

    addToHistory() {
        // Only track undoable state
        const snapshot = {
            reportTitle: this.state.reportTitle,
            sections: JSON.parse(JSON.stringify(this.state.sections)) // Deep copy
        };

        // If we are not at the end of history, discard future
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }

        this.history.push(snapshot);
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        } else {
            this.historyIndex++;
        }
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            const previousState = this.history[this.historyIndex];
            this.setState({
                reportTitle: previousState.reportTitle,
                sections: previousState.sections
            }, false); // false = don't add to history
        }
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            const nextState = this.history[this.historyIndex];
            this.setState({
                reportTitle: nextState.reportTitle,
                sections: nextState.sections
            }, false); // false = don't add to history
        }
    }

    getState() {
        return {
            ...this.state,
            canUndo: this.historyIndex > 0,
            canRedo: this.historyIndex < this.history.length - 1
        };
    }

    setState(newState, addToHistory = true) {
        // Check if undoable fields are changing
        const isUndoableChange = (newState.reportTitle !== undefined && newState.reportTitle !== this.state.reportTitle) ||
            (newState.sections !== undefined && JSON.stringify(newState.sections) !== JSON.stringify(this.state.sections));

        this.state = { ...this.state, ...newState };

        if (addToHistory && isUndoableChange) {
            this.addToHistory();
        }

        // Persist settings
        if (newState.apiKey !== undefined) localStorage.setItem('openai_api_key', this.state.apiKey);
        if (newState.model !== undefined) localStorage.setItem('openai_model', this.state.model);
        if (newState.maxBudget !== undefined) localStorage.setItem('openai_max_budget', this.state.maxBudget);
        if (newState.searchProvider !== undefined) localStorage.setItem('openai_search_provider', this.state.searchProvider);

        // Persist session (Title, Sections, Chat History)
        if (newState.reportTitle !== undefined || newState.sections !== undefined || newState.chatHistory !== undefined) {
            const session = {
                reportTitle: this.state.reportTitle,
                sections: this.state.sections.map(s => ({
                    ...s,
                    files: [] // Don't save files to localStorage to avoid quota limits
                })),
                chatHistory: this.state.chatHistory
            };
            try {
                localStorage.setItem('openreport_session', JSON.stringify(session));
            } catch (e) {
                console.warn('Could not save session to localStorage:', e);
            }
        }
        
        // Note: Global documents are intentionally NOT persisted to avoid storage limits
        // Large files can easily exceed localStorage quota

        this.notify();
    }

    subscribe(observer) {
        this.observers.push(observer);
        return () => {
            this.observers = this.observers.filter(o => o !== observer);
        };
    }

    notify() {
        this.observers.forEach(observer => observer(this.state));
    }
}

window.store = new Store();
