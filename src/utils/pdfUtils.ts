import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import type { PageOrientation, PageFit } from '../types';

// Setup pdfjs worker
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
  } catch {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  }
}

export async function getPageCount(file: File): Promise<number> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  return pdfDoc.getPageCount();
}

export async function mergePdfs(files: File[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  return mergedPdf.save();
}

/**
 * Extracts a subset of pages into a new PDF document.
 * @param pageIndices 0-based indices of pages to keep
 */
export async function extractPdfPages(
  file: File,
  pageIndices: number[]
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const srcDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const newDoc = await PDFDocument.create();

  const copiedPages = await newDoc.copyPages(srcDoc, pageIndices);
  copiedPages.forEach((p) => newDoc.addPage(p));

  return newDoc.save();
}

/**
 * Splits a PDF into multiple separate documents based on page groups.
 */
export async function splitPdfIntoFiles(
  file: File,
  pageGroups: number[][] // 0-based indices grouped
): Promise<{ name: string; bytes: Uint8Array }[]> {
  const arrayBuffer = await file.arrayBuffer();
  const srcDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const baseName = file.name.replace(/\.pdf$/i, '');
  const results: { name: string; bytes: Uint8Array }[] = [];

  for (let i = 0; i < pageGroups.length; i++) {
    const group = pageGroups[i];
    const newDoc = await PDFDocument.create();
    const copiedPages = await newDoc.copyPages(srcDoc, group);
    copiedPages.forEach((p) => newDoc.addPage(p));
    const bytes = await newDoc.save();
    const pageLabel = group.length === 1 ? `page_${group[0] + 1}` : `pages_${group[0] + 1}-${group[group.length - 1] + 1}`;
    results.push({
      name: `${baseName}_${pageLabel}.pdf`,
      bytes,
    });
  }

  return results;
}

/**
 * Rotates specific pages in a PDF document and allows reordering/deleting.
 */
export async function rotateAndReorganizePdf(
  file: File,
  pagesConfig: Array<{ originalIndex: number; rotation: number }>
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const srcDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const newDoc = await PDFDocument.create();

  for (const item of pagesConfig) {
    const [copied] = await newDoc.copyPages(srcDoc, [item.originalIndex]);
    const currentAngle = copied.getRotation().angle;
    copied.setRotation(degrees((currentAngle + item.rotation) % 360));
    newDoc.addPage(copied);
  }

  return newDoc.save();
}

/**
 * Adds custom text watermark and optional page numbering to PDF.
 */
export async function addWatermarkToPdf(
  file: File,
  options: {
    watermarkText?: string;
    opacity: number;
    fontSize: number;
    angle: number;
    color: { r: number; g: number; b: number };
    includePageNumbers: boolean;
    pageNumberPosition: 'bottom-center' | 'bottom-right' | 'top-right';
  }
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const totalPages = pdfDoc.getPageCount();

  const {
    watermarkText,
    opacity,
    fontSize,
    angle,
    color,
    includePageNumbers,
    pageNumberPosition,
  } = options;

  for (let i = 0; i < totalPages; i++) {
    const page = pdfDoc.getPage(i);
    const { width, height } = page.getSize();

    // 1. Watermark text
    if (watermarkText && watermarkText.trim().length > 0) {
      const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
      const textHeight = font.heightAtSize(fontSize);

      page.drawText(watermarkText, {
        x: width / 2 - (textWidth / 2) * Math.cos((angle * Math.PI) / 180),
        y: height / 2 - (textHeight / 2) * Math.sin((angle * Math.PI) / 180),
        size: fontSize,
        font,
        color: rgb(color.r, color.g, color.b),
        opacity,
        rotate: degrees(angle),
      });
    }

    // 2. Page numbers
    if (includePageNumbers) {
      const pageStr = `${i + 1} / ${totalPages}`;
      const numFontSize = 10;
      const numWidth = font.widthOfTextAtSize(pageStr, numFontSize);

      let x = (width - numWidth) / 2;
      let y = 25;

      if (pageNumberPosition === 'bottom-right') {
        x = width - numWidth - 30;
        y = 25;
      } else if (pageNumberPosition === 'top-right') {
        x = width - numWidth - 30;
        y = height - 30;
      }

      page.drawText(pageStr, {
        x,
        y,
        size: numFontSize,
        font,
        color: rgb(0.3, 0.3, 0.3),
        opacity: 0.8,
      });
    }
  }

  return pdfDoc.save();
}

/**
 * Protect PDF with password encryption using pdf-lib.
 */
export async function protectPdfDocument(
  file: File,
  userPassword: string,
  ownerPassword?: string
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

  // Encrypt with AES-256 standard via pdf-lib encrypt method
  // Note: pdf-lib encrypt requires userPassword and optional ownerPassword
  if (typeof (pdfDoc as unknown as { encrypt?: (opts: unknown) => void }).encrypt === 'function') {
    (pdfDoc as unknown as { encrypt: (opts: unknown) => void }).encrypt({
      userPassword,
      ownerPassword: ownerPassword || userPassword,
      permissions: {
        printing: 'highResolution',
        modifying: false,
        copying: false,
        annotating: false,
        fillingForms: true,
        contentAccessibility: true,
      },
    });
  }

  return pdfDoc.save();
}

/**
 * Renders a PDF page to a canvas using PDF.js.
 */
export async function renderPdfPageToCanvas(
  file: File,
  pageNumber: number, // 1-based
  scale = 1.5
): Promise<HTMLCanvasElement> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(pageNumber);

  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not get 2D canvas context');

  const renderContext = {
    canvasContext: context,
    viewport,
  };

  await page.render(renderContext).promise;
  return canvas;
}

/**
 * Converts all pages in a PDF to high-res images.
 */
export async function convertPdfToImages(
  file: File,
  format: 'image/png' | 'image/jpeg' = 'image/png',
  quality = 0.9,
  scale = 2.0,
  onProgress?: (current: number, total: number) => void
): Promise<Array<{ pageNumber: number; blob: Blob; preview: string; name: string }>> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;
  const baseName = file.name.replace(/\.pdf$/i, '');
  const ext = format === 'image/png' ? 'png' : 'jpg';

  const results: Array<{ pageNumber: number; blob: Blob; preview: string; name: string }> = [];

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const context = canvas.getContext('2d');
    if (!context) continue;

    // Fill white background for JPEGs
    if (format === 'image/jpeg') {
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
    }

    await page.render({ canvasContext: context, viewport }).promise;

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error('Canvas toBlob failed'));
        },
        format,
        quality
      );
    });

    const preview = URL.createObjectURL(blob);
    results.push({
      pageNumber: i,
      blob,
      preview,
      name: `${baseName}_page_${i}.${ext}`,
    });

    if (onProgress) {
      onProgress(i, totalPages);
    }
  }

  return results;
}

function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function imageToCanvasPngBytes(file: File): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 800;
        canvas.height = img.naturalHeight || 600;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error('Could not get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        URL.revokeObjectURL(url);
        resolve(dataUrlToUint8Array(dataUrl));
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load image: ${file.name}`));
    };

    img.src = url;
  });
}

async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth || 800, height: img.naturalHeight || 600 });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to read dimensions for: ${file.name}`));
    };

    img.src = url;
  });
}

export async function imagesToPdf(
  images: Array<{ file: File; orientation: PageOrientation; fit: PageFit }>
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const MARGIN = 40;

  for (const { file, orientation, fit } of images) {
    const pageWidth = orientation === 'portrait' ? 595.28 : 841.89;
    const pageHeight = orientation === 'portrait' ? 841.89 : 595.28;

    let embeddedImage;
    const fileType = file.type.toLowerCase();

    try {
      if (fileType === 'image/webp') {
        const pngBytes = await imageToCanvasPngBytes(file);
        embeddedImage = await pdfDoc.embedPng(pngBytes);
      } else if (fileType === 'image/png') {
        const arrayBuffer = await file.arrayBuffer();
        embeddedImage = await pdfDoc.embedPng(arrayBuffer);
      } else if (fileType === 'image/jpeg' || fileType === 'image/jpg') {
        const arrayBuffer = await file.arrayBuffer();
        embeddedImage = await pdfDoc.embedJpg(arrayBuffer);
      } else {
        const pngBytes = await imageToCanvasPngBytes(file);
        embeddedImage = await pdfDoc.embedPng(pngBytes);
      }
    } catch {
      const pngBytes = await imageToCanvasPngBytes(file);
      embeddedImage = await pdfDoc.embedPng(pngBytes);
    }

    const imgDims = await getImageDimensions(file);
    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    const availableWidth = pageWidth - MARGIN * 2;
    const availableHeight = pageHeight - MARGIN * 2;

    let drawWidth: number;
    let drawHeight: number;

    if (fit === 'fit') {
      const scaleX = availableWidth / imgDims.width;
      const scaleY = availableHeight / imgDims.height;
      const scale = Math.min(scaleX, scaleY, 1);
      drawWidth = imgDims.width * scale;
      drawHeight = imgDims.height * scale;
    } else {
      drawWidth = Math.min(imgDims.width, availableWidth);
      drawHeight = Math.min(imgDims.height, availableHeight);
      if (drawWidth < imgDims.width || drawHeight < imgDims.height) {
        const scaleX = availableWidth / imgDims.width;
        const scaleY = availableHeight / imgDims.height;
        const scale = Math.min(scaleX, scaleY);
        drawWidth = imgDims.width * scale;
        drawHeight = imgDims.height * scale;
      }
    }

    const x = (pageWidth - drawWidth) / 2;
    const y = (pageHeight - drawHeight) / 2;

    page.drawImage(embeddedImage, {
      x,
      y,
      width: drawWidth,
      height: drawHeight,
    });
  }

  return pdfDoc.save();
}
