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

export type ToolCategory = 'all' | 'pdf' | 'image' | 'smart' | 'dev' | 'media';

export type ToolType =
  // PDF Utilities
  | 'merge-pdf'
  | 'split-pdf'
  | 'rotate-pdf'
  | 'pdf-to-images'
  | 'watermark-pdf'
  | 'protect-pdf'
  | 'sign-pdf'
  | 'redact-pdf'
  | 'resize-pdf'
  | 'diff-pdf'
  | 'form-pdf'
  | 'metadata-pdf'
  | 'extract-text-pdf'
  | 'markdown-to-pdf'
  // Image & Design
  | 'compress-image'
  | 'image-to-pdf'
  | 'convert-image'
  | 'crop-image'
  | 'filter-scanner'
  | 'favicon-gen'
  | 'color-palette'
  | 'svg-optimizer'
  | 'batch-watermark'
  | 'meme-maker'
  // Dev & Security
  | 'ocr-extract'
  | 'code-poster'
  | 'qr-suite'
  | 'file-encrypt'
  | 'hash-verifier'
  | 'steganography'
  | 'data-converter'
  | 'base64-studio'
  | 'regex-tester'
  // Media & Audio
  | 'video-frames'
  | 'audio-trimmer'
  | 'screen-recorder'
  | 'audio-speed';

export interface ToolDefinition {
  type: ToolType;
  category: 'pdf' | 'image' | 'smart' | 'dev' | 'media';
  label: string;
  shortDesc: string;
  badge?: string;
  iconName: string;
}
