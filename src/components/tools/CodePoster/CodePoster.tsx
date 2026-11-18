import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Code2,
  Download,
  Copy,
  Check,
  FileText,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { saveAs } from 'file-saver';
import { Button } from '../../ui/Button';
import { PDFDocument } from 'pdf-lib';

type GradientTheme = 'midnight' | 'sunset' | 'emerald' | 'indigo' | 'mono';

const THEMES: { id: GradientTheme; name: string; bg: string; grad: [string, string] }[] = [
  { id: 'midnight', name: 'Midnight', bg: 'from-slate-900 via-indigo-950 to-slate-900', grad: ['#0f172a', '#1e1b4b'] },
  { id: 'sunset', name: 'Sunset', bg: 'from-rose-500 via-pink-500 to-amber-500', grad: ['#f43f5e', '#fb923c'] },
  { id: 'emerald', name: 'Emerald', bg: 'from-emerald-600 via-teal-600 to-cyan-700', grad: ['#059669', '#0891b2'] },
  { id: 'indigo', name: 'Electric', bg: 'from-indigo-600 via-purple-600 to-pink-600', grad: ['#4f46e5', '#9333ea'] },
  { id: 'mono', name: 'Minimal Mono', bg: 'from-gray-800 to-gray-900', grad: ['#1e293b', '#0f172a'] },
];

const DEFAULT_CODE = `// High-Performance Browser-Only Utility
export async function processDocument(file: File) {
  const buffer = await file.arrayBuffer();
  console.log(\`Loaded \${file.name} (\${buffer.byteLength} bytes)\`);
  
  // 100% Client-Side. Zero API calls.
  return { success: true, timestamp: Date.now() };
}`;

export function CodePoster() {
  const [code, setCode] = useState<string>(DEFAULT_CODE);
  const [title, setTitle] = useState<string>('snippet.ts');
  const [theme, setTheme] = useState<GradientTheme>('midnight');
  const [showLineNumbers, setShowLineNumbers] = useState<boolean>(true);
  const [showWindowDots, setShowWindowDots] = useState<boolean>(true);
  const [padding, setPadding] = useState<number>(40);

  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Render high-DPI canvas
  const renderCardToCanvas = useCallback((): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    const dpr = 2; // Retina sharpness

    const lines = code.split('\n');
    const lineHeight = 24;
    const fontSize = 14;
    const charWidth = 8.5; // Approximation for monospace font
    const maxLineLen = Math.max(...lines.map((l) => l.length), 25);

    const codeWidth = Math.max(500, maxLineLen * charWidth + (showLineNumbers ? 60 : 30));
    const codeHeight = lines.length * lineHeight + (showWindowDots ? 60 : 30);

    const totalWidth = codeWidth + padding * 2;
    const totalHeight = codeHeight + padding * 2;

    canvas.width = totalWidth * dpr;
    canvas.height = totalHeight * dpr;

    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    ctx.scale(dpr, dpr);

    // 1. Draw outer gradient background
    const selectedTheme = THEMES.find((t) => t.id === theme) || THEMES[0];
    const grad = ctx.createLinearGradient(0, 0, totalWidth, totalHeight);
    grad.addColorStop(0, selectedTheme.grad[0]);
    grad.addColorStop(1, selectedTheme.grad[1]);

    ctx.fillStyle = grad;
    roundRect(ctx, 0, 0, totalWidth, totalHeight, 16);
    ctx.fill();

    // 2. Window container shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 35;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 15;

    // 3. Window container body
    const winX = padding;
    const winY = padding;
    ctx.fillStyle = '#0f172a'; // Dark editor slate
    roundRect(ctx, winX, winY, codeWidth, codeHeight, 12);
    ctx.fill();
    ctx.restore();

    // Subtle window border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    roundRect(ctx, winX, winY, codeWidth, codeHeight, 12);
    ctx.stroke();

    // 4. Window header
    if (showWindowDots) {
      // macOS traffic dots
      const dotY = winY + 20;
      // Red
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(winX + 22, dotY, 6, 0, Math.PI * 2);
      ctx.fill();
      // Yellow
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(winX + 40, dotY, 6, 0, Math.PI * 2);
      ctx.fill();
      // Green
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(winX + 58, dotY, 6, 0, Math.PI * 2);
      ctx.fill();

      // Title in header center
      if (title.trim()) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '500 12px ui-sans-serif, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(title.trim(), winX + codeWidth / 2, dotY + 4);
      }
    }

    // 5. Code content & lines
    const startY = winY + (showWindowDots ? 50 : 25);
    ctx.font = `${fontSize}px "JetBrains Mono", "Fira Code", Menlo, monospace`;
    ctx.textBaseline = 'middle';

    lines.forEach((line, index) => {
      const y = startY + index * lineHeight;

      // Line numbers
      if (showLineNumbers) {
        ctx.textAlign = 'right';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.fillText(String(index + 1), winX + 38, y);
      }

      // Syntax Highlight token drawing
      ctx.textAlign = 'left';
      const textX = winX + (showLineNumbers ? 55 : 20);

      // Lightweight syntax parser
      drawSyntaxHighlightedLine(ctx, line, textX, y);
    });

    return canvas;
  }, [code, title, theme, showLineNumbers, showWindowDots, padding]);

  // Update preview when state changes
  useEffect(() => {
    let isMounted = true;
    queueMicrotask(() => {
      if (!isMounted) return;
      const canvas = renderCardToCanvas();
      canvasRef.current = canvas;
      const url = canvas.toDataURL('image/png');
      setPreviewUrl(url);
    });
    return () => {
      isMounted = false;
    };
  }, [renderCardToCanvas]);

  const handleDownloadPng = () => {
    const canvas = renderCardToCanvas();
    canvas.toBlob((blob) => {
      if (blob) {
        saveAs(blob, `${title.replace(/\.[^/.]+$/, '')}_code_card.png`);
      }
    }, 'image/png');
  };

  const handleDownloadPdf = async () => {
    const canvas = renderCardToCanvas();
    const pngDataUrl = canvas.toDataURL('image/png');
    const parts = pngDataUrl.split(';base64,');
    const raw = window.atob(parts[1]);
    const uInt8Array = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }

    const pdfDoc = await PDFDocument.create();
    const pngImg = await pdfDoc.embedPng(uInt8Array);
    const page = pdfDoc.addPage([pngImg.width / 2 + 40, pngImg.height / 2 + 40]);
    page.drawImage(pngImg, {
      x: 20,
      y: 20,
      width: pngImg.width / 2,
      height: pngImg.height / 2,
    });

    const pdfBytes = await pdfDoc.save();
    const pdfBlob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
    saveAs(pdfBlob, `${title.replace(/\.[^/.]+$/, '')}_code_poster.pdf`);
  };

  const handleCopyImage = async () => {
    const canvas = renderCardToCanvas();
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }, 'image/png');
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Code2 className="w-6 h-6 text-cyan-500" />
          Code Poster & Social Card Generator
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Turn your code snippets into polished, presentation-ready images and PDF documents with radiant gradient backdrops.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Editor & Controls */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-4">
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400 font-medium block mb-1">
                Window File Title:
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="index.ts"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-slate-50 dark:bg-gray-950"
              />
            </div>

            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400 font-medium block mb-1">
                Source Code:
              </label>
              <textarea
                rows={9}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full p-3 font-mono text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-slate-900 text-slate-100"
              />
            </div>

            {/* Gradient Theme */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-600 dark:text-gray-400 font-medium block">
                Gradient Backdrop:
              </label>
              <div className="flex gap-2">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTheme(t.id)}
                    title={t.name}
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${
                      theme === t.id ? 'scale-110 border-cyan-500 ring-2 ring-cyan-500/30' : 'border-transparent'
                    }`}
                    style={{
                      background: `linear-gradient(135deg, ${t.grad[0]}, ${t.grad[1]})`,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Options */}
            <div className="border-t border-gray-100 dark:border-gray-800 pt-3 space-y-2 text-xs">
              <span className="font-semibold text-gray-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
                <Sliders className="w-3 h-3 text-cyan-500" /> Options
              </span>

              <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={showLineNumbers}
                  onChange={(e) => setShowLineNumbers(e.target.checked)}
                  className="rounded text-cyan-600 focus:ring-cyan-500"
                />
                <span>Show Line Numbers</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={showWindowDots}
                  onChange={(e) => setShowWindowDots(e.target.checked)}
                  className="rounded text-cyan-600 focus:ring-cyan-500"
                />
                <span>macOS Traffic Window Dots</span>
              </label>

              <div>
                <div className="flex justify-between text-gray-500 text-[11px] mb-1">
                  <span>Padding:</span>
                  <span>{padding}px</span>
                </div>
                <input
                  type="range"
                  min={16}
                  max={60}
                  step={4}
                  value={padding}
                  onChange={(e) => setPadding(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" onClick={handleDownloadPng} className="bg-cyan-600 hover:bg-cyan-700 text-white font-medium">
                  <Download className="w-3.5 h-3.5 mr-1" />
                  Save PNG
                </Button>
                <Button variant="secondary" size="sm" onClick={handleDownloadPdf}>
                  <FileText className="w-3.5 h-3.5 mr-1" />
                  Save PDF
                </Button>
              </div>
              <Button variant="ghost" size="sm" onClick={handleCopyImage} className="w-full text-xs">
                {copied ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                {copied ? 'Copied Image to Clipboard!' : 'Copy Image to Clipboard'}
              </Button>
            </div>
          </div>
        </div>

        {/* Live Canvas Preview */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center p-3 sm:p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-3">
          <span className="font-semibold text-xs text-gray-400 uppercase tracking-wider flex items-center gap-1 self-start">
            <Sparkles className="w-3.5 h-3.5 text-cyan-500" /> Live High-DPI Output
          </span>

          {previewUrl && (
            <div className="max-w-full overflow-auto rounded-xl shadow-lg border border-gray-300 dark:border-gray-800 p-2 bg-slate-50 dark:bg-gray-950 flex items-center justify-center">
              <img
                src={previewUrl}
                alt="Rendered Card"
                className="max-h-[500px] w-auto max-w-full object-contain rounded-lg shadow-sm"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Simple syntax colorizer for keywords, strings, comments
function drawSyntaxHighlightedLine(ctx: CanvasRenderingContext2D, line: string, x: number, y: number) {
  // Check comment
  const trimmed = line.trim();
  if (trimmed.startsWith('//') || trimmed.startsWith('#')) {
    ctx.fillStyle = '#64748b'; // Muted comment gray
    ctx.fillText(line, x, y);
    return;
  }

  // Tokens regex
  const keywords = /\b(export|import|from|function|async|await|return|const|let|var|if|else|interface|type|class)\b/;
  const strings = /(["'`].*?["'`])/;

  const parts = line.split(/(\s+|[(),;={}.[\]])/);
  let currentX = x;

  for (const part of parts) {
    if (!part) continue;

    if (keywords.test(part)) {
      ctx.fillStyle = '#c084fc'; // Purple keyword
    } else if (strings.test(part)) {
      ctx.fillStyle = '#fde047'; // Amber string
    } else if (/^\d+$/.test(part)) {
      ctx.fillStyle = '#38bdf8'; // Cyan number
    } else if (/[(),;={}.[\]]/.test(part)) {
      ctx.fillStyle = '#94a3b8'; // Punctuation
    } else {
      ctx.fillStyle = '#f8fafc'; // White text
    }

    ctx.fillText(part, currentX, y);
    currentX += ctx.measureText(part).width;
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
