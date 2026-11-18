import { useState, useCallback } from 'react';
import {
  Lock,
  Unlock,
  KeyRound,
  RotateCcw,
  AlertCircle,
  CheckCircle,
  FileText,
  Eye,
  EyeOff,
} from 'lucide-react';
import { saveAs } from 'file-saver';
import { Dropzone } from '../../ui/Dropzone';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';

export function FileEncryptor() {
  const [tab, setTab] = useState<'encrypt' | 'decrypt'>('encrypt');
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isDone, setIsDone] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesAdded = useCallback((files: File[]) => {
    if (files.length === 0) return;
    setFile(files[0]);
    setError(null);
    setIsDone(false);
  }, []);

  const handleEncrypt = async () => {
    if (!file || !password) return;
    setIsProcessing(true);
    setError(null);

    try {
      const fileBytes = new Uint8Array(await file.arrayBuffer());
      const enc = new TextEncoder();

      // 1. Generate 16-byte random salt and 12-byte random IV
      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      const iv = window.crypto.getRandomValues(new Uint8Array(12));

      // 2. Derive key via PBKDF2
      const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        enc.encode(password),
        'PBKDF2',
        false,
        ['deriveKey']
      );

      const aesKey = await window.crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt,
          iterations: 100000,
          hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
      );

      // 3. Encrypt payload
      const ciphertext = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        aesKey,
        fileBytes
      );

      // 4. Serialize container: [Magic 4B: 'ENC1'] [Filename Len 2B] [Filename UTF8] [Salt 16B] [IV 12B] [Ciphertext]
      const filenameBytes = enc.encode(file.name);
      const totalLen = 4 + 2 + filenameBytes.length + 16 + 12 + ciphertext.byteLength;
      const result = new Uint8Array(totalLen);
      const view = new DataView(result.buffer);

      // Magic 'ENC1'
      result.set([69, 78, 67, 49], 0);
      view.setUint16(4, filenameBytes.length, true);
      result.set(filenameBytes, 6);

      let offset = 6 + filenameBytes.length;
      result.set(salt, offset);
      offset += 16;
      result.set(iv, offset);
      offset += 12;
      result.set(new Uint8Array(ciphertext), offset);

      const blob = new Blob([result as unknown as BlobPart], { type: 'application/octet-stream' });
      saveAs(blob, `${file.name}.vault`);
      setIsDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Encryption failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecrypt = async () => {
    if (!file || !password) return;
    setIsProcessing(true);
    setError(null);

    try {
      const enc = new TextEncoder();
      const dec = new TextDecoder();
      const raw = new Uint8Array(await file.arrayBuffer());
      const view = new DataView(raw.buffer);

      // 1. Verify Magic
      if (raw[0] !== 69 || raw[1] !== 78 || raw[2] !== 67 || raw[3] !== 49) {
        throw new Error('Not a valid encrypted .vault file');
      }

      const filenameLen = view.getUint16(4, true);
      const origName = dec.decode(raw.slice(6, 6 + filenameLen));

      let offset = 6 + filenameLen;
      const salt = raw.slice(offset, offset + 16);
      offset += 16;
      const iv = raw.slice(offset, offset + 12);
      offset += 12;
      const ciphertext = raw.slice(offset);

      // 2. Derive key
      const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        enc.encode(password),
        'PBKDF2',
        false,
        ['deriveKey']
      );

      const aesKey = await window.crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt,
          iterations: 100000,
          hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      );

      // 3. Decrypt payload
      const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        aesKey,
        ciphertext
      );

      const blob = new Blob([decrypted as unknown as BlobPart], { type: 'application/octet-stream' });
      saveAs(blob, origName || 'decrypted_file');
      setIsDone(true);
    } catch {
      setError('Decryption failed. Incorrect passphrase or corrupted file container.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPassword('');
    setIsDone(false);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Lock className="w-6 h-6 text-emerald-500" />
            AES-256 Client-Side File Vault
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Encrypt or decrypt any document, photo, or archive in-browser using military-grade AES-256-GCM. Zero uploads, zero backdoors.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-gray-800 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setTab('encrypt');
              handleReset();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              tab === 'encrypt' ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            Encrypt File
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('decrypt');
              handleReset();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              tab === 'decrypt' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <Unlock className="w-3.5 h-3.5" />
            Decrypt File
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isDone && (
        <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-xl border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <span className="font-semibold text-sm">
              File successfully {tab === 'encrypt' ? 'encrypted' : 'decrypted'} and downloaded!
            </span>
          </div>
          <Button variant="secondary" size="sm" onClick={handleReset}>
            {tab === 'encrypt' ? 'Encrypt Another' : 'Decrypt Another'}
          </Button>
        </div>
      )}

      {!file ? (
        <Dropzone
          accept={tab === 'encrypt' ? '*/*' : '.vault,.enc'}
          onFilesAdded={handleFilesAdded}
          icon={
            tab === 'encrypt' ? (
              <Lock className="w-12 h-12 text-emerald-500" />
            ) : (
              <Unlock className="w-12 h-12 text-amber-500" />
            )
          }
          title={tab === 'encrypt' ? 'Drop any file here to encrypt' : 'Drop .vault file here to decrypt'}
          subtitle={
            tab === 'encrypt'
              ? 'Encrypt PDFs, photos, videos, ZIPs, or code'
              : 'Select your encrypted file container to unlock'
          }
        />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-100 dark:bg-gray-800/60 border border-slate-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500">
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
              Change File
            </Button>
          </div>

          <div className="p-5 sm:p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-4 max-w-lg mx-auto">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-emerald-500" />
                {tab === 'encrypt' ? 'Choose Encryption Passphrase:' : 'Enter Decryption Passphrase:'}
              </label>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter strong passphrase..."
                  className="w-full pl-3 pr-10 py-2.5 text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-slate-50 dark:bg-gray-950 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {tab === 'encrypt' && (
                <p className="text-[11px] text-gray-400 italic">
                  Note: There is no password recovery. Store this passphrase safely.
                </p>
              )}
            </div>

            <Button
              onClick={tab === 'encrypt' ? handleEncrypt : handleDecrypt}
              disabled={isProcessing || !password.trim()}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5"
            >
              {isProcessing ? (
                <>
                  <Spinner className="w-4 h-4 mr-2" />
                  {tab === 'encrypt' ? 'Encrypting with AES-256...' : 'Decrypting...'}
                </>
              ) : tab === 'encrypt' ? (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Encrypt & Download (.vault)
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4 mr-2" />
                  Unlock & Restore Original File
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
