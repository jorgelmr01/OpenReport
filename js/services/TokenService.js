class TokenService {
    estimateTokens(text) {
        // Rough estimation: 1 token ~= 4 chars
        return Math.ceil(text.length / 4);
    }

    formatCount(count) {
        if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
        if (count >= 1000) return (count / 1000).toFixed(1) + 'k';
        return count.toString();
    }

    estimateCost(tokens, model) {
        // Pricing (approximate as of late 2024)
        const rates = {
            'gpt-4o': { input: 5.00, output: 15.00 }, // Per 1M tokens
            'gpt-4o-mini': { input: 0.15, output: 0.60 },
            'gpt-4-turbo': { input: 10.00, output: 30.00 }
        };

        const rate = rates[model] || rates['gpt-4o'];
        // Assuming 80% input, 20% output for a typical report generation flow
        const inputTokens = tokens * 0.8;
        const outputTokens = tokens * 0.2;

        const cost = (inputTokens / 1000000 * rate.input) + (outputTokens / 1000000 * rate.output);
        return cost.toFixed(4);
    }
    trackUsage(tokens, model) {
        const cost = parseFloat(this.estimateCost(tokens, model));
        
        // Safety check for store
        if (!window.store || typeof window.store.getState !== 'function') {
            console.warn('Store not available, cannot track usage');
            return;
        }
        
        const state = window.store.getState();
        const newCost = (state.sessionCost || 0) + cost;

        window.store.setState({ sessionCost: newCost });

        // Update UI if it exists
        const costDisplay = document.getElementById('cost-display');
        if (costDisplay) {
            costDisplay.textContent = `$${newCost.toFixed(4)}`;
        }
    }
}

window.TokenService = new TokenService();
