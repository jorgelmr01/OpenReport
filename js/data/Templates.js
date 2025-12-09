window.Templates = [
    {
        name: "Monthly Financial Report",
        description: "Comprehensive financial overview including P&L, Balance Sheet, and Outlook.",
        reportTitle: "Monthly Financial Report - [Month] [Year]",
        sections: [
            {
                name: "Executive Summary",
                description: "High-level overview of financial performance, key variances, and strategic highlights.",
                overviewMode: true,
                files: []
            },
            {
                name: "P&L Analysis",
                description: "Detailed profit and loss analysis comparing actuals vs budget and prior year.",
                overviewMode: false,
                files: []
            },
            {
                name: "Balance Sheet",
                description: "Review of assets, liabilities, and equity position.",
                overviewMode: false,
                files: []
            },
            {
                name: "Cash Flow",
                description: "Analysis of operating, investing, and financing cash flows.",
                overviewMode: false,
                files: []
            },
            {
                name: "Financial Outlook",
                description: "Forecast for the remainder of the quarter/year.",
                overviewMode: false,
                files: []
            }
        ]
    },
    {
        name: "Risk Assessment",
        description: "Standard risk reporting covering market, credit, and operational risks.",
        reportTitle: "Risk Assessment Report",
        sections: [
            {
                name: "Risk Dashboard",
                description: "Summary of key risk indicators (KRIs) and heat map status.",
                overviewMode: true,
                files: []
            },
            {
                name: "Market Risk",
                description: "Analysis of VaR, sensitivity, and market exposure.",
                overviewMode: false,
                files: []
            },
            {
                name: "Credit Risk",
                description: "Overview of loan portfolio quality, NPLs, and concentration risk.",
                overviewMode: false,
                files: []
            },
            {
                name: "Operational Risk",
                description: "Report on operational incidents, losses, and control effectiveness.",
                overviewMode: false,
                files: []
            }
        ]
    },
    {
        name: "Project Status Update",
        description: "Weekly or monthly project tracking report.",
        reportTitle: "Project Status Update",
        sections: [
            {
                name: "Project Summary",
                description: "Brief summary of project health, timeline, and budget status.",
                overviewMode: true,
                files: []
            },
            {
                name: "Key Accomplishments",
                description: "List major milestones achieved during this period.",
                overviewMode: false,
                files: []
            },
            {
                name: "Upcoming Milestones",
                description: "List key deliverables and milestones for the next period.",
                overviewMode: false,
                files: []
            },
            {
                name: "Risks & Issues",
                description: "Detail any active risks or issues, along with mitigation plans.",
                overviewMode: false,
                files: []
            }
        ]
    },
    {
        name: "Meeting Minutes",
        description: "Structure for capturing meeting notes and action items.",
        reportTitle: "Meeting Minutes",
        sections: [
            {
                name: "Meeting Details",
                description: "Date, time, attendees, and agenda overview.",
                overviewMode: true,
                files: []
            },
            {
                name: "Discussion Points",
                description: "Detailed notes on topics discussed.",
                overviewMode: false,
                files: []
            },
            {
                name: "Decisions Made",
                description: "List of formal decisions agreed upon.",
                overviewMode: false,
                files: []
            },
            {
                name: "Action Items",
                description: "List of tasks assigned, owners, and due dates.",
                overviewMode: false,
                files: []
            }
        ]
    }
];
