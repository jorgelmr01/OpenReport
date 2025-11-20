// Document Processing Handler
class DocumentProcessor {
    constructor() {
        // Set PDF.js worker
        if (typeof pdfjsLib !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
    }

    async processFile(file) {
        const fileName = file.name.toLowerCase();
        const fileType = this.getFileType(fileName);

        try {
            switch (fileType) {
                case 'pdf':
                    return await this.processPDF(file);
                case 'docx':
                    return await this.processDOCX(file);
                case 'txt':
                    return await this.processTXT(file);
                case 'excel':
                    return await this.processExcel(file);
                default:
                    throw new Error(`Unsupported file type: ${fileName}`);
            }
        } catch (error) {
            errorLogger?.logFileError('processFile', file.name, error, { 
                fileType: this.getFileType(file.name),
                fileSize: file.size 
            });
            throw new Error(`Error processing ${fileName}: ${error.message}`);
        }
    }

    getFileType(fileName) {
        if (fileName.endsWith('.pdf')) return 'pdf';
        if (fileName.endsWith('.docx')) return 'docx';
        if (fileName.endsWith('.txt')) return 'txt';
        if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv')) return 'excel';
        return 'unknown';
    }

    async processPDF(file) {
        return new Promise((resolve, reject) => {
            const fileReader = new FileReader();
            
            fileReader.onload = async function() {
                try {
                    const typedArray = new Uint8Array(this.result);
                    const pdf = await pdfjsLib.getDocument(typedArray).promise;
                    let fullText = '';

                    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                        const page = await pdf.getPage(pageNum);
                        const textContent = await page.getTextContent();
                        const pageText = textContent.items.map(item => item.str).join(' ');
                        fullText += pageText + '\n\n';
                    }

                    resolve({
                        name: file.name,
                        content: fullText.trim(),
                        type: 'pdf'
                    });
                } catch (error) {
                    reject(new Error(`PDF parsing error: ${error.message}`));
                }
            };

            fileReader.onerror = () => reject(new Error('Failed to read PDF file'));
            fileReader.readAsArrayBuffer(file);
        });
    }

    async processDOCX(file) {
        return new Promise((resolve, reject) => {
            const fileReader = new FileReader();
            
            fileReader.onload = async function() {
                try {
                    const arrayBuffer = this.result;
                    const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
                    
                    resolve({
                        name: file.name,
                        content: result.value.trim(),
                        type: 'docx'
                    });
                } catch (error) {
                    reject(new Error(`DOCX parsing error: ${error.message}`));
                }
            };

            fileReader.onerror = () => reject(new Error('Failed to read DOCX file'));
            fileReader.readAsArrayBuffer(file);
        });
    }

    async processTXT(file) {
        return new Promise((resolve, reject) => {
            const fileReader = new FileReader();
            
            fileReader.onload = function() {
                resolve({
                    name: file.name,
                    content: this.result.trim(),
                    type: 'txt'
                });
            };

            fileReader.onerror = () => reject(new Error('Failed to read TXT file'));
            fileReader.readAsText(file);
        });
    }

    async processExcel(file) {
        return new Promise((resolve, reject) => {
            const fileReader = new FileReader();
            
            fileReader.onload = async function() {
                try {
                    const data = new Uint8Array(this.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    
                    let fullText = '';
                    
                    // Process each sheet
                    workbook.SheetNames.forEach((sheetName, index) => {
                        const worksheet = workbook.Sheets[sheetName];
                        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
                        
                        fullText += `Sheet: ${sheetName}\n\n`;
                        
                        // Convert to readable text format
                        jsonData.forEach(row => {
                            const rowText = row.filter(cell => cell !== '').join(' | ');
                            if (rowText) {
                                fullText += rowText + '\n';
                            }
                        });
                        
                        fullText += '\n';
                    });

                    resolve({
                        name: file.name,
                        content: fullText.trim(),
                        type: 'excel'
                    });
                } catch (error) {
                    reject(new Error(`Excel parsing error: ${error.message}`));
                }
            };

            fileReader.onerror = () => reject(new Error('Failed to read Excel file'));
            fileReader.readAsArrayBuffer(file);
        });
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    getFileIcon(fileName) {
        const lower = fileName.toLowerCase();
        if (lower.endsWith('.pdf')) return '📄';
        if (lower.endsWith('.docx')) return '📝';
        if (lower.endsWith('.txt')) return '📃';
        if (lower.endsWith('.xlsx') || lower.endsWith('.xls') || lower.endsWith('.csv')) return '📊';
        return '📎';
    }

    validateFile(file) {
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = ['.pdf', '.docx', '.txt', '.xlsx', '.xls', '.csv'];
        
        // Check file size
        if (file.size > maxSize) {
            throw new Error(`File "${file.name}" is too large. Maximum size is 10MB.`);
        }

        // Check file type
        const fileName = file.name.toLowerCase();
        const isValidType = allowedTypes.some(type => fileName.endsWith(type));
        
        if (!isValidType) {
            throw new Error(`File type not supported: ${file.name}. Allowed types: ${allowedTypes.join(', ')}`);
        }

        return true;
    }
}

// Create global instance
const docProcessor = new DocumentProcessor();

