import { useState } from 'react';
import { ArrowLeftRight, Download, Copy, Check, FileJson, Table, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { saveAs } from 'file-saver';
import { Dropzone } from '../../ui/Dropzone';

// Robust client-side RFC 4180 CSV parser
function parseCSV(csvText: string): Record<string, unknown>[] {
  const lines: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let currentToken = '';

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentToken += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(currentToken.trim());
      currentToken = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip LF
      }
      row.push(currentToken.trim());
      if (row.some((cell) => cell.length > 0)) {
        lines.push(row);
      }
      row = [];
      currentToken = '';
    } else {
      currentToken += char;
    }
  }

  if (currentToken.length > 0 || row.length > 0) {
    row.push(currentToken.trim());
    if (row.some((cell) => cell.length > 0)) {
      lines.push(row);
    }
  }

  if (lines.length < 2) return [];

  const headers = lines[0];
  const results: Record<string, unknown>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i];
    const obj: Record<string, unknown> = {};
    for (let j = 0; j < headers.length; j++) {
      const key = headers[j];
      const val = values[j] !== undefined ? values[j] : '';
      // Type coercion for numbers and booleans
      if (val.toLowerCase() === 'true') obj[key] = true;
      else if (val.toLowerCase() === 'false') obj[key] = false;
      else if (val !== '' && !isNaN(Number(val))) obj[key] = Number(val);
      else obj[key] = val;
    }
    results.push(obj);
  }

  return results;
}

// Robust client-side JSON to CSV stringifier
function jsonToCSV(jsonData: unknown[]): string {
  if (!Array.isArray(jsonData) || jsonData.length === 0) {
    throw new Error('JSON input must be a non-empty array of objects.');
  }

  // Collect all unique keys
  const keysSet = new Set<string>();
  jsonData.forEach((item) => {
    if (typeof item === 'object' && item !== null) {
      Object.keys(item).forEach((k) => keysSet.add(k));
    }
  });

  const headers = Array.from(keysSet);
  const escapeCell = (val: unknown): string => {
    if (val === null || val === undefined) return '';
    let str = typeof val === 'object' ? JSON.stringify(val) : String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      str = `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerRow = headers.map(escapeCell).join(',');
  const rows = jsonData.map((item) => {
    const record = item as Record<string, unknown>;
    return headers.map((key) => escapeCell(record[key])).join(',');
  });

  return [headerRow, ...rows].join('\n');
}

const SAMPLE_DATA = [
  { id: 1, name: 'Alice Smith', role: 'Full Stack Engineer', department: 'Engineering', active: true, salary: 125000 },
  { id: 2, name: 'Bob Jones', role: 'Product Designer', department: 'Design', active: true, salary: 110000 },
  { id: 3, name: 'Carol White', role: 'DevOps Lead', department: 'Operations', active: false, salary: 135000 },
  { id: 4, name: 'David Lee', role: 'Security Analyst', department: 'Security', active: true, salary: 130000 },
];

export function DataConverter() {
  const [mode, setMode] = useState<'json-to-csv' | 'csv-to-json'>('json-to-csv');
  const [inputText, setInputText] = useState<string>(JSON.stringify(SAMPLE_DATA, null, 2));
  const [outputText, setOutputText] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const handleConvert = () => {
    setErrorMsg(null);
    if (!inputText.trim()) {
      setOutputText('');
      return;
    }

    try {
      if (mode === 'json-to-csv') {
        const parsed = JSON.parse(inputText);
        const arrayData = Array.isArray(parsed) ? parsed : [parsed];
        const csv = jsonToCSV(arrayData);
        setOutputText(csv);
      } else {
        const parsed = parseCSV(inputText);
        if (parsed.length === 0) {
          throw new Error('Could not parse any tabular rows from the CSV text.');
        }
        setOutputText(JSON.stringify(parsed, null, 2));
      }
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || 'Conversion error occurred.');
    }
  };

  const handleFileUpload = (files: File[]) => {
    if (files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setInputText(content);
      if (file.name.endsWith('.csv') || file.name.endsWith('.tsv')) {
        setMode('csv-to-json');
      } else if (file.name.endsWith('.json')) {
        setMode('json-to-csv');
      }
    };
    reader.readAsText(file);
  };

  const handleCopy = async () => {
    if (!outputText) return;
    await navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!outputText) return;
    const isCsv = mode === 'json-to-csv';
    const mime = isCsv ? 'text/csv;charset=utf-8;' : 'application/json;charset=utf-8;';
    const ext = isCsv ? 'csv' : 'json';
    const blob = new Blob([outputText], { type: mime });
    saveAs(blob, `converted-data.${ext}`);
  };

  const handleMinify = () => {
    setErrorMsg(null);
    try {
      if (mode === 'json-to-csv') {
        const parsed = JSON.parse(inputText);
        setInputText(JSON.stringify(parsed));
      }
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message);
    }
  };

  const handleBeautify = () => {
    setErrorMsg(null);
    try {
      if (mode === 'json-to-csv') {
        const parsed = JSON.parse(inputText);
        setInputText(JSON.stringify(parsed, null, 2));
      }
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <ArrowLeftRight className="w-5 h-5 text-indigo-500" />
          Client-Side Data Converter (JSON ⇄ CSV)
        </h3>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
          Instant client-side transformation between JSON documents and CSV tabular spreadsheets with RFC 4180 parsing, quotes handling, and type inference.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Mode Switcher and Options Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-850 rounded-2xl border border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => {
              setMode('json-to-csv');
              setOutputText('');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              mode === 'json-to-csv'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            <FileJson className="w-3.5 h-3.5" /> JSON to CSV
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('csv-to-json');
              setOutputText('');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              mode === 'csv-to-json'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            <Table className="w-3.5 h-3.5" /> CSV to JSON
          </button>
        </div>

        <div className="flex items-center gap-2">
          {mode === 'json-to-csv' && (
            <>
              <button
                type="button"
                onClick={handleBeautify}
                className="px-2.5 py-1 text-[11px] rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-300 cursor-pointer"
              >
                Beautify
              </button>
              <button
                type="button"
                onClick={handleMinify}
                className="px-2.5 py-1 text-[11px] rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-300 cursor-pointer"
              >
                Minify
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => {
              setInputText(JSON.stringify(SAMPLE_DATA, null, 2));
              setMode('json-to-csv');
              setOutputText('');
            }}
            className="px-2.5 py-1 text-[11px] rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-200 dark:border-indigo-900 flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3 h-3" /> Load Sample
          </button>
        </div>
      </div>

      {/* Dropzone for fast file loading */}
      <Dropzone
        accept=".json,.csv,.tsv,.txt"
        maxFiles={1}
        onDrop={handleFileUpload}
        label="Drop a .json or .csv file to import, or paste text below"
      />

      {/* Editor Split Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Input Column */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Input {mode === 'json-to-csv' ? 'JSON' : 'CSV'}
            </span>
            <span className="text-[11px] text-gray-400 font-mono">
              {inputText.length} chars
            </span>
          </div>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={mode === 'json-to-csv' ? '[{"id": 1, "name": "..."}]' : 'id,name,role\n1,Alice,Engineer'}
            rows={14}
            className="w-full p-3.5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono text-xs focus:ring-2 focus:ring-indigo-500 outline-none resize-y"
          />
        </div>

        {/* Output Column */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Output {mode === 'json-to-csv' ? 'CSV' : 'JSON'}
            </span>
            <span className="text-[11px] text-gray-400 font-mono">
              {outputText.length} chars
            </span>
          </div>

          <textarea
            readOnly
            value={outputText}
            placeholder="Converted output will appear here after clicking Convert..."
            rows={14}
            className="w-full p-3.5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-mono text-xs focus:ring-2 focus:ring-indigo-500 outline-none resize-y"
          />
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={() => {
            setInputText('');
            setOutputText('');
            setErrorMsg(null);
          }}
          className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Clear All
        </button>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleConvert}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-600/20 transition cursor-pointer"
          >
            <ArrowLeftRight className="w-4 h-4" /> Convert Now
          </button>

          {outputText && (
            <>
              <button
                type="button"
                onClick={handleCopy}
                className="px-3.5 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy Result
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition cursor-pointer"
              >
                <Download className="w-4 h-4" /> Download ({mode === 'json-to-csv' ? '.csv' : '.json'})
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
