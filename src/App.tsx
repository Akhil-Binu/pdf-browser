import { useState } from 'react';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { ToolSwitcher } from './components/layout/ToolSwitcher';
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
import type { ToolType } from './types';

function App() {
  const [activeTool, setActiveTool] = useState<ToolType>('merge-pdf');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 sm:py-10">
        {/* Hero Section */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-200 dark:border-blue-800 mb-2">
            <span>v2.0 • 12 High-Speed Client Utilities</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Client-Side PDF & Image Toolkit
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
            Process documents and images securely right in your browser. All computations happen locally with zero file uploads and zero servers.
          </p>
        </div>

        {/* Tool Switcher & Category Filter */}
        <ToolSwitcher activeTool={activeTool} onToolChange={setActiveTool} />

        {/* Active Tool Workspace */}
        <div className="mt-6 bg-white/80 dark:bg-gray-900/70 backdrop-blur-md rounded-3xl p-5 sm:p-8 border border-gray-200/80 dark:border-gray-800 shadow-xl shadow-gray-200/40 dark:shadow-none">
          {activeTool === 'merge-pdf' && <MergePdf />}
          {activeTool === 'split-pdf' && <SplitPdf />}
          {activeTool === 'rotate-pdf' && <RotatePdf />}
          {activeTool === 'pdf-to-images' && <PdfToImages />}
          {activeTool === 'watermark-pdf' && <WatermarkPdf />}
          {activeTool === 'protect-pdf' && <ProtectPdf />}
          {activeTool === 'compress-image' && <CompressImage />}
          {activeTool === 'image-to-pdf' && <ImageToPdf />}
          {activeTool === 'convert-image' && <ConvertImage />}
          {activeTool === 'crop-image' && <CropImage />}
          {activeTool === 'filter-scanner' && <FilterScanner />}
          {activeTool === 'ocr-extract' && <OcrTool />}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default App;
