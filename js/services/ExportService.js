class ExportService {
    async exportToWord(content, title) {
        // Check if docx library is loaded
        if (typeof docx === 'undefined') {
            throw new Error('Word export library not loaded. Please check your internet connection and refresh the page.');
        }
        
        const { Document, Packer, Paragraph, TextRun, HeadingLevel } = docx;

        // Simple Markdown to Docx parser
        // This is a simplified version. For full markdown support, we'd need a more complex parser.
        // Here we'll split by newlines and headers.

        const blocks = content.split(/\n\n+/);
        const children = [];

        // Title
        children.push(new Paragraph({
            text: title,
            heading: HeadingLevel.TITLE,
            spacing: { after: 400 },
            alignment: docx.AlignmentType.CENTER
        }));

        blocks.forEach(block => {
            const trimmed = block.trim();
            if (!trimmed) return;

            // Helper to clean text (remove asterisks used for bolding)
            // Note: In a real app, we'd parse bolding into TextRun objects
            const cleanText = (text) => text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/\n/g, ' ');

            if (trimmed.startsWith('# ')) {
                children.push(new Paragraph({
                    text: cleanText(trimmed.replace('# ', '')),
                    heading: HeadingLevel.HEADING_1,
                    spacing: { before: 400, after: 200 }
                }));
            } else if (trimmed.startsWith('## ')) {
                children.push(new Paragraph({
                    text: cleanText(trimmed.replace('## ', '')),
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 300, after: 150 }
                }));
            } else if (trimmed.startsWith('### ')) {
                children.push(new Paragraph({
                    text: cleanText(trimmed.replace('### ', '')),
                    heading: HeadingLevel.HEADING_3,
                    spacing: { before: 200, after: 100 }
                }));
            } else if (trimmed.startsWith('- ')) {
                // Handle lists
                const items = trimmed.split('\n');
                items.forEach(item => {
                    children.push(new Paragraph({
                        text: cleanText(item.replace(/^- /, '')),
                        bullet: { level: 0 },
                        spacing: { after: 100 },
                        lineRule: "auto",
                        line: 360 // 1.5 line spacing
                    }));
                });
            } else {
                // Regular paragraph
                children.push(new Paragraph({
                    text: cleanText(trimmed),
                    spacing: { after: 240 }, // ~12pt after
                    lineRule: "auto",
                    line: 360 // 1.5 line spacing
                }));
            }
        });

        const doc = new Document({
            sections: [{
                properties: {},
                children: children
            }]
        });

        const blob = await Packer.toBlob(doc);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title.replace(/[^a-z0-9]/gi, '_')}.docx`;
        a.click();
        window.URL.revokeObjectURL(url);
    }
    async exportToPdf(reportTitle, content) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Simple text dump for now, as full HTML rendering is complex without html2canvas
        // But we can do basic formatting

        doc.setFontSize(20);
        doc.text(reportTitle, 20, 20);

        doc.setFontSize(12);
        const splitText = doc.splitTextToSize(content.replace(/\*\*/g, ''), 170); // Strip bold markers

        let y = 40;
        splitText.forEach(line => {
            if (y > 280) {
                doc.addPage();
                y = 20;
            }
            doc.text(line, 20, y);
            y += 7;
        });

        doc.save(`${reportTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
    }
}

window.ExportService = new ExportService();
