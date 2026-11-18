import { useState, useCallback } from 'react';
import {
  EyeOff,
  Eye,
  Lock,
  Copy,
  Check,
  RotateCcw,
  Download,
  AlertCircle,
  Image as ImageIcon,
} from 'lucide-react';
import { saveAs } from 'file-saver';
import { Dropzone } from '../../ui/Dropzone';
import { Button } from '../../ui/Button';

const MAGIC_HEADER = [83, 84, 69, 71]; // 'STEG'

export function Steganography() {
  const [tab, setTab] = useState<'encode' | 'decode'>('encode');
  const [file, setFile] = useState<File | null>(null);
  const [secretText, setSecretText] = useState<string>('');
  const [decodedText, setDecodedText] = useState<string | null>(null);

  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesAdded = useCallback((files: File[]) => {
    if (files.length === 0) return;
    setFile(files[0]);
    setError(null);
    setDecodedText(null);
  }, []);

  const handleEncode = async () => {
    if (!file || !secretText.trim()) return;
    setError(null);

    try {
      const img = new Image();
      const url = URL.createObjectURL(file);
      await new Promise<void>((res, rej) => {
        img.onload = () => res();
        img.onerror = () => rej(new Error('Failed to load cover image'));
        img.src = url;
      });
      URL.revokeObjectURL(url);

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      // Prepare payload: Magic (4B) + Length (4B) + UTF8 text
      const enc = new TextEncoder();
      const textBytes = enc.encode(secretText);
      const totalPayload = new Uint8Array(8 + textBytes.length);

      // Magic 'STEG'
      totalPayload.set(MAGIC_HEADER, 0);

      // 32-bit length
      const view = new DataView(totalPayload.buffer);
      view.setUint32(4, textBytes.length, true);
      totalPayload.set(textBytes, 8);

      // Total bits needed: totalPayload.length * 8
      const totalBits = totalPayload.length * 8;
      // Available RGB channels (data.length / 4 * 3)
      const availableBits = Math.floor((data.length / 4) * 3);

      if (totalBits > availableBits) {
        throw new Error(`Message is too large for this image. Capacity: ${Math.floor(availableBits / 8)} bytes.`);
      }

      // Encode into LSB of R, G, B channels
      let bitIndex = 0;
      for (let i = 0; i < data.length && bitIndex < totalBits; i++) {
        if ((i + 1) % 4 === 0) continue; // Skip Alpha channel

        const bytePos = Math.floor(bitIndex / 8);
        const bitPos = 7 - (bitIndex % 8);
        const bit = (totalPayload[bytePos] >> bitPos) & 1;

        // Clear LSB and write bit
        data[i] = (data[i] & ~1) | bit;
        bitIndex++;
      }

      ctx.putImageData(imgData, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          saveAs(blob, 'secret_stego_image.png');
        }
      }, 'image/png');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Encoding failed');
    }
  };

  const handleDecode = async () => {
    if (!file) return;
    setError(null);
    setDecodedText(null);

    try {
      const img = new Image();
      const url = URL.createObjectURL(file);
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
      if (!ctx) throw new Error('Could not get canvas context');

      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

      // Extract raw bits from RGB channels
      const extractBytes = (startBit: number, numBytes: number): Uint8Array => {
        const out = new Uint8Array(numBytes);
        let bitIndex = startBit;
        let dataIndex = 0;

        // Advance dataIndex to startBit
        let bitsSkipped = 0;
        while (bitsSkipped < startBit && dataIndex < data.length) {
          if ((dataIndex + 1) % 4 !== 0) bitsSkipped++;
          dataIndex++;
        }

        for (let b = 0; b < numBytes; b++) {
          let byteVal = 0;
          for (let bit = 7; bit >= 0; bit--) {
            while ((dataIndex + 1) % 4 === 0) dataIndex++; // skip alpha
            const bitVal = data[dataIndex] & 1;
            byteVal |= bitVal << bit;
            dataIndex++;
            bitIndex++;
          }
          out[b] = byteVal;
        }
        return out;
      };

      // Read 8-byte header: 4B Magic + 4B Length
      const headerBytes = extractBytes(0, 8);
      if (
        headerBytes[0] !== 83 ||
        headerBytes[1] !== 84 ||
        headerBytes[2] !== 69 ||
        headerBytes[3] !== 71
      ) {
        throw new Error('No hidden steganographic message found in this image.');
      }

      const view = new DataView(headerBytes.buffer);
      const textLen = view.getUint32(4, true);

      if (textLen <= 0 || textLen > 500000) {
        throw new Error('Corrupted or invalid payload length.');
      }

      const payloadBytes = extractBytes(64, textLen);
      const dec = new TextDecoder();
      const decoded = dec.decode(payloadBytes);
      setDecodedText(decoded);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Decoding failed');
    }
  };

  const handleCopyDecoded = () => {
    if (!decodedText) return;
    navigator.clipboard.writeText(decodedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setFile(null);
    setSecretText('');
    setDecodedText(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <EyeOff className="w-6 h-6 text-pink-500" />
            Image Steganography (Secret Message Concealer)
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Conceal encrypted text messages inside picture pixels with zero visual degradation, or reveal hidden messages from stego-images.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-gray-800 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setTab('encode');
              handleReset();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              tab === 'encode' ? 'bg-white dark:bg-gray-700 text-pink-600 dark:text-pink-400 shadow-xs' : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            Conceal Message
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('decode');
              handleReset();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              tab === 'decode' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Reveal Message
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!file ? (
        <Dropzone
          accept="image/png,image/jpeg,image/webp"
          onFilesAdded={handleFilesAdded}
          icon={<ImageIcon className="w-12 h-12 text-pink-500" />}
          title={tab === 'encode' ? 'Drop cover image to conceal message' : 'Drop stego-image to reveal message'}
          subtitle="PNG format recommended for lossless pixel concealment"
        />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-100 dark:bg-gray-800/60 border border-slate-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-pink-500/10 text-pink-500">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{file.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Change Image
            </Button>
          </div>

          <div className="p-5 sm:p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-4 max-w-xl mx-auto">
            {tab === 'encode' ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Secret Message to Embed:
                  </label>
                  <textarea
                    rows={5}
                    value={secretText}
                    onChange={(e) => setSecretText(e.target.value)}
                    placeholder="Type private message, notes, passwords, or recovery seeds..."
                    className="w-full p-3 text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-slate-50 dark:bg-gray-950 leading-relaxed font-mono"
                  />
                  <p className="text-[11px] text-gray-400">
                    The text will be woven into the pixel bits and exported as a lossless PNG.
                  </p>
                </div>

                <Button
                  onClick={handleEncode}
                  disabled={!secretText.trim()}
                  className="w-full bg-pink-600 hover:bg-pink-700 text-white font-medium py-2.5"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Conceal & Download Stego Image (.png)
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Button
                  onClick={handleDecode}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Extract Hidden Message
                </Button>

                {decodedText && (
                  <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        Revealed Message:
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyDecoded}
                        className="text-xs text-indigo-500 hover:underline flex items-center gap-1"
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-xs font-mono whitespace-pre-wrap break-all text-gray-900 dark:text-gray-100">
                      {decodedText}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
