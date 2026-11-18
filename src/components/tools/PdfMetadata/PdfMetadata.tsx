import { useState, useCallback } from 'react';
import {
  FileCode,
  FileText,
  RotateCcw,
  Download,
  AlertCircle,
  CheckCircle,
  ShieldCheck,
  Calendar,
  User,
  Tag,
  Info,
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { Dropzone } from '../../ui/Dropzone';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';

interface MetadataState {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  producer: string;
  creator: string;
  creationDate: string;
  modificationDate: string;
}

export function PdfMetadata() {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<MetadataState>({
    title: '',
    author: '',
    subject: '',
    keywords: '',
    producer: '',
    creator: '',
    creationDate: '',
    modificationDate: '',
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isDone, setIsDone] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesAdded = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setFile(selected);
    setIsLoading(true);
    setError(null);
    setIsDone(false);

    try {
      const arrayBuffer = await selected.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

      setMetadata({
        title: pdfDoc.getTitle() || '',
        author: pdfDoc.getAuthor() || '',
        subject: pdfDoc.getSubject() || '',
        keywords: pdfDoc.getKeywords() || '',
        producer: pdfDoc.getProducer() || '',
        creator: pdfDoc.getCreator() || '',
        creationDate: pdfDoc.getCreationDate() ? pdfDoc.getCreationDate()!.toISOString() : '',
        modificationDate: pdfDoc.getModificationDate() ? pdfDoc.getModificationDate()!.toISOString() : '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read PDF metadata');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSanitizeAll = () => {
    setMetadata({
      title: '',
      author: '',
      subject: '',
      keywords: '',
      producer: '',
      creator: '',
      creationDate: '',
      modificationDate: '',
    });
  };

  const handleSave = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

      pdfDoc.setTitle(metadata.title);
      pdfDoc.setAuthor(metadata.author);
      pdfDoc.setSubject(metadata.subject);
      pdfDoc.setKeywords(metadata.keywords.split(',').map((k) => k.trim()).filter(Boolean));
      pdfDoc.setProducer(metadata.producer);
      pdfDoc.setCreator(metadata.creator);

      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
      const baseName = file.name.replace(/\.pdf$/i, '');
      saveAs(blob, `${baseName}_metadata_updated.pdf`);
      setIsDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update PDF metadata');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setIsDone(false);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Info className="w-6 h-6 text-teal-500" />
          PDF Metadata Editor & Privacy Sanitizer
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Inspect, edit, or strip hidden author identity, software signatures, creation timestamps, and tracking keywords from PDF documents.
        </p>
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
            <span className="font-semibold text-sm">PDF metadata successfully updated and saved!</span>
          </div>
          <Button variant="secondary" size="sm" onClick={handleReset}>
            Inspect Another PDF
          </Button>
        </div>
      )}

      {!file ? (
        <Dropzone
          accept="application/pdf"
          onFilesAdded={handleFilesAdded}
          icon={<Info className="w-12 h-12 text-teal-500" />}
          title="Drop PDF here to view or strip metadata"
          subtitle="Inspect hidden creation tags, authors, and software stamps"
        />
      ) : (
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-100 dark:bg-gray-800/60 border border-slate-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-teal-500/10 text-teal-500">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{file.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={handleSanitizeAll}>
                <ShieldCheck className="w-4 h-4 mr-1.5 text-emerald-500" />
                Strip All Metadata
              </Button>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <RotateCcw className="w-4 h-4 mr-1.5" />
                Change File
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-2">
              <Spinner className="w-8 h-8 text-teal-500" />
              <p className="text-xs text-gray-500 font-medium">Reading document metadata tags...</p>
            </div>
          ) : (
            <div className="p-5 sm:p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-teal-500" /> Document Title:
                  </label>
                  <input
                    type="text"
                    value={metadata.title}
                    onChange={(e) => setMetadata((p) => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. Annual Report 2026"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-slate-50 dark:bg-gray-950"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-teal-500" /> Author / Owner:
                  </label>
                  <input
                    type="text"
                    value={metadata.author}
                    onChange={(e) => setMetadata((p) => ({ ...p, author: e.target.value }))}
                    placeholder="e.g. John Doe"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-slate-50 dark:bg-gray-950"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-teal-500" /> Subject / Description:
                  </label>
                  <input
                    type="text"
                    value={metadata.subject}
                    onChange={(e) => setMetadata((p) => ({ ...p, subject: e.target.value }))}
                    placeholder="e.g. Financial summary"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-slate-50 dark:bg-gray-950"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-teal-500" /> Keywords (comma-separated):
                  </label>
                  <input
                    type="text"
                    value={metadata.keywords}
                    onChange={(e) => setMetadata((p) => ({ ...p, keywords: e.target.value }))}
                    placeholder="e.g. finance, tax, confidential"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-slate-50 dark:bg-gray-950"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-teal-500" /> Creator Application:
                  </label>
                  <input
                    type="text"
                    value={metadata.creator}
                    onChange={(e) => setMetadata((p) => ({ ...p, creator: e.target.value }))}
                    placeholder="e.g. Microsoft Word"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-slate-50 dark:bg-gray-950"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-teal-500" /> Creation Timestamp:
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={metadata.creationDate || 'Not specified'}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-slate-100 dark:bg-gray-900 text-gray-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  onClick={handleSave}
                  disabled={isProcessing}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5"
                >
                  {isProcessing ? (
                    <>
                      <Spinner className="w-4 h-4 mr-2" />
                      Updating PDF...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Save & Download PDF
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
