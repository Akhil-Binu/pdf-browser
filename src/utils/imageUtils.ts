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

      // Determine output format
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

export function createImagePreview(file: File): string {
  return URL.createObjectURL(file);
}

export function revokePreview(url: string): void {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}
