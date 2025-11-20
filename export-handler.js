// Word Document Export Handler
class ExportHandler {
    constructor() {
        // docx will be available from the global window object
        this.checkLibrary();
    }

    checkLibrary() {
        // Wait for library to load
        if (typeof docx === 'undefined' && typeof window.docx === 'undefined') {
            console.warn('docx library not yet loaded, will retry when exporting');
        }
    }

    getDocx() {
        // Try multiple ways to access the library
        if (typeof docx !== 'undefined') {
            return docx;
        }
        if (typeof window.docx !== 'undefined') {
            return window.docx;
        }
        throw new Error('Document export library not loaded. Please refresh the page and try again.');
    }

    async exportToWord(reportContent, reportTitle = 'Openbank Report') {
        try {
            const docxLib = this.getDocx();
            const { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, ImageRun } = docxLib;

            // Load and convert logo to base64
            const logoBase64 = await this.loadImageAsBase64('Openbank-comienza-a-operar-en-Mexico-1000x600.png');

            const children = [];

            // Add title
            children.push(
                new Paragraph({
                    text: reportTitle,
                    heading: HeadingLevel.TITLE,
                    spacing: {
                        after: 400
                    },
                    alignment: AlignmentType.CENTER
                })
            );

            // Parse and add report content
            const sections = this.parseReportContent(reportContent);
            
            sections.forEach(section => {
                // Add section heading
                if (section.heading) {
                    children.push(
                        new Paragraph({
                            text: section.heading,
                            heading: HeadingLevel.HEADING_1,
                            spacing: {
                                before: 400,
                                after: 200
                            }
                        })
                    );
                }

                // Add section content paragraphs
                section.paragraphs.forEach(para => {
                    children.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: para,
                                    size: 24 // 12pt font
                                })
                            ],
                            spacing: {
                                after: 200
                            }
                        })
                    );
                });
            });

            // Add spacing before footer
            children.push(
                new Paragraph({
                    text: '',
                    spacing: { after: 600 }
                })
            );

            // Add logo at the bottom
            if (logoBase64) {
                try {
                    children.push(
                        new Paragraph({
                            children: [
                                new ImageRun({
                                    data: logoBase64,
                                    transformation: {
                                        width: 300,
                                        height: 180
                                    }
                                })
                            ],
                            alignment: AlignmentType.CENTER,
                            spacing: {
                                before: 400
                            }
                        })
                    );
                } catch (error) {
                    console.error('Error adding logo to document:', error);
                    // Add text fallback if logo fails
                    children.push(
                        new Paragraph({
                            text: 'Openbank',
                            alignment: AlignmentType.CENTER,
                            spacing: {
                                before: 400
                            }
                        })
                    );
                }
            }

            // Create document
            const doc = new Document({
                sections: [{
                    properties: {},
                    children: children
                }]
            });

            // Generate and download (use existing docxLib from line 28)
            const blob = await docxLib.Packer.toBlob(doc);
            this.downloadBlob(blob, `${reportTitle.replace(/[^a-z0-9]/gi, '_')}.docx`);

            return true;
        } catch (error) {
            errorLogger?.logExportError(error, { reportTitle: reportTitle });
            throw new Error(`Export error: ${error.message}`);
        }
    }

    parseReportContent(content) {
        const sections = [];
        const lines = content.split('\n');
        let currentSection = null;

        for (let line of lines) {
            line = line.trim();
            
            if (!line) {
                continue;
            }

            // Check if line is a heading (starts with ###, ##, or #)
            if (line.startsWith('### ')) {
                // Save previous section
                if (currentSection) {
                    sections.push(currentSection);
                }
                // Start new section with subheading
                currentSection = {
                    heading: line.replace(/^###\s+/, '').trim(),
                    paragraphs: []
                };
            } else if (line.startsWith('## ')) {
                // Save previous section
                if (currentSection) {
                    sections.push(currentSection);
                }
                // Start new section
                currentSection = {
                    heading: line.replace(/^##\s+/, '').trim(),
                    paragraphs: []
                };
            } else if (line.startsWith('# ')) {
                // Save previous section
                if (currentSection) {
                    sections.push(currentSection);
                }
                // Start new section with main heading
                currentSection = {
                    heading: line.replace(/^#\s+/, '').trim(),
                    paragraphs: []
                };
            } else {
                // Add to current section or create default section
                if (!currentSection) {
                    currentSection = {
                        heading: null,
                        paragraphs: []
                    };
                }
                
                // Clean markdown formatting
                const cleanLine = this.cleanMarkdown(line);
                if (cleanLine) {
                    currentSection.paragraphs.push(cleanLine);
                }
            }
        }

        // Add last section
        if (currentSection) {
            sections.push(currentSection);
        }

        return sections;
    }

    cleanMarkdown(text) {
        // Remove bold markdown
        text = text.replace(/\*\*(.+?)\*\*/g, '$1');
        // Remove italic markdown
        text = text.replace(/\*(.+?)\*/g, '$1');
        // Remove inline code
        text = text.replace(/`(.+?)`/g, '$1');
        // Remove links but keep text
        text = text.replace(/\[(.+?)\]\(.+?\)/g, '$1');
        
        return text.trim();
    }

    async loadImageAsBase64(imagePath) {
        try {
            const response = await fetch(imagePath);
            const blob = await response.blob();
            return await this.blobToBase64(blob);
        } catch (error) {
            console.error('Error loading image:', error);
            return null;
        }
    }

    blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result.split(',')[1];
                resolve(Uint8Array.from(atob(base64), c => c.charCodeAt(0)));
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    generatePreview(reportContent, reportTitle = 'Openbank Report') {
        let html = `<h1>${this.escapeHtml(reportTitle)}</h1>`;
        
        const sections = this.parseReportContent(reportContent);
        
        sections.forEach(section => {
            if (section.heading) {
                html += `<h2>${this.escapeHtml(section.heading)}</h2>`;
            }
            
            section.paragraphs.forEach(para => {
                html += `<p>${this.escapeHtml(para)}</p>`;
            });
        });

        html += `<div style="text-align: center; margin-top: 40px;">
                    <img src="Openbank-comienza-a-operar-en-Mexico-1000x600.png" alt="Openbank" style="max-width: 300px;">
                 </div>`;

        return html;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Create global instance
const exportHandler = new ExportHandler();

