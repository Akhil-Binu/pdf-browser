import { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  Copy,
  Check,
  Eye,
  Edit3,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { marked } from 'marked';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';

const DEFAULT_MARKDOWN = `# Project Proposal & Specification

**Date:** 2026-11-18  
**Author:** Engineering Team  
**Status:** Approved  

---

## 1. Executive Summary

This document outlines the architecture for our **100% Client-Side Privacy Studio**. All computing workloads occur within the user's browser sandbox without external telemetry.

## 2. Core Pillars

- **Zero Network Transmission:** Documents remain strictly in device RAM.
- **Hardware Acceleration:** WebAssembly and Canvas 2D engines for maximum speed.
- **Universal Cross-Platform:** Runs offline on desktop and mobile devices.

### Key Performance Metrics

| Metric | Target | Result |
| :--- | :--- | :--- |
| Processing Time | < 1.0s | 0.6s |
| Memory Footprint | Minimal | Zero Leaks |
| Telemetry Calls | 0 | 0 |

> "Privacy is not a feature; it is the fundamental architecture."

### Implementation Snippet

\`\`\`javascript
export async function sanitizeDocument(file) {
  const buffer = await file.arrayBuffer();
  return processLocally(buffer);
}
\`\`\`

---
*Generated securely with 100% Browser Studio.*
`;

export function MarkdownToPdf() {
  const [markdown, setMarkdown] = useState<string>(DEFAULT_MARKDOWN);
  const [tab, setTab] = useState<'split' | 'edit' | 'preview'>('split');
  const [title, setTitle] = useState<string>('document.pdf');

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Render HTML preview safely
  const htmlContent = useMemo(() => {
    return marked.parse(markdown);
  }, [markdown]);

  const handleExportPdf = async () => {
    setIsGenerating(true);

    try {
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const pageWidth = 595.28; // A4
      const pageHeight = 841.89;
      const margin = 50;
      const usableWidth = pageWidth - margin * 2;

      let page = pdfDoc.addPage([pageWidth, pageHeight]);
      let currentY = pageHeight - margin;

      const lines = markdown.split('\n');

      for (const line of lines) {
        if (currentY < margin + 40) {
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          currentY = pageHeight - margin;
        }

        const trimmed = line.trim();

        if (trimmed.startsWith('# ')) {
          const text = trimmed.substring(2);
          page.drawText(text, {
            x: margin,
            y: currentY - 18,
            size: 20,
            font: fontBold,
            color: rgb(0.1, 0.1, 0.1),
          });
          currentY -= 32;
        } else if (trimmed.startsWith('## ')) {
          const text = trimmed.substring(3);
          page.drawText(text, {
            x: margin,
            y: currentY - 14,
            size: 15,
            font: fontBold,
            color: rgb(0.15, 0.15, 0.15),
          });
          currentY -= 26;
        } else if (trimmed.startsWith('### ')) {
          const text = trimmed.substring(4);
          page.drawText(text, {
            x: margin,
            y: currentY - 12,
            size: 12,
            font: fontBold,
            color: rgb(0.2, 0.2, 0.2),
          });
          currentY -= 22;
        } else if (trimmed.startsWith('> ')) {
          const text = trimmed.substring(2);
          page.drawRectangle({
            x: margin,
            y: currentY - 14,
            width: 3,
            height: 16,
            color: rgb(0.4, 0.4, 0.8),
          });
          page.drawText(text, {
            x: margin + 12,
            y: currentY - 12,
            size: 10,
            font,
            color: rgb(0.3, 0.3, 0.3),
          });
          currentY -= 20;
        } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const text = `•  ${trimmed.substring(2)}`;
          page.drawText(text, {
            x: margin + 8,
            y: currentY - 10,
            size: 10,
            font,
            color: rgb(0.2, 0.2, 0.2),
          });
          currentY -= 16;
        } else if (trimmed === '---') {
          page.drawLine({
            start: { x: margin, y: currentY - 8 },
            end: { x: pageWidth - margin, y: currentY - 8 },
            thickness: 1,
            color: rgb(0.85, 0.85, 0.85),
          });
          currentY -= 20;
        } else if (trimmed.length > 0) {
          // Normal line
          const cleanText = trimmed.replace(/\*\*/g, '').replace(/`/g, '');
          page.drawText(cleanText.substring(0, Math.floor(usableWidth / 6)), {
            x: margin,
            y: currentY - 10,
            size: 10,
            font,
            color: rgb(0.25, 0.25, 0.25),
          });
          currentY -= 16;
        } else {
          currentY -= 10;
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      const name = title.replace(/\.pdf$/i, '');
      saveAs(blob, `${name}.pdf`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-500" />
            Markdown to PDF Studio
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Write or paste Markdown with live formatted preview, and compile directly into structured PDF documents in-browser.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-gray-800 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setTab('split')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              tab === 'split' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Split View
          </button>
          <button
            type="button"
            onClick={() => setTab('edit')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              tab === 'edit' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5 inline mr-1" />
            Editor
          </button>
          <button
            type="button"
            onClick={() => setTab('preview')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              tab === 'preview' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <Eye className="w-3.5 h-3.5 inline mr-1" />
            Preview
          </button>
        </div>
      </div>

      {/* Action Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-100 dark:bg-gray-800/60 border border-slate-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500">Output Title:</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="px-2.5 py-1 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 font-mono"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleCopyMarkdown}>
            {copied ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
            {copied ? 'Copied' : 'Copy MD'}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setMarkdown(DEFAULT_MARKDOWN)}>
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Reset Sample
          </Button>
          <Button
            size="sm"
            onClick={handleExportPdf}
            disabled={isGenerating || !markdown.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
          >
            {isGenerating ? (
              <>
                <Spinner className="w-3.5 h-3.5 mr-1" />
                Compiling...
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 mr-1" />
                Export PDF
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Editor & Preview Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(tab === 'split' || tab === 'edit') && (
          <div className={`space-y-1 ${tab === 'edit' ? 'md:col-span-2' : ''}`}>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
              Markdown Source
            </span>
            <textarea
              rows={20}
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              className="w-full p-4 font-mono text-xs rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 leading-relaxed shadow-inner"
            />
          </div>
        )}

        {(tab === 'split' || tab === 'preview') && (
          <div className={`space-y-1 ${tab === 'preview' ? 'md:col-span-2' : ''}`}>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-500" /> Formatted Preview
            </span>
            <div
              className="prose dark:prose-invert max-w-none p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs leading-relaxed max-h-[460px] overflow-y-auto shadow-sm"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
