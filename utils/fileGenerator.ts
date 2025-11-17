
import type { ExtractedPage } from '../types';

export function generateTxt(pages: ExtractedPage[], baseName: string): Blob {
    const content = pages.map(p => `${p.pageNumber}\n${p.text}`).join('\n\n');
    return new Blob([content], { type: 'text/plain' });
}

export function generateJson(pages: ExtractedPage[], baseName: string): Blob {
    const pageObject = pages.reduce((acc, p) => {
        acc[p.pageNumber] = p.text;
        return acc;
    }, {} as Record<number, string>);

    const jsonStructure = {
        paginas: pageObject
    };

    const content = JSON.stringify(jsonStructure, null, 2);
    return new Blob([content], { type: 'application/json' });
}

export function generateHtml(pages: ExtractedPage[], baseName: string): Blob {
    const articles = pages.map(p => `<article data-pagina="${p.pageNumber}">\n  ${p.text.replace(/\n/g, '\n  ')}\n</article>`).join('\n\n');
    
    const content = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Extracted Content - ${baseName}</title>
    <style>
        body { font-family: sans-serif; line-height: 1.6; padding: 2em; }
        article { border: 1px solid #ccc; padding: 1em; margin-bottom: 1em; border-radius: 5px; white-space: pre-wrap; }
        article::before { content: 'Page ' attr(data-pagina); font-weight: bold; display: block; margin-bottom: 0.5em; color: #555; }
    </style>
</head>
<body>
${articles}
</body>
</html>`;
    
    return new Blob([content], { type: 'text/html' });
}
