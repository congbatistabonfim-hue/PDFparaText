import React, { useState, useCallback, DragEvent } from 'react';
import { UploadIcon } from './icons/UploadIcon';
import { FileIcon } from './icons/FileIcon';

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  onProcess: () => void;
  initialFile: File | null;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, onProcess, initialFile }) => {
  const [file, setFile] = useState<File | null>(initialFile);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile) {
      setFile(selectedFile);
      onFileSelect(selectedFile);
    }
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     if (e.target.files && e.target.files.length > 0) {
       handleFileChange(e.target.files[0]);
     }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`relative w-full p-8 border-2 border-dashed rounded-xl transition-colors duration-300 ${isDragging ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20' : 'border-slate-300 dark:border-slate-600 hover:border-sky-400'}`}
      >
        <input
          type="file"
          accept="application/pdf,image/png,image/jpeg,image/webp"
          onChange={handleInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center justify-center text-center">
          <UploadIcon className="w-12 h-12 text-slate-400 dark:text-slate-500 mb-4" />
          <p className="font-semibold text-slate-700 dark:text-slate-300">
            Drag & drop your file here
          </p>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            or <span className="text-sky-500 font-medium">click to browse</span>
          </p>
          <p className="text-xs text-slate-400 mt-2">PDF, PNG, JPG, WEBP accepted (Max 200MB)</p>
        </div>
      </div>

      {file && (
        <div className="w-full p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg flex items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3 overflow-hidden">
            <FileIcon className="w-6 h-6 text-sky-500 flex-shrink-0" />
            <span className="truncate font-medium text-slate-800 dark:text-slate-200" title={file.name}>
                {file.name}
            </span>
          </div>
          <button
            onClick={() => { setFile(null); onFileSelect(null); }}
            className="text-slate-500 hover:text-red-500 transition-colors flex-shrink-0 font-bold text-lg"
            aria-label="Remove file"
          >
            &times;
          </button>
        </div>
      )}

      <button
        onClick={onProcess}
        disabled={!file}
        className="w-full sm:w-auto px-8 py-3 bg-sky-500 text-white font-semibold rounded-lg shadow-md hover:bg-sky-600 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-all transform hover:scale-105 disabled:scale-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 dark:focus:ring-offset-slate-900"
      >
        Process File
      </button>
    </div>
  );
};