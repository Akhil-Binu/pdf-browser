import { ShieldCheck, Cpu, HardDrive } from 'lucide-react';

const currentYear = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm py-8 transition-colors">
      <div className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6 text-center sm:text-left">
          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">Zero Server Uploads</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Files never touch any remote server</p>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">Browser-Powered</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">WebAssembly & Canvas acceleration</p>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">100% In-Memory</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Memory freed instantly on reset</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800 pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 dark:text-gray-400 gap-2">
          <p>© {currentYear} PDF & Image Kit • Production-ready client-side utility</p>
          <p>Built with React, Vite, Tailwind CSS & Web APIs</p>
        </div>
      </div>
    </footer>
  );
}
