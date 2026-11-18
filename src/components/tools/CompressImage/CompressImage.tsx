import { useState, useCallback, useEffect } from 'react';
import {
  ImageDown,
  Upload,
  RotateCcw,
  Download,
  CheckCircle,
  AlertCircle,
  X,
  Trash2,
} from 'lucide-react';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import type { ImageFile, CompressedImage } from '../../../types';
import { formatFileSize, generateId } from '../../../utils/format';
import {
  compressImage,
  createImagePreview,
  revokePreview,
} from '../../../utils/imageUtils';
import { Button } from '../../ui/Button';
import { Dropzone } from '../../ui/Dropzone';
import { Slider } from '../../ui/Slider';
import { Spinner } from '../../ui/Spinner';
import { ImageCompareCard } from './ImageCompareCard';

export function CompressImage() {
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [results, setResults] = useState<CompressedImage[]>([]);
  const [quality, setQuality] = useState(80);
  const [maxDimension, setMaxDimension] = useState<string>('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      files.forEach((f) => revokePreview(f.preview));
      results.forEach((r) => revokePreview(r.compressed.preview));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilesAdded = useCallback((newFiles: File[]) => {
    const imageFiles: ImageFile[] = newFiles.map((file) => ({
      id: generateId(),
      file,
      name: file.name,
      size: file.size,
      preview: createImagePreview(file),
    }));
    setFiles((prev) => [...prev, ...imageFiles]);
    setIsDone(false);
    setResults([]);
    setError(null);
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file) revokePreview(file.preview);
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const handleCompress = useCallback(async () => {
    setIsCompressing(true);
    setError(null);
    try {
      const compressed: CompressedImage[] = [];
      for (const file of files) {
        const maxDim = maxDimension ? parseInt(maxDimension, 10) : undefined;
        const blob = await compressImage(file.file, quality / 100, maxDim);
        const preview = URL.createObjectURL(blob);
        const savings = ((file.size - blob.size) / file.size) * 100;
        compressed.push({
          original: file,
          compressed: {
            blob,
            size: blob.size,
            name: `compressed_${file.name}`,
            preview,
          },
          savings: Math.max(0, savings),
        });
      }
      setResults(compressed);
      setIsDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Compression failed');
    } finally {
      setIsCompressing(false);
    }
  }, [files, quality, maxDimension]);

  const downloadSingle = useCallback((item: CompressedImage) => {
    saveAs(item.compressed.blob, item.compressed.name);
  }, []);

  const downloadAll = useCallback(async () => {
    const zip = new JSZip();
    results.forEach((r) => {
      zip.file(r.compressed.name, r.compressed.blob);
    });
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'compressed_images.zip');
  }, [results]);

  const handleClear = useCallback(() => {
    files.forEach((f) => revokePreview(f.preview));
    results.forEach((r) => revokePreview(r.compressed.preview));
    setFiles([]);
    setResults([]);
    setQuality(80);
    setMaxDimension('');
    setIsCompressing(false);
    setIsDone(false);
    setError(null);
  }, [files, results]);

  const totalSaved =
    results.length > 0
      ? results.reduce((sum, r) => sum + r.savings, 0) / results.length
      : 0;

  return (
    <div className="space-y-6">
      {!isDone && (
        <>
          <Dropzone
            onFilesAdded={handleFilesAdded}
            accept="image/png,image/jpeg,image/webp"
            multiple={true}
            label="Drop images here"
            sublabel="PNG, JPG, or WebP • Single or batch"
            icon={<Upload className="w-8 h-8 text-blue-500" />}
          />

          {files.length > 0 && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Compression Settings
                </h3>
                <div className="space-y-4">
                  <Slider
                    label="Quality"
                    value={quality}
                    onChange={setQuality}
                    min={10}
                    max={100}
                    step={5}
                    unit="%"
                    showValue
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Max Width/Height (optional)
                    </label>
                    <input
                      type="number"
                      value={maxDimension}
                      onChange={(e) => setMaxDimension(e.target.value)}
                      placeholder="e.g. 1920"
                      className="w-full max-w-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {files.length}{' '}
                    {files.length === 1 ? 'image' : 'images'} selected
                  </h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<Trash2 className="w-4 h-4" />}
                    onClick={handleClear}
                  >
                    Clear all
                  </Button>
                </div>
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                  >
                    <img
                      src={file.preview}
                      alt={file.name}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFile(file.id)}
                      className="p-1 hover:bg-red-50 dark:hover:bg-red-900/30 rounded text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <Button
                variant="primary"
                size="lg"
                onClick={handleCompress}
                loading={isCompressing}
                disabled={files.length === 0 || isCompressing}
                icon={<ImageDown className="w-5 h-5" />}
                className="w-full"
              >
                {isCompressing
                  ? 'Compressing...'
                  : `Compress ${files.length} ${files.length === 1 ? 'Image' : 'Images'}`}
              </Button>
            </div>
          )}
        </>
      )}

      {isCompressing && (
        <div className="flex flex-col items-center gap-3 py-8">
          <Spinner size="lg" />
          <p className="text-sm text-gray-500">Compressing images...</p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {isDone && results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            <p className="text-sm text-green-700 dark:text-green-400">
              Compressed {results.length}{' '}
              {results.length === 1 ? 'image' : 'images'} • Average saved:{' '}
              {totalSaved.toFixed(1)}%
            </p>
          </div>

          <div className="space-y-3">
            {results.map((r, i) => (
              <ImageCompareCard
                key={i}
                item={r}
                onDownload={downloadSingle}
              />
            ))}
          </div>

          {results.length > 1 && (
            <Button
              variant="primary"
              size="lg"
              onClick={downloadAll}
              icon={<Download className="w-5 h-5" />}
              className="w-full"
            >
              Download All as ZIP
            </Button>
          )}

          <Button
            variant="secondary"
            onClick={handleClear}
            icon={<RotateCcw className="w-4 h-4" />}
            className="w-full"
          >
            Clear / Start Over
          </Button>
        </div>
      )}
    </div>
  );
}
