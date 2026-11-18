import { useState, useCallback } from 'react';
import {
  Upload,
  Scissors,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { getPageCount, extractPdfPages, splitPdfIntoFiles } from '../../../utils/pdfUtils';
import { formatFileSize } from '../../../utils/format';
import { Button } from '../../ui/Button';
import { Dropzone } from '../../ui/Dropzone';
import { Spinner } from '../../ui/Spinner';

export function SplitPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [mode, setMode] = useState<'range' | 'all'>('range');
  const [rangeInput, setRangeInput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesAdded = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setError(null);
    setIsDone(false);
    try {
      const count = await getPageCount(selected);
      setFile(selected);
      setPageCount(count);
      setRangeInput(`1-${Math.min(count, 3)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read PDF');
    }
  }, []);

  const parseRangeString = (input: string, max: number): number[] => {
    const indices = new Set<number>();
    const parts = input.split(',').map((p) => p.trim());

    for (const part of parts) {
      if (part.includes('-')) {
        const [startStr, endStr] = part.split('-').map((s) => s.trim());
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (!isNaN(start) && !isNaN(end)) {
          const from = Math.max(1, Math.min(start, end));
          const to = Math.min(max, Math.max(start, end));
          for (let i = from; i <= to; i++) {
            indices.add(i - 1); // 0-based
          }
        }
      } else {
        const num = parseInt(part, 10);
        if (!isNaN(num) && num >= 1 && num <= max) {
          indices.add(num - 1);
        }
      }
    }
    return Array.from(indices).sort((a, b) => a - b);
  };

  const handleSplit = useCallback(async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);

    try {
      if (mode === 'range') {
        const indices = parseRangeString(rangeInput, pageCount);
        if (indices.length === 0) {
          throw new Error(`Please specify valid pages between 1 and ${pageCount}`);
        }
        const bytes = await extractPdfPages(file, indices);
        const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
        const base = file.name.replace(/\.pdf$/i, '');
        saveAs(blob, `${base}_extracted.pdf`);
        setIsDone(true);
      } else {
        // Split every page
        const groups: number[][] = [];
        for (let i = 0; i < pageCount; i++) {
          groups.push([i]);
        }
        const splitFiles = await splitPdfIntoFiles(file, groups);
        const zip = new JSZip();
        splitFiles.forEach((sf) => {
          zip.file(sf.name, sf.bytes);
        });
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const base = file.name.replace(/\.pdf$/i, '');
        saveAs(zipBlob, `${base}_all_pages.zip`);
        setIsDone(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Split operation failed');
    } finally {
      setIsProcessing(false);
    }
  }, [file, mode, rangeInput, pageCount]);

  const handleClear = useCallback(() => {
    setFile(null);
    setPageCount(0);
    setRangeInput('');
    setIsProcessing(false);
    setIsDone(false);
    setError(null);
  }, []);

  return (
    <div className="space-y-6">
      {!file && (
        <Dropzone
          onFilesAdded={handleFilesAdded}
          accept="application/pdf"
          multiple={false}
          label="Drop a PDF to Split or Extract Pages"
          sublabel="Extract custom page ranges or separate every single page"
          icon={<Upload className="w-8 h-8 text-blue-500" />}
        />
      )}

      {file && (
        <div className="space-y-5">
          {/* File Card */}
          <div className="flex items-center gap-4 bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="w-12 h-12 bg-red-50 dark:bg-red-950/40 rounded-xl flex items-center justify-center text-red-500 flex-shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                {file.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {formatFileSize(file.size)} • {pageCount} {pageCount === 1 ? 'page' : 'total pages'}
              </p>
            </div>
            <Button size="sm" variant="ghost" onClick={handleClear}>
              Change
            </Button>
          </div>

          {/* Mode Selector */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Extraction Method
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode('range')}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  mode === 'range'
                    ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 shadow-sm'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="font-semibold text-sm">Extract Specific Pages</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Download selected pages as a single PDF
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMode('all')}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  mode === 'all'
                    ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 shadow-sm'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="font-semibold text-sm">Split into Single Pages</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Saves all {pageCount} pages as individual files in a ZIP
                </div>
              </button>
            </div>

            {mode === 'range' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Page Range (e.g. 1-3, 5, 8-{pageCount})
                </label>
                <input
                  type="text"
                  value={rangeInput}
                  onChange={(e) => setRangeInput(e.target.value)}
                  placeholder={`1-${Math.min(pageCount, 3)}`}
                  className="w-full max-w-sm px-3.5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            )}
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={handleSplit}
            loading={isProcessing}
            disabled={isProcessing}
            icon={<Scissors className="w-5 h-5" />}
            className="w-full"
          >
            {isProcessing
              ? 'Processing...'
              : mode === 'range'
                ? 'Extract Pages & Download'
                : `Split all ${pageCount} pages into ZIP`}
          </Button>
        </div>
      )}

      {isProcessing && (
        <div className="flex flex-col items-center gap-3 py-6">
          <Spinner size="lg" />
          <p className="text-sm text-gray-500">Splitting PDF in your browser...</p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {isDone && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            <p className="text-sm text-green-700 dark:text-green-400 font-medium">
              Pages extracted successfully! Your download has started.
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={handleClear}
            icon={<RotateCcw className="w-4 h-4" />}
            className="w-full"
          >
            Start Over
          </Button>
        </div>
      )}
    </div>
  );
}
