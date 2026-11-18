import { useState, useCallback, useEffect } from 'react';
import {
  Upload,
  Sparkles,
  Download,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { saveAs } from 'file-saver';
import {
  applyImageFilter,
  stripExifMetadata,
  createImagePreview,
  revokePreview,
  type ScannerFilterType,
} from '../../../utils/imageUtils';
import { formatFileSize } from '../../../utils/format';
import { Button } from '../../ui/Button';
import { Dropzone } from '../../ui/Dropzone';
import { Slider } from '../../ui/Slider';

export function FilterScanner() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<ScannerFilterType>('bw-document');
  const [threshold, setThreshold] = useState<number>(140);
  const [stripExif, setStripExif] = useState<boolean>(true);

  const [filteredBlob, setFilteredBlob] = useState<Blob | null>(null);
  const [filteredPreview, setFilteredPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) revokePreview(previewUrl);
      if (filteredPreview) revokePreview(filteredPreview);
    };
  }, [previewUrl, filteredPreview]);

  const handleFilesAdded = useCallback((files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setFile(selected);
    const url = createImagePreview(selected);
    setPreviewUrl(url);
    setFilteredBlob(null);
    setFilteredPreview(null);
    setError(null);
  }, []);

  const handleApplyFilter = useCallback(async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);

    try {
      let workingFile = file;
      if (stripExif) {
        const cleaned = await stripExifMetadata(file);
        workingFile = new File([cleaned], file.name, { type: file.type });
      }

      const result = await applyImageFilter(workingFile, filterType, threshold);
      const url = URL.createObjectURL(result);
      setFilteredBlob(result);
      setFilteredPreview(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Filter failed');
    } finally {
      setIsProcessing(false);
    }
  }, [file, filterType, threshold, stripExif]);

  // Re-run filter when settings change
  useEffect(() => {
    if (file) {
      handleApplyFilter();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType, threshold, stripExif]);

  const handleDownload = () => {
    if (!file || !filteredBlob) return;
    const base = file.name.replace(/\.[^/.]+$/, '');
    saveAs(filteredBlob, `${base}_scanned.png`);
  };

  const handleClear = useCallback(() => {
    if (previewUrl) revokePreview(previewUrl);
    if (filteredPreview) revokePreview(filteredPreview);
    setFile(null);
    setPreviewUrl(null);
    setFilteredBlob(null);
    setFilteredPreview(null);
    setError(null);
  }, [previewUrl, filteredPreview]);

  const filters: { id: ScannerFilterType; label: string; desc: string }[] = [
    { id: 'bw-document', label: 'B&W Document', desc: 'Crisp scan threshold' },
    { id: 'grayscale', label: 'Grayscale', desc: 'Smooth monochrome' },
    { id: 'high-contrast', label: 'High Contrast', desc: 'Sharpen faded text' },
    { id: 'invert', label: 'Invert', desc: 'Dark mode inversion' },
    { id: 'warm', label: 'Warm Sepia', desc: 'Soft document tone' },
    { id: 'none', label: 'Original Clean', desc: 'Exif clean only' },
  ];

  return (
    <div className="space-y-6">
      {!file && (
        <Dropzone
          onFilesAdded={handleFilesAdded}
          accept="image/*"
          multiple={false}
          label="Drop Image to Enhance or Clean EXIF"
          sublabel="Turn photo-captured notes/receipts into clean black-and-white documents"
          icon={<Upload className="w-8 h-8 text-blue-500" />}
        />
      )}

      {file && previewUrl && (
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{file.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{formatFileSize(file.size)}</p>
            </div>
            <Button size="sm" variant="ghost" onClick={handleClear}>
              Change
            </Button>
          </div>

          {/* Filter Options */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Enhancement Presets
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {filters.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilterType(f.id)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    filterType === f.id
                      ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-xs font-bold">{f.label}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{f.desc}</div>
                </button>
              ))}
            </div>

            {filterType === 'bw-document' && (
              <div className="pt-2">
                <Slider
                  label="Scanner Threshold (Black vs White sensitivity)"
                  value={threshold}
                  onChange={setThreshold}
                  min={50}
                  max={210}
                  step={2}
                  showValue
                />
              </div>
            )}

            <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-750 pt-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Strip Privacy & EXIF Metadata (GPS coordinates, camera details)
                </span>
              </div>
              <input
                type="checkbox"
                checked={stripExif}
                onChange={(e) => setStripExif(e.target.checked)}
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Before vs After Display */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 flex flex-col items-center">
              <span className="text-xs font-semibold text-gray-400 mb-2 uppercase">Original</span>
              <div className="w-full aspect-[4/3] bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center p-2">
                <img src={previewUrl} alt="Original" className="max-h-full max-w-full object-contain" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 flex flex-col items-center">
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2 uppercase flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Enhanced Scan
              </span>
              <div className="w-full aspect-[4/3] bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center p-2">
                {filteredPreview ? (
                  <img src={filteredPreview} alt="Filtered" className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-xs text-gray-400">Processing...</span>
                )}
              </div>
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={handleDownload}
            loading={isProcessing}
            disabled={isProcessing || !filteredBlob}
            icon={<Download className="w-5 h-5" />}
            className="w-full"
          >
            Download Enhanced Document
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
