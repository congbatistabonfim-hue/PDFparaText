import React, { useState, useCallback } from 'react';
import { FileUpload } from './components/FileUpload';
import { ResultsDisplay } from './components/ResultsDisplay';
import { ProgressBar } from './components/ProgressBar';
import { extractTextFromImage } from './services/geminiService';
import { generateTxt, generateJson, generateHtml } from './utils/fileGenerator';
import { hybridProcessPdf } from './utils/pdfProcessor';
import type { ProcessState, LogEntry, OutputFile, ExtractedPage, HybridPageResult } from './types';
import { LogoIcon } from './components/icons/LogoIcon';
import { getDocument } from 'pdfjs-dist';


const App: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [processState, setProcessState] = useState<ProcessState>('IDLE');
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [extractedPages, setExtractedPages] = useState<ExtractedPage[]>([]);
    const [outputFiles, setOutputFiles] = useState<OutputFile[]>([]);
    const [error, setError] = useState<string | null>(null);

    const addLog = (message: string, type: 'info' | 'success' | 'warning' = 'info') => {
        setLogs(prev => [...prev, { timestamp: new Date(), message, type }]);
    };

    const resetState = useCallback(() => {
        outputFiles.forEach(f => URL.revokeObjectURL(f.url));
        setFile(null);
        setProcessState('IDLE');
        setLogs([]);
        setExtractedPages([]);
        setOutputFiles([]);
        setError(null);
    }, [outputFiles]);

    const handleFileProcess = useCallback(async () => {
        if (!file) {
            setError('Please select a file first.');
            return;
        }

        const currentFile = file;
        setProcessState('UPLOADING');
        setLogs([]);
        setExtractedPages([]);
        setOutputFiles([]);
        setError(null);
        addLog(`Starting processing for "${currentFile.name}".`);

        try {
            let pageChunks: number[][] = [];
            const allExtractedPages: ExtractedPage[] = [];

            if (currentFile.type === 'application/pdf') {
                setProcessState('SPLITTING');
                addLog('Analyzing PDF and preparing for processing...');
                
                const fileBuffer = await currentFile.arrayBuffer();
                const pdfDocument = await getDocument({ data: fileBuffer }).promise;
                const numPages = pdfDocument.numPages;

                const MB = 1024 * 1024;
                const fileSizeInMB = currentFile.size / MB;

                if (fileSizeInMB < 10) {
                    addLog('PDF size is under 10MB. Processing as a single part.');
                    const allPages = Array.from({ length: numPages }, (_, i) => i + 1);
                    pageChunks.push(allPages);
                } else if (fileSizeInMB < 19) {
                    addLog('PDF size is between 10MB and 19MB. Splitting into 2 parts.');
                    const midPoint = Math.ceil(numPages / 2);
                    const part1 = Array.from({ length: midPoint }, (_, i) => i + 1);
                    const part2 = Array.from({ length: numPages - midPoint }, (_, i) => midPoint + i + 1);
                    pageChunks.push(part1, part2);
                } else {
                    addLog('PDF size is over 19MB. Splitting into smaller parts.');
                    const chunkSize = 15; // Process in chunks of 15 pages
                    for (let i = 0; i < numPages; i += chunkSize) {
                        const chunk = Array.from({ length: Math.min(chunkSize, numPages - i) }, (_, j) => i + j + 1);
                        pageChunks.push(chunk);
                    }
                }
                
                addLog(`PDF will be processed in ${pageChunks.length} part(s).`);

                const hybridResults: HybridPageResult[] = await hybridProcessPdf(pdfDocument);
                
                setProcessState('EXTRACTING');
                addLog(`Extracting text from ${numPages} page(s) using Hybrid OCR...`);

                const extractionPromises = hybridResults.map(result => {
                    if (result.type === 'text') {
                        addLog(`- Page ${result.pageNumber}: Direct text extracted.`, 'success');
                        return Promise.resolve({ pageNumber: result.pageNumber, text: result.content });
                    } else {
                        addLog(`- Page ${result.pageNumber}: Requires AI OCR...`);
                        return extractTextFromImage(result.content, result.mimeType)
                            .then(text => {
                                addLog(`  Page ${result.pageNumber} AI OCR successful.`, 'success');
                                return { pageNumber: result.pageNumber, text: text || '[No text found]' };
                            });
                    }
                });

                const pageResults = await Promise.all(extractionPromises);
                allExtractedPages.push(...pageResults.sort((a, b) => a.pageNumber - b.pageNumber));
                setExtractedPages(allExtractedPages);

            } else if (currentFile.type.startsWith('image/')) {
                addLog('Processing single image file.');
                pageChunks.push([1]); // Single chunk for a single image
                
                setProcessState('EXTRACTING');
                const reader = new FileReader();
                reader.readAsDataURL(currentFile);
                const base64Data = await new Promise<string>((resolve, reject) => {
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = error => reject(error);
                });
                
                const text = await extractTextFromImage(base64Data.split(',')[1], currentFile.type);
                allExtractedPages.push({ pageNumber: 1, text: text || '[No text found]' });
                setExtractedPages(allExtractedPages);

            } else {
                throw new Error('Unsupported file type. Please upload a PDF or an image file.');
            }
            
            addLog('All pages extracted.', 'success');
            
            setProcessState('GENERATING');
            addLog('Generating output files...');
            
            const finalOutputFiles: OutputFile[] = [];
            const isMultiPart = pageChunks.length > 1;

            pageChunks.forEach((chunk, index) => {
                const baseName = isMultiPart ? `part${index + 1}_saida` : 'saida';
                const chunkPages = allExtractedPages.filter(p => chunk.includes(p.pageNumber));
                
                const txtBlob = generateTxt(chunkPages, baseName);
                const jsonBlob = generateJson(chunkPages, baseName);
                const htmlBlob = generateHtml(chunkPages, baseName);
                
                finalOutputFiles.push(
                    { name: `${baseName}.txt`, url: URL.createObjectURL(txtBlob) },
                    { name: `${baseName}.json`, url: URL.createObjectURL(jsonBlob) },
                    { name: `${baseName}.html`, url: URL.createObjectURL(htmlBlob) }
                );
            });

            setOutputFiles(finalOutputFiles);
            addLog('Output files generated.', 'success');
            
            setProcessState('DONE');
            addLog('Processing complete!', 'success');

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Processing failed: ${errorMessage}`);
            addLog(`Error: ${errorMessage}`, 'warning');
            setProcessState('IDLE');
        }

    }, [file]);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
                <header className="flex items-center gap-4 mb-8">
                    <LogoIcon className="w-10 h-10 text-sky-500" />
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">PDF Text Extractor Pro</h1>
                        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">Intelligent OCR and Data Export</p>
                    </div>
                </header>

                <main className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-lg p-6 sm:p-8 border border-slate-200 dark:border-slate-700">
                    {processState === 'IDLE' && !extractedPages.length ? (
                        <FileUpload onFileSelect={setFile} onProcess={handleFileProcess} initialFile={file} />
                    ) : (
                        <div>
                            <ProgressBar state={processState} />
                            <ResultsDisplay
                                pages={extractedPages}
                                logs={logs}
                                outputFiles={outputFiles}
                                onReset={resetState}
                                isProcessing={processState !== 'DONE' && processState !== 'IDLE'}
                            />
                        </div>
                    )}
                    
                    {error && (
                        <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg">
                            <p className="font-semibold">Error</p>
                            <p>{error}</p>
                        </div>
                    )}
                </main>
                <footer className="text-center mt-8 text-sm text-slate-500 dark:text-slate-400">
                    <p>&copy; {new Date().getFullYear()} PDF Text Extractor Pro. All rights reserved.</p>
                </footer>
            </div>
        </div>
    );
};

export default App;