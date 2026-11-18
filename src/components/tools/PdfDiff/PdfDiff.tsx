import { useState, useEffect, useRef } from 'react';
import {
  GitCompare,
  FileText,
  RotateCcw,
  Download,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Sliders,
  Columns,
} from 'lucide-react';
import { saveAs } from 'file-saver';
import { Dropzone } from '../../ui/Dropzone';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';
import { getPageCount, renderPdfPageToCanvas } from '../../../utils/pdfUtils';

export function PdfDiff() {
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);

  const [pageCountA, setPageCountA] = useState<number>(1);
  const [pageCountB, setPageCountB] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [urlA, setUrlA] = useState<string | null>(null);
  const [urlB, setUrlB] = useState<string | null>(null);
  const [diffUrl, setDiffUrl] = useState<string | null>(null);

  // View mode
  const [viewMode, setViewMode] = useState<'side-by-side' | 'diff' | 'swipe'>('side-by-side');
  const [swipePos, setSwipePos] = useState<number>(50); // percentage

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const diffCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Render both pages and generate difference canvas
  useEffect(() => {
    if (!fileA || !fileB) return;

    let isMounted = true;
    queueMicrotask(() => {
      if (isMounted) {
        setIsLoading(true);
        setError(null);
      }
    });

    const loadPages = async () => {
      try {
        const [canvasA, canvasB] = await Promise.all([
          currentPage <= pageCountA ? renderPdfPageToCanvas(fileA, currentPage, 1.2) : null,
          currentPage <= pageCountB ? renderPdfPageToCanvas(fileB, currentPage, 1.2) : null,
        ]);

        if (!isMounted) return;

        const dataUrlA = canvasA ? canvasA.toDataURL('image/png') : null;
        const dataUrlB = canvasB ? canvasB.toDataURL('image/png') : null;
        setUrlA(dataUrlA);
        setUrlB(dataUrlB);

        // Generate visual diff
        if (canvasA && canvasB) {
          const diffW = Math.max(canvasA.width, canvasB.width);
          const diffH = Math.max(canvasA.height, canvasB.height);

          const diffCanvas = document.createElement('canvas');
          diffCanvas.width = diffW;
          diffCanvas.height = diffH;
          const ctx = diffCanvas.getContext('2d');

          if (ctx) {
            // Draw A
            ctx.drawImage(canvasA, 0, 0);

            // Get image data
            const imgDataA = ctx.getImageData(0, 0, diffW, diffH);
            const ctxB = canvasB.getContext('2d');
            const imgDataB = ctxB ? ctxB.getImageData(0, 0, diffW, diffH) : null;

            if (imgDataB) {
              const dataA = imgDataA.data;
              const dataB = imgDataB.data;
              const output = ctx.createImageData(diffW, diffH);
              const outData = output.data;

              for (let i = 0; i < dataA.length; i += 4) {
                const rA = dataA[i];
                const gA = dataA[i + 1];
                const bA = dataA[i + 2];
                const aA = dataA[i + 3];

                const rB = dataB[i];
                const gB = dataB[i + 1];
                const bB = dataB[i + 2];
                const aB = dataB[i + 3];

                const diff = Math.abs(rA - rB) + Math.abs(gA - gB) + Math.abs(bA - bB) + Math.abs(aA - aB);

                if (diff > 30) {
                  // Significant difference: highlight in vivid magenta/red
                  outData[i] = 239;     // R
                  outData[i + 1] = 68;  // G
                  outData[i + 2] = 68;  // B
                  outData[i + 3] = 255; // Alpha
                } else {
                  // Identical: subtle muted gray
                  const gray = (rA * 0.299 + gA * 0.587 + bA * 0.114) * 0.6;
                  outData[i] = gray + 80;
                  outData[i + 1] = gray + 80;
                  outData[i + 2] = gray + 80;
                  outData[i + 3] = 255;
                }
              }

              ctx.putImageData(output, 0, 0);
              diffCanvasRef.current = diffCanvas;
              setDiffUrl(diffCanvas.toDataURL('image/png'));
            }
          }
        } else {
          setDiffUrl(null);
        }
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Failed to compare pages');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadPages();

    return () => {
      isMounted = false;
    };
  }, [fileA, fileB, currentPage, pageCountA, pageCountB]);

  const handleFileAAdded = async (files: File[]) => {
    if (files.length === 0) return;
    const f = files[0];
    setFileA(f);
    try {
      const c = await getPageCount(f);
      setPageCountA(c);
      setCurrentPage(1);
    } catch {
      setError('Could not read Draft A');
    }
  };

  const handleFileBAdded = async (files: File[]) => {
    if (files.length === 0) return;
    const f = files[0];
    setFileB(f);
    try {
      const c = await getPageCount(f);
      setPageCountB(c);
      setCurrentPage(1);
    } catch {
      setError('Could not read Draft B');
    }
  };

  const maxPages = Math.max(pageCountA, pageCountB);

  const handleExportDiff = () => {
    if (!diffCanvasRef.current) return;
    diffCanvasRef.current.toBlob((blob) => {
      if (blob) {
        saveAs(blob, `diff_page_${currentPage}.png`);
      }
    }, 'image/png');
  };

  const handleReset = () => {
    setFileA(null);
    setFileB(null);
    setUrlA(null);
    setUrlB(null);
    setDiffUrl(null);
    setCurrentPage(1);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold flex items-center gap-2">
          <GitCompare className="w-6 h-6 text-teal-500" />
          PDF Visual Difference (Diff)
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Compare two versions of a document side-by-side or highlight revisions, deletions, and additions in high-contrast overlay.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Dual File Pickers */}
      {(!fileA || !fileB) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <span className="font-semibold text-xs uppercase tracking-wider text-teal-600 dark:text-teal-400">
              Draft A (Original Document)
            </span>
            {!fileA ? (
              <Dropzone
                accept={{ 'application/pdf': ['.pdf'] }}
                onFilesAdded={handleFileAAdded}
                icon={<FileText className="w-10 h-10 text-teal-500" />}
                title="Select Draft A"
                subtitle="Original PDF baseline"
              />
            ) : (
              <div className="p-4 rounded-xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-teal-900 dark:text-teal-200">{fileA.name}</p>
                  <p className="text-xs text-teal-600 dark:text-teal-400">{pageCountA} pages</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFileA(null)}
                  className="text-xs text-red-500 hover:underline"
                >
                  Change
                </button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <span className="font-semibold text-xs uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Draft B (Revised Document)
            </span>
            {!fileB ? (
              <Dropzone
                accept={{ 'application/pdf': ['.pdf'] }}
                onFilesAdded={handleFileBAdded}
                icon={<FileText className="w-10 h-10 text-blue-500" />}
                title="Select Draft B"
                subtitle="New or modified revision"
              />
            ) : (
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-blue-900 dark:text-blue-200">{fileB.name}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">{pageCountB} pages</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFileB(null)}
                  className="text-xs text-red-500 hover:underline"
                >
                  Change
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Diff Workspace */}
      {fileA && fileB && (
        <div className="space-y-5">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            {/* View Mode Switcher */}
            <div className="flex rounded-lg bg-slate-100 dark:bg-gray-800 p-1 text-xs font-medium">
              <button
                type="button"
                onClick={() => setViewMode('side-by-side')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                  viewMode === 'side-by-side'
                    ? 'bg-white dark:bg-gray-700 text-teal-600 dark:text-teal-400 shadow-xs'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                Side-by-Side
              </button>
              <button
                type="button"
                onClick={() => setViewMode('diff')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                  viewMode === 'diff'
                    ? 'bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 shadow-xs'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Difference Map
              </button>
              <button
                type="button"
                onClick={() => setViewMode('swipe')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                  viewMode === 'swipe'
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                Split Swipe
              </button>
            </div>

            {/* Page Navigation */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1 || isLoading}
                className="p-1.5 rounded-md bg-slate-100 dark:bg-gray-800 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Page {currentPage} of {maxPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(maxPages, p + 1))}
                disabled={currentPage >= maxPages || isLoading}
                className="p-1.5 rounded-md bg-slate-100 dark:bg-gray-800 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {diffUrl && (
                <Button variant="secondary" size="sm" onClick={handleExportDiff}>
                  <Download className="w-3.5 h-3.5 mr-1" />
                  Save Diff Image
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Reset
              </Button>
            </div>
          </div>

          {/* View Container */}
          <div className="relative rounded-2xl border border-gray-200 dark:border-gray-800 bg-slate-100 dark:bg-gray-950 p-4 min-h-[460px] flex items-center justify-center overflow-hidden">
            {isLoading && (
              <div className="absolute inset-0 bg-white/70 dark:bg-gray-950/70 backdrop-blur-xs flex items-center justify-center z-20">
                <Spinner className="w-8 h-8 text-teal-500" />
              </div>
            )}

            {/* 1. Side by side view */}
            {viewMode === 'side-by-side' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <div className="flex flex-col items-center space-y-2">
                  <span className="text-xs font-semibold text-teal-600 dark:text-teal-400">
                    Draft A: {fileA.name}
                  </span>
                  {urlA ? (
                    <img
                      src={urlA}
                      alt="Draft A"
                      className="rounded-lg shadow-md max-h-[560px] w-auto border border-gray-300 dark:border-gray-700 object-contain"
                    />
                  ) : (
                    <div className="h-64 flex items-center justify-center text-xs text-gray-400">
                      Page not in Draft A
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-center space-y-2">
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                    Draft B: {fileB.name}
                  </span>
                  {urlB ? (
                    <img
                      src={urlB}
                      alt="Draft B"
                      className="rounded-lg shadow-md max-h-[560px] w-auto border border-gray-300 dark:border-gray-700 object-contain"
                    />
                  ) : (
                    <div className="h-64 flex items-center justify-center text-xs text-gray-400">
                      Page not in Draft B
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. Difference Map Overlay */}
            {viewMode === 'diff' && (
              <div className="flex flex-col items-center space-y-3 w-full">
                <div className="flex items-center gap-4 text-xs font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500" />
                    <span>Changed / Added Pixels</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-gray-400" />
                    <span>Unchanged Content</span>
                  </div>
                </div>

                {diffUrl ? (
                  <img
                    src={diffUrl}
                    alt="Difference Map"
                    className="rounded-lg shadow-md max-h-[600px] w-auto border border-gray-300 dark:border-gray-700 object-contain"
                  />
                ) : (
                  <div className="h-64 flex items-center justify-center text-xs text-gray-400">
                    Cannot calculate diff for missing pages
                  </div>
                )}
              </div>
            )}

            {/* 3. Swipe / Split slider */}
            {viewMode === 'swipe' && urlA && urlB && (
              <div className="flex flex-col items-center space-y-4 w-full">
                <div className="w-full max-w-md flex items-center gap-3">
                  <span className="text-xs font-semibold text-teal-600">Draft A</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={swipePos}
                    onChange={(e) => setSwipePos(Number(e.target.value))}
                    className="flex-1 accent-teal-500"
                  />
                  <span className="text-xs font-semibold text-blue-600">Draft B</span>
                </div>

                <div className="relative rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700 shadow-md max-h-[580px]">
                  {/* Base: Draft A */}
                  <img src={urlA} alt="Draft A" className="w-full h-auto max-h-[580px] object-contain block" />

                  {/* Clipped Over: Draft B */}
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ clipPath: `inset(0 0 0 ${swipePos}%)` }}
                  >
                    <img src={urlB} alt="Draft B" className="w-full h-auto max-h-[580px] object-contain block" />
                  </div>

                  {/* Divider line */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-teal-500 shadow-lg pointer-events-none"
                    style={{ left: `${swipePos}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
