# OpenReport - AI-Powered Report Generator

A professional web application that uses ChatGPT API to generate comprehensive, well-structured reports with document processing and intelligent content generation.

## Features

### 🤖 AI-Powered Generation
- Multiple GPT model support (GPT-4o, GPT-4o Mini, GPT-4 Turbo, O1 models)
- Two-stage generation: individual sections + final review for consistency
- Overview Mode: sections that generate last using context from other sections

### 📄 Document Processing
- Supports PDF, DOCX, TXT, and Excel files
- Automatic text extraction and optimization
- Global documents (applied to all sections)
- Section-specific documents

### 🎨 Professional Output
- Export to Word (.docx) with custom branding
- Clean, professional formatting
- Customizable report titles
- Automatic section structuring

### 💡 Smart Features
- AI chatbot assistant to help configure report structure
- Token estimation and cost calculation
- Rate limit checking
- Preset save/load functionality
- Real-time progress tracking
- Comprehensive error logging

### 🔒 Privacy & Security
- All processing happens locally in browser
- API key stored securely in localStorage
- No data sent to external servers (except OpenAI)
- Full control over your data

## Quick Start

1. **Download or clone this repository**
   ```bash
   git clone https://github.com/jorgelmr01/OpenReport.git
   cd OpenReport
   ```

2. **Open `index.html` in your browser**
   - No installation or build process required!
   - Works completely offline (except API calls)

3. **Set your OpenAI API Key**
   - Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
   - Enter it in the top navigation bar
   - Select your preferred model

4. **Create your report**
   - Set report title
   - Add sections (or use AI Assistant)
   - Upload documents
   - Generate report
   - Export to Word

## Usage Guide

### Basic Workflow

1. **Set Report Title** - Enter your report title in the input field
2. **Add Global Documents** (optional) - Upload documents for context across all sections
3. **Add Sections** - Click "Add Section" or use AI Assistant
4. **Configure Sections**:
   - Name each section
   - Add instructions/description
   - Upload relevant documents
   - Enable "Overview Mode" for summary sections
5. **Generate Report** - Click "Generate Report"
6. **Export** - Download as Word document

### Overview Mode

Enable "Overview Mode" for sections that should:
- Generate **after** all regular sections
- Receive context from other sections
- Create summaries (e.g., Executive Summary, Conclusions)

### AI Assistant

1. Click "🤖 AI Assistant"
2. Describe your report needs
3. AI suggests sections with instructions
4. Click "Apply Suggestions"
5. Fine-tune and add documents

### Presets

**Save Preset:**
- Saves report structure for reuse
- Includes sections, titles, and settings
- Stored in browser localStorage

**Load Preset:**
- Shows list of saved presets
- Can also load from JSON file

## Token Optimization

The app includes smart token management:
- Automatic document truncation
- Per-section token limits
- Real-time cost estimation
- Rate limit warnings

**Typical token usage:**
- Small report (3-5 sections): 10-15K tokens
- Medium report (5-10 sections): 20-30K tokens
- Large report (10+ sections): 30-50K tokens

## Error Logging

Comprehensive error logging system:
- All errors captured with full context
- Stored in localStorage
- Exportable as JSON

**Console commands:**
```javascript
window.printErrorReport()  // View error summary
window.getErrorLogs()      // Get all errors
window.exportErrorLogs()   // Download JSON
window.clearErrorLogs()    // Clear all
```

## File Structure

```
OpenReport/
├── index.html              # Main application
├── styles.css              # Styling
├── app.js                  # Main logic
├── api-handler.js          # OpenAI integration
├── doc-processor.js        # Document processing
├── export-handler.js       # Word export
├── token-manager.js        # Token optimization
├── error-logger.js         # Error logging
├── presets/                # Example presets
│   ├── example_quarterly_report.json
│   └── example_market_analysis.json
├── README.md               # This file
├── QUICK_START.md          # Quick start guide
├── FEATURES.md             # Feature list
├── TOKEN_OPTIMIZATION_GUIDE.md
└── ERROR_LOGS_GUIDE.md
```

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Edge 90+
- Safari 14+

## Requirements

- Modern web browser
- Internet connection (for OpenAI API)
- OpenAI API key

## Cost Estimation

Approximate costs (depends on model and report size):

| Model | Small Report | Medium Report | Large Report |
|-------|--------------|---------------|--------------|
| GPT-4o | $0.10-0.30 | $0.30-0.60 | $0.60-1.20 |
| GPT-4o Mini | $0.01-0.03 | $0.03-0.06 | $0.06-0.12 |

*Actual costs vary based on document sizes and complexity*

## Tips for Best Results

1. **Use Global Documents** for general context
2. **Clear Instructions** in section descriptions
3. **Overview Mode** for summaries
4. **Check Token Estimate** before generating
5. **GPT-4o Mini** for drafts (cheaper, faster)
6. **GPT-4o** for final versions (best quality)

## Troubleshooting

### "API connection failed"
- Verify API key is correct
- Check you have credits in OpenAI account
- Try different model

### "Rate limit exceeded"
- Check token estimate
- Use GPT-4o Mini (200K limit)
- Reduce document sizes
- Generate in smaller batches

### "Export failed"
- Hard refresh (Ctrl+Shift+R)
- Check browser console (F12)
- Try different browser

### General Issues
1. Open console (F12)
2. Run `window.printErrorReport()`
3. Check error logs
4. Export logs if needed

## Development

This is a client-side only application:
- No build process required
- No dependencies to install
- All libraries loaded from CDN
- Works from file:// protocol

To customize:
1. Edit HTML/CSS/JS files directly
2. Refresh browser to see changes
3. No compilation needed

## Privacy

- ✅ API key stored locally only
- ✅ All processing client-side
- ✅ No data sent to external servers
- ✅ You control all data
- ❌ No tracking or analytics
- ❌ No data collection

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use and modify!

## Support

For issues or questions:
1. Check documentation files
2. Review error logs
3. Open GitHub issue

## Credits

Built with:
- OpenAI GPT API
- pdf.js (Mozilla)
- mammoth.js
- SheetJS
- docx.js

## Version

Current version: 1.2

**Last updated:** November 20, 2025

---

**Happy Report Generating!** 🎉
