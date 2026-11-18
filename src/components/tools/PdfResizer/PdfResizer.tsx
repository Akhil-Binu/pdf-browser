import { useState, useCallback } from 'react';
import {
  Maximize2,
  FileText,
  RotateCcw,
  Download,
  AlertCircle,
  CheckCircle,
  BookOpen,
  Sliders,
} from 'lucide-react';
import { saveAs } from 'file-saver';
import { Dropzone } from '../../ui/Dropzone';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';
import { getPageCount, resizePdfDocument } from '../../../utils/pdfUtils';

export function PdfResizer() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);

  // Settings
  const [targetSize, setTargetSize] = useState<'a4' | 'letter'>('a4');
  const [mode, setMode] = useState<'fit' | '2up'>('fit');
  const [marginPt, setMarginPt] = useState<number>(20);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isDone, setIsDone] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesAdded = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setFile(selected);
    setError(null);
    setIsDone(false);

    try {
      const count = await getPageCount(selected);
      setPageCount(count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read PDF metadata');
    }
  }, []);

  const handleResize = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);

    try {
      const resizedBytes = await resizePdfDocument(file, targetSize, mode, marginPt);
      const blob = new Blob([resizedBytes as unknown as BlobPart], {
        type: 'application/pdf',
      });
      const originalName = file.name.replace(/\.pdf$/i, '');
      const suffix = mode === '2up' ? '2up_booklet' : `${targetSize}_resized`;
      saveAs(blob, `${originalName}_${suffix}.pdf`);
      setIsDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resize PDF');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPageCount(0);
    setIsDone(false);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Maximize2 className="w-6 h-6 text-amber-500" />
          Resize & 2-Up Booklet PDF
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Standardize mixed page dimensions to uniform A4 or US Letter, add margins, or convert to 2-Up side-by-side spreads for printing.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isDone && (
        <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-xl border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <span className="font-semibold text-sm">Document successfully resized & downloaded!</span>
          </div>
          <Button variant="secondary" size="sm" onClick={handleReset}>
            Resize Another PDF
          </Button>
        </div>
      )}

      {!file ? (
        <Dropzone
          accept={{ 'application/pdf': ['.pdf'] }}
          onFilesAdded={handleFilesAdded}
          icon={<Maximize2 className="w-12 h-12 text-amber-500" />}
          title="Drop your PDF here to resize"
          subtitle="Supports single or multi-page documents"
        />
      ) : (
        <div className="space-y-6">
          {/* File summary */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-100 dark:bg-gray-800/60 border border-slate-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-500">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{file.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {pageCount} {pageCount === 1 ? 'page' : 'pages'} • {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Change Document
            </Button>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Layout Mode */}
            <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-4">
              <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 block">
                1. Page Format & Layout
              </span>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMode('fit')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    mode === 'fit'
                      ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 ring-1 ring-amber-500'
                      : 'border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800/50'
                  }`}
                >
                  <FileText className="w-6 h-6 text-amber-500 mb-2" />
                  <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">Standard 1-Up</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    1 page per sheet, scaled to uniform size with clean margins.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('2up')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    mode === '2up'
                      ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 ring-1 ring-amber-500'
                      : 'border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800/50'
                  }`}
                >
                  <BookOpen className="w-6 h-6 text-amber-500 mb-2" />
                  <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">2-Up Booklet Spread</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Places 2 consecutive pages side-by-side on landscape sheets.
                  </p>
                </button>
              </div>

              {/* Target Paper Size */}
              <div className="pt-2">
                <label className="text-xs text-gray-600 dark:text-gray-400 font-medium block mb-1.5">
                  Target Paper Size:
                </label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                    <input
                      type="radio"
                      name="targetSize"
                      value="a4"
                      checked={targetSize === 'a4'}
                      onChange={() => setTargetSize('a4')}
                      className="text-amber-500 focus:ring-amber-500"
                    />
                    <span>ISO A4 (210 × 297 mm)</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                    <input
                      type="radio"
                      name="targetSize"
                      value="letter"
                      checked={targetSize === 'letter'}
                      onChange={() => setTargetSize('letter')}
                      className="text-amber-500 focus:ring-amber-500"
                    />
                    <span>US Letter (8.5 × 11 in)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Margins & Action */}
            <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-500" />
                  2. Margins & Padding
                </span>

                <div>
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-2">
                    <span>Sheet Border Margin:</span>
                    <span className="font-bold text-gray-900 dark:text-gray-100">{marginPt} pt</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={60}
                    step={5}
                    value={marginPt}
                    onChange={(e) => setMarginPt(Number(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                    <span>0 pt (Flush)</span>
                    <span>20 pt (Standard)</span>
                    <span>60 pt (Wide)</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-gray-800/60 border border-slate-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100">Summary:</p>
                  <p>
                    Target Output: <span className="font-semibold">{targetSize.toUpperCase()}</span> ({mode === '2up' ? 'Landscape 2-Up' : 'Portrait 1-Up'})
                  </p>
                  <p>
                    Total Result Sheets:{' '}
                    <span className="font-semibold">
                      {mode === '2up' ? Math.ceil(pageCount / 2) : pageCount} sheets
                    </span>
                  </p>
                </div>
              </div>

              <Button
                onClick={handleResize}
                disabled={isProcessing}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-2.5"
              >
                {isProcessing ? (
                  <>
                    <Spinner className="w-4 h-4 mr-2" />
                    Resizing Document...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Resize & Download PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
