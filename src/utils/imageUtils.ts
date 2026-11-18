import imageCompression from 'browser-image-compression';

async function canvasCompress(
  file: File,
  quality: number,
  maxWidthOrHeight?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let width = img.naturalWidth;
      let height = img.naturalHeight;

      if (maxWidthOrHeight && (width > maxWidthOrHeight || height > maxWidthOrHeight)) {
        if (width > height) {
          height = Math.round((height * maxWidthOrHeight) / width);
          width = maxWidthOrHeight;
        } else {
          width = Math.round((width * maxWidthOrHeight) / height);
          height = maxWidthOrHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas compression failed'));
          }
        },
        mime,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for canvas compression'));
    };

    img.src = url;
  });
}

export async function compressImage(
  file: File,
  quality: number,
  maxWidthOrHeight?: number
): Promise<Blob> {
  try {
    const options = {
      maxSizeMB: quality >= 0.9 ? 10 : quality >= 0.5 ? 5 : 2,
      maxWidthOrHeight: maxWidthOrHeight || undefined,
      useWebWorker: true,
      initialQuality: quality,
      fileType: file.type,
    };
    return await imageCompression(file, options);
  } catch (err) {
    console.warn('browser-image-compression worker failed, falling back to Canvas API:', err);
    return await canvasCompress(file, quality, maxWidthOrHeight);
  }
}

/**
 * Converts an image file to another target format (PNG, JPEG, WebP).
 */
export async function convertImageFormat(
  file: File,
  targetMime: 'image/png' | 'image/jpeg' | 'image/webp',
  quality = 0.92
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      // If converting to JPEG, draw white background behind transparent pixels
      if (targetMime === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Format conversion failed'));
        },
        targetMime,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for conversion'));
    };

    img.src = url;
  });
}

export type ScannerFilterType =
  | 'none'
  | 'bw-document'
  | 'grayscale'
  | 'high-contrast'
  | 'warm'
  | 'invert';

/**
 * Applies document enhancement / scanner filters to an image.
 */
export async function applyImageFilter(
  file: File,
  filterType: ScannerFilterType,
  threshold = 128
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }

      ctx.drawImage(img, 0, 0);

      if (filterType !== 'none') {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Calculate luminance
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;

          if (filterType === 'bw-document') {
            // Adaptive clean black-and-white scanner threshold
            const val = gray >= threshold ? 255 : 0;
            data[i] = val;
            data[i + 1] = val;
            data[i + 2] = val;
          } else if (filterType === 'grayscale') {
            data[i] = gray;
            data[i + 1] = gray;
            data[i + 2] = gray;
          } else if (filterType === 'high-contrast') {
            // S-curve high contrast
            const factor = 1.6;
            const newR = Math.min(255, Math.max(0, factor * (r - 128) + 128));
            const newG = Math.min(255, Math.max(0, factor * (g - 128) + 128));
            const newB = Math.min(255, Math.max(0, factor * (b - 128) + 128));
            data[i] = newR;
            data[i + 1] = newG;
            data[i + 2] = newB;
          } else if (filterType === 'warm') {
            data[i] = Math.min(255, r * 1.1);
            data[i + 2] = Math.max(0, b * 0.9);
          } else if (filterType === 'invert') {
            data[i] = 255 - r;
            data[i + 1] = 255 - g;
            data[i + 2] = 255 - b;
          }
        }

        ctx.putImageData(imageData, 0, 0);
      }

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Filter application failed'));
        },
        file.type.includes('png') ? 'image/png' : 'image/jpeg',
        0.95
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for filtering'));
    };

    img.src = url;
  });
}

/**
 * Crops an image given normalized or pixel rectangle coordinates.
 */
export async function cropImage(
  file: File,
  cropArea: { x: number; y: number; width: number; height: number }
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(cropArea.width));
      canvas.height = Math.max(1, Math.round(cropArea.height));
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      ctx.drawImage(
        img,
        cropArea.x,
        cropArea.y,
        cropArea.width,
        cropArea.height,
        0,
        0,
        canvas.width,
        canvas.height
      );

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Crop export failed'));
        },
        file.type.includes('png') ? 'image/png' : 'image/jpeg',
        0.95
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for cropping'));
    };

    img.src = url;
  });
}

/**
 * Strips EXIF metadata (GPS, serials, dates) by re-encoding via canvas.
 */
export async function stripExifMetadata(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }
      ctx.drawImage(img, 0, 0);

      // Re-encoding directly through Canvas strips all EXIF tags natively
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('EXIF strip failed'));
        },
        file.type,
        0.98
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for EXIF cleaning'));
    };

    img.src = url;
  });
}

export function createImagePreview(file: File): string {
  return URL.createObjectURL(file);
}

export function revokePreview(url: string): void {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}
