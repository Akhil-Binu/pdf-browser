import { PDFDocument } from 'pdf-lib';
import type { PageOrientation, PageFit } from '../types';

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
        // Fallback for WebP/SVG/BMP/etc: render to canvas and embed as PNG
        const pngBytes = await imageToCanvasPngBytes(file);
        embeddedImage = await pdfDoc.embedPng(pngBytes);
      }
    } catch {
      // If direct embed failed (e.g. progressive JPEG or unusual PNG chunk), fallback to canvas
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
