import React, { useState, useCallback, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { ResultsDisplay } from './components/ResultsDisplay';
import { ProgressBar } from './components/ProgressBar';
import { extractTextFromImage } from './services/geminiService';
import { generateTxt, generateJson, generateHtml } from './utils/fileGenerator';
import { processPdf } from './utils/pdfProcessor';
import type { ProcessState, LogEntry, OutputFile, ExtractedPage } from './types';
import { LogoIcon } from './components/icons/LogoIcon';

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
        // Clean up blob URLs to prevent memory leaks
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

        // Reset previous results but keep the file for display
        const currentFile = file;
        setProcessState('IDLE');
        setLogs([]);
        setExtractedPages([]);
        setOutputFiles([]);
        setError(null);

        setProcessState('UPLOADING');
        addLog(`Starting processing for "${currentFile.name}".`);

        try {
            let pageImages: string[] = [];
            let imageMimeType: string = 'image/jpeg'; // PDF pages are converted to JPEG

            if (currentFile.type === 'application/pdf') {
                setProcessState('SPLITTING');
                addLog('Processing PDF: Converting pages to images for OCR...');
                pageImages = await processPdf(currentFile);
                addLog(`PDF processed. Found ${pageImages.length} pages.`, 'success');
            } else if (currentFile.type.startsWith('image/')) {
                addLog('Processing single image file.');
                const reader = new FileReader();
                reader.readAsDataURL(currentFile);
                const base64Data = await new Promise<string>((resolve, reject) => {
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = error => reject(error);
                });
                pageImages.push(base64Data.split(',')[1]);
                imageMimeType = currentFile.type;
            } else {
                throw new Error('Unsupported file type. Please upload a PDF or an image file.');
            }
            
            setProcessState('EXTRACTING');
            addLog(`Extracting text from ${pageImages.length} page(s) using Gemini OCR...`);

            const extractedContent: ExtractedPage[] = [];
            for (let i = 0; i < pageImages.length; i++) {
                addLog(`- Processing page ${i + 1} of ${pageImages.length}...`);
                const text = await extractTextFromImage(pageImages[i], imageMimeType);
                extractedContent.push({ pageNumber: i + 1, text: text || '[No text found on this page]' });
                addLog(`  Page ${i + 1} extracted successfully.`, 'success');
                setExtractedPages([...extractedContent]); // Update UI progressively
            }
            addLog('All pages extracted.', 'success');
            
            setProcessState('GENERATING');
            addLog('Generating output files...');
            
            const txtBlob = generateTxt(extractedContent, 'saida');
            const jsonBlob = generateJson(extractedContent, 'saida');
            const htmlBlob = generateHtml(extractedContent, 'saida');

            setOutputFiles([
                { name: 'saida.txt', url: URL.createObjectURL(txtBlob) },
                { name: 'saida.json', url: URL.createObjectURL(jsonBlob) },
                { name: 'saida.html', url: URL.createObjectURL(htmlBlob) },
            ]);
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
                                isProcessing={processState !== 'DONE'}
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
