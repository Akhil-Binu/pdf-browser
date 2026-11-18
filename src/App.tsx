import { useState } from 'react';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { ToolSwitcher } from './components/layout/ToolSwitcher';
import { MergePdf } from './components/tools/MergePdf/MergePdf';
import { CompressImage } from './components/tools/CompressImage/CompressImage';
import { ImageToPdf } from './components/tools/ImageToPdf/ImageToPdf';
import type { ToolType } from './types';

function App() {
  const [activeTool, setActiveTool] = useState<ToolType>('merge-pdf');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 sm:py-12">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Client-Side File Utilities
          </h2>
          <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
            Process documents and images securely right in your browser. Fast, private, and with zero file uploads.
          </p>
        </div>

        {/* Tool Switcher */}
        <ToolSwitcher activeTool={activeTool} onToolChange={setActiveTool} />

        {/* Tool Container */}
        <div className="mt-8 bg-white/70 dark:bg-gray-900/60 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-gray-200/80 dark:border-gray-800 shadow-xl shadow-gray-200/50 dark:shadow-none">
          {activeTool === 'merge-pdf' && <MergePdf />}
          {activeTool === 'compress-image' && <CompressImage />}
          {activeTool === 'image-to-pdf' && <ImageToPdf />}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default App;
