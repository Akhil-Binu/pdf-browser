import { useState, useCallback, useEffect } from 'react';
import {
  Upload,
  FileImage,
  Download,
  RotateCcw,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { getPageCount, convertPdfToImages } from '../../../utils/pdfUtils';
import { formatFileSize } from '../../../utils/format';
import { Button } from '../../ui/Button';
import { Dropzone } from '../../ui/Dropzone';
import { ProgressBar } from '../../ui/ProgressBar';

interface RenderedImage {
  pageNumber: number;
  blob: Blob;
  preview: string;
  name: string;
}

export function PdfToImages() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [format, setFormat] = useState<'image/png' | 'image/jpeg'>('image/png');
  const quality = 0.92;
  const [scale, setScale] = useState<number>(2.0);
  const [progress, setProgress] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<RenderedImage[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      results.forEach((r) => URL.revokeObjectURL(r.preview));
    };
  }, [results]);

  const handleFilesAdded = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setFile(selected);
    setError(null);
    setResults([]);
    try {
      const count = await getPageCount(selected);
      setPageCount(count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read PDF');
    }
  }, []);

  const handleConvert = useCallback(async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const imgs = await convertPdfToImages(file, format, quality, scale, (curr, total) => {
        setProgress(Math.round((curr / total) * 100));
      });
      setResults(imgs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to convert PDF pages');
    } finally {
      setIsProcessing(false);
    }
  }, [file, format, quality, scale]);

  const downloadSingle = (img: RenderedImage) => {
    saveAs(img.blob, img.name);
  };

  const downloadAll = async () => {
    const zip = new JSZip();
    results.forEach((img) => {
      zip.file(img.name, img.blob);
    });
    const content = await zip.generateAsync({ type: 'blob' });
    const base = file?.name.replace(/\.pdf$/i, '') || 'pdf_pages';
    saveAs(content, `${base}_images.zip`);
  };

  const handleClear = useCallback(() => {
    results.forEach((r) => URL.revokeObjectURL(r.preview));
    setFile(null);
    setPageCount(0);
    setResults([]);
    setProgress(0);
    setIsProcessing(false);
    setError(null);
  }, [results]);

  return (
    <div className="space-y-6">
      {!file && (
        <Dropzone
          onFilesAdded={handleFilesAdded}
          accept="application/pdf"
          multiple={false}
          label="Drop a PDF to Convert into Images"
          sublabel="Extract each page as high-res PNG or JPEG directly in your browser"
          icon={<Upload className="w-8 h-8 text-blue-500" />}
        />
      )}

      {file && results.length === 0 && (
        <div className="space-y-5">
          {/* File Card */}
          <div className="flex items-center gap-4 bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/40 rounded-xl flex items-center justify-center text-blue-500 flex-shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                {file.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {formatFileSize(file.size)} • {pageCount} pages to convert
              </p>
            </div>
            <Button size="sm" variant="ghost" onClick={handleClear}>
              Change
            </Button>
          </div>

          {/* Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Export Configuration
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Image Format
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormat('image/png')}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                      format === 'image/png'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    PNG (Lossless)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormat('image/jpeg')}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                      format === 'image/jpeg'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    JPEG (Smaller)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Resolution / DPI
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setScale(1.5)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                      scale === 1.5
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    150 DPI
                  </button>
                  <button
                    type="button"
                    onClick={() => setScale(2.0)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                      scale === 2.0
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    200 DPI
                  </button>
                  <button
                    type="button"
                    onClick={() => setScale(3.0)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                      scale === 3.0
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    300 DPI
                  </button>
                </div>
              </div>
            </div>
          </div>

          {isProcessing && (
            <div className="space-y-2 py-2">
              <ProgressBar progress={progress} label="Converting pages in browser..." />
            </div>
          )}

          <Button
            variant="primary"
            size="lg"
            onClick={handleConvert}
            loading={isProcessing}
            disabled={isProcessing}
            icon={<FileImage className="w-5 h-5" />}
            className="w-full"
          >
            {isProcessing ? 'Converting Pages...' : `Convert ${pageCount} Pages to Images`}
          </Button>
        </div>
      )}

      {/* Rendered Results Gallery */}
      {results.length > 0 && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Converted {results.length} pages
            </span>
            <div className="flex gap-2">
              {results.length > 1 && (
                <Button size="sm" variant="primary" icon={<Download className="w-4 h-4" />} onClick={downloadAll}>
                  Download All as ZIP
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={handleClear}>
                Clear
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {results.map((item) => (
              <div
                key={item.pageNumber}
                className="bg-white dark:bg-gray-800 rounded-2xl p-3 border border-gray-200 dark:border-gray-700 flex flex-col justify-between shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span className="font-semibold">Page {item.pageNumber}</span>
                    <span>{formatFileSize(item.blob.size)}</span>
                  </div>
                  <div className="w-full aspect-[3/4] bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center p-2 border border-gray-100 dark:border-gray-800">
                    <img src={item.preview} alt={`Page ${item.pageNumber}`} className="max-h-full max-w-full object-contain" />
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="secondary"
                  icon={<Download className="w-3.5 h-3.5" />}
                  onClick={() => downloadSingle(item)}
                  className="w-full mt-3"
                >
                  Download Page
                </Button>
              </div>
            ))}
          </div>

          <Button variant="secondary" onClick={handleClear} icon={<RotateCcw className="w-4 h-4" />} className="w-full">
            Convert Another Document
          </Button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
