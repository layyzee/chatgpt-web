/**
 * Intelligent Document & PDF Parser for BalaGPT
 * Supports: PDF, CSV, TSV, JSON, Python, JS, Markdown, SQL, TXT
 */

// Dynamically inject PDF.js library when a PDF is selected
async function loadPdfJs() {
  if (window.pdfjsLib) return window.pdfjsLib;

  return new Promise((resolve, reject) => {
    const existingScript = document.getElementById('pdfjs-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.pdfjsLib));
      return;
    }

    const script = document.createElement('script');
    script.id = 'pdfjs-script';
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(window.pdfjsLib);
      } else {
        reject(new Error('PDF.js failed to initialize'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load PDF.js from CDN'));
    document.head.appendChild(script);
  });
}

// Fallback ASCII / text stream extractor for PDFs if offline or unparsed
function extractAsciiFromPdfBuffer(buffer) {
  const bytes = new Uint8Array(buffer);
  let raw = '';
  // Convert printable ASCII
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    if ((b >= 32 && b <= 126) || b === 10 || b === 13 || b === 9) {
      raw += String.fromCharCode(b);
    }
  }
  // Extract text within stream blocks or parenthesized TJ operators
  const matches = raw.match(/\(([^)]+)\)\s*Tj/g) || [];
  if (matches.length > 0) {
    return matches.map(m => m.replace(/^\\\(|\\\)\s*Tj$/g, '')).join(' ');
  }
  return raw.slice(0, 5000);
}

export async function parseUploadedDocument(file, onProgress) {
  if (!file) throw new Error('No file provided');

  const name = file.name;
  const sizeKB = (file.size / 1024).toFixed(1);
  const ext = name.split('.').pop()?.toLowerCase() || '';

  if (file.size > 20 * 1024 * 1024) {
    throw new Error('File exceeds the 20MB maximum size limit.');
  }

  // --- 1. PDF Parsing ---
  if (ext === 'pdf') {
    onProgress?.('Extracting text from PDF pages...');
    try {
      const pdfjs = await loadPdfJs();
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdfDoc = await loadingTask.promise;
      const numPages = pdfDoc.numPages;

      let extractedPages = [];
      for (let i = 1; i <= numPages; i++) {
        onProgress?.(`Reading page ${i} of ${numPages}...`);
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        extractedPages.push(`--- [Page ${i} of ${numPages}] ---\n${pageText.trim()}`);
      }

      const fullText = extractedPages.join('\n\n');
      return {
        name,
        size: `${sizeKB} KB`,
        type: 'pdf',
        pages: numPages,
        charCount: fullText.length,
        content: fullText || 'No text layer found in this PDF (might be a scanned image).'
      };
    } catch (err) {
      console.warn('PDF.js extraction failed, trying binary fallback:', err);
      const arrayBuffer = await file.arrayBuffer();
      const fallbackText = extractAsciiFromPdfBuffer(arrayBuffer);
      return {
        name,
        size: `${sizeKB} KB`,
        type: 'pdf',
        pages: 1,
        charCount: fallbackText.length,
        content: fallbackText || 'Could not parse text from this PDF file.'
      };
    }
  }

  // --- 2. CSV / Tabular Data Parsing ---
  if (ext === 'csv' || ext === 'tsv') {
    onProgress?.('Parsing spreadsheet data...');
    const text = await file.text();
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    const headers = lines[0] || '';
    return {
      name,
      size: `${sizeKB} KB`,
      type: 'spreadsheet',
      lineCount: lines.length,
      headers: headers.slice(0, 100),
      content: text
    };
  }

  // --- 3. JSON Structured Data ---
  if (ext === 'json') {
    onProgress?.('Formatting JSON...');
    const text = await file.text();
    try {
      const parsed = JSON.parse(text);
      const formatted = JSON.stringify(parsed, null, 2);
      return {
        name,
        size: `${sizeKB} KB`,
        type: 'json',
        lineCount: formatted.split('\n').length,
        content: formatted
      };
    } catch {
      return {
        name,
        size: `${sizeKB} KB`,
        type: 'json',
        content: text
      };
    }
  }

  // --- 4. Code & Text Files (Python, JS, SQL, Markdown, etc.) ---
  onProgress?.('Reading text document...');
  const text = await file.text();
  const lineCount = text.split('\n').length;
  return {
    name,
    size: `${sizeKB} KB`,
    type: ext || 'text',
    lineCount,
    content: text
  };
}
