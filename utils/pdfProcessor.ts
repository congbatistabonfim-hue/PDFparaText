import * as pdfjsLib from 'pdfjs-dist';
import 'pdfjs-dist/build/pdf.worker.mjs';

// Set worker source to a reliable CDN to ensure it's loaded correctly.
// This is a critical step for pdf.js to work in many web environments.
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@4.4.168/build/pdf.worker.mjs';

/**
 * Converts each page of a PDF file into a high-resolution base64 encoded image.
 * @param file The PDF file to process.
 * @returns A promise that resolves to an array of base64 strings (without the data URL prefix).
 */
export async function processPdf(file: File): Promise<string[]> {
    const images: string[] = [];
    const fileReader = new FileReader();

    const data = await new Promise<ArrayBuffer>((resolve, reject) => {
        fileReader.onload = (event) => resolve(event.target?.result as ArrayBuffer);
        fileReader.onerror = reject;
        fileReader.readAsArrayBuffer(file);
    });

    const pdf = await pdfjsLib.getDocument({ data }).promise;
    const numPages = pdf.numPages;

    for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const dpi = 300; // High resolution for better OCR results
        const scale = dpi / 96;
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error('Could not get canvas context');
        }
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // FIX: The RenderParameters type for this project's version of pdfjs-dist
        // incorrectly requires a 'canvas' property. Casting to 'any' bypasses
        // the faulty type check while providing the correct parameters.
        const renderContext: any = {
            canvasContext: context,
            viewport: viewport,
        };

        await page.render(renderContext).promise;
        // Use JPEG for smaller file size with high quality
        const imageDataUrl = canvas.toDataURL('image/jpeg', 1.0);
        images.push(imageDataUrl.split(',')[1]); // Return only the base64 part
    }

    return images;
}
