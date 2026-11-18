import { useState, useEffect, useRef, useCallback } from 'react';
import {
  QrCode,
  ScanLine,
  Download,
  Copy,
  Check,
  ExternalLink,
  Wifi,
  Globe,
  FileText,
  User,
  Sliders,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { saveAs } from 'file-saver';
import { Button } from '../../ui/Button';
import { Dropzone } from '../../ui/Dropzone';

type QrPayloadType = 'url' | 'text' | 'wifi' | 'vcard';

export function QrSuite() {
  const [tab, setTab] = useState<'generate' | 'scan'>('generate');

  // Generator State
  const [payloadType, setPayloadType] = useState<QrPayloadType>('url');
  const [urlVal, setUrlVal] = useState<string>('https://github.com/Akhil-Binu/pdf-browser');
  const [textVal, setTextVal] = useState<string>('Hello from Browser-Only Toolkit!');
  // WiFi
  const [wifiSsid, setWifiSsid] = useState<string>('MyHomeNetwork');
  const [wifiPass, setWifiPass] = useState<string>('');
  const [wifiType, setWifiType] = useState<'WPA' | 'WEP' | 'nopass'>('WPA');
  // vCard
  const [vcardName, setVcardName] = useState<string>('Alex Rivera');
  const [vcardPhone, setVcardPhone] = useState<string>('+1 555-0199');
  const [vcardEmail, setVcardEmail] = useState<string>('alex@example.com');
  const [vcardOrg, setVcardOrg] = useState<string>('Design Studio');

  // Customization
  const [fgColor, setFgColor] = useState<string>('#0f172a');
  const [bgColor, setBgColor] = useState<string>('#ffffff');
  const [ecLevel, setEcLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M');
  const [margin, setMargin] = useState<number>(2);

  // Result state
  const [generatedDataUrl, setGeneratedDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Scanner State
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanCopied, setScanCopied] = useState<boolean>(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Construct raw payload string based on type
  const getPayloadString = useCallback((): string => {
    switch (payloadType) {
      case 'url':
        return urlVal.trim();
      case 'text':
        return textVal;
      case 'wifi':
        return `WIFI:T:${wifiType};S:${wifiSsid};P:${wifiPass};;`;
      case 'vcard':
        return [
          'BEGIN:VCARD',
          'VERSION:3.0',
          `FN:${vcardName}`,
          `TEL:${vcardPhone}`,
          `EMAIL:${vcardEmail}`,
          `ORG:${vcardOrg}`,
          'END:VCARD',
        ].join('\n');
      default:
        return '';
    }
  }, [payloadType, urlVal, textVal, wifiType, wifiSsid, wifiPass, vcardName, vcardPhone, vcardEmail, vcardOrg]);

  // Re-generate QR code whenever inputs change
  useEffect(() => {
    if (tab !== 'generate') return;

    let isMounted = true;
    const payload = getPayloadString();
    if (!payload) {
      queueMicrotask(() => {
        if (isMounted) setGeneratedDataUrl('');
      });
      return;
    }

    QRCode.toDataURL(payload, {
      width: 512,
      margin,
      errorCorrectionLevel: ecLevel,
      color: {
        dark: fgColor,
        light: bgColor,
      },
    })
      .then((url) => {
        if (!isMounted) return;
        setGeneratedDataUrl(url);
        setError(null);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Failed to generate QR code');
      });

    return () => {
      isMounted = false;
    };
  }, [tab, getPayloadString, fgColor, bgColor, ecLevel, margin]);

  // Download PNG
  const handleDownloadPng = () => {
    if (!generatedDataUrl) return;
    const blob = dataUrlToBlob(generatedDataUrl);
    saveAs(blob, `qrcode_${payloadType}.png`);
  };

  // Download SVG
  const handleDownloadSvg = async () => {
    const payload = getPayloadString();
    if (!payload) return;
    try {
      const svgString = await QRCode.toString(payload, {
        type: 'svg',
        margin,
        errorCorrectionLevel: ecLevel,
        color: {
          dark: fgColor,
          light: bgColor,
        },
      });
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      saveAs(blob, `qrcode_${payloadType}.svg`);
    } catch {
      setError('Could not export SVG');
    }
  };

  // Copy to clipboard
  const handleCopyImage = async () => {
    if (!generatedDataUrl) return;
    try {
      const blob = dataUrlToBlob(generatedDataUrl);
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: copy payload string
      await navigator.clipboard.writeText(getPayloadString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Scan file handler
  const handleScanFiles = async (files: File[]) => {
    if (files.length === 0) return;
    const f = files[0];
    setIsScanning(true);
    setScanError(null);
    setScanResult(null);

    try {
      const img = new Image();
      const objectUrl = URL.createObjectURL(f);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const canvas = canvasRef.current || document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          setScanError('Failed to initialize canvas context');
          setIsScanning(false);
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        });

        if (code && code.data) {
          setScanResult(code.data);
        } else {
          setScanError('No QR code detected in the uploaded image. Ensure the image is clear and well-lit.');
        }
        setIsScanning(false);
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        setScanError('Failed to load image file');
        setIsScanning(false);
      };

      img.src = objectUrl;
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Error decoding QR code');
      setIsScanning(false);
    }
  };

  const isScanUrl = scanResult && /^https?:\/\//i.test(scanResult);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <QrCode className="w-6 h-6 text-indigo-500" />
            QR Code Generator & Scanner
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Generate high-resolution vector and raster QR codes, or decode QR codes instantly from uploaded images.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-gray-800 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setTab('generate')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              tab === 'generate'
                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            Generator
          </button>
          <button
            type="button"
            onClick={() => setTab('scan')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              tab === 'scan'
                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <ScanLine className="w-3.5 h-3.5" />
            Scanner
          </button>
        </div>
      </div>

      {tab === 'generate' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-4">
              {/* Type Switcher */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'url', label: 'URL', icon: Globe },
                  { id: 'text', label: 'Text', icon: FileText },
                  { id: 'wifi', label: 'WiFi', icon: Wifi },
                  { id: 'vcard', label: 'vCard', icon: User },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPayloadType(item.id as QrPayloadType)}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition-all ${
                        payloadType === item.id
                          ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-bold'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <Icon className="w-4 h-4 mb-1" />
                      {item.label}
                    </button>
                  );
                })}
              </div>

              {/* Input Fields */}
              <div className="space-y-3 pt-2">
                {payloadType === 'url' && (
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400 font-medium block mb-1">
                      Website URL:
                    </label>
                    <input
                      type="url"
                      value={urlVal}
                      onChange={(e) => setUrlVal(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-slate-50 dark:bg-gray-950 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}

                {payloadType === 'text' && (
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400 font-medium block mb-1">
                      Plain Text Note:
                    </label>
                    <textarea
                      rows={3}
                      value={textVal}
                      onChange={(e) => setTextVal(e.target.value)}
                      placeholder="Enter any text message..."
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-slate-50 dark:bg-gray-950 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}

                {payloadType === 'wifi' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-600 dark:text-gray-400 font-medium block mb-1">
                        Network Name (SSID):
                      </label>
                      <input
                        type="text"
                        value={wifiSsid}
                        onChange={(e) => setWifiSsid(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-slate-50 dark:bg-gray-950"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-600 dark:text-gray-400 font-medium block mb-1">
                          Password:
                        </label>
                        <input
                          type="text"
                          value={wifiPass}
                          onChange={(e) => setWifiPass(e.target.value)}
                          placeholder="Leave empty if open"
                          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-slate-50 dark:bg-gray-950"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 dark:text-gray-400 font-medium block mb-1">
                          Security:
                        </label>
                        <select
                          value={wifiType}
                          onChange={(e) => setWifiType(e.target.value as 'WPA' | 'WEP' | 'nopass')}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-slate-50 dark:bg-gray-950"
                        >
                          <option value="WPA">WPA / WPA2 / WPA3</option>
                          <option value="WEP">WEP</option>
                          <option value="nopass">None (Open)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {payloadType === 'vcard' && (
                  <div className="space-y-2.5">
                    <div>
                      <label className="text-xs text-gray-600 dark:text-gray-400 font-medium block mb-1">
                        Full Name:
                      </label>
                      <input
                        type="text"
                        value={vcardName}
                        onChange={(e) => setVcardName(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-slate-50 dark:bg-gray-950"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-600 dark:text-gray-400 font-medium block mb-1">
                          Phone:
                        </label>
                        <input
                          type="tel"
                          value={vcardPhone}
                          onChange={(e) => setVcardPhone(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-slate-50 dark:bg-gray-950"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 dark:text-gray-400 font-medium block mb-1">
                          Email:
                        </label>
                        <input
                          type="email"
                          value={vcardEmail}
                          onChange={(e) => setVcardEmail(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-slate-50 dark:bg-gray-950"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 dark:text-gray-400 font-medium block mb-1">
                        Company / Organization:
                      </label>
                      <input
                        type="text"
                        value={vcardOrg}
                        onChange={(e) => setVcardOrg(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-slate-50 dark:bg-gray-950"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Styling Options */}
              <div className="border-t border-gray-100 dark:border-gray-800 pt-3 space-y-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                  Styling & Correction
                </span>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-gray-600 dark:text-gray-400 block mb-1">Foreground Color:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={fgColor}
                        onChange={(e) => setFgColor(e.target.value)}
                        className="w-8 h-8 rounded-md border cursor-pointer"
                      />
                      <span className="font-mono text-xs">{fgColor}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-gray-600 dark:text-gray-400 block mb-1">Background Color:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="w-8 h-8 rounded-md border cursor-pointer"
                      />
                      <span className="font-mono text-xs">{bgColor}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-gray-600 dark:text-gray-400 block mb-1">Error Correction:</label>
                    <select
                      value={ecLevel}
                      onChange={(e) => setEcLevel(e.target.value as 'L' | 'M' | 'Q' | 'H')}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-slate-50 dark:bg-gray-950"
                    >
                      <option value="L">Low (7%)</option>
                      <option value="M">Medium (15%)</option>
                      <option value="Q">Quartile (25%)</option>
                      <option value="H">High (30%)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-600 dark:text-gray-400 block mb-1">Border Margin:</label>
                    <select
                      value={margin}
                      onChange={(e) => setMargin(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-slate-50 dark:bg-gray-950"
                    >
                      <option value={1}>Compact (1 block)</option>
                      <option value={2}>Standard (2 blocks)</option>
                      <option value={4}>Generous (4 blocks)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Preview & Download */}
          <div className="lg:col-span-5 flex flex-col items-center justify-between p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-4">
            <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">Live Preview</span>

            {generatedDataUrl ? (
              <div className="p-4 bg-white rounded-2xl shadow-md border border-gray-200 dark:border-gray-700">
                <img
                  src={generatedDataUrl}
                  alt="Generated QR Code"
                  className="w-60 h-60 object-contain rounded-lg"
                />
              </div>
            ) : (
              <div className="w-60 h-60 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center text-xs text-gray-400">
                Enter details to generate QR
              </div>
            )}

            <div className="w-full space-y-2 pt-2">
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" size="sm" onClick={handleDownloadPng} disabled={!generatedDataUrl}>
                  <Download className="w-3.5 h-3.5 mr-1" />
                  Save PNG
                </Button>
                <Button variant="secondary" size="sm" onClick={handleDownloadSvg} disabled={!generatedDataUrl}>
                  <Download className="w-3.5 h-3.5 mr-1" />
                  Save SVG
                </Button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyImage}
                disabled={!generatedDataUrl}
                className="w-full text-xs"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                    Copied to Clipboard!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 mr-1" />
                    Copy to Clipboard
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* Scanner Section */
        <div className="max-w-xl mx-auto space-y-4">
          <canvas ref={canvasRef} className="hidden" />

          {scanError && (
            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{scanError}</span>
            </div>
          )}

          <Dropzone
            accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }}
            onFilesAdded={handleScanFiles}
            icon={<ScanLine className="w-12 h-12 text-indigo-500" />}
            title="Drop an image with a QR code"
            subtitle="Upload screenshot, photo, or scan from camera"
          />

          {isScanning && (
            <p className="text-center text-xs text-indigo-500 animate-pulse font-medium">
              Analyzing image and decoding QR pattern...
            </p>
          )}

          {scanResult && (
            <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  Decoded Result
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(scanResult);
                    setScanCopied(true);
                    setTimeout(() => setScanCopied(false), 2000);
                  }}
                  className="text-xs text-indigo-500 hover:underline flex items-center gap-1"
                >
                  {scanCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {scanCopied ? 'Copied!' : 'Copy Text'}
                </button>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 break-all font-mono text-xs text-gray-800 dark:text-gray-200">
                {scanResult}
              </div>

              {isScanUrl && (
                <a
                  href={scanResult}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open Link in New Tab
                </a>
              )}

              <div className="pt-2">
                <Button variant="secondary" size="sm" onClick={() => setScanResult(null)} className="w-full">
                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                  Scan Another Image
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="text-xs text-red-500 text-center">{error}</div>
      )}
    </div>
  );
}

function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(';base64,');
  const contentType = parts[0].split(':')[1];
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);
  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }
  return new Blob([uInt8Array as unknown as BlobPart], { type: contentType });
}
