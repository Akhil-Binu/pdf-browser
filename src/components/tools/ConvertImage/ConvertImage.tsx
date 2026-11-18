import { useState, useCallback, useEffect } from 'react';
import {
  Upload,
  RefreshCw,
  Download,
  RotateCcw,
  AlertCircle,
  X,
  Trash2,
} from 'lucide-react';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import type { ImageFile } from '../../../types';
import { generateId, formatFileSize } from '../../../utils/format';
import {
  convertImageFormat,
  createImagePreview,
  revokePreview,
} from '../../../utils/imageUtils';
import { Button } from '../../ui/Button';
import { Dropzone } from '../../ui/Dropzone';
import { Slider } from '../../ui/Slider';

interface ConvertedResult {
  id: string;
  originalName: string;
  outputName: string;
  originalSize: number;
  outputSize: number;
  blob: Blob;
  preview: string;
}

export function ConvertImage() {
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [targetFormat, setTargetFormat] = useState<'image/png' | 'image/jpeg' | 'image/webp'>('image/webp');
  const [quality, setQuality] = useState<number>(90);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ConvertedResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      files.forEach((f) => revokePreview(f.preview));
      results.forEach((r) => revokePreview(r.preview));
    };
  }, [files, results]);

  const handleFilesAdded = useCallback((newFiles: File[]) => {
    const items: ImageFile[] = newFiles.map((file) => ({
      id: generateId(),
      file,
      name: file.name,
      size: file.size,
      preview: createImagePreview(file),
    }));
    setFiles((prev) => [...prev, ...items]);
    setResults([]);
    setError(null);
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target) revokePreview(target.preview);
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const handleConvert = useCallback(async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setError(null);

    const extMap = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/webp': 'webp',
    };
    const targetExt = extMap[targetFormat];

    try {
      const converted: ConvertedResult[] = [];
      for (const item of files) {
        const blob = await convertImageFormat(item.file, targetFormat, quality / 100);
        const preview = URL.createObjectURL(blob);
        const baseName = item.name.replace(/\.[^/.]+$/, '');
        converted.push({
          id: item.id,
          originalName: item.name,
          outputName: `${baseName}.${targetExt}`,
          originalSize: item.size,
          outputSize: blob.size,
          blob,
          preview,
        });
      }
      setResults(converted);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion failed');
    } finally {
      setIsProcessing(false);
    }
  }, [files, targetFormat, quality]);

  const downloadSingle = (res: ConvertedResult) => {
    saveAs(res.blob, res.outputName);
  };

  const downloadAll = async () => {
    const zip = new JSZip();
    results.forEach((r) => {
      zip.file(r.outputName, r.blob);
    });
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'converted_images.zip');
  };

  const handleClear = useCallback(() => {
    files.forEach((f) => revokePreview(f.preview));
    results.forEach((r) => revokePreview(r.preview));
    setFiles([]);
    setResults([]);
    setIsProcessing(false);
    setError(null);
  }, [files, results]);

  return (
    <div className="space-y-6">
      {results.length === 0 && (
        <>
          <Dropzone
            onFilesAdded={handleFilesAdded}
            accept="image/*"
            multiple={true}
            label="Drop Images to Convert Formats"
            sublabel="Convert between PNG, JPEG, and WebP in seconds"
            icon={<Upload className="w-8 h-8 text-blue-500" />}
          />

          {files.length > 0 && (
            <div className="space-y-5">
              {/* Settings Card */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Target Format
                </h3>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'image/webp', label: 'WebP', desc: 'Modern & Compact' },
                    { id: 'image/png', label: 'PNG', desc: 'Lossless & Crisp' },
                    { id: 'image/jpeg', label: 'JPEG', desc: 'Universal' },
                  ].map((fmt) => (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => setTargetFormat(fmt.id as any)}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        targetFormat === fmt.id
                          ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 font-bold ring-2 ring-blue-500/30'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="text-sm font-semibold">{fmt.label}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{fmt.desc}</div>
                    </button>
                  ))}
                </div>

                {targetFormat !== 'image/png' && (
                  <div className="pt-2">
                    <Slider
                      label="Output Quality"
                      value={quality}
                      onChange={setQuality}
                      min={10}
                      max={100}
                      step={5}
                      unit="%"
                      showValue
                    />
                  </div>
                )}
              </div>

              {/* Added list */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {files.length} {files.length === 1 ? 'image' : 'images'} selected
                  </span>
                  <Button size="sm" variant="ghost" icon={<Trash2 className="w-4 h-4" />} onClick={handleClear}>
                    Clear all
                  </Button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl p-2.5 border border-gray-200 dark:border-gray-700"
                    >
                      <img src={file.preview} alt={file.name} className="w-10 h-10 object-cover rounded-lg border" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{file.name}</p>
                        <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(file.id)}
                        className="p-1 text-gray-400 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                onClick={handleConvert}
                loading={isProcessing}
                disabled={isProcessing}
                icon={<RefreshCw className="w-5 h-5" />}
                className="w-full"
              >
                {isProcessing ? 'Converting Images...' : `Convert ${files.length} Images`}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Results View */}
      {results.length > 0 && (
        <div className="space-y-5">
          <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Successfully converted {results.length} images
            </span>
            <div className="flex gap-2">
              {results.length > 1 && (
                <Button size="sm" variant="primary" icon={<Download className="w-4 h-4" />} onClick={downloadAll}>
                  Download All ZIP
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={handleClear}>
                Reset
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {results.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-4 bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img src={r.preview} alt={r.outputName} className="w-12 h-12 object-cover rounded-lg border" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{r.outputName}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(r.originalSize)} ➔ <span className="text-blue-600 font-bold">{formatFileSize(r.outputSize)}</span>
                    </p>
                  </div>
                </div>

                <Button size="sm" variant="secondary" icon={<Download className="w-4 h-4" />} onClick={() => downloadSingle(r)}>
                  Save
                </Button>
              </div>
            ))}
          </div>

          <Button variant="secondary" onClick={handleClear} icon={<RotateCcw className="w-4 h-4" />} className="w-full">
            Convert More Images
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
