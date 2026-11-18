import { useState, useCallback, useEffect } from 'react';
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
  FileImage,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Smartphone,
  Monitor,
  Maximize,
  Move,
  Trash2,
} from 'lucide-react';
import { saveAs } from 'file-saver';
import type { ImageFile, PageOrientation, PageFit } from '../../../types';
import { generateId, formatFileSize } from '../../../utils/format';
import { imagesToPdf } from '../../../utils/pdfUtils';
import { createImagePreview, revokePreview } from '../../../utils/imageUtils';
import { Button } from '../../ui/Button';
import { Dropzone } from '../../ui/Dropzone';
import { Spinner } from '../../ui/Spinner';
import { ImageItem } from './ImageItem';

export function ImageToPdf() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [orientation, setOrientation] = useState<PageOrientation>('portrait');
  const [pageFit, setPageFit] = useState<PageFit>('fit');
  const [isConverting, setIsConverting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      images.forEach((img) => revokePreview(img.preview));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilesAdded = useCallback((newFiles: File[]) => {
    const imageFiles: ImageFile[] = newFiles.map((file) => ({
      id: generateId(),
      file,
      name: file.name,
      size: file.size,
      preview: createImagePreview(file),
    }));
    setImages((prev) => [...prev, ...imageFiles]);
    setIsDone(false);
    setError(null);
  }, []);

  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img) revokePreview(img.preview);
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const moveUp = useCallback((id: string) => {
    setImages((prev) => {
      const index = prev.findIndex((i) => i.id === id);
      if (index <= 0) return prev;
      const newImages = [...prev];
      [newImages[index - 1], newImages[index]] = [
        newImages[index],
        newImages[index - 1],
      ];
      return newImages;
    });
  }, []);

  const moveDown = useCallback((id: string) => {
    setImages((prev) => {
      const index = prev.findIndex((i) => i.id === id);
      if (index < 0 || index >= prev.length - 1) return prev;
      const newImages = [...prev];
      [newImages[index], newImages[index + 1]] = [
        newImages[index + 1],
        newImages[index],
      ];
      return newImages;
    });
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setImages((prev) => {
        const oldIndex = prev.findIndex((i) => i.id === active.id);
        const newIndex = prev.findIndex((i) => i.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }, []);

  const handleConvert = useCallback(async () => {
    setIsConverting(true);
    setError(null);
    try {
      const result = await imagesToPdf(
        images.map((img) => ({ file: img.file, orientation, fit: pageFit }))
      );
      const blob = new Blob([result as unknown as BlobPart], { type: 'application/pdf' });
      saveAs(blob, 'images.pdf');
      setIsDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion failed');
    } finally {
      setIsConverting(false);
    }
  }, [images, orientation, pageFit]);

  const handleClear = useCallback(() => {
    images.forEach((img) => revokePreview(img.preview));
    setImages([]);
    setOrientation('portrait');
    setPageFit('fit');
    setIsConverting(false);
    setIsDone(false);
    setError(null);
  }, [images]);

  const totalSize = images.reduce((sum, img) => sum + img.size, 0);

  return (
    <div className="space-y-6">
      <Dropzone
        onFilesAdded={handleFilesAdded}
        accept="image/png,image/jpeg,image/webp"
        multiple={true}
        label="Drop images here"
        sublabel="PNG, JPG, or WebP • Reorder pages and customize layout"
        icon={<Upload className="w-8 h-8 text-blue-500" />}
      />

      {images.length > 0 && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
              PDF Page Layout
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Orientation
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setOrientation('portrait')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                      orientation === 'portrait'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-750 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" /> Portrait
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrientation('landscape')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                      orientation === 'landscape'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-750 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Monitor className="w-4 h-4" /> Landscape
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Image Sizing
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPageFit('fit')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                      pageFit === 'fit'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-750 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Maximize className="w-4 h-4" /> Fit to Page
                  </button>
                  <button
                    type="button"
                    onClick={() => setPageFit('original')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                      pageFit === 'original'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-750 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Move className="w-4 h-4" /> Original Size
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {images.length} {images.length === 1 ? 'image' : 'images'} • Total {formatFileSize(totalSize)}
              </span>
              <Button
                size="sm"
                variant="ghost"
                icon={<Trash2 className="w-4 h-4" />}
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
                items={images.map((i) => i.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {images.map((image, index) => (
                    <ImageItem
                      key={image.id}
                      image={image}
                      index={index}
                      onRemove={removeImage}
                      onMoveUp={moveUp}
                      onMoveDown={moveDown}
                      isFirst={index === 0}
                      isLast={index === images.length - 1}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={handleConvert}
            loading={isConverting}
            disabled={images.length === 0 || isConverting}
            icon={<FileImage className="w-5 h-5" />}
            className="w-full"
          >
            {isConverting
              ? 'Creating PDF...'
              : `Create PDF from ${images.length} ${images.length === 1 ? 'Image' : 'Images'}`}
          </Button>
        </div>
      )}

      {isConverting && (
        <div className="flex flex-col items-center gap-3 py-8">
          <Spinner size="lg" />
          <p className="text-sm text-gray-500">Creating PDF...</p>
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
              PDF created and downloaded successfully! (images.pdf)
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
