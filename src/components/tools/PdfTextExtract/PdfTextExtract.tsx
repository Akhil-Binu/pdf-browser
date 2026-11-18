import { useState, useCallback, useMemo } from 'react';
import {
  FileText,
  Search,
  Download,
  Copy,
  Check,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { saveAs } from 'file-saver';
import { Dropzone } from '../../ui/Dropzone';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';

interface PageText {
  pageNumber: number;
  text: string;
}

export function PdfTextExtract() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageText[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesAdded = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setFile(selected);
    setIsLoading(true);
    setError(null);
    setPages([]);

    try {
      const arrayBuffer = await selected.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;

      const extracted: PageText[] = [];

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageStr = textContent.items
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((item: any) => item.str)
          .join(' ');

        extracted.push({
          pageNumber: i,
          text: pageStr.trim(),
        });
      }

      setPages(extracted);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract text from PDF');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fullText = useMemo(() => {
    return pages
      .map((p) => `--- Page ${p.pageNumber} ---\n${p.text}`)
      .join('\n\n');
  }, [pages]);

  const matchCount = useMemo(() => {
    if (!searchQuery.trim() || !fullText) return 0;
    const regex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = fullText.match(regex);
    return matches ? matches.length : 0;
  }, [searchQuery, fullText]);

  const handleCopy = () => {
    if (!fullText) return;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!fullText || !file) return;
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const name = file.name.replace(/\.pdf$/i, '');
    saveAs(blob, `${name}_extracted_text.txt`);
  };

  const handleDownloadJson = () => {
    if (pages.length === 0 || !file) return;
    const jsonStr = JSON.stringify(pages, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const name = file.name.replace(/\.pdf$/i, '');
    saveAs(blob, `${name}_pages.json`);
  };

  const handleReset = () => {
    setFile(null);
    setPages([]);
    setSearchQuery('');
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold flex items-center gap-2">
          <FileText className="w-6 h-6 text-purple-500" />
          PDF Text & Content Extractor
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Extract all readable text across all pages in a PDF document with in-browser keyword search, and export as Markdown or structured JSON.
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
          accept="application/pdf"
          onFilesAdded={handleFilesAdded}
          icon={<FileText className="w-12 h-12 text-purple-500" />}
          title="Drop PDF here to extract text"
          subtitle="Supports single and multi-page documents"
        />
      ) : (
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-100 dark:bg-gray-800/60 border border-slate-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-500">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{file.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {pages.length} {pages.length === 1 ? 'page' : 'pages'} extracted
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={handleCopy} disabled={!fullText}>
                {copied ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                {copied ? 'Copied' : 'Copy Text'}
              </Button>
              <Button variant="secondary" size="sm" onClick={handleDownloadTxt} disabled={!fullText}>
                <Download className="w-3.5 h-3.5 mr-1" />
                Save .txt
              </Button>
              <Button variant="secondary" size="sm" onClick={handleDownloadJson} disabled={pages.length === 0}>
                <Download className="w-3.5 h-3.5 mr-1" />
                Save .json
              </Button>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <RotateCcw className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-2">
              <Spinner className="w-8 h-8 text-purple-500" />
              <p className="text-xs text-gray-500 font-medium">Extracting text streams from PDF...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Search filter */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter extracted text by keyword..."
                  className="w-full pl-9 pr-24 py-2 text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                />
                {searchQuery && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                    {matchCount} {matchCount === 1 ? 'match' : 'matches'}
                  </span>
                )}
              </div>

              {/* Text viewer */}
              <div className="max-h-[460px] overflow-y-auto space-y-4 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 font-mono text-xs leading-relaxed text-gray-800 dark:text-gray-200">
                {pages.map((p) => {
                  const isVisible =
                    !searchQuery || p.text.toLowerCase().includes(searchQuery.toLowerCase());
                  if (!isVisible) return null;

                  return (
                    <div key={p.pageNumber} className="border-b border-gray-100 dark:border-gray-800 pb-3 last:border-none">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-500 mb-1 block">
                        Page {p.pageNumber}
                      </span>
                      <p className="whitespace-pre-wrap">{p.text || '(No text content on this page)'}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
