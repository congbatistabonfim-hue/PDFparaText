import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import 'pdfjs-dist/build/pdf.worker.mjs';
import type { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
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
    const processingPromises: Promise<HybridPageResult>[] = [];

    for (let i = 1; i <= numPages; i++) {
        const promise = (async () => {
            const page = await pdfDocument.getPage(i);
            const textContent = await page.getTextContent();
            
            const extractedText = textContent.items.map(item => 'str' in item ? item.str : '').join(' ');

            // If text is substantial, use it directly. Otherwise, render an image.
            if (extractedText.trim().length > 20) { // Threshold for "sufficient" text
                return { pageNumber: i, type: 'text' as const, content: extractedText };
            }

            // Fallback to rendering the page as an image
            const dpi = 300;
            const scale = dpi / 96;
            const viewport = page.getViewport({ scale });

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            if (!context) {
                throw new Error(`Could not get canvas context for page ${i}`);
            }
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            const renderContext: any = {
                canvasContext: context,
                viewport: viewport,
            };

            await page.render(renderContext).promise;
            const imageDataUrl = canvas.toDataURL('image/jpeg', 1.0);
            
            return {
                pageNumber: i,
                type: 'image' as const,
                content: imageDataUrl.split(',')[1],
                mimeType: 'image/jpeg'
            };
        })();
        processingPromises.push(promise);
    }

    return Promise.all(processingPromises);
}