
import React, { useState, useCallback, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { ResultsDisplay } from './components/ResultsDisplay';
import { ProgressBar } from './components/ProgressBar';
import { extractTextFromImage } from './services/geminiService';
import { generateTxt, generateJson, generateHtml } from './utils/fileGenerator';
import type { ProcessState, LogEntry, OutputFile, ExtractedPage } from './types';
import { LogoIcon } from './components/icons/LogoIcon';

const InfoBox: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="mb-6 p-4 bg-sky-100 dark:bg-sky-900/50 border border-sky-300 dark:border-sky-700 text-sky-700 dark:text-sky-300 rounded-lg text-sm">
        {children}
    </div>
);

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
    
    // Clean up object URLs to prevent memory leaks
    useEffect(() => {
        return () => {
            outputFiles.forEach(file => URL.revokeObjectURL(file.url));
        };
    }, [outputFiles]);


    const resetState = () => {
        // Revoking is handled by the useEffect cleanup function when outputFiles is set to []
        setFile(null);
        setProcessState('IDLE');
        setLogs([]);
        setExtractedPages([]);
        setOutputFiles([]);
        setError(null);
    };

    const handleFileProcess = useCallback(async () => {
        if (!file) {
            setError('Please select a file first.');
            return;
        }

        // Reset previous run state but keep file for display
        setProcessState('UPLOADING');
        setLogs([]);
        setExtractedPages([]);
        setOutputFiles([]); // This triggers useEffect to clean up old URLs
        setError(null);
        addLog(`Starting processing for "${file.name}".`);

        try {
            // SIMULATION: This demo treats the uploaded file as an image for OCR.
            // The PDF splitting logic is simulated for demonstration purposes.
            
            // Artificial delay to show progress
            await new Promise(res => setTimeout(res, 500));
            setProcessState('SPLITTING');
            const fileSizeMB = file.size / (1024 * 1024);

            if (fileSizeMB > 19) {
                const parts = Math.ceil(fileSizeMB / 6);
                addLog(`PDF size (${fileSizeMB.toFixed(2)}MB) > 19MB. Simulating split into ${parts} parts.`, 'info');
            } else if (fileSizeMB >= 10) {
                addLog(`PDF size (${fileSizeMB.toFixed(2)}MB) is between 10-19MB. Simulating split into 2 parts.`, 'info');
            } else {
                addLog(`PDF size (${fileSizeMB.toFixed(2)}MB) < 10MB. Processing directly.`, 'info');
            }
            addLog('PDF split simulation complete.', 'success');


            await new Promise(res => setTimeout(res, 500));
            setProcessState('EXTRACTING');
            if (!file.type.startsWith('image/')) {
                 addLog('File is not an image. For this demo, an image is required to test OCR.', 'warning');
                 throw new Error('This demonstration requires an image file to showcase the OCR functionality.');
            }
            
            addLog('Converting image to base64 for processing...');
            const reader = new FileReader();
            reader.readAsDataURL(file);
            const base64Data = await new Promise<string>((resolve, reject) => {
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = error => reject(error);
            });
            const base64Image = base64Data.split(',')[1];
            
            addLog('Applying intelligent OCR via Gemini API...');
            const extractedText = await extractTextFromImage(base64Image, file.type);
            const pages: ExtractedPage[] = [{ pageNumber: 1, text: extractedText }];
            setExtractedPages(pages);
            addLog('Text extraction successful.', 'success');


            await new Promise(res => setTimeout(res, 500));
            setProcessState('GENERATING');
            addLog('Generating output files...');
            
            const txtBlob = generateTxt(pages, 'saida');
            const jsonBlob = generateJson(pages, 'saida');
            const htmlBlob = generateHtml(pages, 'saida');

            setOutputFiles([
                { name: 'saida.txt', url: URL.createObjectURL(txtBlob) },
                { name: 'saida.json', url: URL.createObjectURL(jsonBlob) },
                { name: 'saida.html', url: URL.createObjectURL(htmlBlob) },
            ]);
            addLog('Output files generated.', 'success');
            
            await new Promise(res => setTimeout(res, 200));
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
                        <>
                          <InfoBox>
                              <p><strong className="font-semibold">Demonstration Mode:</strong> This app simulates PDF processing. To test the powerful OCR feature with the Gemini API, please upload an <strong>image file</strong> (e.g., PNG, JPG).</p>
                          </InfoBox>
                          <FileUpload onFileSelect={setFile} onProcess={handleFileProcess} initialFile={file} />
                        </>
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