// FIX: The `RenderParameters` type is not exported from the main `pdfjs-dist` module in recent versions.
// The type has been removed from the import, and the explicit type annotation for `renderContext` is also removed
// to rely on TypeScript's structural typing, which resolves the error.
import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy } from 'pdfjs-dist';
import type { HybridPageResult } from '../types';

// Set worker source to a reliable CDN to ensure it's loaded correctly.
GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@4.4.168/build/pdf.worker.mjs';

/**
 * Processes each page of a PDF using a hybrid approach:
 * 1. Tries to extract text directly.
 * 2. If direct extraction yields insufficient text, renders the page as a high-res image.
 * @param pdfDocument The PDF document proxy object from pdf.js.
 * @returns A promise that resolves to an array of HybridPageResult objects.
 */
export async function hybridProcessPdf(pdfDocument: PDFDocumentProxy): Promise<HybridPageResult[]> {
    const numPages = pdfDocument.numPages;
    
    const pageNumbers = Array.from({ length: numPages }, (_, i) => i + 1);

    const processingPromises = pageNumbers.map(async (pageNum) => {
        const page = await pdfDocument.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        const extractedText = textContent.items.map(item => 'str' in item ? item.str : '').join(' ');

        // If text is substantial, use it directly. Otherwise, render an image.
        if (extractedText.trim().length > 20) { // Threshold for "sufficient" text
            return { pageNumber: pageNum, type: 'text' as const, content: extractedText };
        }

        // Fallback to rendering the page as an image
        const dpi = 300;
        const scale = dpi / 96;
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error(`Could not get canvas context for page ${pageNum}`);
        }
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        const renderContext = {
            canvasContext: context,
            viewport: viewport,
        };

        await page.render(renderContext).promise;
        const imageDataUrl = canvas.toDataURL('image/jpeg', 1.0);
        
        return {
            pageNumber: pageNum,
            type: 'image' as const,
            content: imageDataUrl.split(',')[1],
            mimeType: 'image/jpeg'
        };
    });

    return Promise.all(processingPromises);
}
