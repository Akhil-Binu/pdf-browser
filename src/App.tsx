import { useState } from 'react';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { ToolSwitcher } from './components/layout/ToolSwitcher';

// 12 Original Tools
import { MergePdf } from './components/tools/MergePdf/MergePdf';
import { SplitPdf } from './components/tools/SplitPdf/SplitPdf';
import { RotatePdf } from './components/tools/RotatePdf/RotatePdf';
import { PdfToImages } from './components/tools/PdfToImages/PdfToImages';
import { WatermarkPdf } from './components/tools/WatermarkPdf/WatermarkPdf';
import { ProtectPdf } from './components/tools/ProtectPdf/ProtectPdf';
import { CompressImage } from './components/tools/CompressImage/CompressImage';
import { ImageToPdf } from './components/tools/ImageToPdf/ImageToPdf';
import { ConvertImage } from './components/tools/ConvertImage/ConvertImage';
import { CropImage } from './components/tools/CropImage/CropImage';
import { FilterScanner } from './components/tools/FilterScanner/FilterScanner';
import { OcrTool } from './components/tools/OcrTool/OcrTool';

// 11 v3.0 Tools
import { PdfSigner } from './components/tools/PdfSigner/PdfSigner';
import { PdfRedactor } from './components/tools/PdfRedactor/PdfRedactor';
import { PdfResizer } from './components/tools/PdfResizer/PdfResizer';
import { PdfDiff } from './components/tools/PdfDiff/PdfDiff';
import { FaviconGen } from './components/tools/FaviconGen/FaviconGen';
import { ColorPalette } from './components/tools/ColorPalette/ColorPalette';
import { SvgOptimizer } from './components/tools/SvgOptimizer/SvgOptimizer';
import { QrSuite } from './components/tools/QrSuite/QrSuite';
import { CodePoster } from './components/tools/CodePoster/CodePoster';
import { VideoFrames } from './components/tools/VideoFrames/VideoFrames';
import { AudioTrimmer } from './components/tools/AudioTrimmer/AudioTrimmer';

// 14 v4.0 Tools
import { PdfFormFiller } from './components/tools/PdfFormFiller/PdfFormFiller';
import { PdfMetadata } from './components/tools/PdfMetadata/PdfMetadata';
import { PdfTextExtract } from './components/tools/PdfTextExtract/PdfTextExtract';
import { MarkdownToPdf } from './components/tools/MarkdownToPdf/MarkdownToPdf';
import { BatchWatermark } from './components/tools/BatchWatermark/BatchWatermark';
import { MemeMaker } from './components/tools/MemeMaker/MemeMaker';
import { FileEncryptor } from './components/tools/FileEncryptor/FileEncryptor';
import { HashVerifier } from './components/tools/HashVerifier/HashVerifier';
import { Steganography } from './components/tools/Steganography/Steganography';
import { DataConverter } from './components/tools/DataConverter/DataConverter';
import { Base64Studio } from './components/tools/Base64Studio/Base64Studio';
import { RegexTester } from './components/tools/RegexTester/RegexTester';
import { ScreenRecorder } from './components/tools/ScreenRecorder/ScreenRecorder';
import { AudioSpeed } from './components/tools/AudioSpeed/AudioSpeed';

import type { ToolType } from './types';

function App() {
  const [activeTool, setActiveTool] = useState<ToolType>('merge-pdf');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-8 md:py-10">
        {/* Hero Section */}
        <div className="text-center mb-5 sm:mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-[11px] sm:text-xs font-bold border border-blue-200 dark:border-blue-800 mb-2">
            <span>v4.0 • 37 High-Speed Client Utilities</span>
          </div>
          <h2 className="text-xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Client-Side PDF, Media, Security & Dev Studio
          </h2>
          <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 max-w-xl mx-auto px-2">
            Process documents, multimedia, encryption vaults, QR codes, audio and code securely right in your browser. 100% local computations with zero file uploads and zero servers.
          </p>
        </div>

        {/* Tool Switcher & Category Filter */}
        <ToolSwitcher activeTool={activeTool} onToolChange={setActiveTool} />

        {/* Active Tool Workspace */}
        <div className="mt-4 sm:mt-6 bg-white/80 dark:bg-gray-900/70 backdrop-blur-md rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 md:p-8 border border-gray-200/80 dark:border-gray-800 shadow-xl shadow-gray-200/40 dark:shadow-none">
          {/* PDF Suite */}
          {activeTool === 'merge-pdf' && <MergePdf />}
          {activeTool === 'split-pdf' && <SplitPdf />}
          {activeTool === 'rotate-pdf' && <RotatePdf />}
          {activeTool === 'pdf-to-images' && <PdfToImages />}
          {activeTool === 'watermark-pdf' && <WatermarkPdf />}
          {activeTool === 'protect-pdf' && <ProtectPdf />}
          {activeTool === 'sign-pdf' && <PdfSigner />}
          {activeTool === 'redact-pdf' && <PdfRedactor />}
          {activeTool === 'resize-pdf' && <PdfResizer />}
          {activeTool === 'diff-pdf' && <PdfDiff />}
          {activeTool === 'form-pdf' && <PdfFormFiller />}
          {activeTool === 'metadata-pdf' && <PdfMetadata />}
          {activeTool === 'extract-text-pdf' && <PdfTextExtract />}
          {activeTool === 'markdown-to-pdf' && <MarkdownToPdf />}

          {/* Image & Design Suite */}
          {activeTool === 'compress-image' && <CompressImage />}
          {activeTool === 'image-to-pdf' && <ImageToPdf />}
          {activeTool === 'convert-image' && <ConvertImage />}
          {activeTool === 'crop-image' && <CropImage />}
          {activeTool === 'filter-scanner' && <FilterScanner />}
          {activeTool === 'favicon-gen' && <FaviconGen />}
          {activeTool === 'color-palette' && <ColorPalette />}
          {activeTool === 'svg-optimizer' && <SvgOptimizer />}
          {activeTool === 'batch-watermark' && <BatchWatermark />}
          {activeTool === 'meme-maker' && <MemeMaker />}

          {/* Dev & Security Suite */}
          {activeTool === 'ocr-extract' && <OcrTool />}
          {activeTool === 'qr-suite' && <QrSuite />}
          {activeTool === 'code-poster' && <CodePoster />}
          {activeTool === 'file-encrypt' && <FileEncryptor />}
          {activeTool === 'hash-verifier' && <HashVerifier />}
          {activeTool === 'steganography' && <Steganography />}
          {activeTool === 'data-converter' && <DataConverter />}
          {activeTool === 'base64-studio' && <Base64Studio />}
          {activeTool === 'regex-tester' && <RegexTester />}

          {/* Media & Audio Suite */}
          {activeTool === 'video-frames' && <VideoFrames />}
          {activeTool === 'audio-trimmer' && <AudioTrimmer />}
          {activeTool === 'screen-recorder' && <ScreenRecorder />}
          {activeTool === 'audio-speed' && <AudioSpeed />}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default App;
