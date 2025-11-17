import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import type { HybridPageResult } from '../types';

GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@4.4.168/build/pdf.worker.mjs';

interface ProcessedPdf {
    hybridResults: HybridPageResult[];
    numPages: number;
}

export async function hybridProcessPdf(fileBuffer: ArrayBuffer): Promise<ProcessedPdf> {
    const pdfDocument = await getDocument({ data: fileBuffer }).promise;
    const numPages = pdfDocument.numPages;
    
    const pageNumbers = Array.from({ length: numPages }, (_, i) => i + 1);

    const processingPromises = pageNumbers.map(async (pageNum) => {
        const page = await pdfDocument.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Join text items, handling both old and new pdf.js structures.
        const extractedText = textContent.items.map(item => 'str' in item ? item.str : '').join(' ');

        // If page has substantial text content, use it directly.
        if (extractedText.trim().length > 20) {
            return { pageNumber: pageNum, type: 'text' as const, content: extractedText };
        }

        // Otherwise, render to an image for OCR.
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
        
        // The `render` method requires a context object with the canvas's 2D context and the viewport.
        const renderContext = {
            canvasContext: context,
            viewport: viewport,
        };

        // FIX: The type definitions for this version of pdf.js require the 'canvas' property in RenderParameters.
        await page.render(renderContext as any).promise;
        const imageDataUrl = canvas.toDataURL('image/jpeg', 1.0);
        
        return {
            pageNumber: pageNum,
            type: 'image' as const,
            content: imageDataUrl.split(',')[1],
            mimeType: 'image/jpeg'
        };
    });

    const hybridResults = await Promise.all(processingPromises);
    return { hybridResults, numPages };
}