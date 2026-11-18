import { ShieldCheck, Cpu, HardDrive, Heart, ExternalLink } from 'lucide-react';

const currentYear = new Date().getFullYear();

function GithubIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md py-8 transition-colors">
      <div className="max-w-5xl mx-auto px-4">
        {/* Value Props Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6 text-center sm:text-left">
          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <div className="p-2 rounded-xl bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">Zero Server Uploads</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Files never touch any remote server</p>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">Browser-Powered</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">WebAssembly & Canvas acceleration</p>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">100% In-Memory</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Memory freed instantly on reset</p>
            </div>
          </div>
        </div>

        {/* Open Source & GitHub Callout Banner */}
        <div className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl p-4 mb-6 border border-gray-200/80 dark:border-gray-700/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <p className="text-xs text-gray-700 dark:text-gray-300">
              <span className="font-bold text-gray-900 dark:text-white">100% Free & Open-Source</span> — Licensed under the MIT License. Contributions and feedback are welcome!
            </p>
          </div>

          <a
            href="https://github.com/Akhil-Binu/pdf-browser"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-all shadow-sm flex-shrink-0"
          >
            <GithubIcon className="w-4 h-4" />
            <span>GitHub Repository</span>
            <ExternalLink className="w-3 h-3 opacity-70" />
          </a>
        </div>

        {/* Bottom Credits */}
        <div className="border-t border-gray-100 dark:border-gray-800 pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 dark:text-gray-400 gap-2">
          <p>© {currentYear} PDF & Image Kit • Client-Side Open-Source Utility</p>
          <p className="flex items-center gap-1">
            Built with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> using React, Vite, and Tailwind CSS
          </p>
        </div>
      </div>
    </footer>
  );
}
