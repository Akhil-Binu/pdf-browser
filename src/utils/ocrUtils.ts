import { createWorker } from 'tesseract.js';

export interface OcrResult {
  text: string;
  confidence: number;
  lines: string[];
}

export async function extractTextFromImage(
  imageSource: File | Blob | string,
  language = 'eng',
  onProgress?: (progress: number, status: string) => void
): Promise<OcrResult> {
  const worker = await createWorker(language, 1, {
    logger: (m) => {
      if (onProgress && m.status === 'recognizing text') {
        onProgress(Math.round(m.progress * 100), m.status);
      } else if (onProgress) {
        onProgress(0, m.status || 'Loading OCR language models...');
      }
    },
  });

  try {
    const ret = await worker.recognize(imageSource);
    await worker.terminate();

    return {
      text: ret.data.text,
      confidence: Math.round(ret.data.confidence),
      lines: ret.data.lines ? ret.data.lines.map((l) => l.text) : [],
    };
  } catch (err) {
    await worker.terminate();
    throw err;
  }
}
