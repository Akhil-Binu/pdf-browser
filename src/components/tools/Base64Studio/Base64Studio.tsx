import { useState } from 'react';
import { Binary, Download, Copy, Check, FileUp, RefreshCw, AlertCircle, Eye } from 'lucide-react';
import { saveAs } from 'file-saver';
import { Dropzone } from '../../ui/Dropzone';

// Sniff MIME type from raw Base64 prefix
function detectMimeFromBase64(base64: string): { mime: string; ext: string } {
  // Check if it already has a data URL header
  const match = base64.match(/^data:([a-zA-Z0-9/+-]+);base64,/);
  if (match) {
    const mime = match[1];
    let ext = mime.split('/')[1] || 'bin';
    if (ext === 'svg+xml') ext = 'svg';
    if (ext === 'jpeg') ext = 'jpg';
    return { mime, ext };
  }

  // Sniff magic bytes from leading Base64 chars
  const clean = base64.trim();
  if (clean.startsWith('/9j/')) return { mime: 'image/jpeg', ext: 'jpg' };
  if (clean.startsWith('iVBORw0KGgo')) return { mime: 'image/png', ext: 'png' };
  if (clean.startsWith('R0lGOD')) return { mime: 'image/gif', ext: 'gif' };
  if (clean.startsWith('UklGR')) return { mime: 'image/webp', ext: 'webp' };
  if (clean.startsWith('JVBERi0')) return { mime: 'application/pdf', ext: 'pdf' };
  if (clean.startsWith('UEsDBBQ')) return { mime: 'application/zip', ext: 'zip' };
  if (clean.startsWith('SUQz') || clean.startsWith('//uQ')) return { mime: 'audio/mpeg', ext: 'mp3' };

  return { mime: 'application/octet-stream', ext: 'bin' };
}

// Convert Base64 or Data URI to Blob
function base64ToBlob(base64Data: string, detectedMime: string): Blob {
  let cleanData = base64Data.trim();
  if (cleanData.includes(',')) {
    cleanData = cleanData.split(',')[1];
  }
  // Strip whitespace/newlines
  cleanData = cleanData.replace(/\s/g, '');

  const byteCharacters = atob(cleanData);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: detectedMime });
}

export function Base64Studio() {
  const [activeTab, setActiveTab] = useState<'encode' | 'decode'>('encode');

  // Encode state
  const [encodedFile, setEncodedFile] = useState<File | null>(null);
  const [rawBase64, setRawBase64] = useState<string>('');
  const [dataUri, setDataUri] = useState<string>('');
  const [activeCopy, setActiveCopy] = useState<string | null>(null);

  // Decode state
  const [decodeInput, setDecodeInput] = useState<string>('');
  const [decodedBlob, setDecodedBlob] = useState<Blob | null>(null);
  const [decodedMime, setDecodedMime] = useState<string>('application/octet-stream');
  const [decodedExt, setDecodedExt] = useState<string>('bin');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [decodeError, setDecodeError] = useState<string | null>(null);

  const handleEncodeUpload = (files: File[]) => {
    if (files.length === 0) return;
    const file = files[0];
    setEncodedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setDataUri(result);
      // Extract raw base64
      const commaIndex = result.indexOf(',');
      if (commaIndex !== -1) {
        setRawBase64(result.slice(commaIndex + 1));
      } else {
        setRawBase64(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCopyText = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setActiveCopy(id);
    setTimeout(() => setActiveCopy(null), 2000);
  };

  const handleDecode = () => {
    setDecodeError(null);
    if (!decodeInput.trim()) {
      setDecodedBlob(null);
      setPreviewUrl(null);
      return;
    }

    try {
      const { mime, ext } = detectMimeFromBase64(decodeInput);
      setDecodedMime(mime);
      setDecodedExt(ext);

      const blob = base64ToBlob(decodeInput, mime);
      setDecodedBlob(blob);

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (err: unknown) {
      const error = err as Error;
      setDecodeError(`Invalid Base64 data: ${error.message}`);
    }
  };

  const handleDownloadDecoded = () => {
    if (!decodedBlob) return;
    saveAs(decodedBlob, `decoded-file.${decodedExt}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Binary className="w-5 h-5 text-cyan-500" />
          Client-Side Base64 Studio
        </h3>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
          Encode any file into raw Base64, Data URI, HTML/CSS snippets, or decode Base64 strings back to their original binary format with automatic MIME sniffing.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit border border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => setActiveTab('encode')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'encode'
              ? 'bg-white dark:bg-gray-900 text-cyan-600 dark:text-cyan-400 shadow-xs'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
          }`}
        >
          <FileUp className="w-3.5 h-3.5" /> File to Base64
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('decode')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'decode'
              ? 'bg-white dark:bg-gray-900 text-cyan-600 dark:text-cyan-400 shadow-xs'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
          }`}
        >
          <Binary className="w-3.5 h-3.5" /> Base64 to File
        </button>
      </div>

      {/* TAB 1: File to Base64 */}
      {activeTab === 'encode' && (
        <div className="space-y-5">
          <Dropzone
            maxFiles={1}
            onDrop={handleEncodeUpload}
            label={encodedFile ? `Replace file (${encodedFile.name})` : 'Drop any file here to encode to Base64 (Images, PDFs, Audio, etc.)'}
          />

          {encodedFile && rawBase64 && (
            <div className="space-y-4">
              {/* File Stats */}
              <div className="p-4 bg-gray-50 dark:bg-gray-850 rounded-2xl border border-gray-200 dark:border-gray-800 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {encodedFile.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Original: {(encodedFile.size / 1024).toFixed(1)} KB • MIME: {encodedFile.type || 'unknown'}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 text-xs font-mono font-bold">
                    Base64: {(rawBase64.length / 1024).toFixed(1)} KB (+33%)
                  </span>
                </div>
              </div>

              {/* Format Snippets */}
              <div className="grid grid-cols-1 gap-3">
                {/* 1. Data URI */}
                <div className="p-3.5 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      Data URI Scheme
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyText(dataUri, 'datauri')}
                      className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1 cursor-pointer"
                    >
                      {activeCopy === 'datauri' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      Copy Data URI
                    </button>
                  </div>
                  <div className="p-2.5 bg-gray-50 dark:bg-gray-950 rounded-lg font-mono text-[11px] text-gray-600 dark:text-gray-400 truncate">
                    {dataUri.slice(0, 120)}...
                  </div>
                </div>

                {/* 2. Raw Base64 */}
                <div className="p-3.5 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      Raw Base64 String
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const blob = new Blob([rawBase64], { type: 'text/plain' });
                          saveAs(blob, `${encodedFile.name}.base64.txt`);
                        }}
                        className="px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3 h-3" /> Save .txt
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyText(rawBase64, 'raw')}
                        className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1 cursor-pointer"
                      >
                        {activeCopy === 'raw' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        Copy String
                      </button>
                    </div>
                  </div>
                  <div className="p-2.5 bg-gray-50 dark:bg-gray-950 rounded-lg font-mono text-[11px] text-gray-600 dark:text-gray-400 truncate">
                    {rawBase64.slice(0, 120)}...
                  </div>
                </div>

                {/* 3. HTML <img> Tag */}
                {encodedFile.type.startsWith('image/') && (
                  <div className="p-3.5 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        HTML &lt;img&gt; Tag
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(`<img src="${dataUri}" alt="${encodedFile.name}" />`, 'html')}
                        className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1 cursor-pointer"
                      >
                        {activeCopy === 'html' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        Copy Tag
                      </button>
                    </div>
                    <div className="p-2.5 bg-gray-50 dark:bg-gray-950 rounded-lg font-mono text-[11px] text-gray-600 dark:text-gray-400 truncate">
                      {`<img src="${dataUri.slice(0, 80)}..." alt="${encodedFile.name}" />`}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Base64 to File */}
      {activeTab === 'decode' && (
        <div className="space-y-5">
          {decodeError && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{decodeError}</span>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Paste Base64 or Data URI
              </label>
              <span className="text-[11px] text-gray-400 font-mono">
                {decodeInput.length} characters
              </span>
            </div>

            <textarea
              value={decodeInput}
              onChange={(e) => setDecodeInput(e.target.value)}
              placeholder="Paste data:image/png;base64,iVBORw0KGgo... or raw Base64 string here..."
              rows={6}
              className="w-full p-3.5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono text-xs focus:ring-2 focus:ring-cyan-500 outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                setDecodeInput('');
                setDecodedBlob(null);
                setPreviewUrl(null);
                setDecodeError(null);
              }}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Clear
            </button>

            <button
              type="button"
              onClick={handleDecode}
              className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-cyan-600/20 transition cursor-pointer"
            >
              <Binary className="w-4 h-4" /> Decode & Preview
            </button>
          </div>

          {/* Decoded Result View */}
          {decodedBlob && (
            <div className="p-5 bg-gray-50 dark:bg-gray-850 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-cyan-500" />
                    Decoded Output Ready
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Detected Type: <span className="font-mono font-bold text-gray-700 dark:text-gray-300">{decodedMime}</span> • Size: {(decodedBlob.size / 1024).toFixed(1)} KB
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadDecoded}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Download Decoded File (.${decodedExt})
                </button>
              </div>

              {/* Visual Preview if Image or Audio */}
              {previewUrl && (
                <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center justify-center">
                  {decodedMime.startsWith('image/') ? (
                    <img
                      src={previewUrl}
                      alt="Decoded preview"
                      className="max-h-64 rounded-lg object-contain"
                    />
                  ) : decodedMime.startsWith('audio/') ? (
                    <audio src={previewUrl} controls className="w-full max-w-md" />
                  ) : (
                    <div className="text-xs text-gray-500 font-mono">
                      Binary file ready for download.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
