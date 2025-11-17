
export type ProcessState = 'IDLE' | 'UPLOADING' | 'SPLITTING' | 'EXTRACTING' | 'GENERATING' | 'DONE';

export interface LogEntry {
  timestamp: Date;
  message: string;
  type: 'info' | 'success' | 'warning';
}

export interface ExtractedPage {
  pageNumber: number;
  text: string;
}

export interface OutputFile {
  name: string;
  url: string;
}
