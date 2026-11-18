import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Stamp,
  Image as ImageIcon,
  Download,
  RotateCcw,
  AlertCircle,
  Sliders,
  Type,
} from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Dropzone } from '../../ui/Dropzone';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';

type PositionPreset = 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'tile';

export function BatchWatermark() {
  const [files, setFiles] = useState<File[]>([]);
  const [watermarkType, setWatermarkType] = useState<'text' | 'logo'>('text');

  // Text watermark
  const [wmText, setWmText] = useState<string>('CONFIDENTIAL');
  const [textColor, setTextColor] = useState<string>('#ffffff');
  const [textSize, setTextSize] = useState<number>(36);
  const [opacity, setOpacity] = useState<number>(0.6);
  const [position, setPosition] = useState<PositionPreset>('bottom-right');

  // Logo watermark
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoScale, setLogoScale] = useState<number>(20); // % of image width

  // Preview state
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleFilesAdded = useCallback((added: File[]) => {
    if (added.length === 0) return;
    setFiles((prev) => [...prev, ...added]);
    setError(null);
  }, []);

  const handleLogoAdded = useCallback((added: File[]) => {
    if (added.length === 0) return;
    const f = added[0];
    setLogoFile(f);
    setLogoUrl(URL.createObjectURL(f));
  }, []);

  // Render watermarked image on canvas
  const renderWatermarkedCanvas = useCallback(
    async (fileItem: File): Promise<HTMLCanvasElement> => {
      const img = new Image();
      const url = URL.createObjectURL(fileItem);
      await new Promise<void>((res, rej) => {
        img.onload = () => res();
        img.onerror = () => rej(new Error('Failed to load image'));
        img.src = url;
      });
      URL.revokeObjectURL(url);

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context failed');

      ctx.drawImage(img, 0, 0);
      ctx.globalAlpha = opacity;

      const w = canvas.width;
      const h = canvas.height;

      if (watermarkType === 'text') {
        ctx.fillStyle = textColor;
        ctx.font = `bold ${textSize}px sans-serif`;
        ctx.textBaseline = 'middle';

        const metrics = ctx.measureText(wmText);
        const textW = metrics.width;
        const textH = textSize;
        const pad = 40;

        if (position === 'center') {
          ctx.fillText(wmText, (w - textW) / 2, h / 2);
        } else if (position === 'top-left') {
          ctx.fillText(wmText, pad, pad + textH / 2);
        } else if (position === 'top-right') {
          ctx.fillText(wmText, w - textW - pad, pad + textH / 2);
        } else if (position === 'bottom-left') {
          ctx.fillText(wmText, pad, h - pad - textH / 2);
        } else if (position === 'bottom-right') {
          ctx.fillText(wmText, w - textW - pad, h - pad - textH / 2);
        } else if (position === 'tile') {
          ctx.save();
          ctx.rotate((-25 * Math.PI) / 180);
          const stepX = textW + 120;
          const stepY = textH + 100;
          for (let x = -w; x < w * 2; x += stepX) {
            for (let y = -h; y < h * 2; y += stepY) {
              ctx.fillText(wmText, x, y);
            }
          }
          ctx.restore();
        }
      } else if (watermarkType === 'logo' && logoUrl) {
        const logoImg = new Image();
        await new Promise<void>((res) => {
          logoImg.onload = () => res();
          logoImg.src = logoUrl;
        });

        const targetW = (w * logoScale) / 100;
        const targetH = (logoImg.naturalHeight / logoImg.naturalWidth) * targetW;
        const pad = 30;

        let posX = w - targetW - pad;
        let posY = h - targetH - pad;

        if (position === 'center') {
          posX = (w - targetW) / 2;
          posY = (h - targetH) / 2;
        } else if (position === 'top-left') {
          posX = pad;
          posY = pad;
        } else if (position === 'top-right') {
          posX = w - targetW - pad;
          posY = pad;
        } else if (position === 'bottom-left') {
          posX = pad;
          posY = h - targetH - pad;
        }

        ctx.drawImage(logoImg, posX, posY, targetW, targetH);
      }

      ctx.globalAlpha = 1.0;
      return canvas;
    },
    [watermarkType, wmText, textColor, textSize, opacity, position, logoUrl, logoScale]
  );

  // Update live preview of first image
  useEffect(() => {
    if (files.length === 0) return;

    let isMounted = true;
    renderWatermarkedCanvas(files[0])
      .then((c) => {
        if (!isMounted) return;
        setPreviewDataUrl(c.toDataURL('image/jpeg', 0.85));
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [files, renderWatermarkedCanvas]);

  const handleDownloadAll = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setError(null);

    try {
      const zip = new JSZip();

      for (let i = 0; i < files.length; i++) {
        const fileItem = files[i];
        const canvas = await renderWatermarkedCanvas(fileItem);
        const blob = await new Promise<Blob>((res) =>
          canvas.toBlob((b) => res(b!), 'image/jpeg', 0.92)
        );
        const base = fileItem.name.replace(/\.[^/.]+$/, '');
        zip.file(`${base}_watermarked.jpg`, blob);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, 'watermarked_images.zip');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Batch watermarking failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setPreviewDataUrl(null);
    setLogoFile(null);
    setLogoUrl(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Stamp className="w-6 h-6 text-amber-500" />
          Batch Image Watermark & Logo Stamper
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Apply transparent text stamps, copyright badges, or logo watermarks across dozens of photos simultaneously with live preview.
        </p>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {files.length === 0 ? (
        <Dropzone
          accept="image/*"
          multiple={true}
          onFilesAdded={handleFilesAdded}
          icon={<Stamp className="w-12 h-12 text-amber-500" />}
          title="Drop photos here to watermark"
          subtitle="Batch process PNG, JPG, and WebP images"
        />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-100 dark:bg-gray-800/60 border border-slate-200 dark:border-gray-700">
            <div>
              <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                {files.length} {files.length === 1 ? 'image' : 'images'} loaded
              </p>
              <p className="text-xs text-gray-500">Live preview reflects image #1</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={handleReset}>
                <RotateCcw className="w-4 h-4 mr-1.5" />
                Clear All
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Settings */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-4">
                {/* Type Selection */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setWatermarkType('text')}
                    className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 ${
                      watermarkType === 'text'
                        ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600'
                    }`}
                  >
                    <Type className="w-4 h-4" /> Text Stamp
                  </button>
                  <button
                    type="button"
                    onClick={() => setWatermarkType('logo')}
                    className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 ${
                      watermarkType === 'logo'
                        ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600'
                    }`}
                  >
                    <ImageIcon className="w-4 h-4" /> PNG Logo
                  </button>
                </div>

                {watermarkType === 'text' ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-500 font-medium block mb-1">Watermark Text:</label>
                      <input
                        type="text"
                        value={wmText}
                        onChange={(e) => setWmText(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-slate-50 dark:bg-gray-950 font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="text-gray-500 block mb-1">Color:</label>
                        <input
                          type="color"
                          value={textColor}
                          onChange={(e) => setTextColor(e.target.value)}
                          className="w-full h-8 rounded-lg border cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="text-gray-500 block mb-1">Font Size ({textSize}px):</label>
                        <input
                          type="range"
                          min={16}
                          max={96}
                          value={textSize}
                          onChange={(e) => setTextSize(Number(e.target.value))}
                          className="w-full accent-amber-500"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <label className="text-xs text-gray-500 font-medium block">Upload Logo (PNG):</label>
                    {!logoFile ? (
                      <Dropzone
                        accept="image/png"
                        multiple={false}
                        onFilesAdded={handleLogoAdded}
                        icon={<ImageIcon className="w-6 h-6 text-amber-500" />}
                        title="Upload Logo PNG"
                        subtitle="Transparent PNG recommended"
                      />
                    ) : (
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-gray-800 text-xs">
                        <span>{logoFile.name}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setLogoFile(null);
                            setLogoUrl(null);
                          }}
                          className="text-red-500 hover:underline"
                        >
                          Change
                        </button>
                      </div>
                    )}

                    <div>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Logo Size:</span>
                        <span>{logoScale}%</span>
                      </div>
                      <input
                        type="range"
                        min={5}
                        max={60}
                        value={logoScale}
                        onChange={(e) => setLogoScale(Number(e.target.value))}
                        className="w-full accent-amber-500"
                      />
                    </div>
                  </div>
                )}

                {/* Common Settings: Opacity & Position */}
                <div className="border-t border-gray-100 dark:border-gray-800 pt-3 space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                    <Sliders className="w-3 h-3 text-amber-500" /> Positioning & Opacity
                  </span>

                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Opacity:</span>
                      <span>{Math.round(opacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0.1}
                      max={1.0}
                      step={0.05}
                      value={opacity}
                      onChange={(e) => setOpacity(Number(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Placement:</label>
                    <select
                      value={position}
                      onChange={(e) => setPosition(e.target.value as PositionPreset)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-slate-50 dark:bg-gray-950"
                    >
                      <option value="bottom-right">Bottom Right Corner</option>
                      <option value="bottom-left">Bottom Left Corner</option>
                      <option value="top-right">Top Right Corner</option>
                      <option value="top-left">Top Left Corner</option>
                      <option value="center">Centered</option>
                      {watermarkType === 'text' && <option value="tile">Repeated Diagonal Tile</option>}
                    </select>
                  </div>
                </div>

                <Button
                  onClick={handleDownloadAll}
                  disabled={isProcessing}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-2.5"
                >
                  {isProcessing ? (
                    <>
                      <Spinner className="w-4 h-4 mr-2" />
                      Processing Images...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Watermark All & Download ZIP ({files.length})
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Live Preview */}
            <div className="lg:col-span-7 space-y-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                Live Preview Output
              </span>

              <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-slate-900 p-2 flex items-center justify-center min-h-[360px] overflow-hidden shadow-inner">
                {previewDataUrl ? (
                  <img
                    src={previewDataUrl}
                    alt="Watermark Preview"
                    className="max-h-[460px] w-auto max-w-full object-contain rounded-xl shadow-md"
                  />
                ) : (
                  <Spinner className="w-8 h-8 text-amber-500" />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
