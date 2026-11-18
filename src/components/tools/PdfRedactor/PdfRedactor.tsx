import { useState, useRef, useEffect, useCallback } from 'react';
import {
  FileText,
  ShieldAlert,
  RotateCcw,
  Download,
  AlertCircle,
  CheckCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
  EyeOff,
} from 'lucide-react';
import { saveAs } from 'file-saver';
import { Dropzone } from '../../ui/Dropzone';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';
import {
  getPageCount,
  renderPdfPageToCanvas,
  redactPdfDocument,
} from '../../../utils/pdfUtils';

interface RedactionBox {
  id: string;
  pageNumber: number;
  xRatio: number;
  yRatio: number;
  widthRatio: number;
  heightRatio: number;
  color: 'black' | 'white';
}

export function PdfRedactor() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageCanvasUrl, setPageCanvasUrl] = useState<string | null>(null);

  // Redaction boxes across pages
  const [boxes, setBoxes] = useState<RedactionBox[]>([]);
  const [boxColor, setBoxColor] = useState<'black' | 'white'>('black');

  // Drag state for creating a new box
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [currentDrag, setCurrentDrag] = useState<{ x: number; y: number } | null>(null);

  const [isLoadingPage, setIsLoadingPage] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isDone, setIsDone] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!file) return;

    let isMounted = true;
    queueMicrotask(() => {
      if (isMounted) {
        setIsLoadingPage(true);
        setError(null);
      }
    });

    renderPdfPageToCanvas(file, currentPage, 1.2)
      .then((canvas) => {
        if (!isMounted) return;
        setPageCanvasUrl(canvas.toDataURL('image/png'));
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Failed to render PDF page');
      })
      .finally(() => {
        if (isMounted) setIsLoadingPage(false);
      });

    return () => {
      isMounted = false;
    };
  }, [file, currentPage]);

  const handleFilesAdded = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setFile(selected);
    setError(null);
    setIsDone(false);
    setBoxes([]);

    try {
      const count = await getPageCount(selected);
      setPageCount(count);
      setCurrentPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read PDF metadata');
    }
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    setIsDrawing(true);
    setDragStart({ x, y });
    setCurrentDrag({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !dragStart || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    setCurrentDrag({ x, y });
  };

  const handleMouseUp = () => {
    if (!isDrawing || !dragStart || !currentDrag) {
      setIsDrawing(false);
      return;
    }

    const xRatio = Math.min(dragStart.x, currentDrag.x);
    const yRatio = Math.min(dragStart.y, currentDrag.y);
    const widthRatio = Math.abs(currentDrag.x - dragStart.x);
    const heightRatio = Math.abs(currentDrag.y - dragStart.y);

    // Only record if bigger than minimum click threshold
    if (widthRatio > 0.02 && heightRatio > 0.01) {
      setBoxes((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(2, 9),
          pageNumber: currentPage,
          xRatio,
          yRatio,
          widthRatio,
          heightRatio,
          color: boxColor,
        },
      ]);
    }

    setIsDrawing(false);
    setDragStart(null);
    setCurrentDrag(null);
  };

  const removeBox = (id: string) => {
    setBoxes((prev) => prev.filter((b) => b.id !== id));
  };

  const handleApplyRedaction = async () => {
    if (!file || boxes.length === 0) return;
    setIsProcessing(true);
    setError(null);

    try {
      const redactedBytes = await redactPdfDocument(
        file,
        boxes.map((b) => ({
          pageNumber: b.pageNumber,
          xRatio: b.xRatio,
          yRatio: b.yRatio,
          widthRatio: b.widthRatio,
          heightRatio: b.heightRatio,
          color: b.color,
        }))
      );

      const blob = new Blob([redactedBytes as unknown as BlobPart], {
        type: 'application/pdf',
      });
      const originalName = file.name.replace(/\.pdf$/i, '');
      saveAs(blob, `${originalName}_redacted.pdf`);
      setIsDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to redact PDF');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPageCanvasUrl(null);
    setCurrentPage(1);
    setPageCount(1);
    setBoxes([]);
    setIsDone(false);
    setError(null);
  };

  const currentPageBoxes = boxes.filter((b) => b.pageNumber === currentPage);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold flex items-center gap-2">
          <EyeOff className="w-6 h-6 text-red-500" />
          Redact & Sanitize PDF
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Draw blackout or whiteout boxes over sensitive text, SSNs, credit cards, or private details. Permanently sanitized with zero trace.
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
            <span className="font-semibold text-sm">Document successfully sanitized & downloaded!</span>
          </div>
          <Button variant="secondary" size="sm" onClick={handleReset}>
            Redact Another PDF
          </Button>
        </div>
      )}

      {!file ? (
        <Dropzone
          accept={{ 'application/pdf': ['.pdf'] }}
          onFilesAdded={handleFilesAdded}
          icon={<ShieldAlert className="w-12 h-12 text-red-500" />}
          title="Drop your PDF here to redact"
          subtitle="Redact confidential contracts, medical records, invoices, IDs"
        />
      ) : (
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-100 dark:bg-gray-800/60 border border-slate-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-red-500/10 text-red-500">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{file.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Page {currentPage} of {pageCount} • {boxes.length} {boxes.length === 1 ? 'mark' : 'marks'} marked
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={handleReset}>
                <RotateCcw className="w-4 h-4 mr-1.5" />
                Change File
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Control Sidebar */}
            <div className="lg:col-span-4 space-y-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-4">
                <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 block">
                  Redaction Tools
                </span>

                {/* Box Color Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs text-gray-600 dark:text-gray-400 font-medium">Redaction Style:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setBoxColor('black')}
                      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                        boxColor === 'black'
                          ? 'bg-black text-white border-black ring-2 ring-red-500'
                          : 'bg-slate-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className="w-3 h-3 bg-black border border-white/40 rounded-xs" />
                      Blackout Box
                    </button>
                    <button
                      type="button"
                      onClick={() => setBoxColor('white')}
                      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                        boxColor === 'white'
                          ? 'bg-white text-gray-900 border-gray-300 ring-2 ring-red-500 shadow-sm'
                          : 'bg-slate-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className="w-3 h-3 bg-white border border-gray-400 rounded-xs" />
                      Whiteout Erase
                    </button>
                  </div>
                </div>

                {/* Redaction List */}
                <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                      Applied Marks ({boxes.length})
                    </span>
                    {boxes.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setBoxes([])}
                        className="text-[11px] text-red-500 hover:underline"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {boxes.length === 0 ? (
                    <p className="text-xs text-gray-400 italic py-2 text-center">
                      No redaction marks yet. Click & drag across text to create a blackout mark.
                    </p>
                  ) : (
                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                      {boxes.map((b, idx) => (
                        <div
                          key={b.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-gray-800/80 text-xs border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-3 h-3 rounded-xs border ${
                                b.color === 'black' ? 'bg-black border-black' : 'bg-white border-gray-400'
                              }`}
                            />
                            <span>
                              Mark #{idx + 1} (Page {b.pageNumber})
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeBox(b.id)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <Button
                    onClick={handleApplyRedaction}
                    disabled={isProcessing || boxes.length === 0}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-medium"
                  >
                    {isProcessing ? (
                      <>
                        <Spinner className="w-4 h-4 mr-2" />
                        Sanitizing PDF...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Sanitize & Download ({boxes.length})
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Document Interactive Viewer */}
            <div className="lg:col-span-8 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  Draw Redaction Box (Click & Drag)
                </span>

                {/* Page Navigation */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1 || isLoadingPage}
                    className="p-1.5 rounded-md bg-slate-100 dark:bg-gray-800 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    Page {currentPage} of {pageCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(pageCount, p + 1))}
                    disabled={currentPage >= pageCount || isLoadingPage}
                    className="p-1.5 rounded-md bg-slate-100 dark:bg-gray-800 disabled:opacity-40"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Rendered Page Area */}
              <div
                ref={containerRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                className="relative select-none cursor-crosshair rounded-xl border border-gray-300 dark:border-gray-700 overflow-hidden shadow-inner bg-slate-200 dark:bg-gray-950 flex items-center justify-center min-h-[440px]"
              >
                {isLoadingPage && (
                  <div className="absolute inset-0 bg-white/70 dark:bg-gray-950/70 backdrop-blur-xs flex items-center justify-center z-20">
                    <Spinner className="w-8 h-8 text-red-500" />
                  </div>
                )}

                {pageCanvasUrl && (
                  <img
                    src={pageCanvasUrl}
                    alt={`Page ${currentPage}`}
                    className="w-full h-auto object-contain select-none max-h-[640px] pointer-events-none"
                  />
                )}

                {/* Drawn Redaction Boxes on Current Page */}
                {currentPageBoxes.map((b) => (
                  <div
                    key={b.id}
                    className="absolute border border-red-500/80 shadow-xs"
                    style={{
                      left: `${b.xRatio * 100}%`,
                      top: `${b.yRatio * 100}%`,
                      width: `${b.widthRatio * 100}%`,
                      height: `${b.heightRatio * 100}%`,
                      backgroundColor: b.color === 'black' ? '#000000' : '#ffffff',
                    }}
                  />
                ))}

                {/* Live Preview Box During Drag */}
                {isDrawing && dragStart && currentDrag && (
                  <div
                    className="absolute border-2 border-dashed border-red-500 bg-red-500/30 pointer-events-none"
                    style={{
                      left: `${Math.min(dragStart.x, currentDrag.x) * 100}%`,
                      top: `${Math.min(dragStart.y, currentDrag.y) * 100}%`,
                      width: `${Math.abs(currentDrag.x - dragStart.x) * 100}%`,
                      height: `${Math.abs(currentDrag.y - dragStart.y) * 100}%`,
                    }}
                  />
                )}
              </div>

              <p className="text-[11px] text-gray-500 dark:text-gray-400 text-center">
                Click and drag over sensitive sections (names, SSN, bank numbers) to place permanent opaque redaction blocks.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
