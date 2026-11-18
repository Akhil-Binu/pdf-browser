import { Moon, Sun, Shield, FileText } from 'lucide-react';
import { useDarkMode } from '../../hooks/useDarkMode';

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

export function Header() {
  const [isDark, toggleDark] = useDarkMode();

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm transition-colors">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              PDF & Image Kit
            </h1>
            <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
              Open Source
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Privacy Badges */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-full">
            <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              100% Local • Files Never Leave Your Browser
            </span>
          </div>

          <div className="md:hidden flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-full">
            <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              100% Local
            </span>
          </div>

          {/* GitHub Repo Link */}
          <a
            href="https://github.com/Akhil-Binu/pdf-browser"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer text-gray-700 dark:text-gray-300"
            title="GitHub Repository (Open Source)"
            aria-label="GitHub Repository"
          >
            <GithubIcon className="w-4 h-4" />
          </a>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDark}
            className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer text-gray-600 dark:text-gray-300"
            aria-label="Toggle dark mode"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
