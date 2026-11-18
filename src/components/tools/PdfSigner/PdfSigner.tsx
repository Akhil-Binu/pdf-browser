import { useState, useRef, useEffect, useCallback } from 'react';
import {
  FileText,
  PenTool,
  RotateCcw,
  Download,
  AlertCircle,
  Calendar,
  CheckCircle,
  Type,
  ChevronLeft,
  ChevronRight,
  Move,
} from 'lucide-react';
import { saveAs } from 'file-saver';
import { Dropzone } from '../../ui/Dropzone';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';
import {
  getPageCount,
  renderPdfPageToCanvas,
  signPdfDocument,
} from '../../../utils/pdfUtils';

const TODAY_ISO_DATE = new Date().toISOString().split('T')[0];

export function PdfSigner() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageCanvasUrl, setPageCanvasUrl] = useState<string | null>(null);

  // Signature mode: draw or type
  const [signMode, setSignMode] = useState<'draw' | 'type'>('draw');
  const [typedName, setTypedName] = useState<string>('');
  const [strokeColor, setStrokeColor] = useState<string>('#000000');

  // Text stamps
  const [includeDate, setIncludeDate] = useState<boolean>(true);
  const [signerName, setSignerName] = useState<string>('');

  // Signature placement coordinates relative to page (0 to 1 ratio)
  const [posRatio, setPosRatio] = useState<{ x: number; y: number }>({
    x: 0.6,
    y: 0.8,
  });

  const [isLoadingPage, setIsLoadingPage] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isDone, setIsDone] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Signature drawing canvas ref
  const drawCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Render current PDF page whenever file or currentPage changes
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
        const url = canvas.toDataURL('image/png');
        setPageCanvasUrl(url);
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

    try {
      const count = await getPageCount(selected);
      setPageCount(count);
      setCurrentPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read PDF metadata');
    }
  }, []);

  // Clear drawing canvas
  const handleClearSignature = () => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Drawing event handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    isDrawingRef.current = true;
    lastPointRef.current = {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !lastPointRef.current) return;
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const currentX = (clientX - rect.left) * (canvas.width / rect.width);
    const currentY = (clientY - rect.top) * (canvas.height / rect.height);

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();

    lastPointRef.current = { x: currentX, y: currentY };
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
  };

  // Click on page preview to place signature
  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xRatio = Math.max(0.05, Math.min(0.8, (e.clientX - rect.left) / rect.width));
    const yRatio = Math.max(0.05, Math.min(0.85, (e.clientY - rect.top) / rect.height));
    setPosRatio({ x: xRatio, y: yRatio });
  };

  // Convert typed text or drawn canvas to PNG Data URL
  const getSignatureDataUrl = (): string => {
    if (signMode === 'draw') {
      const canvas = drawCanvasRef.current;
      if (!canvas) throw new Error('Signature pad not found');
      return canvas.toDataURL('image/png');
    } else {
      if (!typedName.trim()) throw new Error('Please enter your name to sign');
      const offCanvas = document.createElement('canvas');
      offCanvas.width = 400;
      offCanvas.height = 120;
      const ctx = offCanvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context failure');

      ctx.font = 'italic bold 36px "Brush Script MT", "Caveat", "Segoe Script", cursive, Georgia, serif';
      ctx.fillStyle = strokeColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(typedName, 200, 60);

      // Add a subtle flourish underline
      ctx.beginPath();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
      ctx.moveTo(60, 95);
      ctx.quadraticCurveTo(200, 85, 340, 95);
      ctx.stroke();

      return offCanvas.toDataURL('image/png');
    }
  };

  const handleApplySignature = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);

    try {
      const sigDataUrl = getSignatureDataUrl();

      const extraTexts: Array<{ text: string; xRatio: number; yRatio: number; size: number }> = [];

      // Date Stamp
      if (includeDate) {
        const todayStr = new Date().toISOString().split('T')[0];
        extraTexts.push({
          text: `Date: ${todayStr}`,
          xRatio: posRatio.x,
          yRatio: posRatio.y + 0.12,
          size: 10,
        });
      }

      // Printed Signer Name
      if (signerName.trim()) {
        extraTexts.push({
          text: `Signed by: ${signerName.trim()}`,
          xRatio: posRatio.x,
          yRatio: posRatio.y + (includeDate ? 0.15 : 0.12),
          size: 10,
        });
      }

      const signedBytes = await signPdfDocument(
        file,
        sigDataUrl,
        currentPage,
        {
          xRatio: posRatio.x,
          yRatio: posRatio.y,
          widthRatio: 0.25,
          heightRatio: 0.08,
        },
        extraTexts
      );

      const blob = new Blob([signedBytes as unknown as BlobPart], {
        type: 'application/pdf',
      });
      const originalName = file.name.replace(/\.pdf$/i, '');
      saveAs(blob, `${originalName}_signed.pdf`);
      setIsDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign document');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPageCanvasUrl(null);
    setCurrentPage(1);
    setPageCount(1);
    setIsDone(false);
    setError(null);
    setTypedName('');
    setSignerName('');
    handleClearSignature();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold flex items-center gap-2">
          <PenTool className="w-6 h-6 text-indigo-500" />
          Sign PDF Document
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Draw or type your legal signature and stamp it securely onto any page. 100% private in-browser.
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
            <span className="font-semibold text-sm">Document successfully signed and downloaded!</span>
          </div>
          <Button variant="secondary" size="sm" onClick={handleReset}>
            Sign Another PDF
          </Button>
        </div>
      )}

      {!file ? (
        <Dropzone
          accept={{ 'application/pdf': ['.pdf'] }}
          onFilesAdded={handleFilesAdded}
          icon={<FileText className="w-12 h-12 text-indigo-500" />}
          title="Drop your PDF here to sign"
          subtitle="Supports contracts, NDAs, invoices, and documents"
        />
      ) : (
        <div className="space-y-6">
          {/* File details & reset */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-100 dark:bg-gray-800/60 border border-slate-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-500">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{file.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Total {pageCount} {pageCount === 1 ? 'page' : 'pages'} • {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Change Document
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Signature Creator Panel */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">Create Signature</span>
                  <div className="flex rounded-lg bg-slate-100 dark:bg-gray-800 p-0.5 text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => setSignMode('draw')}
                      className={`px-3 py-1 rounded-md transition-colors ${
                        signMode === 'draw'
                          ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      Draw
                    </button>
                    <button
                      type="button"
                      onClick={() => setSignMode('type')}
                      className={`px-3 py-1 rounded-md transition-colors ${
                        signMode === 'type'
                          ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      Type
                    </button>
                  </div>
                </div>

                {/* Color Chooser */}
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Ink Color:</span>
                  <div className="flex gap-2">
                    {[
                      { label: 'Black', val: '#000000' },
                      { label: 'Blue', val: '#1d4ed8' },
                      { label: 'Red', val: '#dc2626' },
                    ].map((c) => (
                      <button
                        key={c.val}
                        type="button"
                        onClick={() => setStrokeColor(c.val)}
                        className={`w-6 h-6 rounded-full border-2 transition-transform ${
                          strokeColor === c.val ? 'scale-110 border-indigo-500' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c.val }}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>

                {/* Draw mode canvas */}
                {signMode === 'draw' ? (
                  <div className="space-y-2">
                    <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl overflow-hidden bg-slate-50 dark:bg-gray-950">
                      <canvas
                        ref={drawCanvasRef}
                        width={360}
                        height={120}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="w-full h-28 cursor-crosshair touch-none"
                      />
                      <div className="absolute bottom-1 right-2 pointer-events-none text-[10px] text-gray-400">
                        Sign above
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleClearSignature}
                        className="text-xs text-red-500 hover:underline flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" /> Clear Signature Pad
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Type className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Type full name..."
                        value={typedName}
                        onChange={(e) => setTypedName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-slate-50 dark:bg-gray-950 focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    {typedName && (
                      <div className="p-3 bg-slate-50 dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 text-center">
                        <span
                          className="text-2xl italic font-serif"
                          style={{ color: strokeColor }}
                        >
                          {typedName}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Additional Stamps */}
                <div className="border-t border-gray-100 dark:border-gray-800 pt-3 space-y-2.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Additional Fields
                  </span>

                  <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeDate}
                      onChange={(e) => setIncludeDate(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Include Today's Date Stamp ({TODAY_ISO_DATE})</span>
                  </label>

                  <div className="space-y-1">
                    <label className="text-xs text-gray-600 dark:text-gray-400">Printed Signer Name (Optional):</label>
                    <input
                      type="text"
                      placeholder="e.g. John Doe, CEO"
                      value={signerName}
                      onChange={(e) => setSignerName(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-slate-50 dark:bg-gray-950"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    onClick={handleApplySignature}
                    disabled={isProcessing || isLoadingPage}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
                  >
                    {isProcessing ? (
                      <>
                        <Spinner className="w-4 h-4 mr-2" />
                        Embedding Signature...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Apply Signature & Download
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Document Interactive Preview & Placement */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  Target Page Preview (Click to place signature)
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

              {/* Rendered page container */}
              <div
                onClick={handlePageClick}
                className="relative cursor-crosshair rounded-xl border border-gray-300 dark:border-gray-700 overflow-hidden shadow-inner bg-slate-200 dark:bg-gray-950 flex items-center justify-center min-h-[260px] sm:min-h-[420px]"
              >
                {isLoadingPage && (
                  <div className="absolute inset-0 bg-white/70 dark:bg-gray-950/70 backdrop-blur-xs flex items-center justify-center z-20">
                    <Spinner className="w-8 h-8 text-indigo-500" />
                  </div>
                )}

                {pageCanvasUrl && (
                  <img
                    src={pageCanvasUrl}
                    alt={`Page ${currentPage}`}
                    className="w-full h-auto object-contain select-none max-h-[600px]"
                  />
                )}

                {/* Visual signature marker box */}
                <div
                  className="absolute pointer-events-none transition-all duration-150 border-2 border-indigo-500 bg-indigo-500/20 rounded-md p-1 flex items-center justify-center text-[10px] font-bold text-indigo-700 dark:text-indigo-300 shadow-md"
                  style={{
                    left: `${posRatio.x * 100}%`,
                    top: `${posRatio.y * 100}%`,
                    width: '26%',
                    height: '9%',
                  }}
                >
                  <div className="flex items-center gap-1">
                    <Move className="w-3 h-3" />
                    <span>Signature Here</span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-gray-500 dark:text-gray-400 text-center">
                Click anywhere on the document sheet above to position your signature box.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
