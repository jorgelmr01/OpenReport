class OpenAIService {
    constructor() {
        this.baseUrl = 'https://api.openai.com/v1';
    }

    getHeaders(apiKey) {
        return {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        };
    }

    async testConnection(apiKey) {
        try {
            const response = await fetch(`${this.baseUrl}/models`, {
                headers: this.getHeaders(apiKey)
            });
            if (!response.ok) throw new Error('Invalid API Key');
            return true;
        } catch (error) {
            throw error;
        }
    }

    async chat(messages, options = {}) {
        const state = window.store.getState();
        const apiKey = state.apiKey;
        const model = options.model || state.model;

        // Check API Key
        if (!apiKey) {
            throw new Error('API Key is missing. Please configure it in the Settings.');
        }
        
        // Validate API key format (should start with 'sk-')
        if (!apiKey.startsWith('sk-')) {
            throw new Error('Invalid API Key format. OpenAI API keys start with "sk-".');
        }

        // Check Budget
        if (state.sessionCost >= state.maxBudget) {
            throw new Error(`Budget Exceeded! Limit: $${state.maxBudget.toFixed(2)}, Used: $${state.sessionCost.toFixed(4)}`);
        }

        const body = {
            model: model,
            messages: messages,
            temperature: options.temperature ?? 0.7
        };

        // Add web search tool if enabled (OpenAI built-in)
        if (options.enableWebSearch && state.searchProvider === 'openai') {
            // Use the responses API with web_search_preview for supported models
            body.tools = [{ type: "web_search_preview" }];
        }

        // O1 and reasoning models don't support temperature
        if (model.startsWith('o1') || model.startsWith('o3')) {
            delete body.temperature;
        }

        // Check Cache
        const cacheKey = `openai_cache_${JSON.stringify(messages)}_${model}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            console.log('Using cached response');
            return cached;
        }

        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: this.getHeaders(apiKey),
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || 'API Error');
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        // Track Usage
        if (data.usage) {
            window.TokenService.trackUsage(data.usage.total_tokens, model);
        } else {
            // Fallback estimation
            const estimated = window.TokenService.estimateTokens(JSON.stringify(messages) + content);
            window.TokenService.trackUsage(estimated, model);
        }

        // Save to Cache (limit size?)
        try {
            localStorage.setItem(cacheKey, content);
        } catch (e) {
            // Likely quota exceeded, clear old cache?
            console.warn('Cache full, clearing old entries');
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('openai_cache_')) localStorage.removeItem(key);
            });
            localStorage.setItem(cacheKey, content);
        }

        return content;
    }

    async generateReportBrief(title, sections) {
        const sectionsList = sections.map(s => `- ${s.name}: ${s.description}`).join('\n');
        
        // Use custom prompt if set, otherwise default
        const customPrompt = window.configManager?.getSystemPrompt('general') || '';
        const profilePrompt = window.profileManager?.getCurrentProfile()?.getSystemPrompt?.() || '';
        const basePrompt = customPrompt || profilePrompt || 'You are a professional report writer.';
        
        const messages = [
            {
                role: 'system',
                content: `${basePrompt}\n\nCreate a cohesive briefing for a report.`
            },
            {
                role: 'user',
                content: `Report Title: ${title}\n\nSections:\n${sectionsList}\n\nTask: Write a 1-paragraph briefing that defines the overall tone, target audience, and the "golden thread" that should connect these sections.`
            }
        ];
        return await this.chat(messages);
    }

    async generateSection(section, contextDocs, globalContext = '', previousContext = '') {
        const state = window.store.getState();
        const searchProvider = state.searchProvider || 'none';

        // Use custom prompt if set, otherwise use profile prompt
        const customPrompt = window.configManager?.getSystemPrompt('general') || '';
        const profilePrompt = window.profileManager?.getCurrentProfile()?.getSystemPrompt?.() || '';
        const basePrompt = customPrompt || profilePrompt || 'You are a professional report writer.';

        const systemPrompt = `${basePrompt}

Write a section titled "${section.name}".

${globalContext ? `GLOBAL CONTEXT (Keep this in mind):\n${globalContext}\n` : ''}
${previousContext ? `PREVIOUS SECTION CONTEXT (Connect to this):\n${previousContext}\n` : ''}

Format: Markdown. Use proper headers (##, ###) but do NOT repeat the section title as an H1.
CITATIONS: If you use information from the provided documents, cite them using [Doc Name] format.`;

        let userPrompt = `Instructions: ${section.description}\n\n`;

        if (contextDocs.length > 0) {
            userPrompt += `CONTEXT DOCUMENTS:\n`;
            contextDocs.forEach(doc => {
                userPrompt += `--- ${doc.name} ---\n${doc.content}\n\n`;
            });
        }

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ];

        // Enable OpenAI web search if selected
        const enableWebSearch = searchProvider === 'openai';
        
        // Use temperature from config
        const temperature = window.configManager?.getSectionSettings()?.temperature ?? 0.7;
        
        return await this.chat(messages, { enableWebSearch, temperature });
    }

    async generateSummary(text) {
        // Recursive summarization for large texts
        const MAX_CHUNK_SIZE = 12000; // Characters (~3000 tokens)

        if (text.length <= MAX_CHUNK_SIZE) {
            return this._summarizeChunk(text);
        }

        console.log(`Text too long (${text.length} chars), splitting...`);
        const chunks = this._splitText(text, MAX_CHUNK_SIZE);

        // Summarize each chunk in parallel
        const chunkSummaries = await Promise.all(
            chunks.map(chunk => this._summarizeChunk(chunk))
        );

        // Summarize the combined summaries
        return this.generateSummary(chunkSummaries.join('\n\n'));
    }

    _splitText(text, maxLength) {
        const chunks = [];
        let currentChunk = '';

        // Split by paragraphs to avoid breaking sentences
        const paragraphs = text.split('\n\n');

        for (const para of paragraphs) {
            if ((currentChunk + para).length > maxLength) {
                chunks.push(currentChunk);
                currentChunk = para;
            } else {
                currentChunk += (currentChunk ? '\n\n' : '') + para;
            }
        }
        if (currentChunk) chunks.push(currentChunk);

        return chunks;
    }

    async _summarizeChunk(text) {
        const response = await this.chat([
            { role: "system", content: "Summarize the following text concisely, capturing key points and metrics." },
            { role: "user", content: text }
        ], { model: 'gpt-4o-mini' }); // Use cheaper model for summarization
        return response;
    }
}

window.OpenAIService = new OpenAIService();
