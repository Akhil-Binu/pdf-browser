import React, { useState, useRef, useCallback } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface DropzoneProps {
  onFilesAdded: (files: File[]) => void;
  accept: string;
  multiple: boolean;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  onError?: (message: string) => void;
}

export function Dropzone({
  onFilesAdded,
  accept,
  multiple,
  label,
  sublabel,
  icon,
  onError,
}: DropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const acceptedTypes = accept.split(',').map((t) => t.trim().toLowerCase());

  const isFileTypeAccepted = useCallback(
    (file: File): boolean => {
      const fileType = file.type.toLowerCase();
      const fileName = file.name.toLowerCase();

      return acceptedTypes.some((type) => {
        if (type.startsWith('.')) {
          return fileName.endsWith(type);
        }
        if (type.endsWith('/*')) {
          const prefix = type.replace('/*', '/');
          return fileType.startsWith(prefix);
        }
        return fileType === type;
      });
    },
    [acceptedTypes]
  );

  const processFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;

      const validFiles: File[] = [];
      const rejectedNames: string[] = [];

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        if (isFileTypeAccepted(file)) {
          validFiles.push(file);
        } else {
          rejectedNames.push(file.name);
        }
      }

      if (rejectedNames.length > 0) {
        const msg = `Unsupported file${rejectedNames.length > 1 ? 's' : ''} skipped: ${rejectedNames.slice(0, 3).join(', ')}${rejectedNames.length > 3 ? ` and ${rejectedNames.length - 3} more` : ''}. Allowed types: ${accept}`;
        setErrorMessage(msg);
        if (onError) onError(msg);
      } else {
        setErrorMessage(null);
      }

      if (validFiles.length > 0) {
        onFilesAdded(validFiles);
      }
    },
    [isFileTypeAccepted, accept, onFilesAdded, onError]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      processFiles(e.dataTransfer.files);
    },
    [processFiles]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      processFiles(e.target.files);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    },
    [processFiles]
  );

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  return (
    <div className="space-y-3">
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
        className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-200 cursor-pointer select-none outline-none focus:ring-2 focus:ring-blue-500/40 ${
          isDragOver
            ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/30 scale-[1.01] shadow-lg shadow-blue-500/10'
            : 'border-gray-300 dark:border-gray-700 bg-white/60 dark:bg-gray-800/40 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-gray-800/70'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-3">
          <div
            className={`p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 transition-transform duration-200 ${
              isDragOver ? 'scale-110 shadow-md' : ''
            }`}
          >
            {icon}
          </div>
          <div>
            <p className="text-base font-semibold text-gray-800 dark:text-gray-100">
              {label}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {sublabel}
            </p>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-start justify-between gap-3 p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-amber-800 dark:text-amber-300 text-xs animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setErrorMessage(null);
            }}
            className="p-0.5 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded text-amber-600 dark:text-amber-400"
            aria-label="Dismiss error"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
