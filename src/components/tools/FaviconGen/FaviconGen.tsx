import { useState, useCallback } from 'react';
import {
  Sparkles,
  Download,
  Copy,
  Check,
  AlertCircle,
  RotateCcw,
  Code,
  Layers,
  Image as ImageIcon,
} from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Dropzone } from '../../ui/Dropzone';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';

interface IconSize {
  name: string;
  width: number;
  height: number;
}

const ICON_SIZES: IconSize[] = [
  { name: 'favicon-16x16.png', width: 16, height: 16 },
  { name: 'favicon-32x32.png', width: 32, height: 32 },
  { name: 'apple-touch-icon.png', width: 180, height: 180 },
  { name: 'android-chrome-192x192.png', width: 192, height: 192 },
  { name: 'android-chrome-512x512.png', width: 512, height: 512 },
];

export function FaviconGen() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [appName, setAppName] = useState<string>('My Web App');

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copiedSnippet, setCopiedSnippet] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesAdded = useCallback((files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setFile(selected);
    setError(null);

    const url = URL.createObjectURL(selected);
    setPreviewUrl(url);
  }, []);

  const renderResizedBlob = (img: HTMLImageElement, size: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas context failure'));

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, size, size);

      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error(`Failed to generate ${size}x${size} icon`));
      }, 'image/png');
    });
  };

  const createIcoFile = (png32Bytes: Uint8Array): Uint8Array => {
    // Standard ICO container wrapping 32x32 PNG
    const icoHeader = new Uint8Array(6 + 16 + png32Bytes.length);
    const view = new DataView(icoHeader.buffer);

    // ICONDIR
    view.setUint16(0, 0, true); // Reserved (0)
    view.setUint16(2, 1, true); // Type (1 = ICO)
    view.setUint16(4, 1, true); // Image count (1)

    // ICONDIRENTRY (Entry 0: 32x32)
    view.setUint8(6, 32); // Width (32)
    view.setUint8(7, 32); // Height (32)
    view.setUint8(8, 0); // Palette colors
    view.setUint8(9, 0); // Reserved
    view.setUint16(10, 1, true); // Color planes
    view.setUint16(12, 32, true); // Bits per pixel
    view.setUint32(14, png32Bytes.length, true); // Bytes in resource
    view.setUint32(18, 22, true); // Offset to image data (6 + 16 = 22)

    // Copy PNG bytes
    icoHeader.set(png32Bytes, 22);
    return icoHeader;
  };

  const handleGenerateZip = async () => {
    if (!previewUrl) return;
    setIsGenerating(true);
    setError(null);

    try {
      const zip = new JSZip();
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Could not decode master icon image'));
        img.src = previewUrl;
      });

      let png32Blob: Blob | null = null;

      // Render standard sizes
      for (const item of ICON_SIZES) {
        const blob = await renderResizedBlob(img, item.width);
        zip.file(item.name, blob);
        if (item.width === 32) png32Blob = blob;
      }

      // Generate favicon.ico
      if (png32Blob) {
        const arr = new Uint8Array(await png32Blob.arrayBuffer());
        const icoBytes = createIcoFile(arr);
        zip.file('favicon.ico', icoBytes);
      }

      // Generate site.webmanifest
      const manifest = {
        name: appName,
        short_name: appName,
        icons: [
          {
            src: '/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
      };
      zip.file('site.webmanifest', JSON.stringify(manifest, null, 2));

      // Generate Readme / instruction file
      const htmlTags = [
        '<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">',
        '<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">',
        '<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">',
        '<link rel="manifest" href="/site.webmanifest">',
      ].join('\n');
      zip.file('html_tags.html', htmlTags);

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, 'favicon_package.zip');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate favicon package');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyTags = () => {
    const htmlTags = [
      '<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">',
      '<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">',
      '<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">',
      '<link rel="manifest" href="/site.webmanifest">',
    ].join('\n');
    navigator.clipboard.writeText(htmlTags);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const handleReset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-pink-500" />
          Favicon & App Icon Generator
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Upload a high-res logo or illustration and generate a complete multi-platform icon package (16px, 32px, 180px, 192px, 512px, favicon.ico, and site.webmanifest).
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!file ? (
        <Dropzone
          accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.svg', '.webp'] }}
          onFilesAdded={handleFilesAdded}
          icon={<ImageIcon className="w-12 h-12 text-pink-500" />}
          title="Drop master image here"
          subtitle="PNG, SVG, or high-res JPG (Square 512x512 or higher recommended)"
        />
      ) : (
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-100 dark:bg-gray-800/60 border border-slate-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Uploaded Master"
                  className="w-12 h-12 rounded-xl object-cover border border-gray-300 dark:border-gray-700 bg-white"
                />
              )}
              <div>
                <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{file.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Ready to produce 5 icons + favicon.ico + webmanifest
                </p>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Upload Different Image
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Browser Preview Mockups */}
            <div className="lg:col-span-7 space-y-4">
              <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 block">
                Browser Tab & App Previews
              </span>

              {/* Light Browser Tab Mockup */}
              <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-slate-100 p-3 space-y-2 shadow-xs">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  Desktop Browser Tab (Light Mode)
                </span>
                <div className="bg-slate-200 rounded-lg p-1.5 flex items-center">
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-md shadow-xs max-w-xs">
                    {previewUrl && (
                      <img src={previewUrl} alt="Tab Icon" className="w-4 h-4 rounded-xs object-contain" />
                    )}
                    <span className="text-xs font-medium text-gray-800 truncate">{appName}</span>
                    <span className="text-gray-400 text-xs ml-2">×</span>
                  </div>
                </div>
              </div>

              {/* Dark Browser Tab Mockup */}
              <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-950 p-3 space-y-2 shadow-xs">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  Desktop Browser Tab (Dark Mode)
                </span>
                <div className="bg-gray-900 rounded-lg p-1.5 flex items-center">
                  <div className="flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-md shadow-xs max-w-xs border border-gray-700">
                    {previewUrl && (
                      <img src={previewUrl} alt="Tab Icon" className="w-4 h-4 rounded-xs object-contain" />
                    )}
                    <span className="text-xs font-medium text-gray-200 truncate">{appName}</span>
                    <span className="text-gray-500 text-xs ml-2">×</span>
                  </div>
                </div>
              </div>

              {/* Mobile Home Screen Mockup */}
              <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                  Mobile Home Screen (Apple Touch / PWA Icon)
                </span>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-md border border-gray-200 dark:border-gray-700 bg-white flex items-center justify-center p-1">
                    {previewUrl && (
                      <img src={previewUrl} alt="App Icon" className="w-full h-full object-contain rounded-xl" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{appName}</p>
                    <p className="text-xs text-gray-500">180x180 & 192x192 icons included</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Export & Code Panel */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-4">
                <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-pink-500" />
                  Package Configuration
                </span>

                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-400 font-medium block mb-1">
                    Web App Title:
                  </label>
                  <input
                    type="text"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-slate-50 dark:bg-gray-950"
                  />
                </div>

                <div className="pt-2">
                  <Button
                    onClick={handleGenerateZip}
                    disabled={isGenerating}
                    className="w-full bg-pink-600 hover:bg-pink-700 text-white font-medium py-2.5"
                  >
                    {isGenerating ? (
                      <>
                        <Spinner className="w-4 h-4 mr-2" />
                        Generating Icons & ZIP...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Download Favicon Package (.zip)
                      </>
                    )}
                  </Button>
                </div>

                {/* HTML Tags Section */}
                <div className="border-t border-gray-100 dark:border-gray-800 pt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      <Code className="w-3.5 h-3.5 text-pink-500" />
                      HTML Header Tags
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyTags}
                      className="text-xs text-pink-600 dark:text-pink-400 hover:underline flex items-center gap-1"
                    >
                      {copiedSnippet ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedSnippet ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <pre className="p-2.5 rounded-lg bg-slate-900 text-slate-100 text-[11px] font-mono overflow-x-auto leading-relaxed">
{`<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="manifest" href="/site.webmanifest">`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
