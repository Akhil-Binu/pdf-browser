import { useState, useCallback, useMemo } from 'react';
import {
  FileCode,
  Download,
  Copy,
  Check,
  AlertCircle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Eye,
  Code,
} from 'lucide-react';
import { saveAs } from 'file-saver';
import { Dropzone } from '../../ui/Dropzone';
import { Button } from '../../ui/Button';

export function SvgOptimizer() {
  const [file, setFile] = useState<File | null>(null);
  const [rawSvg, setRawSvg] = useState<string>('');
  const [optimizedSvg, setOptimizedSvg] = useState<string>('');
  const [viewTab, setViewTab] = useState<'preview' | 'code'>('preview');

  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const optimizeSvgString = (input: string): string => {
    let result = input;

    // 1. Remove XML declaration and DOCTYPE
    result = result.replace(/<\?xml[\s\S]*?\?>/gi, '');
    result = result.replace(/<!DOCTYPE[\s\S]*?>/gi, '');

    // 2. Remove comments
    result = result.replace(/<!--[\s\S]*?-->/gi, '');

    // 3. Remove metadata and description tags
    result = result.replace(/<metadata[\s\S]*?<\/metadata>/gi, '');
    result = result.replace(/<desc[\s\S]*?<\/desc>/gi, '');
    result = result.replace(/<title[\s\S]*?<\/title>/gi, '');

    // 4. Remove editor namespace definitions (Inkscape, Sodipodi, Illustrator, Sketch)
    result = result.replace(
      /\s*(xmlns:inkscape|xmlns:sodipodi|xmlns:adobe|xmlns:sketch|xmlns:i|xmlns:graph)=["'][^"']*["']/gi,
      ''
    );

    // 5. Remove editor attributes
    result = result.replace(
      /\s*(inkscape|sodipodi|adobe|sketch|i):[a-zA-Z0-9_-]+=["'][^"']*["']/gi,
      ''
    );

    // 6. Remove empty groups
    result = result.replace(/<g[^>]*>\s*<\/g>/gi, '');

    // 7. Clean up redundant whitespace between tags
    result = result.replace(/>\s+</g, '><');
    result = result.replace(/\s{2,}/g, ' ');

    return result.trim();
  };

  const handleFilesAdded = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setFile(selected);
    setError(null);

    try {
      const text = await selected.text();
      setRawSvg(text);
      const opt = optimizeSvgString(text);
      setOptimizedSvg(opt);
    } catch {
      setError('Could not read SVG file');
    }
  }, []);

  const handleManualInput = (val: string) => {
    setRawSvg(val);
    if (val.trim()) {
      const opt = optimizeSvgString(val);
      setOptimizedSvg(opt);
    } else {
      setOptimizedSvg('');
    }
  };

  const stats = useMemo(() => {
    const rawLen = new Blob([rawSvg]).size;
    const optLen = new Blob([optimizedSvg]).size;
    if (rawLen === 0) return { rawSize: 0, optSize: 0, savings: 0 };
    const saved = Math.max(0, ((rawLen - optLen) / rawLen) * 100);
    return {
      rawSize: rawLen,
      optSize: optLen,
      savings: Number(saved.toFixed(1)),
    };
  }, [rawSvg, optimizedSvg]);

  const handleCopy = () => {
    if (!optimizedSvg) return;
    navigator.clipboard.writeText(optimizedSvg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!optimizedSvg) return;
    const blob = new Blob([optimizedSvg], { type: 'image/svg+xml;charset=utf-8' });
    const name = file ? file.name.replace(/\.svg$/i, '') : 'optimized';
    saveAs(blob, `${name}_optimized.svg`);
  };

  const handleReset = () => {
    setFile(null);
    setRawSvg('');
    setOptimizedSvg('');
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold flex items-center gap-2">
          <FileCode className="w-6 h-6 text-orange-500" />
          SVG Minifier & Code Optimizer
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Strip redundant XML namespaces, Illustrator/Inkscape bloat, metadata, and comments for leaner web SVGs.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!file && !rawSvg ? (
        <div className="space-y-4">
          <Dropzone
            accept={{ 'image/svg+xml': ['.svg'] }}
            onFilesAdded={handleFilesAdded}
            icon={<FileCode className="w-12 h-12 text-orange-500" />}
            title="Drop SVG file here to optimize"
            subtitle="Or paste raw SVG code below"
          />

          <div className="text-center text-xs text-gray-400">or paste SVG string directly</div>

          <textarea
            rows={4}
            placeholder="<svg ...> ... </svg>"
            value={rawSvg}
            onChange={(e) => handleManualInput(e.target.value)}
            className="w-full p-3 font-mono text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-6">
              <div>
                <span className="text-[10px] uppercase font-semibold text-gray-400 block">Original</span>
                <span className="font-mono font-bold text-sm text-gray-700 dark:text-gray-300">
                  {(stats.rawSize / 1024).toFixed(2)} KB
                </span>
              </div>

              <ArrowRight className="w-4 h-4 text-gray-400" />

              <div>
                <span className="text-[10px] uppercase font-semibold text-gray-400 block">Optimized</span>
                <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                  {(stats.optSize / 1024).toFixed(2)} KB
                </span>
              </div>

              <div className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{stats.savings}% Smaller</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={handleCopy}>
                {copied ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                {copied ? 'Copied' : 'Copy SVG'}
              </Button>
              <Button size="sm" onClick={handleDownload} className="bg-orange-600 hover:bg-orange-700 text-white">
                <Download className="w-3.5 h-3.5 mr-1" />
                Download .svg
              </Button>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <RotateCcw className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* View Switcher & Display */}
          <div className="space-y-3">
            <div className="flex rounded-lg bg-slate-100 dark:bg-gray-800 p-1 text-xs font-medium w-fit">
              <button
                type="button"
                onClick={() => setViewTab('preview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                  viewTab === 'preview'
                    ? 'bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-xs'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Rendered Preview
              </button>
              <button
                type="button"
                onClick={() => setViewTab('code')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                  viewTab === 'code'
                    ? 'bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-xs'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                Code Inspection
              </button>
            </div>

            {viewTab === 'preview' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col items-center justify-center min-h-[320px]">
                  <span className="text-xs font-semibold text-gray-400 mb-3 block">Light Background</span>
                  <div
                    className="p-4 max-h-[260px] max-w-full overflow-hidden flex items-center justify-center"
                    dangerouslySetInnerHTML={{ __html: optimizedSvg }}
                  />
                </div>

                <div className="p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-slate-950 flex flex-col items-center justify-center min-h-[320px]">
                  <span className="text-xs font-semibold text-gray-500 mb-3 block">Dark Background</span>
                  <div
                    className="p-4 max-h-[260px] max-w-full overflow-hidden flex items-center justify-center"
                    dangerouslySetInnerHTML={{ __html: optimizedSvg }}
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-gray-500">Original Raw SVG:</span>
                  <textarea
                    rows={12}
                    readOnly
                    value={rawSvg}
                    className="w-full p-3 font-mono text-[11px] rounded-xl border border-gray-300 dark:border-gray-700 bg-slate-50 dark:bg-gray-950 text-gray-600 dark:text-gray-300"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-emerald-600">Optimized SVG:</span>
                  <textarea
                    rows={12}
                    readOnly
                    value={optimizedSvg}
                    className="w-full p-3 font-mono text-[11px] rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/20 dark:bg-emerald-950/20 text-gray-800 dark:text-gray-100"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
