import { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  Upload,
  FilePlus2,
  CheckCircle,
  RotateCcw,
  AlertCircle,
  FileStack,
} from 'lucide-react';
import { saveAs } from 'file-saver';
import type { PdfFile } from '../../../types';
import { generateId, formatFileSize } from '../../../utils/format';
import { getPageCount, mergePdfs } from '../../../utils/pdfUtils';
import { Button } from '../../ui/Button';
import { Dropzone } from '../../ui/Dropzone';
import { Spinner } from '../../ui/Spinner';
import { PdfFileItem } from './PdfFileItem';

export function MergePdf() {
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesAdded = useCallback(async (newFiles: File[]) => {
    setIsLoading(true);
    setError(null);
    setIsDone(false);
    try {
      const pdfFiles: PdfFile[] = [];
      for (const file of newFiles) {
        const pageCount = await getPageCount(file);
        pdfFiles.push({
          id: generateId(),
          file,
          name: file.name,
          size: file.size,
          pageCount,
        });
      }
      setFiles((prev) => [...prev, ...pdfFiles]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to read PDF files'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const moveUp = useCallback((id: string) => {
    setFiles((prev) => {
      const index = prev.findIndex((f) => f.id === id);
      if (index <= 0) return prev;
      const newFiles = [...prev];
      [newFiles[index - 1], newFiles[index]] = [
        newFiles[index],
        newFiles[index - 1],
      ];
      return newFiles;
    });
  }, []);

  const moveDown = useCallback((id: string) => {
    setFiles((prev) => {
      const index = prev.findIndex((f) => f.id === id);
      if (index < 0 || index >= prev.length - 1) return prev;
      const newFiles = [...prev];
      [newFiles[index], newFiles[index + 1]] = [
        newFiles[index + 1],
        newFiles[index],
      ];
      return newFiles;
    });
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFiles((prev) => {
        const oldIndex = prev.findIndex((f) => f.id === active.id);
        const newIndex = prev.findIndex((f) => f.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }, []);

  const handleMerge = useCallback(async () => {
    setIsMerging(true);
    setError(null);
    try {
      const mergedBytes = await mergePdfs(files.map((f) => f.file));
      const blob = new Blob([mergedBytes as unknown as BlobPart], { type: 'application/pdf' });
      saveAs(blob, 'merged.pdf');
      setIsDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to merge PDFs');
    } finally {
      setIsMerging(false);
    }
  }, [files]);

  const handleClear = useCallback(() => {
    setFiles([]);
    setIsMerging(false);
    setIsDone(false);
    setIsLoading(false);
    setError(null);
  }, []);

  const totalPages = files.reduce((sum, f) => sum + f.pageCount, 0);
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  return (
    <div className="space-y-6">
      <Dropzone
        onFilesAdded={handleFilesAdded}
        accept="application/pdf"
        multiple={true}
        label="Drop PDF files here"
        sublabel="or click to browse"
        icon={<Upload className="w-8 h-8 text-blue-500" />}
      />

      {isLoading && (
        <div className="flex flex-col items-center gap-3 py-6">
          <Spinner size="md" />
          <p className="text-sm text-gray-500">Reading PDF files...</p>
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileStack className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {files.length} {files.length === 1 ? 'file' : 'files'} •{' '}
                {totalPages} {totalPages === 1 ? 'page' : 'pages'} •{' '}
                {formatFileSize(totalSize)}
              </span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              icon={<RotateCcw className="w-4 h-4" />}
              onClick={handleClear}
            >
              Clear all
            </Button>
          </div>

          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={files.map((f) => f.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {files.map((file, index) => (
                  <PdfFileItem
                    key={file.id}
                    file={file}
                    index={index}
                    onRemove={removeFile}
                    onMoveUp={moveUp}
                    onMoveDown={moveDown}
                    isFirst={index === 0}
                    isLast={index === files.length - 1}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <Button
            variant="primary"
            size="lg"
            onClick={handleMerge}
            loading={isMerging}
            disabled={files.length < 2 || isMerging}
            icon={<FilePlus2 className="w-5 h-5" />}
            className="w-full"
          >
            {isMerging
              ? 'Merging...'
              : `Merge ${files.length} PDFs & Download`}
          </Button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {isDone && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            <p className="text-sm text-green-700 dark:text-green-400">
              PDF merged successfully! Your download should start automatically.
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={handleClear}
            icon={<RotateCcw className="w-4 h-4" />}
            className="w-full"
          >
            Clear / Start Over
          </Button>
        </div>
      )}
    </div>
  );
}
