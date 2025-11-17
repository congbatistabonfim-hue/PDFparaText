
import React from 'react';
import type { ExtractedPage, LogEntry, OutputFile } from '../types';
import { DownloadIcon } from './icons/DownloadIcon';
import { LogIcon } from './icons/LogIcon';
import { PageIcon } from './icons/PageIcon';
import { TxtIcon } from './icons/TxtIcon';
import { JsonIcon } from './icons/JsonIcon';
import { HtmlIcon } from './icons/HtmlIcon';


interface ResultsDisplayProps {
    pages: ExtractedPage[];
    logs: LogEntry[];
    outputFiles: OutputFile[];
    onReset: () => void;
    isProcessing: boolean;
}

const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.txt')) return <TxtIcon className="w-8 h-8"/>;
    if (fileName.endsWith('.json')) return <JsonIcon className="w-8 h-8"/>;
    if (fileName.endsWith('.html')) return <HtmlIcon className="w-8 h-8"/>;
    return <PageIcon className="w-8 h-8"/>;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ pages, logs, outputFiles, onReset, isProcessing }) => {
    
    const getLogColor = (type: LogEntry['type']) => {
        switch (type) {
            case 'success': return 'text-green-500';
            case 'warning': return 'text-yellow-500';
            default: return 'text-slate-400';
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Download Section */}
            <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-100"><DownloadIcon className="w-6 h-6 text-sky-500"/> Download Your Files</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {outputFiles.map(file => (
                        <a 
                            key={file.name} 
                            href={file.url} 
                            download={file.name}
                            className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-lg flex items-center gap-4 hover:bg-slate-200 dark:hover:bg-slate-700/80 transition-all transform hover:scale-105"
                        >
                           {getFileIcon(file.name)}
                            <span className="font-semibold text-slate-700 dark:text-slate-200">{file.name}</span>
                        </a>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Extracted Text Preview */}
                <div>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-100"><PageIcon className="w-6 h-6 text-sky-500" /> Extracted Text</h2>
                    <div className="h-64 p-4 bg-slate-100 dark:bg-slate-900/50 rounded-lg overflow-auto border border-slate-200 dark:border-slate-700">
                        {pages.length > 0 ? (
                            pages.map(page => (
                                <div key={page.pageNumber}>
                                    <h3 className="font-bold text-sm mb-2 text-slate-500 dark:text-slate-400">Page {page.pageNumber}</h3>
                                    <p className="whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{page.text}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-slate-400 text-center mt-8">Extracting text...</p>
                        )}
                    </div>
                </div>

                {/* Processing Logs */}
                <div>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-100"><LogIcon className="w-6 h-6 text-sky-500" /> Processing Log</h2>
                    <div className="h-64 p-4 bg-slate-100 dark:bg-slate-900/50 rounded-lg overflow-auto border border-slate-200 dark:border-slate-700">
                        <ul className="space-y-2">
                            {logs.map((log, index) => (
                                <li key={index} className="flex gap-2 text-sm">
                                    <span className="font-mono text-slate-400">{log.timestamp.toLocaleTimeString()}</span>
                                    <span className={getLogColor(log.type)}>
                                        {log.type === 'success' ? '✓' : log.type === 'warning' ? '!' : '»'}
                                    </span>
                                    <span className="text-slate-600 dark:text-slate-300">{log.message}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
            
            <div className="text-center mt-6">
                <button
                    onClick={onReset}
                    disabled={isProcessing}
                    className="px-6 py-2 bg-slate-600 text-white font-semibold rounded-lg shadow-md hover:bg-slate-700 disabled:bg-slate-400 disabled:cursor-wait transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 dark:focus:ring-offset-slate-900"
                >
                    Process Another File
                </button>
            </div>
        </div>
    );
};
