import { useState, useCallback, useEffect } from 'react';
import {
  Upload,
  FileSearch,
  Copy,
  Check,
  Download,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import { saveAs } from 'file-saver';
import { extractTextFromImage, type OcrResult } from '../../../utils/ocrUtils';
import { createImagePreview, revokePreview } from '../../../utils/imageUtils';
import { Button } from '../../ui/Button';
import { Dropzone } from '../../ui/Dropzone';
import { ProgressBar } from '../../ui/ProgressBar';

export function OcrTool() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [language, setLanguage] = useState<string>('eng');
  const [progress, setProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) revokePreview(previewUrl);
    };
  }, [previewUrl]);

  const handleFilesAdded = useCallback((files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setFile(selected);
    const url = createImagePreview(selected);
    setPreviewUrl(url);
    setOcrResult(null);
    setProgress(0);
    setError(null);
  }, []);

  const handleExtract = useCallback(async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const result = await extractTextFromImage(file, language, (p, status) => {
        setProgress(p);
        setStatusMessage(status);
      });
      setOcrResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OCR extraction failed');
    } finally {
      setIsProcessing(false);
    }
  }, [file, language]);

  const handleCopy = async () => {
    if (!ocrResult) return;
    await navigator.clipboard.writeText(ocrResult.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!file || !ocrResult) return;
    const base = file.name.replace(/\.[^/.]+$/, '');
    const blob = new Blob([ocrResult.text], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `${base}_extracted_text.txt`);
  };

  const handleClear = useCallback(() => {
    if (previewUrl) revokePreview(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setOcrResult(null);
    setProgress(0);
    setIsProcessing(false);
    setError(null);
  }, [previewUrl]);

  const wordCount = ocrResult ? ocrResult.text.trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = ocrResult ? ocrResult.text.length : 0;

  return (
    <div className="space-y-6">
      {!file && (
        <Dropzone
          onFilesAdded={handleFilesAdded}
          accept="image/*"
          multiple={false}
          label="Drop Image or Scanned Document for OCR"
          sublabel="Extract text 100% locally using in-browser WebAssembly OCR"
          icon={<Upload className="w-8 h-8 text-blue-500" />}
        />
      )}

      {file && previewUrl && !ocrResult && (
        <div className="space-y-5">
          <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3">
              <img src={previewUrl} alt="Target" className="w-12 h-12 object-cover rounded-xl border" />
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{file.name}</p>
                <p className="text-xs text-gray-400">Ready for client-side text recognition</p>
              </div>
            </div>
            <Button size="sm" variant="ghost" onClick={handleClear}>
              Change
            </Button>
          </div>

          {/* Language Selector */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Recognition Language
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'eng', label: 'English' },
                { id: 'spa', label: 'Spanish' },
                { id: 'fra', label: 'French' },
                { id: 'deu', label: 'German' },
              ].map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => setLanguage(lang.id)}
                  className={`py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    language === lang.id
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {isProcessing && (
            <div className="space-y-2 py-2">
              <ProgressBar progress={progress} label={statusMessage || 'Extracting text with Tesseract...'} />
            </div>
          )}

          <Button
            variant="primary"
            size="lg"
            onClick={handleExtract}
            loading={isProcessing}
            disabled={isProcessing}
            icon={<FileSearch className="w-5 h-5" />}
            className="w-full"
          >
            {isProcessing ? 'Recognizing Text in Browser...' : 'Extract Text with OCR'}
          </Button>
        </div>
      )}

      {/* OCR Results View */}
      {ocrResult && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-200 dark:border-emerald-800">
                {ocrResult.confidence}% Confidence
              </span>
              <span className="text-xs text-gray-500">
                {wordCount} words • {charCount} characters
              </span>
            </div>

            <div className="flex gap-2">
              <Button size="sm" variant="secondary" icon={copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />} onClick={handleCopy}>
                {copied ? 'Copied!' : 'Copy Text'}
              </Button>
              <Button size="sm" variant="primary" icon={<Download className="w-4 h-4" />} onClick={handleDownloadTxt}>
                Download .txt
              </Button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
            <textarea
              readOnly
              value={ocrResult.text}
              rows={12}
              className="w-full bg-gray-50 dark:bg-gray-900 rounded-xl p-4 font-mono text-sm leading-relaxed text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-800 outline-none resize-y"
            />
          </div>

          <Button variant="secondary" onClick={handleClear} icon={<RotateCcw className="w-4 h-4" />} className="w-full">
            Extract from Another Image
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
