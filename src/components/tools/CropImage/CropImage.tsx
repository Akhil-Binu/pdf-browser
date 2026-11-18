import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Upload,
  Crop,
  Download,
  RotateCcw,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { saveAs } from 'file-saver';
import { cropImage, createImagePreview, revokePreview } from '../../../utils/imageUtils';
import { formatFileSize } from '../../../utils/format';
import { Button } from '../../ui/Button';
import { Dropzone } from '../../ui/Dropzone';
import { Slider } from '../../ui/Slider';

type AspectRatio = 'free' | '1:1' | '16:9' | '4:3' | '9:16';

export function CropImage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [naturalDim, setNaturalDim] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  const [aspect, setAspect] = useState<AspectRatio>('1:1');
  const [cropBox, setCropBox] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  const [croppedPreview, setCroppedPreview] = useState<string | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) revokePreview(previewUrl);
      if (croppedPreview) revokePreview(croppedPreview);
    };
  }, [previewUrl, croppedPreview]);

  const handleFilesAdded = useCallback((files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setFile(selected);
    const url = createImagePreview(selected);
    setPreviewUrl(url);
    setCroppedBlob(null);
    setCroppedPreview(null);
    setError(null);

    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      setNaturalDim({ width: w, height: h });
      // Default to center 80% square
      const size = Math.min(w, h) * 0.8;
      setCropBox({
        x: Math.round((w - size) / 2),
        y: Math.round((h - size) / 2),
        width: Math.round(size),
        height: Math.round(size),
      });
    };
    img.src = url;
  }, []);

  const setRatio = (ratio: AspectRatio) => {
    setAspect(ratio);
    const { width: w, height: h } = naturalDim;
    if (w === 0 || h === 0) return;

    let targetW = w * 0.8;
    let targetH = h * 0.8;

    if (ratio === '1:1') {
      const size = Math.min(w, h) * 0.8;
      targetW = size;
      targetH = size;
    } else if (ratio === '16:9') {
      targetW = w * 0.8;
      targetH = targetW * (9 / 16);
      if (targetH > h) {
        targetH = h * 0.8;
        targetW = targetH * (16 / 9);
      }
    } else if (ratio === '4:3') {
      targetW = w * 0.8;
      targetH = targetW * (3 / 4);
      if (targetH > h) {
        targetH = h * 0.8;
        targetW = targetH * (4 / 3);
      }
    } else if (ratio === '9:16') {
      targetH = h * 0.8;
      targetW = targetH * (9 / 16);
      if (targetW > w) {
        targetW = w * 0.8;
        targetH = targetW * (16 / 9);
      }
    }

    setCropBox({
      x: Math.round((w - targetW) / 2),
      y: Math.round((h - targetH) / 2),
      width: Math.round(targetW),
      height: Math.round(targetH),
    });
  };

  const handleApplyCrop = useCallback(async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    try {
      const blob = await cropImage(file, cropBox);
      const url = URL.createObjectURL(blob);
      setCroppedBlob(blob);
      setCroppedPreview(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cropping failed');
    } finally {
      setIsProcessing(false);
    }
  }, [file, cropBox]);

  const handleDownload = () => {
    if (!file || !croppedBlob) return;
    const base = file.name.replace(/\.[^/.]+$/, '');
    saveAs(croppedBlob, `${base}_cropped.${file.type.includes('png') ? 'png' : 'jpg'}`);
  };

  const handleClear = useCallback(() => {
    if (previewUrl) revokePreview(previewUrl);
    if (croppedPreview) revokePreview(croppedPreview);
    setFile(null);
    setPreviewUrl(null);
    setCroppedBlob(null);
    setCroppedPreview(null);
    setError(null);
  }, [previewUrl, croppedPreview]);

  return (
    <div className="space-y-6">
      {!file && (
        <Dropzone
          onFilesAdded={handleFilesAdded}
          accept="image/*"
          multiple={false}
          label="Drop an Image to Crop"
          sublabel="Preset aspect ratios (1:1, 16:9, 9:16, 4:3) with pixel precision"
          icon={<Upload className="w-8 h-8 text-blue-500" />}
        />
      )}

      {file && previewUrl && !croppedBlob && (
        <div className="space-y-5">
          {/* Preset Buttons */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Aspect Ratio
            </span>

            <div className="flex flex-wrap gap-2">
              {(['free', '1:1', '16:9', '4:3', '9:16'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRatio(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    aspect === r
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {r.toUpperCase()}
                </button>
              ))}
            </div>

            <Button size="sm" variant="ghost" onClick={handleClear}>
              Change
            </Button>
          </div>

          {/* Interactive Preview Canvas Box */}
          <div className="relative bg-gray-900 rounded-2xl overflow-hidden p-4 flex items-center justify-center min-h-[300px]">
            <img
              ref={imgRef}
              src={previewUrl}
              alt="Crop target"
              className="max-h-[400px] max-w-full object-contain select-none"
            />
          </div>

          {/* Dimension Controls */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Crop Region Settings
              </h3>
              <span className="text-xs text-gray-400 font-mono">
                {cropBox.width} × {cropBox.height} px (at x:{cropBox.x}, y:{cropBox.y})
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Slider
                label="Crop Width"
                value={cropBox.width}
                onChange={(val) => setCropBox((p) => ({ ...p, width: Math.min(val, naturalDim.width - p.x) }))}
                min={20}
                max={naturalDim.width}
                step={5}
                unit="px"
                showValue
              />
              <Slider
                label="Crop Height"
                value={cropBox.height}
                onChange={(val) => setCropBox((p) => ({ ...p, height: Math.min(val, naturalDim.height - p.y) }))}
                min={20}
                max={naturalDim.height}
                step={5}
                unit="px"
                showValue
              />
              <Slider
                label="Horizontal Offset (X)"
                value={cropBox.x}
                onChange={(val) => setCropBox((p) => ({ ...p, x: Math.min(val, naturalDim.width - p.width) }))}
                min={0}
                max={Math.max(0, naturalDim.width - cropBox.width)}
                step={5}
                unit="px"
                showValue
              />
              <Slider
                label="Vertical Offset (Y)"
                value={cropBox.y}
                onChange={(val) => setCropBox((p) => ({ ...p, y: Math.min(val, naturalDim.height - p.height) }))}
                min={0}
                max={Math.max(0, naturalDim.height - cropBox.height)}
                step={5}
                unit="px"
                showValue
              />
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={handleApplyCrop}
            loading={isProcessing}
            disabled={isProcessing}
            icon={<Crop className="w-5 h-5" />}
            className="w-full"
          >
            {isProcessing ? 'Cropping...' : 'Crop Image'}
          </Button>
        </div>
      )}

      {/* Cropped Output Result */}
      {croppedBlob && croppedPreview && (
        <div className="space-y-5">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-green-600 font-semibold text-sm">
              <CheckCircle className="w-5 h-5" /> Image Cropped Successfully!
            </div>

            <div className="max-w-md mx-auto aspect-auto bg-gray-50 dark:bg-gray-900 rounded-xl p-2 border overflow-hidden flex items-center justify-center">
              <img src={croppedPreview} alt="Cropped output" className="max-h-72 max-w-full object-contain rounded-lg" />
            </div>

            <p className="text-xs text-gray-500">
              {cropBox.width} × {cropBox.height} px • {formatFileSize(croppedBlob.size)}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                variant="primary"
                size="lg"
                icon={<Download className="w-5 h-5" />}
                onClick={handleDownload}
                className="flex-1"
              >
                Download Cropped Image
              </Button>
              <Button
                variant="secondary"
                size="lg"
                icon={<RotateCcw className="w-5 h-5" />}
                onClick={() => {
                  setCroppedBlob(null);
                  setCroppedPreview(null);
                }}
                className="flex-1"
              >
                Re-adjust Crop
              </Button>
            </div>
          </div>
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
