import { useState, useRef, useEffect, useCallback } from 'react';
import { Download, RefreshCw, Copy, Check, Type, Sparkles } from 'lucide-react';
import { saveAs } from 'file-saver';
import { Dropzone } from '../../ui/Dropzone';

const MEME_PRESETS = [
  {
    name: 'Classic Gradient',
    generate: (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#1e293b');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    },
  },
  {
    name: 'Vibrant Duo',
    generate: (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, '#4f46e5');
      grad.addColorStop(1, '#ec4899');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    },
  },
  {
    name: 'Solar Flare',
    generate: (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#f97316');
      grad.addColorStop(1, '#ef4444');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    },
  },
];

export function MemeMaker() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>('meme');
  const [topText, setTopText] = useState<string>('WHEN THE CODE COMPILES');
  const [bottomText, setBottomText] = useState<string>('ON THE FIRST TRY');
  const [fontSize, setFontSize] = useState<number>(36);
  const [fontFamily, setFontFamily] = useState<string>('Impact, Arial Black, sans-serif');
  const [textColor, setTextColor] = useState<string>('#ffffff');
  const [strokeColor, setStrokeColor] = useState<string>('#000000');
  const [strokeWidth, setStrokeWidth] = useState<number>(4);
  const [allCaps, setAllCaps] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loadedImageRef = useRef<HTMLImageElement | null>(null);

  const handleImageUpload = (files: File[]) => {
    if (files.length === 0) return;
    const file = files[0];
    setImageName(file.name.replace(/\.[^/.]+$/, ''));
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      setImageSrc(src);
      const img = new Image();
      img.onload = () => {
        loadedImageRef.current = img;
        drawMeme();
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const drawTextWithWrapping = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      text: string,
      x: number,
      startY: number,
      maxWidth: number,
      lineHeight: number,
      isTop: boolean
    ) => {
      if (!text.trim()) return;
      const formatted = allCaps ? text.toUpperCase() : text;
      const words = formatted.split(' ');
      const lines: string[] = [];
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);

      const totalBlockHeight = lines.length * lineHeight;
      let y = isTop ? startY : startY - totalBlockHeight + lineHeight;

      ctx.fillStyle = textColor;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.textAlign = 'center';
      ctx.lineJoin = 'round';
      ctx.miterLimit = 2;

      for (const line of lines) {
        if (strokeWidth > 0) {
          ctx.strokeText(line, x, y);
        }
        ctx.fillText(line, x, y);
        y += lineHeight;
      }
    },
    [allCaps, textColor, strokeColor, strokeWidth]
  );

  const drawMeme = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 640;
    let height = 480;

    if (loadedImageRef.current) {
      width = loadedImageRef.current.naturalWidth || 640;
      height = loadedImageRef.current.naturalHeight || 480;
      // Cap maximum dimensions for crisp rendering without excessive memory
      if (width > 1200 || height > 1200) {
        const ratio = Math.min(1200 / width, 1200 / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
    }

    canvas.width = width;
    canvas.height = height;

    if (loadedImageRef.current) {
      ctx.drawImage(loadedImageRef.current, 0, 0, width, height);
    } else {
      // Default placeholder background
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#1e293b');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    }

    // Dynamic scale font based on canvas width
    const responsiveFontSize = Math.round((fontSize * width) / 600);
    ctx.font = `bold ${responsiveFontSize}px ${fontFamily}`;
    const lineHeight = responsiveFontSize * 1.15;
    const padding = 20;
    const maxWidth = width - padding * 2;

    // Draw Top Text
    drawTextWithWrapping(ctx, topText, width / 2, padding + responsiveFontSize, maxWidth, lineHeight, true);

    // Draw Bottom Text
    drawTextWithWrapping(ctx, bottomText, width / 2, height - padding, maxWidth, lineHeight, false);
  }, [drawTextWithWrapping, fontSize, fontFamily, topText, bottomText]);

  useEffect(() => {
    drawMeme();
  }, [drawMeme]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (blob) {
        saveAs(blob, `${imageName}-meme.png`);
      }
    }, 'image/png');
  };

  const handleCopyClipboard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }, 'image/png');
    } catch {
      // Clipboard write image might require permission or secure context
      handleDownload();
    }
  };

  const handlePresetSelect = (preset: typeof MEME_PRESETS[0]) => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      preset.generate(ctx, 640, 480);
      const dataUrl = canvas.toDataURL('image/png');
      setImageSrc(dataUrl);
      setImageName(preset.name.toLowerCase().replace(/\s+/g, '-'));
      const img = new Image();
      img.onload = () => {
        loadedImageRef.current = img;
        drawMeme();
      };
      img.src = dataUrl;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Type className="w-5 h-5 text-pink-500" />
          Client-Side Meme Generator
        </h3>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
          Craft viral memes directly in your browser. Upload any picture or use a preset backdrop with crisp typography and zero watermarks.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Controls */}
        <div className="lg:col-span-5 space-y-4">
          <Dropzone
            accept="image/*"
            maxFiles={1}
            onDrop={handleImageUpload}
            label={imageSrc ? 'Drop a new image to replace' : 'Upload Meme Image (PNG, JPG, WebP)'}
          />

          {/* Quick Presets */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-pink-500" /> Or pick a backdrop:
            </span>
            {MEME_PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => handlePresetSelect(p)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-pink-950/40 hover:text-pink-600 dark:hover:text-pink-400 font-medium transition cursor-pointer"
              >
                {p.name}
              </button>
            ))}
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-850 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Top Text
              </label>
              <input
                type="text"
                value={topText}
                onChange={(e) => setTopText(e.target.value)}
                placeholder="TOP TEXT..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-bold focus:ring-2 focus:ring-pink-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Bottom Text
              </label>
              <input
                type="text"
                value={bottomText}
                onChange={(e) => setBottomText(e.target.value)}
                placeholder="BOTTOM TEXT..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-bold focus:ring-2 focus:ring-pink-500 outline-none"
              />
            </div>

            {/* Typography & Styling Controls */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  Font Family
                </label>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200"
                >
                  <option value="Impact, Arial Black, sans-serif">Classic Impact</option>
                  <option value="Arial, sans-serif">Arial Clean</option>
                  <option value="'Comic Sans MS', cursive, sans-serif">Comic Sans</option>
                  <option value="monospace">Monospace</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">
                    Font Size
                  </span>
                  <span className="text-[11px] font-bold text-gray-900 dark:text-gray-100">
                    {fontSize}px
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="64"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full accent-pink-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  Text Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-7 h-7 rounded border border-gray-300 dark:border-gray-600 cursor-pointer p-0 bg-transparent"
                  />
                  <span className="text-[11px] text-gray-600 dark:text-gray-300 font-mono">
                    {textColor}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  Stroke Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={strokeColor}
                    onChange={(e) => setStrokeColor(e.target.value)}
                    className="w-7 h-7 rounded border border-gray-300 dark:border-gray-600 cursor-pointer p-0 bg-transparent"
                  />
                  <span className="text-[11px] text-gray-600 dark:text-gray-300 font-mono">
                    {strokeColor}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allCaps}
                  onChange={(e) => setAllCaps(e.target.checked)}
                  className="rounded text-pink-600 focus:ring-pink-500"
                />
                Force ALL-CAPS
              </label>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-gray-500">Outline:</span>
                {[0, 2, 4, 6].map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setStrokeWidth(w)}
                    className={`px-2 py-0.5 text-[10px] rounded font-bold ${
                      strokeWidth === w
                        ? 'bg-pink-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {w}px
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Canvas Preview & Actions */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="w-full p-3 bg-gray-900 rounded-2xl border border-gray-800 flex flex-col items-center justify-center overflow-hidden shadow-inner">
            <canvas
              ref={canvasRef}
              className="max-w-full h-auto max-h-[500px] object-contain rounded-xl shadow-lg"
            />
          </div>

          <div className="w-full flex flex-wrap items-center justify-between gap-3 mt-4">
            <button
              type="button"
              onClick={() => {
                setTopText('');
                setBottomText('');
              }}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Clear Text
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleCopyClipboard}
                className="px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy Image
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-pink-600/20 transition cursor-pointer"
              >
                <Download className="w-4 h-4" /> Download Meme (PNG)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
