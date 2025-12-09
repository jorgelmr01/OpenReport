/**
 * Profile Manager - Manages industry-specific profiles and configurations
 */
class ProfileManager {
    constructor() {
        this.profiles = new Map();
        this.currentProfile = null;
        this.loadProfiles();
    }

    loadProfiles() {
        try {
            // Register all industry profiles
            const profileClasses = [
                LegalProfile,
                AMLProfile,
                DataAnalysisProfile,
                FinanceProfile,
                RiskManagementProfile,
                OperationsProfile,
                MarketingProfile,
                HRProfile
            ];
            
            profileClasses.forEach(ProfileClass => {
                try {
                    if (typeof ProfileClass === 'function') {
                        const profile = new ProfileClass();
                        if (profile && profile.id) {
                            this.registerProfile(profile);
                        }
                    }
                } catch (error) {
                    console.error(`Error loading profile ${ProfileClass.name}:`, error);
                }
            });
        } catch (error) {
            console.error('Error loading profiles:', error);
        }
    }

    registerProfile(profile) {
        try {
            if (!profile || !profile.id) {
                console.error('Invalid profile:', profile);
                return false;
            }
            this.profiles.set(profile.id, profile);
            return true;
        } catch (error) {
            console.error('Error registering profile:', error);
            return false;
        }
    }

    getProfile(id) {
        return this.profiles.get(id);
    }

    getAllProfiles() {
        return Array.from(this.profiles.values());
    }

    setCurrentProfile(id) {
        try {
            if (!id || typeof id !== 'string') {
                return false;
            }
            
            const profile = this.getProfile(id);
            if (profile) {
                this.currentProfile = profile;
                try {
                    localStorage.setItem('current_profile', id);
                } catch (error) {
                    console.warn('Could not save profile to localStorage:', error);
                }
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error setting current profile:', error);
            return false;
        }
    }

    getCurrentProfile() {
        try {
            if (!this.currentProfile) {
                try {
                    const saved = localStorage.getItem('current_profile');
                    if (saved && this.getProfile(saved)) {
                        this.setCurrentProfile(saved);
                    } else {
                        // Default to Finance or first available
                        const defaultId = this.getProfile('finance') ? 'finance' : Array.from(this.profiles.keys())[0];
                        if (defaultId) {
                            this.setCurrentProfile(defaultId);
                        }
                    }
                } catch (error) {
                    console.warn('Error loading saved profile:', error);
                    // Fallback to first available profile
                    const firstProfile = Array.from(this.profiles.values())[0];
                    if (firstProfile) {
                        this.currentProfile = firstProfile;
                    }
                }
            }
            return this.currentProfile || null;
        } catch (error) {
            console.error('Error getting current profile:', error);
            return null;
        }
    }

    getSystemPrompt(context = {}) {
        try {
            const profile = this.getCurrentProfile();
            if (!profile || typeof profile.getSystemPrompt !== 'function') {
                return 'You are a professional report writer.';
            }
            return profile.getSystemPrompt(context) || 'You are a professional report writer.';
        } catch (error) {
            console.error('Error getting system prompt:', error);
            return 'You are a professional report writer.';
        }
    }

    getSectionPrompt(sectionName, sectionDescription, context = {}) {
        try {
            const profile = this.getCurrentProfile();
            if (!profile || typeof profile.getSectionPrompt !== 'function') {
                return `Generate content for: ${sectionName}\n\nInstructions: ${sectionDescription}`;
            }
            return profile.getSectionPrompt(sectionName, sectionDescription, context) || 
                   `Generate content for: ${sectionName}\n\nInstructions: ${sectionDescription}`;
        } catch (error) {
            console.error('Error getting section prompt:', error);
            return `Generate content for: ${sectionName}\n\nInstructions: ${sectionDescription}`;
        }
    }

    getReviewPrompt(sections, reportTitle, context = {}) {
        try {
            const profile = this.getCurrentProfile();
            if (!profile || typeof profile.getReviewPrompt !== 'function') {
                return 'Review and unify this report for consistency and coherence.';
            }
            return profile.getReviewPrompt(sections, reportTitle, context) || 
                   'Review and unify this report for consistency and coherence.';
        } catch (error) {
            console.error('Error getting review prompt:', error);
            return 'Review and unify this report for consistency and coherence.';
        }
    }

    getRecommendedSections() {
        try {
            const profile = this.getCurrentProfile();
            if (!profile || typeof profile.getRecommendedSections !== 'function') {
                return [];
            }
            const sections = profile.getRecommendedSections();
            return Array.isArray(sections) ? sections : [];
        } catch (error) {
            console.error('Error getting recommended sections:', error);
            return [];
        }
    }

    getSupportedFormats() {
        try {
            const profile = this.getCurrentProfile();
            if (!profile || typeof profile.getSupportedFormats !== 'function') {
                return ['docx', 'pdf'];
            }
            const formats = profile.getSupportedFormats();
            return Array.isArray(formats) ? formats : ['docx', 'pdf'];
        } catch (error) {
            console.error('Error getting supported formats:', error);
            return ['docx', 'pdf'];
        }
    }

    getDocumentTypes() {
        try {
            const profile = this.getCurrentProfile();
            if (!profile || typeof profile.getDocumentTypes !== 'function') {
                return ['pdf', 'docx', 'txt', 'xlsx'];
            }
            const types = profile.getDocumentTypes();
            return Array.isArray(types) ? types : ['pdf', 'docx', 'txt', 'xlsx'];
        } catch (error) {
            console.error('Error getting document types:', error);
            return ['pdf', 'docx', 'txt', 'xlsx'];
        }
    }
}

// Base Profile Class
class BaseProfile {
    constructor(id, name, description, icon) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.icon = icon;
    }

    getSystemPrompt(context) {
        return `You are a professional report writer. Generate high-quality, professional content based on provided instructions and documents.`;
    }

    getSectionPrompt(sectionName, sectionDescription, context) {
        return `Generate content for: ${sectionName}\n\nInstructions: ${sectionDescription}`;
    }

    getReviewPrompt(sections, reportTitle, context) {
        return `Review and unify this report for consistency, tone, and coherence.`;
    }

    getRecommendedSections() {
        return [];
    }

    getSupportedFormats() {
        return ['docx', 'pdf'];
    }

    getDocumentTypes() {
        return ['pdf', 'docx', 'txt', 'xlsx'];
    }
}

// Legal Profile
class LegalProfile extends BaseProfile {
    constructor() {
        super('legal', 'Legal', 'Contract drafting, legal opinions, case summaries', '⚖️');
    }

    getSystemPrompt(context) {
        return `You are a professional legal document writer. Your task is to generate precise, legally sound content based on provided instructions and legal documents.

CRITICAL REQUIREMENTS:
- Use precise legal terminology appropriate to the jurisdiction
- Maintain formal, professional tone
- Ensure accuracy and clarity in legal language
- Focus ONLY on information provided in documents
- Do not add legal advice or interpretations not present in source materials
- Structure content logically with clear headings
- Use proper legal citation format when referencing sources

Tone: Formal, precise, authoritative
Style: Professional legal writing
Focus: Accuracy, clarity, compliance`;
    }

    getSectionPrompt(sectionName, sectionDescription, context) {
        return `Generate legal content for section: ${sectionName}

Instructions: ${sectionDescription}

IMPORTANT:
- Use precise legal terminology
- Maintain formal tone
- Cite sources when referencing documents
- Structure with clear legal headings
- Ensure compliance with legal writing standards`;
    }

    getReviewPrompt(sections, reportTitle, context) {
        return `You are a senior legal editor. Review and unify this legal document to ensure:

1. Consistent legal terminology throughout
2. Proper legal structure and formatting
3. Accurate citations and references
4. No contradictions between sections
5. Professional legal writing style
6. Compliance with legal document standards

Maintain all legal accuracy. Do not add information not present in source materials.`;
    }

    getRecommendedSections() {
        return [
            { name: 'Executive Summary', description: 'High-level overview of legal matters', overviewMode: true },
            { name: 'Background', description: 'Context and factual background', overviewMode: false },
            { name: 'Legal Analysis', description: 'Detailed legal analysis and interpretation', overviewMode: false },
            { name: 'Conclusions', description: 'Legal conclusions and recommendations', overviewMode: true },
            { name: 'Appendices', description: 'Supporting legal documents and references', overviewMode: false }
        ];
    }

    getSupportedFormats() {
        return ['docx', 'pdf'];
    }

    getDocumentTypes() {
        return ['pdf', 'docx', 'txt'];
    }
}

// AML/Compliance Profile
class AMLProfile extends BaseProfile {
    constructor() {
        super('aml', 'AML/Compliance', 'Regulatory reports, KYC documentation, compliance audits', '🛡️');
    }

    getSystemPrompt(context) {
        return `You are a compliance and AML (Anti-Money Laundering) report writer. Generate comprehensive compliance reports based on regulatory requirements and provided documentation.

CRITICAL REQUIREMENTS:
- Use regulatory terminology accurately
- Structure content according to compliance frameworks
- Include risk assessments and mitigation strategies
- Document all sources and evidence
- Maintain audit trail standards
- Focus on regulatory compliance requirements
- Use formal, official tone

Tone: Formal, regulatory, authoritative
Style: Compliance documentation
Focus: Regulatory adherence, risk assessment, auditability`;
    }

    getSectionPrompt(sectionName, sectionDescription, context) {
        return `Generate compliance content for section: ${sectionName}

Instructions: ${sectionDescription}

IMPORTANT:
- Include risk assessments where relevant
- Document compliance with regulations
- Maintain audit trail standards
- Use regulatory terminology
- Structure for regulatory review`;
    }

    getReviewPrompt(sections, reportTitle, context) {
        return `You are a senior compliance officer. Review and unify this compliance report to ensure:

1. Regulatory compliance throughout
2. Consistent risk assessment language
3. Complete audit trail
4. Proper regulatory structure
5. No compliance gaps
6. Professional regulatory tone

Ensure all regulatory requirements are met. Maintain complete documentation.`;
    }

    getRecommendedSections() {
        return [
            { name: 'Executive Summary', description: 'Compliance overview and key findings', overviewMode: true },
            { name: 'Risk Assessment', description: 'Detailed risk analysis and scoring', overviewMode: false },
            { name: 'Transaction Analysis', description: 'Analysis of transactions and patterns', overviewMode: false },
            { name: 'Compliance Checklist', description: 'Regulatory compliance verification', overviewMode: false },
            { name: 'Recommendations', description: 'Remediation and improvement recommendations', overviewMode: true },
            { name: 'Appendices', description: 'Supporting documentation and evidence', overviewMode: false }
        ];
    }

    getSupportedFormats() {
        return ['docx', 'pdf'];
    }

    getDocumentTypes() {
        return ['pdf', 'docx', 'xlsx', 'txt'];
    }
}

// Data Analysis Profile
class DataAnalysisProfile extends BaseProfile {
    constructor() {
        super('data', 'Data Analysis', 'Research reports, statistical analysis, data insights', '📊');
    }

    getSystemPrompt(context) {
        return `You are a data analyst and research report writer. Generate comprehensive data analysis reports with statistical insights and clear interpretations.

CRITICAL REQUIREMENTS:
- Interpret data accurately and objectively
- Use statistical terminology appropriately
- Explain methodology clearly
- Present findings with supporting evidence
- Include data-driven insights
- Structure with clear sections: methodology, results, analysis
- Use professional, analytical tone

Tone: Analytical, objective, data-driven
Style: Research and analysis
Focus: Data interpretation, statistical accuracy, clear insights`;
    }

    getSectionPrompt(sectionName, sectionDescription, context) {
        return `Generate data analysis content for section: ${sectionName}

Instructions: ${sectionDescription}

IMPORTANT:
- Base conclusions on data provided
- Use statistical terminology accurately
- Explain methodology clearly
- Present findings objectively
- Include data-driven insights`;
    }

    getReviewPrompt(sections, reportTitle, context) {
        return `You are a senior data analyst. Review and unify this data analysis report to ensure:

1. Consistent analytical approach
2. Accurate statistical interpretation
3. Clear methodology documentation
4. Logical flow from data to insights
5. Professional analytical tone
6. Proper data visualization descriptions

Maintain statistical accuracy. Ensure all conclusions are data-supported.`;
    }

    getRecommendedSections() {
        return [
            { name: 'Executive Summary', description: 'Key findings and insights', overviewMode: true },
            { name: 'Methodology', description: 'Data collection and analysis methods', overviewMode: false },
            { name: 'Results', description: 'Data findings and statistics', overviewMode: false },
            { name: 'Analysis', description: 'Interpretation and insights', overviewMode: false },
            { name: 'Conclusions', description: 'Summary of findings and recommendations', overviewMode: true },
            { name: 'Appendices', description: 'Raw data, charts, and supporting materials', overviewMode: false }
        ];
    }

    getSupportedFormats() {
        return ['docx', 'pdf', 'html', 'markdown'];
    }

    getDocumentTypes() {
        return ['pdf', 'docx', 'xlsx', 'csv', 'txt'];
    }
}

// Finance Profile
class FinanceProfile extends BaseProfile {
    constructor() {
        super('finance', 'Finance', 'Financial reports, budgets, forecasts, P&L analysis', '💰');
    }

    getSystemPrompt(context) {
        return `You are a financial analyst and report writer. Generate comprehensive financial reports with accurate analysis and professional financial terminology.

CRITICAL REQUIREMENTS:
- Use accurate financial terminology
- Follow accounting standards
- Present financial data clearly
- Include ratio analysis where relevant
- Structure according to financial reporting standards
- Use professional financial tone

Tone: Professional, analytical, financial
Style: Financial reporting
Focus: Accuracy, clarity, financial standards`;
    }

    getRecommendedSections() {
        return [
            { name: 'Executive Summary', description: 'Financial performance overview', overviewMode: true },
            { name: 'P&L Analysis', description: 'Profit and loss analysis', overviewMode: false },
            { name: 'Balance Sheet', description: 'Assets, liabilities, and equity', overviewMode: false },
            { name: 'Cash Flow', description: 'Operating, investing, financing flows', overviewMode: false },
            { name: 'Financial Outlook', description: 'Forecasts and projections', overviewMode: true }
        ];
    }
}

// Risk Management Profile
class RiskManagementProfile extends BaseProfile {
    constructor() {
        super('risk', 'Risk Management', 'Risk assessments, mitigation plans, risk analysis', '⚠️');
    }

    getSystemPrompt(context) {
        return `You are a risk management professional. Generate comprehensive risk assessment reports with detailed analysis and mitigation strategies.`;
    }

    getRecommendedSections() {
        return [
            { name: 'Risk Dashboard', description: 'Summary of key risk indicators', overviewMode: true },
            { name: 'Market Risk', description: 'Market risk analysis', overviewMode: false },
            { name: 'Credit Risk', description: 'Credit risk assessment', overviewMode: false },
            { name: 'Operational Risk', description: 'Operational risk evaluation', overviewMode: false },
            { name: 'Mitigation Strategies', description: 'Risk mitigation recommendations', overviewMode: true }
        ];
    }
}

// Operations Profile
class OperationsProfile extends BaseProfile {
    constructor() {
        super('operations', 'Operations', 'Process documentation, SOPs, operational reports', '⚙️');
    }

    getRecommendedSections() {
        return [
            { name: 'Overview', description: 'Operational summary', overviewMode: true },
            { name: 'Process Documentation', description: 'Detailed process steps', overviewMode: false },
            { name: 'Performance Metrics', description: 'Operational KPIs', overviewMode: false },
            { name: 'Improvements', description: 'Operational improvements and recommendations', overviewMode: true }
        ];
    }
}

// Marketing Profile
class MarketingProfile extends BaseProfile {
    constructor() {
        super('marketing', 'Marketing', 'Campaign reports, market research, brand analysis', '📢');
    }

    getRecommendedSections() {
        return [
            { name: 'Campaign Summary', description: 'Marketing campaign overview', overviewMode: true },
            { name: 'Market Research', description: 'Market analysis and insights', overviewMode: false },
            { name: 'Performance Metrics', description: 'Campaign performance data', overviewMode: false },
            { name: 'Recommendations', description: 'Marketing recommendations', overviewMode: true }
        ];
    }
}

// HR Profile
class HRProfile extends BaseProfile {
    constructor() {
        super('hr', 'Human Resources', 'Performance reviews, policy documents, training materials', '👥');
    }

    getRecommendedSections() {
        return [
            { name: 'Summary', description: 'HR overview', overviewMode: true },
            { name: 'Performance Review', description: 'Employee performance analysis', overviewMode: false },
            { name: 'Policy Documentation', description: 'HR policies and procedures', overviewMode: false },
            { name: 'Recommendations', description: 'HR recommendations', overviewMode: true }
        ];
    }
}

// Export for use
// Create global instance with error handling
try {
    window.ProfileManager = ProfileManager;
    window.profileManager = new ProfileManager();
} catch (error) {
    console.error('Error initializing ProfileManager:', error);
    // Create fallback
    window.profileManager = {
        getCurrentProfile: () => null,
        getAllProfiles: () => [],
        getSystemPrompt: () => 'You are a professional report writer.',
        getSectionPrompt: (name, desc) => `Generate content for: ${name}\n\nInstructions: ${desc}`,
        getReviewPrompt: () => 'Review and unify this report.',
        getRecommendedSections: () => [],
        getSupportedFormats: () => ['docx', 'pdf'],
        getDocumentTypes: () => ['pdf', 'docx', 'txt', 'xlsx']
    };
}

