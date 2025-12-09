# OpenReport v2.0

**AI-Powered Professional Report Generator**

Create polished, professional reports in minutes using GPT-4o. Upload your documents, define your sections, and let AI do the heavy lifting.

---

## ✨ Features

### 🤖 AI-Powered Generation
- **GPT-4o Integration** - State-of-the-art language model
- **Smart Context Management** - Efficient token usage
- **Industry Profiles** - Legal, Finance, AML, Data Analysis, and more

### 📄 Document Processing
- **Multi-Format Support** - PDF, DOCX, XLSX, TXT
- **Automatic Extraction** - AI-ready text extraction
- **Global Documents** - Share context across all sections

### 🎨 Professional Output
- **Word Export** - Clean, formatted DOCX files
- **Markdown Preview** - Live preview as you work
- **Customizable Templates** - Pre-built and custom templates

### ⚙️ Fully Configurable
- **Editable AI Prompts** - Full control over AI behavior
- **Industry Profiles** - Pre-configured for different use cases
- **Export/Import Settings** - Share configurations with your team

---

## 🚀 Quick Start

### 1. Download & Open
```
Download the folder → Open index.html in your browser
```

### 2. Add Your API Key
Enter your OpenAI API key in the top-right corner of the app.

### 3. Create Your Report
- **Choose a template** or start from scratch
- **Add sections** with instructions for the AI
- **Upload documents** for context
- **Generate** and export to Word!

---

## 📁 Project Structure

```
OpenReport/
├── index.html          # Main application
├── styles.css          # Styling
├── js/
│   ├── core/           # Core framework
│   │   ├── Component.js
│   │   ├── ConfigManager.js
│   │   ├── EventBus.js
│   │   └── Store.js
│   ├── services/       # Business logic
│   │   ├── OpenAIService.js
│   │   ├── DocumentService.js
│   │   ├── TokenService.js
│   │   └── ExportService.js
│   ├── components/     # UI components
│   │   ├── App.js
│   │   ├── Sidebar.js
│   │   ├── SectionManager.js
│   │   └── ...
│   ├── profiles/       # Industry profiles
│   │   └── ProfileManager.js
│   └── data/           # Templates
│       └── Templates.js
└── assets/             # Images and resources
```

---

## 🏢 Industry Profiles

| Profile | Use Cases |
|---------|-----------|
| ⚖️ **Legal** | Contracts, legal opinions, case summaries |
| 🛡️ **AML/Compliance** | Regulatory reports, KYC documentation |
| 📊 **Data Analysis** | Research reports, statistical analysis |
| 💰 **Finance** | Financial reports, budgets, forecasts |
| ⚠️ **Risk Management** | Risk assessments, mitigation plans |
| ⚙️ **Operations** | Process documentation, SOPs |
| 📢 **Marketing** | Campaign reports, market research |
| 👥 **HR** | Performance reviews, policy documents |

---

## ⚙️ Settings

### AI Configuration
- **System Prompts** - Customize AI behavior for your needs
- **Temperature** - Control creativity (0 = focused, 1 = creative)
- **Token Limits** - Manage costs and output length

### Advanced Options
- **Debug Mode** - Log all prompts to console
- **Export/Import** - Share settings with team members
- **Reset** - Return to default settings

---

## 💡 Tips for Best Results

1. **Be Specific** - Clear instructions = better output
2. **Use Templates** - Start with a template, then customize
3. **Upload Context** - More relevant documents = better results
4. **Review & Iterate** - Regenerate sections that need improvement
5. **Save Presets** - Save your section structures for reuse

---

## 🔒 Privacy & Security

- **100% Client-Side** - All processing happens in your browser
- **No Data Storage** - Nothing is sent to our servers
- **Direct API Calls** - Your data goes directly to OpenAI
- **API Key Control** - Stored locally in your browser only

---

## 📋 Requirements

- **Browser** - Chrome, Edge, Firefox (latest versions)
- **Internet** - Required for API calls
- **API Key** - OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

---

## 🆘 Troubleshooting

### "API Key is missing"
Enter your OpenAI API key in the top-right corner.

### "API Key format invalid"
Ensure your key starts with `sk-`. Get a new key from OpenAI if needed.

### Styling looks broken
Try refreshing with Ctrl+F5 (hard refresh).

### Export not working
Ensure you have an internet connection (required for the export library).

---

## 📝 Changelog

### v2.0 (Current)
- ✅ Complete UI redesign
- ✅ Industry profiles (8 industries)
- ✅ Fully configurable AI prompts
- ✅ Settings panel with export/import
- ✅ Improved document processing
- ✅ Better error handling
- ✅ XSS security fixes

### v1.0
- Initial release
- Basic report generation
- Word export

---

## 📄 License

MIT License - Free for personal and commercial use.

---

**Made with ❤️ for professionals who value their time.**
