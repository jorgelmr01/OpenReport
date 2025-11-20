// Token Management and Optimization
class TokenManager {
    constructor() {
        // Approximate token counts (1 token ≈ 4 characters for English)
        this.CHARS_PER_TOKEN = 4;
        this.MAX_DOCUMENT_TOKENS = 3000; // Max tokens per document
        this.MAX_SECTION_CONTEXT_TOKENS = 8000; // Max total context per section
        this.MAX_REVIEW_TOKENS = 15000; // Max tokens for final review
    }

    estimateTokens(text) {
        if (!text) return 0;
        return Math.ceil(text.length / this.CHARS_PER_TOKEN);
    }

    truncateText(text, maxTokens) {
        const maxChars = maxTokens * this.CHARS_PER_TOKEN;
        if (text.length <= maxChars) {
            return text;
        }
        
        // Truncate and add indicator
        return text.substring(0, maxChars) + '\n\n[... Content truncated due to length. Total length: ' + text.length + ' characters ...]';
    }

    summarizeDocuments(documents, maxTokensPerDoc = this.MAX_DOCUMENT_TOKENS) {
        return documents.map(doc => {
            const tokens = this.estimateTokens(doc.content);
            
            if (tokens <= maxTokensPerDoc) {
                return doc;
            }

            // Truncate long documents
            return {
                ...doc,
                content: this.truncateText(doc.content, maxTokensPerDoc),
                originalTokens: tokens,
                truncated: true
            };
        });
    }

    optimizeSectionContext(documents, sectionDescription, maxTokens = this.MAX_SECTION_CONTEXT_TOKENS) {
        // Start with section description tokens
        let totalTokens = this.estimateTokens(sectionDescription);
        let optimizedDocs = [];

        // First pass: summarize all documents
        const summarizedDocs = this.summarizeDocuments(documents, this.MAX_DOCUMENT_TOKENS);

        // Calculate tokens for each document
        for (let doc of summarizedDocs) {
            const docTokens = this.estimateTokens(doc.content);
            
            if (totalTokens + docTokens <= maxTokens) {
                optimizedDocs.push(doc);
                totalTokens += docTokens;
            } else {
                // Calculate remaining token budget
                const remainingTokens = maxTokens - totalTokens;
                
                if (remainingTokens > 500) { // Only include if we have reasonable space
                    optimizedDocs.push({
                        ...doc,
                        content: this.truncateText(doc.content, remainingTokens - 100),
                        partiallyIncluded: true
                    });
                }
                break; // Stop adding more documents
            }
        }

        return {
            documents: optimizedDocs,
            totalTokens: totalTokens,
            documentsIncluded: optimizedDocs.length,
            documentsSkipped: documents.length - optimizedDocs.length
        };
    }

    estimateFileTokens(file) {
        // More realistic estimation based on file type
        // PDFs are compressed, actual text is much smaller
        const fileName = file.name.toLowerCase();
        
        if (fileName.endsWith('.pdf')) {
            // PDFs: ~1 page = 500 tokens, estimate 200KB per page
            const estimatedPages = Math.ceil(file.size / 200000);
            return Math.min(estimatedPages * 500, this.MAX_DOCUMENT_TOKENS);
        } else if (fileName.endsWith('.docx')) {
            // DOCX: compressed, ~30% of size is actual text
            const estimatedText = file.size * 0.3;
            return Math.min(estimatedText / this.CHARS_PER_TOKEN, this.MAX_DOCUMENT_TOKENS);
        } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
            // Excel: estimate 50 tokens per KB
            return Math.min((file.size / 1024) * 50, this.MAX_DOCUMENT_TOKENS);
        } else if (fileName.endsWith('.txt')) {
            // TXT: direct text
            return Math.min(file.size / this.CHARS_PER_TOKEN, this.MAX_DOCUMENT_TOKENS);
        }
        
        // Default: conservative estimate
        return Math.min(file.size / 10, this.MAX_DOCUMENT_TOKENS);
    }

    calculateGenerationCost(sections, globalDocuments) {
        let totalTokens = 0;
        let breakdown = {
            globalDocuments: 0,
            sections: [],
            overviewSections: [],
            finalReview: 0,
            total: 0
        };

        // Global documents tokens (capped at max per document)
        const globalTokens = globalDocuments.reduce((sum, doc) => {
            return sum + this.estimateFileTokens(doc);
        }, 0);
        breakdown.globalDocuments = Math.min(globalTokens, 10000); // Cap total global docs

        // Regular sections
        const regularSections = sections.filter(s => !s.overviewMode);
        const overviewSections = sections.filter(s => s.overviewMode);
        
        regularSections.forEach((section) => {
            const sectionDocs = section.files || [];
            const sectionDocsTokens = sectionDocs.reduce((sum, file) => {
                return sum + this.estimateFileTokens(file);
            }, 0);
            const descTokens = this.estimateTokens(section.description || '');
            const manualTokens = this.estimateTokens(section.manualText || '');
            
            // Each section uses optimized context (capped)
            const sectionTotal = Math.min(
                globalTokens + sectionDocsTokens + descTokens + manualTokens,
                this.MAX_SECTION_CONTEXT_TOKENS
            ) + 500; // +500 for system prompt
            
            breakdown.sections.push({
                name: section.name,
                tokens: sectionTotal
            });
            
            totalTokens += sectionTotal;
        });

        // Overview sections (generated after regular sections)
        overviewSections.forEach((section) => {
            // Overview sections get context from other sections + their own docs
            const contextFromSections = Math.min(totalTokens * 0.3, 5000); // Limited context
            const sectionDocs = section.files || [];
            const sectionDocsTokens = sectionDocs.reduce((sum, file) => {
                return sum + this.estimateFileTokens(file);
            }, 0);
            const descTokens = this.estimateTokens(section.description || '');
            
            const overviewTotal = contextFromSections + sectionDocsTokens + descTokens + 500;
            
            breakdown.overviewSections.push({
                name: section.name,
                tokens: overviewTotal
            });
            
            totalTokens += overviewTotal;
        });

        // Final review tokens
        const reviewTokens = Math.min(totalTokens * 0.3, this.MAX_REVIEW_TOKENS);
        breakdown.finalReview = reviewTokens;
        totalTokens += reviewTokens;

        breakdown.total = totalTokens;

        return breakdown;
    }

    formatTokenCount(tokens) {
        if (tokens < 1000) {
            return tokens + ' tokens';
        }
        return (tokens / 1000).toFixed(1) + 'K tokens';
    }

    estimateCost(tokens, model) {
        // Approximate costs per 1K tokens (as of 2024)
        const costs = {
            'gpt-4o': { input: 0.005, output: 0.015 },
            'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
            'gpt-4-turbo': { input: 0.01, output: 0.03 },
            'gpt-4': { input: 0.03, output: 0.06 },
            'o1-preview': { input: 0.015, output: 0.06 },
            'o1-mini': { input: 0.003, output: 0.012 }
        };

        const modelCost = costs[model] || costs['gpt-4o'];
        const inputCost = (tokens / 1000) * modelCost.input;
        const outputCost = (tokens / 1000) * modelCost.output * 0.3; // Assume output is 30% of input
        
        return {
            inputCost: inputCost.toFixed(2),
            outputCost: outputCost.toFixed(2),
            totalCost: (inputCost + outputCost).toFixed(2)
        };
    }

    checkRateLimits(tokens, model) {
        // Rate limits for different models (TPM = Tokens Per Minute)
        const limits = {
            'gpt-4o': 30000,
            'gpt-4o-mini': 200000,
            'gpt-4-turbo': 30000,
            'gpt-4': 10000,
            'o1-preview': 20000,
            'o1-mini': 100000
        };

        const limit = limits[model] || 30000;
        
        return {
            withinLimit: tokens <= limit,
            limit: limit,
            tokens: tokens,
            percentage: ((tokens / limit) * 100).toFixed(1)
        };
    }
}

// Create global instance
const tokenManager = new TokenManager();

