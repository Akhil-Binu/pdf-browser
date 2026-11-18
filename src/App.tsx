import { useState } from 'react';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { ToolSwitcher } from './components/layout/ToolSwitcher';

// 12 Existing Tools
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

// 11 New Tools (v3.0.0)
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

import type { ToolType } from './types';

function App() {
  const [activeTool, setActiveTool] = useState<ToolType>('merge-pdf');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-8 md:py-10">
        {/* Hero Section */}
        <div className="text-center mb-5 sm:mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[11px] sm:text-xs font-bold border border-emerald-200 dark:border-emerald-800 mb-2">
            <span>v3.0 • 23 High-Speed Client Utilities</span>
          </div>
          <h2 className="text-xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Client-Side PDF, Image & Media Studio
          </h2>
          <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 max-w-xl mx-auto px-2">
            Process documents, images, audio, video, and code securely right in your browser. All computations happen locally with zero file uploads and zero servers.
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

          {/* Image & Design Suite */}
          {activeTool === 'compress-image' && <CompressImage />}
          {activeTool === 'image-to-pdf' && <ImageToPdf />}
          {activeTool === 'convert-image' && <ConvertImage />}
          {activeTool === 'crop-image' && <CropImage />}
          {activeTool === 'filter-scanner' && <FilterScanner />}
          {activeTool === 'favicon-gen' && <FaviconGen />}
          {activeTool === 'color-palette' && <ColorPalette />}
          {activeTool === 'svg-optimizer' && <SvgOptimizer />}

          {/* Dev & Smart Suite */}
          {activeTool === 'ocr-extract' && <OcrTool />}
          {activeTool === 'qr-suite' && <QrSuite />}
          {activeTool === 'code-poster' && <CodePoster />}

          {/* Media Suite */}
          {activeTool === 'video-frames' && <VideoFrames />}
          {activeTool === 'audio-trimmer' && <AudioTrimmer />}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default App;
