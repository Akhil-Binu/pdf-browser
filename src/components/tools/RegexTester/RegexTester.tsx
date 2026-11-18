import { useState, useMemo } from 'react';
import { Regex, Copy, Check, AlertCircle, ArrowRightLeft, BookOpen } from 'lucide-react';

interface RegexSnippet {
  name: string;
  pattern: string;
  flags: string;
  description: string;
  sample: string;
}

const REGEX_LIBRARY: RegexSnippet[] = [
  {
    name: 'Email Address',
    pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
    flags: 'g',
    description: 'RFC compliant email address format matcher',
    sample: 'Contact support@example.com or admin.team@domain.co.uk for inquiries.',
  },
  {
    name: 'Web URL',
    pattern: 'https?:\\/\\/(?:www\\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)',
    flags: 'g',
    description: 'Standard HTTP & HTTPS web links',
    sample: 'Visit https://github.com/Akhil-Binu/pdf-browser or http://localhost:5173.',
  },
  {
    name: 'IPv4 Address',
    pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b',
    flags: 'g',
    description: 'Dotted-quad IPv4 address ranges',
    sample: 'DNS servers: 127.0.0.1, 192.168.1.1, and cloud resolver 8.8.8.8.',
  },
  {
    name: 'Hex Color',
    pattern: '#(?:[0-9a-fA-F]{3,4}){1,2}\\b',
    flags: 'gi',
    description: '3, 4, 6 or 8-digit hexadecimal color codes',
    sample: 'Palette: #fff, #4f46e5, #ef4444, and #10b981aa.',
  },
  {
    name: 'Date (YYYY-MM-DD)',
    pattern: '\\b\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])\\b',
    flags: 'g',
    description: 'ISO-8601 calendar date formats',
    sample: 'Milestones: 2026-11-18 release date and 2026-12-25 target.',
  },
  {
    name: 'Phone Number',
    pattern: '\\+?[0-9]{1,4}?[-.\\s]?\\(?[0-9]{1,3}?\\)?[-.\\s]?[0-9]{1,4}[-.\\s]?[0-9]{1,9}',
    flags: 'g',
    description: 'International and standard phone number formatting',
    sample: 'Call +1 (555) 234-5678 or direct dial 555-8765.',
  },
];

interface MatchDetail {
  index: number;
  match: string;
  groups: string[];
}

export function RegexTester() {
  const [pattern, setPattern] = useState<string>('[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}');
  const [flags, setFlags] = useState<string>('g');
  const [testString, setTestString] = useState<string>(
    'Reach out to alex.dev@startup.io or security-lead@enterprise.com for questions regarding user_101!'
  );
  const [replacement, setReplacement] = useState<string>('***@***.com');
  const [copied, setCopied] = useState<boolean>(false);

  const toggleFlag = (flagChar: string) => {
    if (flags.includes(flagChar)) {
      setFlags(flags.replace(flagChar, ''));
    } else {
      setFlags(flags + flagChar);
    }
  };

  const { matches, replacedText, error } = useMemo(() => {
    if (!pattern) {
      return { matches: [], replacedText: testString, error: null };
    }

    try {
      const reg = new RegExp(pattern, flags);
      const allMatches: MatchDetail[] = [];
      let replaced = '';

      if (flags.includes('g')) {
        let m: RegExpExecArray | null;
        let guard = 0;
        while ((m = reg.exec(testString)) !== null && guard < 1000) {
          guard++;
          allMatches.push({
            index: m.index,
            match: m[0],
            groups: m.slice(1),
          });
          if (m.index === reg.lastIndex) {
            reg.lastIndex++;
          }
        }
      } else {
        const m = reg.exec(testString);
        if (m) {
          allMatches.push({
            index: m.index,
            match: m[0],
            groups: m.slice(1),
          });
        }
      }

      try {
        replaced = testString.replace(new RegExp(pattern, flags), replacement);
      } catch {
        replaced = testString;
      }

      return { matches: allMatches, replacedText: replaced, error: null };
    } catch (err: unknown) {
      const error = err as Error;
      return { matches: [], replacedText: testString, error: error.message };
    }
  }, [pattern, flags, testString, replacement]);

  const loadSnippet = (snippet: RegexSnippet) => {
    setPattern(snippet.pattern);
    setFlags(snippet.flags);
    setTestString(snippet.sample);
  };

  const handleCopyReplaced = async () => {
    await navigator.clipboard.writeText(replacedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Regex className="w-5 h-5 text-indigo-500" />
          Client-Side Regex Tester & Debugger
        </h3>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
          Validate, debug, and benchmark regular expressions in real time with capture group inspection, replacement simulation, and built-in snippet library.
        </p>
      </div>

      {/* Snippet Quick Picker */}
      <div className="p-3 bg-gray-50 dark:bg-gray-850 rounded-2xl border border-gray-200 dark:border-gray-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-xs font-bold text-gray-500 flex items-center gap-1 flex-shrink-0">
          <BookOpen className="w-3.5 h-3.5 text-indigo-500" /> Snippets:
        </span>
        {REGEX_LIBRARY.map((snippet) => (
          <button
            key={snippet.name}
            type="button"
            onClick={() => loadSnippet(snippet)}
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[11px] font-semibold text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 transition whitespace-nowrap cursor-pointer flex-shrink-0"
          >
            {snippet.name}
          </button>
        ))}
      </div>

      {/* Regex Pattern Input & Flags Bar */}
      <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Pattern input */}
          <div className="flex-1 flex items-center px-3 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl font-mono text-sm focus-within:ring-2 focus-within:ring-indigo-500">
            <span className="text-gray-400 font-bold select-none mr-1.5">/</span>
            <input
              type="text"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="insert regular expression..."
              className="flex-1 bg-transparent text-gray-900 dark:text-gray-100 outline-none text-xs sm:text-sm"
            />
            <span className="text-gray-400 font-bold select-none ml-1.5">/{flags}</span>
          </div>

          {/* Flags Buttons */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl self-start sm:self-auto">
            {[
              { f: 'g', title: 'Global match' },
              { f: 'i', title: 'Case insensitive' },
              { f: 'm', title: 'Multiline' },
              { f: 's', title: 'Dot all (new lines)' },
            ].map(({ f, title }) => (
              <button
                key={f}
                type="button"
                onClick={() => toggleFlag(f)}
                title={title}
                className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                  flags.includes(f)
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="font-mono">{error}</span>
          </div>
        )}
      </div>

      {/* Test String and Match Highlight Display */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Test String Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Test String
            </label>
            <span className="text-[11px] text-gray-400 font-mono">
              {testString.length} chars
            </span>
          </div>
          <textarea
            value={testString}
            onChange={(e) => setTestString(e.target.value)}
            placeholder="Type or paste test string here..."
            rows={8}
            className="w-full p-3.5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        {/* Live Matches & Group Breakdown */}
        <div className="space-y-2 flex flex-col">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Matches Breakdown
            </label>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold font-mono">
                {matches.length} {matches.length === 1 ? 'match' : 'matches'}
              </span>
              <span className="text-[10px] text-gray-400 font-mono">
                live
              </span>
            </div>
          </div>

          <div className="flex-1 p-3.5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 overflow-y-auto max-h-52 space-y-2">
            {matches.length === 0 ? (
              <div className="text-xs text-gray-400 italic p-4 text-center">
                No matches found with current pattern and flags.
              </div>
            ) : (
              matches.map((m, idx) => (
                <div
                  key={`${m.index}-${idx}`}
                  className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-mono space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      Match #{idx + 1}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      Index {m.index}..{m.index + m.match.length}
                    </span>
                  </div>
                  <div className="p-1.5 bg-gray-100 dark:bg-gray-950 rounded text-gray-900 dark:text-gray-100 break-all font-semibold">
                    {m.match}
                  </div>
                  {m.groups.length > 0 && (
                    <div className="pl-2 pt-1 border-l-2 border-indigo-300 dark:border-indigo-700 text-[11px] text-gray-600 dark:text-gray-300 space-y-0.5">
                      {m.groups.map((grp, gIdx) => (
                        <div key={gIdx} className="truncate">
                          Group {gIdx + 1}: <span className="font-bold text-gray-800 dark:text-gray-200">"{grp}"</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Replace Mode Playground */}
      <div className="p-4 bg-gray-50 dark:bg-gray-850 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
            <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-500" /> Replace Playground
          </div>
          <span className="text-[11px] text-gray-400">
            Supports capture placeholders ($1, $2, etc.)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-5">
            <input
              type="text"
              value={replacement}
              onChange={(e) => setReplacement(e.target.value)}
              placeholder="Replacement string ($1, etc.)..."
              className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="sm:col-span-7 flex items-center gap-2">
            <div className="flex-1 p-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-mono text-gray-700 dark:text-gray-300 truncate">
              {replacedText}
            </div>

            <button
              type="button"
              onClick={handleCopyReplaced}
              className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer flex-shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copy
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
