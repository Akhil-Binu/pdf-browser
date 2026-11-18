import { useState, useCallback, useEffect } from 'react';
import {
  Upload,
  RotateCw,
  RotateCcw,
  Trash2,
  Download,
  CheckCircle,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { saveAs } from 'file-saver';
import {
  getPageCount,
  renderPdfPageToCanvas,
  rotateAndReorganizePdf,
} from '../../../utils/pdfUtils';
import { Button } from '../../ui/Button';
import { Dropzone } from '../../ui/Dropzone';
import { Spinner } from '../../ui/Spinner';

interface PageItem {
  originalIndex: number; // 0-based
  pageNumber: number; // 1-based display
  rotation: number; // 0, 90, 180, 270
  thumbnailUrl: string;
}

export function RotatePdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cleanup thumbnails
  useEffect(() => {
    return () => {
      pages.forEach((p) => {
        if (p.thumbnailUrl) URL.revokeObjectURL(p.thumbnailUrl);
      });
    };
  }, [pages]);

  const handleFilesAdded = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setFile(selected);
    setIsLoading(true);
    setError(null);
    setIsDone(false);

    try {
      const count = await getPageCount(selected);
      const items: PageItem[] = [];

      for (let i = 1; i <= count; i++) {
        // Render low-res thumbnail
        const canvas = await renderPdfPageToCanvas(selected, i, 0.4);
        const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), 'image/jpeg', 0.8));
        const url = URL.createObjectURL(blob);
        items.push({
          originalIndex: i - 1,
          pageNumber: i,
          rotation: 0,
          thumbnailUrl: url,
        });
      }

      setPages(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load PDF pages');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const rotatePage = (index: number) => {
    setPages((prev) =>
      prev.map((p, idx) => (idx === index ? { ...p, rotation: (p.rotation + 90) % 360 } : p))
    );
  };

  const rotateAll = () => {
    setPages((prev) => prev.map((p) => ({ ...p, rotation: (p.rotation + 90) % 360 })));
  };

  const removePage = (index: number) => {
    setPages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSave = useCallback(async () => {
    if (!file || pages.length === 0) return;
    setIsProcessing(true);
    setError(null);

    try {
      const bytes = await rotateAndReorganizePdf(
        file,
        pages.map((p) => ({ originalIndex: p.originalIndex, rotation: p.rotation }))
      );
      const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
      const base = file.name.replace(/\.pdf$/i, '');
      saveAs(blob, `${base}_organized.pdf`);
      setIsDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save organized PDF');
    } finally {
      setIsProcessing(false);
    }
  }, [file, pages]);

  const handleClear = useCallback(() => {
    pages.forEach((p) => URL.revokeObjectURL(p.thumbnailUrl));
    setFile(null);
    setPages([]);
    setIsLoading(false);
    setIsProcessing(false);
    setIsDone(false);
    setError(null);
  }, [pages]);

  return (
    <div className="space-y-6">
      {!file && (
        <Dropzone
          onFilesAdded={handleFilesAdded}
          accept="application/pdf"
          multiple={false}
          label="Drop a PDF to Rotate & Reorganize Pages"
          sublabel="Rotate individual pages, discard unwanted sheets, and re-export"
          icon={<Upload className="w-8 h-8 text-blue-500" />}
        />
      )}

      {isLoading && (
        <div className="flex flex-col items-center gap-3 py-10">
          <Spinner size="lg" />
          <p className="text-sm text-gray-500">Generating page previews locally...</p>
        </div>
      )}

      {file && !isLoading && pages.length > 0 && (
        <div className="space-y-5">
          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {pages.length} {pages.length === 1 ? 'page' : 'pages'} remaining
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" icon={<RotateCw className="w-4 h-4" />} onClick={rotateAll}>
                Rotate All 90°
              </Button>
              <Button size="sm" variant="ghost" onClick={handleClear}>
                Reset
              </Button>
            </div>
          </div>

          {/* Grid of Pages */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {pages.map((p, idx) => (
              <div
                key={p.originalIndex}
                className="bg-white dark:bg-gray-800 rounded-2xl p-3 border border-gray-200 dark:border-gray-700 flex flex-col items-center shadow-sm hover:shadow-md transition-all"
              >
                <div className="w-full flex items-center justify-between text-xs text-gray-400 mb-2">
                  <span className="font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    Page {p.pageNumber}
                  </span>
                  {p.rotation > 0 && (
                    <span className="text-blue-600 font-bold">{p.rotation}°</span>
                  )}
                </div>

                <div className="relative w-full aspect-[3/4] bg-gray-100 dark:bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center p-2">
                  <img
                    src={p.thumbnailUrl}
                    alt={`Page ${p.pageNumber}`}
                    className="max-h-full max-w-full object-contain transition-transform duration-200"
                    style={{ transform: `rotate(${p.rotation}deg)` }}
                  />
                </div>

                <div className="flex items-center gap-2 mt-3 w-full">
                  <button
                    type="button"
                    onClick={() => rotatePage(idx)}
                    title="Rotate 90 degrees"
                    className="flex-1 py-1.5 px-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-xs font-medium flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-blue-600" /> Rotate
                  </button>
                  <button
                    type="button"
                    onClick={() => removePage(idx)}
                    title="Delete page"
                    className="p-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 rounded-lg text-xs cursor-pointer transition-colors text-gray-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={handleSave}
            loading={isProcessing}
            disabled={isProcessing || pages.length === 0}
            icon={<Download className="w-5 h-5" />}
            className="w-full"
          >
            {isProcessing ? 'Saving PDF...' : `Save & Download Organized PDF (${pages.length} Pages)`}
          </Button>
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
              Rotated PDF downloaded successfully!
            </p>
          </div>
          <Button variant="secondary" onClick={handleClear} icon={<RotateCcw className="w-4 h-4" />} className="w-full">
            Start Over
          </Button>
        </div>
      )}
    </div>
  );
}
