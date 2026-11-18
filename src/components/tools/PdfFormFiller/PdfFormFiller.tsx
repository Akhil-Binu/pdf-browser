import { useState, useCallback } from 'react';
import {
  FileEdit,
  FileText,
  RotateCcw,
  Download,
  AlertCircle,
  CheckCircle,
  CheckSquare,
  Type,
  List,
} from 'lucide-react';
import { PDFDocument, PDFTextField, PDFCheckBox, PDFDropdown } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { Dropzone } from '../../ui/Dropzone';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';

interface FormFieldItem {
  name: string;
  type: 'text' | 'checkbox' | 'dropdown' | 'other';
  value: string | boolean;
  options?: string[];
}

export function PdfFormFiller() {
  const [file, setFile] = useState<File | null>(null);
  const [fields, setFields] = useState<FormFieldItem[]>([]);
  const [flatten, setFlatten] = useState<boolean>(true);

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
      const form = pdfDoc.getForm();
      const rawFields = form.getFields();

      const parsed: FormFieldItem[] = [];

      for (const field of rawFields) {
        const name = field.getName();

        if (field instanceof PDFTextField) {
          parsed.push({
            name,
            type: 'text',
            value: field.getText() || '',
          });
        } else if (field instanceof PDFCheckBox) {
          parsed.push({
            name,
            type: 'checkbox',
            value: field.isChecked(),
          });
        } else if (field instanceof PDFDropdown) {
          parsed.push({
            name,
            type: 'dropdown',
            value: field.getSelected()[0] || '',
            options: field.getOptions(),
          });
        } else {
          parsed.push({
            name,
            type: 'other',
            value: '',
          });
        }
      }

      setFields(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to inspect PDF form fields');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleFieldChange = (index: number, val: string | boolean) => {
    setFields((prev) =>
      prev.map((f, i) => (i === index ? { ...f, value: val } : f))
    );
  };

  const handleSaveForm = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const form = pdfDoc.getForm();

      for (const item of fields) {
        try {
          if (item.type === 'text') {
            const field = form.getTextField(item.name);
            field.setText(String(item.value || ''));
          } else if (item.type === 'checkbox') {
            const field = form.getCheckBox(item.name);
            if (item.value) {
              field.check();
            } else {
              field.uncheck();
            }
          } else if (item.type === 'dropdown') {
            const field = form.getDropdown(item.name);
            if (item.value) {
              field.select(String(item.value));
            }
          }
        } catch {
          // ignore individual field mismatch
        }
      }

      if (flatten) {
        form.flatten();
      }

      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
      const baseName = file.name.replace(/\.pdf$/i, '');
      saveAs(blob, `${baseName}_filled.pdf`);
      setIsDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save filled PDF form');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setFields([]);
    setIsDone(false);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold flex items-center gap-2">
          <FileEdit className="w-6 h-6 text-blue-500" />
          PDF Form Filler & Flattener
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Detect and fill interactive AcroForm fields (text fields, checkboxes, dropdowns) directly in your browser, with an option to flatten the form to lock inputs.
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
            <span className="font-semibold text-sm">Form successfully saved and downloaded!</span>
          </div>
          <Button variant="secondary" size="sm" onClick={handleReset}>
            Fill Another Form
          </Button>
        </div>
      )}

      {!file ? (
        <Dropzone
          accept="application/pdf"
          onFilesAdded={handleFilesAdded}
          icon={<FileEdit className="w-12 h-12 text-blue-500" />}
          title="Drop PDF Form here to fill"
          subtitle="Supports tax forms, applications, contracts, and AcroForms"
        />
      ) : (
        <div className="space-y-6">
          {/* Header File Details */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-100 dark:bg-gray-800/60 border border-slate-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-500">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{file.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {fields.length} detected form {fields.length === 1 ? 'field' : 'fields'}
                </p>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Change PDF
            </Button>
          </div>

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-2">
              <Spinner className="w-8 h-8 text-blue-500" />
              <p className="text-xs text-gray-500 font-medium">Scanning PDF for form fields...</p>
            </div>
          ) : fields.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-3">
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
              <h4 className="font-bold text-gray-900 dark:text-gray-100">No AcroForm Fields Found</h4>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                This PDF does not contain interactive form fields. If you need to place text, signatures, or marks, use our <strong>Sign PDF</strong> or <strong>Watermark PDF</strong> utilities.
              </p>
            </div>
          ) : (
            <div className="p-5 sm:p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Form Fields ({fields.length})
                </span>

                <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={flatten}
                    onChange={(e) => setFlatten(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Flatten form (lock and prevent future changes)</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fields.map((f, idx) => (
                  <div
                    key={f.name || idx}
                    className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-750 bg-slate-50 dark:bg-gray-800/50 space-y-2"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 truncate">
                      {f.type === 'text' && <Type className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />}
                      {f.type === 'checkbox' && <CheckSquare className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />}
                      {f.type === 'dropdown' && <List className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />}
                      <span className="truncate">{f.name || `Field ${idx + 1}`}</span>
                    </div>

                    {f.type === 'text' && (
                      <input
                        type="text"
                        value={String(f.value || '')}
                        onChange={(e) => handleFieldChange(idx, e.target.value)}
                        placeholder="Enter value..."
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                      />
                    )}

                    {f.type === 'checkbox' && (
                      <label className="flex items-center gap-2 text-xs text-gray-800 dark:text-gray-200 cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          checked={Boolean(f.value)}
                          onChange={(e) => handleFieldChange(idx, e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span>Checked</span>
                      </label>
                    )}

                    {f.type === 'dropdown' && (
                      <select
                        value={String(f.value || '')}
                        onChange={(e) => handleFieldChange(idx, e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                      >
                        {f.options?.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <Button
                  onClick={handleSaveForm}
                  disabled={isProcessing}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5"
                >
                  {isProcessing ? (
                    <>
                      <Spinner className="w-4 h-4 mr-2" />
                      Saving Form...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Save & Download Filled PDF
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
