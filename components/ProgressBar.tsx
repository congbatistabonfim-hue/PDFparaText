
import React from 'react';
import type { ProcessState } from '../types';
import { CheckIcon } from './icons/CheckIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';

interface ProgressBarProps {
    state: ProcessState;
}

const steps: { id: ProcessState; name: string }[] = [
    { id: 'UPLOADING', name: 'Upload' },
    { id: 'SPLITTING', name: 'Split PDF' },
    { id: 'EXTRACTING', name: 'Extract & OCR' },
    { id: 'GENERATING', name: 'Generate Files' },
    { id: 'DONE', name: 'Done' },
];

export const ProgressBar: React.FC<ProgressBarProps> = ({ state }) => {
    const currentStateIndex = state === 'IDLE' ? -1 : steps.findIndex(step => step.id === state);

    return (
        <div className="w-full mb-8">
            <ol className="flex items-center w-full">
                {steps.map((step, index) => {
                    const isCompleted = index < currentStateIndex;
                    const isCurrent = index === currentStateIndex;

                    return (
                        <li key={step.id} className={`flex w-full items-center ${index < steps.length - 1 ? "after:content-[''] after:w-full after:h-1 after:border-b after:border-4 after:inline-block" : ""} ${isCompleted || isCurrent ? 'after:border-sky-500' : 'after:border-slate-200 dark:after:border-slate-700'}`}>
                           <div className="flex flex-col items-center">
                            <span className={`flex items-center justify-center w-10 h-10 rounded-full text-lg shrink-0 transition-colors duration-300
                                ${isCompleted ? 'bg-sky-500 text-white' : ''}
                                ${isCurrent ? 'bg-sky-500 text-white' : ''}
                                ${!isCompleted && !isCurrent ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300' : ''}
                            `}>
                                {isCompleted ? <CheckIcon className="w-6 h-6"/> : isCurrent ? <SpinnerIcon className="w-6 h-6 animate-spin"/> : index + 1}
                            </span>
                            <span className={`mt-2 text-xs sm:text-sm text-center font-medium ${isCompleted || isCurrent ? 'text-sky-600 dark:text-sky-400' : 'text-slate-500 dark:text-slate-400'}`}>{step.name}</span>
                           </div>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
};
