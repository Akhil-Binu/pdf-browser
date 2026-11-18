import { useState, useCallback, useRef } from 'react';
import {
  Palette,
  Pipette,
  Copy,
  Check,
  AlertCircle,
  RotateCcw,
  Image as ImageIcon,
  Code,
} from 'lucide-react';
import { Dropzone } from '../../ui/Dropzone';
import { Button } from '../../ui/Button';

interface ColorSwatch {
  hex: string;
  rgb: string;
  r: number;
  g: number;
  b: number;
}

export function ColorPalette() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [swatches, setSwatches] = useState<ColorSwatch[]>([]);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const extractPaletteFromImage = (img: HTMLImageElement) => {
    const canvas = canvasRef.current || document.createElement('canvas');
    // Scale down for fast local quantization
    const width = 100;
    const height = Math.max(1, Math.round((img.height / img.width) * 100));
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(img, 0, 0, width, height);
    const imgData = ctx.getImageData(0, 0, width, height).data;

    // Color quantization bucket map
    const colorMap = new Map<string, { r: number; g: number; b: number; count: number }>();

    for (let i = 0; i < imgData.length; i += 16) { // step by 4 pixels (16 bytes)
      const a = imgData[i + 3];
      if (a < 128) continue; // ignore transparent

      // Quantize to 5-bit color space (steps of 8)
      const r = Math.round(imgData[i] / 8) * 8;
      const g = Math.round(imgData[i + 1] / 8) * 8;
      const b = Math.round(imgData[i + 2] / 8) * 8;

      const key = `${r},${g},${b}`;
      const existing = colorMap.get(key);
      if (existing) {
        existing.count++;
      } else {
        colorMap.set(key, { r, g, b, count: 1 });
      }
    }

    // Sort by popularity and select distinct colors
    const sorted = Array.from(colorMap.values()).sort((a, b) => b.count - a.count);
    const distinct: ColorSwatch[] = [];

    for (const item of sorted) {
      if (distinct.length >= 8) break;

      // Ensure min Euclidean color distance from existing swatches
      const isTooClose = distinct.some((d) => {
        const dist = Math.sqrt(
          Math.pow(d.r - item.r, 2) +
          Math.pow(d.g - item.g, 2) +
          Math.pow(d.b - item.b, 2)
        );
        return dist < 45; // Minimum color distance
      });

      if (!isTooClose) {
        const hex = rgbToHex(item.r, item.g, item.b);
        distinct.push({
          hex,
          rgb: `rgb(${item.r}, ${item.g}, ${item.b})`,
          r: item.r,
          g: item.g,
          b: item.b,
        });
      }
    }

    setSwatches(distinct);
  };

  const handleFilesAdded = useCallback((files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setFile(selected);
    setError(null);

    const url = URL.createObjectURL(selected);
    setPreviewUrl(url);

    const img = new Image();
    img.onload = () => {
      extractPaletteFromImage(img);
    };
    img.onerror = () => {
      setError('Could not decode image for palette extraction');
    };
    img.src = url;
  }, []);

  const handleCopySingle = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  const handleCopyCssVars = () => {
    const css = [
      ':root {',
      ...swatches.map((s, idx) => `  --color-palette-${idx + 1}: ${s.hex};`),
      '}',
    ].join('\n');
    navigator.clipboard.writeText(css);
    setCopiedFormat('css');
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  const handleCopyTailwind = () => {
    const tw = [
      'colors: {',
      ...swatches.map((s, idx) => `  palette${idx + 1}: '${s.hex}',`),
      '}',
    ].join('\n');
    navigator.clipboard.writeText(tw);
    setCopiedFormat('tailwind');
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  // Browser Eyedropper API
  const handlePickFromScreen = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const windowWithEye = window as any;
    if (windowWithEye.EyeDropper) {
      try {
        const eyeDropper = new windowWithEye.EyeDropper();
        const result = await eyeDropper.open();
        if (result && result.sRGBHex) {
          const hex = result.sRGBHex.toLowerCase();
          const rgb = hexToRgb(hex);
          if (rgb) {
            setSwatches((prev) => [
              { hex, rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, r: rgb.r, g: rgb.g, b: rgb.b },
              ...prev.slice(0, 7),
            ]);
          }
        }
      } catch {
        // User cancelled eyedropper
      }
    } else {
      setError('Screen EyeDropper API is not supported in this browser. Click on the preview image instead.');
    }
  };

  // Click on image preview to sample pixel
  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const rect = img.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * img.naturalWidth);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * img.naturalHeight);

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(img, 0, 0);
    const p = ctx.getImageData(x, y, 1, 1).data;
    const hex = rgbToHex(p[0], p[1], p[2]);

    setSwatches((prev) => [
      { hex, rgb: `rgb(${p[0]}, ${p[1]}, ${p[2]})`, r: p[0], g: p[1], b: p[2] },
      ...prev.slice(0, 7),
    ]);
  };

  const handleReset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setSwatches([]);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Palette className="w-6 h-6 text-emerald-500" />
          Color Palette & Eyedropper Extractor
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Extract dominant harmonious swatches from photos or designs with local color quantization, screen eyedropper, and CSS/Tailwind exports.
        </p>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!file ? (
        <Dropzone
          accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.svg'] }}
          onFilesAdded={handleFilesAdded}
          icon={<ImageIcon className="w-12 h-12 text-emerald-500" />}
          title="Drop image here to extract palette"
          subtitle="Supports photos, brand logos, illustrations, and UI designs"
        />
      ) : (
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-100 dark:bg-gray-800/60 border border-slate-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{file.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {swatches.length} dominant colors quantized
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={handlePickFromScreen}>
                <Pipette className="w-4 h-4 mr-1.5" />
                Pick Screen Color
              </Button>
              <Button variant="secondary" size="sm" onClick={handleReset}>
                <RotateCcw className="w-4 h-4 mr-1.5" />
                Change Image
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Swatch Grid */}
            <div className="lg:col-span-7 space-y-4">
              <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 block">
                Extracted Palette Swatches
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {swatches.map((s) => {
                  const isLight = (s.r * 299 + s.g * 587 + s.b * 114) / 1000 > 160;
                  return (
                    <div
                      key={s.hex}
                      onClick={() => handleCopySingle(s.hex)}
                      className="group cursor-pointer rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col"
                    >
                      <div
                        className="h-24 w-full flex items-center justify-center relative transition-transform group-hover:scale-105"
                        style={{ backgroundColor: s.hex }}
                      >
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity ${
                            isLight ? 'bg-black/80 text-white' : 'bg-white/80 text-black'
                          }`}
                        >
                          {copiedHex === s.hex ? 'Copied!' : 'Copy Hex'}
                        </span>
                      </div>
                      <div className="p-2.5 bg-white dark:bg-gray-900 flex flex-col gap-0.5">
                        <span className="font-mono font-bold text-xs text-gray-900 dark:text-gray-100">
                          {s.hex.toUpperCase()}
                        </span>
                        <span className="font-mono text-[10px] text-gray-400 truncate">
                          {s.rgb}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Code Export Formats */}
              <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-emerald-500" />
                  Code Exports
                </span>

                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm" onClick={handleCopyCssVars}>
                    {copiedFormat === 'css' ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                    {copiedFormat === 'css' ? 'Copied CSS Variables!' : 'Copy CSS Variables'}
                  </Button>
                  <Button variant="secondary" size="sm" onClick={handleCopyTailwind}>
                    {copiedFormat === 'tailwind' ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                    {copiedFormat === 'tailwind' ? 'Copied Tailwind Colors!' : 'Copy Tailwind Config'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Clickable Image Preview */}
            <div className="lg:col-span-5 space-y-2">
              <span className="font-semibold text-xs text-gray-600 dark:text-gray-400 block">
                Source Image (Click any spot to sample pixel)
              </span>
              <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-slate-100 dark:bg-gray-950 p-2 flex items-center justify-center">
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Sample Target"
                    onClick={handleImageClick}
                    className="max-h-[380px] w-auto object-contain rounded-xl cursor-crosshair shadow-xs select-none"
                    title="Click any pixel on this image to add it to the palette"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.max(0, Math.min(255, n)).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}
