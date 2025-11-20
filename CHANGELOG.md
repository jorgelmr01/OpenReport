# Changelog

## Version 1.1 - Bug Fixes and Improvements (2025-11-20)

### 🐛 Bug Fixes

1. **Section Rendering Issue**
   - Fixed bug where only the first section would be applied when using AI Assistant suggestions
   - Fixed issue where manually adding sections after the first one wouldn't display
   - Improved rendering logic to properly handle multiple sections

2. **Word Export Error**
   - Fixed "Cannot destructure property 'Document'" error
   - Corrected docx library initialization and usage
   - Added proper error handling for missing library

3. **Progress Bar Display**
   - Fixed issue where progress bar wasn't showing during report generation
   - Now properly displays from 0% with detailed status messages
   - Shows progress for global document processing, section generation, and final review

### ✨ New Features

4. **Global Documents Support**
   - Added new section for uploading documents that apply to all sections
   - Reduces redundancy - no need to upload same document to each section
   - More resource-efficient processing
   - Documents automatically included in context for every section

5. **Improved Preset Management**
   - Presets now save automatically to browser localStorage (no download!)
   - Load Preset shows list of saved presets for quick selection
   - Optional backup download still available
   - More professional, seamless workflow

### ♿ Accessibility Improvements

6. **Form Labels and ARIA Attributes**
   - Added proper labels for all form inputs
   - Added ARIA labels for better screen reader support
   - Added content-type meta tag
   - Fixed accessibility warnings in browser console

### 🎨 UI/UX Improvements

7. **Better Progress Feedback**
   - Real-time progress updates during generation
   - Percentage-based progress bar
   - Detailed status messages for each step
   - Clear indication of what's being processed

8. **Professional Preset Workflow**
   - No more download clutter when saving presets
   - Clean confirmation messages
   - List-based preset selection
   - Backup download option available

---

## Version 1.0 - Initial Release (2025-11-20)

### Initial Features

- ChatGPT API integration with multiple model support
- Dynamic section builder with drag-and-drop file upload
- AI Assistant for report structure configuration
- Two-stage generation (sections + final review)
- Document processing (PDF, DOCX, TXT, Excel)
- Professional Word export with Openbank branding
- Preset save/load functionality
- Modern, responsive UI

---

## Upgrade Notes

### From v1.0 to v1.1

**No action required!** Simply refresh your browser to get the latest version.

**New Features You'll Notice:**
1. Global Documents section above your report sections
2. Progress bar now shows during generation
3. Presets save without downloading (check it out!)
4. Word export works reliably

**Breaking Changes:** None

**Data Migration:** 
- Old preset files (.json) can still be loaded
- Browser will start fresh with localStorage-based presets

---

## Known Issues

None currently reported.

---

## Roadmap

Potential future improvements:
- Export to PDF directly
- Report templates gallery
- Collaborative editing
- Cloud storage integration
- Custom branding options
- Report version history

---

## Feedback

Please report any issues or suggestions to your IT department or the development team.

