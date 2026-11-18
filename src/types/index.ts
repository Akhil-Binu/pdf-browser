export interface PdfFile {
  id: string;
  file: File;
  name: string;
  size: number;
  pageCount: number;
}

export interface ImageFile {
  id: string;
  file: File;
  name: string;
  size: number;
  preview: string;
}

export interface CompressedImage {
  original: ImageFile;
  compressed: {
    blob: Blob;
    size: number;
    name: string;
    preview: string;
  };
  savings: number;
}

export type PageOrientation = 'portrait' | 'landscape';
export type PageFit = 'fit' | 'original';

export type ToolCategory = 'all' | 'pdf' | 'image' | 'smart';

export type ToolType =
  | 'merge-pdf'
  | 'split-pdf'
  | 'rotate-pdf'
  | 'pdf-to-images'
  | 'watermark-pdf'
  | 'protect-pdf'
  | 'compress-image'
  | 'image-to-pdf'
  | 'convert-image'
  | 'crop-image'
  | 'filter-scanner'
  | 'ocr-extract';

export interface ToolDefinition {
  type: ToolType;
  category: 'pdf' | 'image' | 'smart';
  label: string;
  shortDesc: string;
  badge?: string;
  iconName: string;
}
