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
export type ToolType = 'merge-pdf' | 'compress-image' | 'image-to-pdf';
