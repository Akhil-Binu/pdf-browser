import { useState, useCallback } from 'react';
import {
  Upload,
  Lock,
  Eye,
  EyeOff,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  FileText,
  ShieldAlert,
} from 'lucide-react';
import { saveAs } from 'file-saver';
import { getPageCount, protectPdfDocument } from '../../../utils/pdfUtils';
import { formatFileSize } from '../../../utils/format';
import { Button } from '../../ui/Button';
import { Dropzone } from '../../ui/Dropzone';

export function ProtectPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesAdded = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setFile(selected);
    setError(null);
    setIsDone(false);
    try {
      const count = await getPageCount(selected);
      setPageCount(count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read PDF');
    }
  }, []);

  const handleProtect = useCallback(async () => {
    if (!file) return;
    if (password.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const bytes = await protectPdfDocument(file, password);
      const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
      const base = file.name.replace(/\.pdf$/i, '');
      saveAs(blob, `${base}_protected.pdf`);
      setIsDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to protect document');
    } finally {
      setIsProcessing(false);
    }
  }, [file, password, confirmPassword]);

  const handleClear = useCallback(() => {
    setFile(null);
    setPageCount(0);
    setPassword('');
    setConfirmPassword('');
    setIsProcessing(false);
    setIsDone(false);
    setError(null);
  }, []);

  return (
    <div className="space-y-6">
      {!file && (
        <Dropzone
          onFilesAdded={handleFilesAdded}
          accept="application/pdf"
          multiple={false}
          label="Drop a PDF to Password Protect"
          sublabel="Encrypt your document client-side with AES security"
          icon={<Upload className="w-8 h-8 text-blue-500" />}
        />
      )}

      {file && (
        <div className="space-y-5">
          {/* File Card */}
          <div className="flex items-center gap-4 bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="w-12 h-12 bg-purple-50 dark:bg-purple-950/40 rounded-xl flex items-center justify-center text-purple-600 flex-shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                {file.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {formatFileSize(file.size)} • {pageCount} pages
              </p>
            </div>
            <Button size="sm" variant="ghost" onClick={handleClear}>
              Change
            </Button>
          </div>

          {/* Password Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Set Encryption Password
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Document Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter secure password"
                    className="w-full pr-10 px-3.5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-xl text-xs text-purple-700 dark:text-purple-300">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                Make sure you save your password safely. Encrypted PDFs cannot be recovered if the password is lost.
              </span>
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={handleProtect}
            loading={isProcessing}
            disabled={isProcessing || !password}
            icon={<Lock className="w-5 h-5" />}
            className="w-full"
          >
            {isProcessing ? 'Encrypting PDF...' : 'Protect PDF & Download'}
          </Button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {isDone && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            <p className="text-sm text-green-700 dark:text-green-400 font-medium">
              Document encrypted and downloaded successfully!
            </p>
          </div>
          <Button variant="secondary" onClick={handleClear} icon={<RotateCcw className="w-4 h-4" />} className="w-full">
            Protect Another File
          </Button>
        </div>
      )}
    </div>
  );
}
