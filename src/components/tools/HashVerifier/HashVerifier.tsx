import { useState, useCallback } from 'react';
import {
  FileCheck2,
  FileText,
  Copy,
  Check,
  AlertCircle,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { Dropzone } from '../../ui/Dropzone';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';

interface HashResults {
  sha256: string;
  sha512: string;
  sha384: string;
  sha1: string;
}

export function HashVerifier() {
  const [file, setFile] = useState<File | null>(null);
  const [hashes, setHashes] = useState<HashResults | null>(null);
  const [expectedHash, setExpectedHash] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const computeHash = async (algo: string, buffer: ArrayBuffer): Promise<string> => {
    const hashBuffer = await window.crypto.subtle.digest(algo, buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  };

  const handleFilesAdded = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setFile(selected);
    setIsLoading(true);
    setError(null);
    setHashes(null);
    setExpectedHash('');

    try {
      const buffer = await selected.arrayBuffer();
      const [sha256, sha512, sha384, sha1] = await Promise.all([
        computeHash('SHA-256', buffer),
        computeHash('SHA-512', buffer),
        computeHash('SHA-384', buffer),
        computeHash('SHA-1', buffer),
      ]);

      setHashes({ sha256, sha512, sha384, sha1 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate file hashes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const verificationStatus = () => {
    if (!expectedHash.trim() || !hashes) return null;
    const cleanExpected = expectedHash.trim().toLowerCase();

    if (
      cleanExpected === hashes.sha256 ||
      cleanExpected === hashes.sha512 ||
      cleanExpected === hashes.sha384 ||
      cleanExpected === hashes.sha1
    ) {
      return { match: true, message: 'Checksum Verified! File integrity is intact.' };
    }
    return { match: false, message: 'Checksum Mismatch! The file may be corrupted or modified.' };
  };

  const result = verificationStatus();

  const handleReset = () => {
    setFile(null);
    setHashes(null);
    setExpectedHash('');
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold flex items-center gap-2">
          <FileCheck2 className="w-6 h-6 text-cyan-500" />
          Cryptographic Hash & Integrity Verifier
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Compute instant SHA-256, SHA-512, and SHA-1 checksums of any file in-browser and verify integrity against publisher releases.
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
          accept="*/*"
          onFilesAdded={handleFilesAdded}
          icon={<FileCheck2 className="w-12 h-12 text-cyan-500" />}
          title="Drop any file here to calculate hashes"
          subtitle="Computes SHA-256, SHA-512, SHA-384, SHA-1 checksums instantly"
        />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-100 dark:bg-gray-800/60 border border-slate-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-500">
                <FileText className="w-5 h-5" />
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
              Check Another File
            </Button>
          </div>

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-2">
              <Spinner className="w-8 h-8 text-cyan-500" />
              <p className="text-xs text-gray-500 font-medium">Computing cryptographic digests...</p>
            </div>
          ) : hashes ? (
            <div className="p-5 sm:p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-5">
              {/* Checksum Verification Box */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 space-y-3">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 block">
                  Verify Against Expected Checksum:
                </span>
                <input
                  type="text"
                  value={expectedHash}
                  onChange={(e) => setExpectedHash(e.target.value)}
                  placeholder="Paste expected SHA-256 or SHA-512 checksum..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 font-mono"
                />

                {result && (
                  <div
                    className={`flex items-center gap-2 p-3 rounded-lg text-xs font-semibold ${
                      result.match
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                    }`}
                  >
                    {result.match ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                    <span>{result.message}</span>
                  </div>
                )}
              </div>

              {/* Hash Rows */}
              <div className="space-y-3">
                {[
                  { label: 'SHA-256 (Recommended)', val: hashes.sha256, key: 'sha256' },
                  { label: 'SHA-512', val: hashes.sha512, key: 'sha512' },
                  { label: 'SHA-384', val: hashes.sha384, key: 'sha384' },
                  { label: 'SHA-1', val: hashes.sha1, key: 'sha1' },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">
                        {item.label}
                      </span>
                      <p className="font-mono text-xs text-gray-800 dark:text-gray-200 break-all select-all">
                        {item.val}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(item.val, item.key)}
                      className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 self-start sm:self-center flex-shrink-0"
                    >
                      {copiedKey === item.key ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedKey === item.key ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
