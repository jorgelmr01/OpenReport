// OpenAI API Handler
class OpenAIHandler {
    constructor() {
        this.apiKey = localStorage.getItem('openai_api_key') || '';
        this.model = localStorage.getItem('openai_model') || 'gpt-4o';
        this.baseURL = 'https://api.openai.com/v1';
    }

    setApiKey(apiKey) {
        this.apiKey = apiKey;
        localStorage.setItem('openai_api_key', apiKey);
    }

    setModel(model) {
        this.model = model;
        localStorage.setItem('openai_model', model);
    }

    getApiKey() {
        return this.apiKey;
    }

    getModel() {
        return this.model;
    }

    async testConnection() {
        if (!this.apiKey) {
            throw new Error('API key is not set');
        }

        try {
            const response = await fetch(`${this.baseURL}/models`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Invalid API key or connection failed');
            }

            return true;
        } catch (error) {
            errorLogger?.logApiError('testConnection', error, { hasApiKey: !!this.apiKey });
            throw new Error(`API connection test failed: ${error.message}`);
        }
    }

    async chat(messages, options = {}) {
        if (!this.apiKey) {
            throw new Error('API key is not set');
        }

        const model = options.model || this.model;
        const temperature = options.temperature !== undefined ? options.temperature : 0.7;
        const maxTokens = options.maxTokens || 4000;

        try {
            const requestBody = {
                model: model,
                messages: messages,
                temperature: temperature,
                max_tokens: maxTokens
            };

            // O1 models don't support temperature and max_tokens parameters
            if (model.startsWith('o1')) {
                delete requestBody.temperature;
                delete requestBody.max_tokens;
            }

            const response = await fetch(`${this.baseURL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            errorLogger?.logApiError('chat', error, { model: model, messageCount: messages.length });
            throw new Error(`Chat API error: ${error.message}`);
        }
    }

    async generateSectionContent(sectionName, sectionDescription, documentContents) {
        const systemPrompt = `You are a professional report writer. Your task is to generate high-quality, professional report sections based on the provided instructions and documents.

Write in a formal, professional tone. Be concise, clear, and data-driven. Focus only on the information provided in the documents and instructions.`;

        let userPrompt = `Generate content for the following report section:

Section Name: ${sectionName}

Instructions: ${sectionDescription}`;

        if (documentContents && documentContents.length > 0) {
            userPrompt += `\n\nRelevant Documents and Information:\n`;
            documentContents.forEach((doc, index) => {
                userPrompt += `\n--- Document ${index + 1}: ${doc.name} ---\n${doc.content}\n`;
            });
        }

        userPrompt += `\n\nPlease generate professional content for this section. Include relevant analysis, insights, and conclusions based on the provided information.`;

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ];

        return await this.chat(messages, { temperature: 0.7, maxTokens: 4000 });
    }

    async generateChatResponse(conversationHistory) {
        const systemPrompt = `You are an AI assistant helping users configure report structures. When users describe their report needs, suggest appropriate sections with clear instructions.

Respond with specific section suggestions in the following format:

Section 1: [Section Name]
Instructions: [Clear instructions for what this section should contain]

Section 2: [Section Name]
Instructions: [Clear instructions for what this section should contain]

And so on...

Be specific and practical. Tailor your suggestions to the type of report the user describes.`;

        const messages = [
            { role: 'system', content: systemPrompt },
            ...conversationHistory
        ];

        return await this.chat(messages, { temperature: 0.8, maxTokens: 2000 });
    }

    async reviewAndUnifyReport(sections, reportTitle) {
        const systemPrompt = `You are a senior editor. Your task is to review and unify a multi-section report to ensure:

1. Consistent tone and writing style throughout
2. No contradictions between sections
3. Smooth transitions between sections
4. Professional language
5. Coherent narrative flow
6. Proper formatting and structure

Make necessary adjustments to create a polished, cohesive final report. Do not add any information not present in the original sections.`;

        let userPrompt = `Please review and unify the following report sections into a cohesive final report:

Report Title: ${reportTitle || 'Professional Report'}

`;

        sections.forEach((section, index) => {
            userPrompt += `\n## ${section.name}\n\n${section.content}\n`;
        });

        userPrompt += `\n\nPlease provide the complete unified report with all sections, ensuring consistency, professionalism, and coherent flow. Maintain all the important information from each section while improving overall quality and readability.`;

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ];

        return await this.chat(messages, { temperature: 0.5, maxTokens: 8000 });
    }

    parseChatSuggestions(responseText) {
        const sections = [];
        const lines = responseText.split('\n');
        let currentSection = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Match section headers like "Section 1:", "Section 2:", etc.
            const sectionMatch = line.match(/^Section\s+\d+:\s*(.+)$/i);
            if (sectionMatch) {
                if (currentSection) {
                    sections.push(currentSection);
                }
                currentSection = {
                    name: sectionMatch[1].trim(),
                    description: ''
                };
                continue;
            }

            // Match instructions
            const instructionMatch = line.match(/^Instructions?:\s*(.+)$/i);
            if (instructionMatch && currentSection) {
                currentSection.description = instructionMatch[1].trim();
                continue;
            }

            // Continue multi-line instructions
            if (currentSection && currentSection.description && line && !line.match(/^Section\s+\d+:/i)) {
                currentSection.description += ' ' + line;
            }
        }

        if (currentSection) {
            sections.push(currentSection);
        }

        return sections;
    }
}

// Create global instance
const apiHandler = new OpenAIHandler();

