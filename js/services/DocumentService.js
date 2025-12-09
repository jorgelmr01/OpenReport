class DocumentService {
    constructor() {
        // Set PDF.js worker if available
        if (typeof pdfjsLib !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
    }

    initPdfWorker() {
        if (typeof pdfjsLib !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
    }

    async processFile(file) {
        const extension = file.name.split('.').pop().toLowerCase();
        let content = '';

        try {
            if (extension === 'pdf') {
                content = await this.readPdf(file);
            } else if (extension === 'docx') {
                content = await this.readDocx(file);
            } else if (['xlsx', 'xls', 'csv'].includes(extension)) {
                content = await this.readExcel(file);
            } else if (['txt', 'md', 'json', 'eml'].includes(extension)) {
                content = await this.readText(file);
            } else {
                throw new Error(`Unsupported file type: .${extension}`);
            }

            return {
                name: file.name,
                type: extension,
                size: file.size,
                content: content.trim()
            };
        } catch (error) {
            console.error('File processing error:', error);
            throw new Error(`Failed to process ${file.name}: ${error.message}`);
        }
    }

    async readText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    async readPdf(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let text = '';

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                text += content.items.map(item => item.str).join(' ') + '\n';
            }
            return text;
        } catch (error) {
            if (error.name === 'PasswordException') {
                throw new Error('PDF is password protected.');
            }
            throw error;
        }
    }

    async readDocx(file) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
        return result.value;
    }

    async readExcel(file) {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer);
        let text = '';

        workbook.SheetNames.forEach(sheetName => {
            const sheet = workbook.Sheets[sheetName];
            text += `Sheet: ${sheetName}\n`;
            text += XLSX.utils.sheet_to_csv(sheet) + '\n';
        });
        return text;
    }
}

window.DocumentService = new DocumentService();
