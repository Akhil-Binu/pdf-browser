import { useState, useCallback } from 'react';
import {
  Upload,
  Stamp,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { saveAs } from 'file-saver';
import { getPageCount, addWatermarkToPdf } from '../../../utils/pdfUtils';
import { formatFileSize } from '../../../utils/format';
import { Button } from '../../ui/Button';
import { Dropzone } from '../../ui/Dropzone';
import { Slider } from '../../ui/Slider';

const colors = {
  red: { r: 0.9, g: 0.2, b: 0.2 },
  gray: { r: 0.4, g: 0.4, b: 0.4 },
  blue: { r: 0.15, g: 0.4, b: 0.9 },
  amber: { r: 0.85, g: 0.5, b: 0.1 },
};

export function WatermarkPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [text, setText] = useState<string>('CONFIDENTIAL');
  const [opacity, setOpacity] = useState<number>(30); // 0-100
  const [fontSize, setFontSize] = useState<number>(54);
  const [angle, setAngle] = useState<number>(-45);
  const [colorPreset, setColorPreset] = useState<'red' | 'gray' | 'blue' | 'amber'>('red');
  const [includePageNumbers, setIncludePageNumbers] = useState<boolean>(true);
  const [pageNumberPosition, setPageNumberPosition] = useState<'bottom-center' | 'bottom-right' | 'top-right'>('bottom-center');

  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);
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
      setError(err instanceof Error ? err.message : 'Could not read PDF');
    }
  }, []);

  const handleApply = useCallback(async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);

    try {
      const bytes = await addWatermarkToPdf(file, {
        watermarkText: text,
        opacity: opacity / 100,
        fontSize,
        angle,
        color: colors[colorPreset],
        includePageNumbers,
        pageNumberPosition,
      });

      const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
      const base = file.name.replace(/\.pdf$/i, '');
      saveAs(blob, `${base}_watermarked.pdf`);
      setIsDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply watermark');
    } finally {
      setIsProcessing(false);
    }
  }, [file, text, opacity, fontSize, angle, colorPreset, includePageNumbers, pageNumberPosition]);

  const handleClear = useCallback(() => {
    setFile(null);
    setPageCount(0);
    setIsProcessing(false);
    setIsDone(false);
    setError(null);
  }, []);

  return (
    <div className="space-y-6">
      {!file && (
        <Dropzone
          onFilesAdded={handleFilesAdded}
          accept="application/pdf"
          multiple={false}
          label="Drop a PDF to Watermark & Add Page Numbers"
          sublabel="Stamp text watermarks and add pagination headers or footers"
          icon={<Upload className="w-8 h-8 text-blue-500" />}
        />
      )}

      {file && (
        <div className="space-y-5">
          {/* File Card */}
          <div className="flex items-center gap-4 bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/40 rounded-xl flex items-center justify-center text-amber-500 flex-shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                {file.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {formatFileSize(file.size)} • {pageCount} pages
              </p>
            </div>
            <Button size="sm" variant="ghost" onClick={handleClear}>
              Change
            </Button>
          </div>

          {/* Watermark Config */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Watermark Settings
            </h3>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Watermark Text
              </label>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="e.g. CONFIDENTIAL, DRAFT, DO NOT COPY"
                className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <div className="flex gap-2 mt-2">
                {['CONFIDENTIAL', 'DRAFT', 'SAMPLE', 'INTERNAL ONLY'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setText(preset)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-750 text-gray-600 dark:text-gray-400 hover:bg-gray-200 transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <Slider
                label="Opacity"
                value={opacity}
                onChange={setOpacity}
                min={10}
                max={90}
                step={5}
                unit="%"
                showValue
              />
              <Slider
                label="Font Size"
                value={fontSize}
                onChange={setFontSize}
                min={24}
                max={96}
                step={4}
                unit="pt"
                showValue
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Color
                </label>
                <div className="flex gap-2">
                  {(['red', 'gray', 'blue', 'amber'] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColorPreset(c)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize border transition-all cursor-pointer ${
                        colorPreset === c
                          ? 'border-blue-600 ring-2 ring-blue-500/30'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rotation Angle
                </label>
                <div className="flex gap-2">
                  {[-45, 0, 45].map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAngle(a)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                        angle === a
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {a}°
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Page Numbering Options */}
            <div className="border-t border-gray-100 dark:border-gray-750 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Include Page Numbers
                  </p>
                  <p className="text-xs text-gray-500">Adds "Page X of Y" to each page</p>
                </div>
                <input
                  type="checkbox"
                  checked={includePageNumbers}
                  onChange={(e) => setIncludePageNumbers(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                />
              </div>

              {includePageNumbers && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Position
                  </label>
                  <div className="flex gap-2">
                    {[
                      { id: 'bottom-center', label: 'Bottom Center' },
                      { id: 'bottom-right', label: 'Bottom Right' },
                      { id: 'top-right', label: 'Top Right' },
                    ].map((pos) => (
                      <button
                        key={pos.id}
                        type="button"
                        onClick={() => setPageNumberPosition(pos.id as any)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                          pageNumberPosition === pos.id
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {pos.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={handleApply}
            loading={isProcessing}
            disabled={isProcessing}
            icon={<Stamp className="w-5 h-5" />}
            className="w-full"
          >
            {isProcessing ? 'Applying Watermark...' : 'Watermark PDF & Download'}
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
              Watermark applied and file downloaded successfully!
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
