import { useState, useMemo } from 'react';
import {
  FilePlus2,
  Scissors,
  RotateCw,
  FileImage,
  Stamp,
  Lock,
  ImageDown,
  RefreshCw,
  Crop,
  Sparkles,
  FileSearch,
  Search,
  PenTool,
  EyeOff,
  Maximize2,
  GitCompare,
  Palette,
  FileCode,
  QrCode,
  Code2,
  Video,
  Music,
  FileCheck,
  Info,
  FileText,
  ScrollText,
  Layers,
  Smile,
  KeyRound,
  Fingerprint,
  Ghost,
  ArrowLeftRight,
  Binary,
  Regex,
  MonitorPlay,
  Gauge,
} from 'lucide-react';
import type { ToolType, ToolCategory, ToolDefinition } from '../../types';

interface ToolSwitcherProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
}

const toolsList: (ToolDefinition & { icon: React.ReactNode })[] = [
  // 1-14: PDF Category
  {
    type: 'merge-pdf',
    category: 'pdf',
    label: 'Merge PDF',
    shortDesc: 'Combine multiple PDFs into one',
    icon: <FilePlus2 className="w-5 h-5 text-red-500" />,
    iconName: 'FilePlus2',
  },
  {
    type: 'split-pdf',
    category: 'pdf',
    label: 'Split PDF',
    shortDesc: 'Extract page ranges or separate all pages',
    icon: <Scissors className="w-5 h-5 text-red-500" />,
    iconName: 'Scissors',
  },
  {
    type: 'rotate-pdf',
    category: 'pdf',
    label: 'Rotate & Organize',
    shortDesc: 'Rotate pages, discard sheets, reorder',
    icon: <RotateCw className="w-5 h-5 text-red-500" />,
    iconName: 'RotateCw',
  },
  {
    type: 'pdf-to-images',
    category: 'pdf',
    label: 'PDF to Images',
    shortDesc: 'Extract pages as high-res PNG/JPG',
    icon: <FileImage className="w-5 h-5 text-red-500" />,
    iconName: 'FileImage',
  },
  {
    type: 'watermark-pdf',
    category: 'pdf',
    label: 'Watermark PDF',
    shortDesc: 'Add text stamp & page numbers',
    icon: <Stamp className="w-5 h-5 text-red-500" />,
    iconName: 'Stamp',
  },
  {
    type: 'protect-pdf',
    category: 'pdf',
    label: 'Protect PDF',
    shortDesc: 'Encrypt document with password',
    icon: <Lock className="w-5 h-5 text-red-500" />,
    iconName: 'Lock',
  },
  {
    type: 'sign-pdf',
    category: 'pdf',
    label: 'Sign PDF',
    shortDesc: 'Draw or type signature and date stamps',
    badge: 'v3.0',
    icon: <PenTool className="w-5 h-5 text-indigo-500" />,
    iconName: 'PenTool',
  },
  {
    type: 'redact-pdf',
    category: 'pdf',
    label: 'Redact PDF',
    shortDesc: 'Permanent blackout/whiteout sanitization',
    badge: 'v3.0',
    icon: <EyeOff className="w-5 h-5 text-red-600" />,
    iconName: 'EyeOff',
  },
  {
    type: 'resize-pdf',
    category: 'pdf',
    label: 'Resize & 2-Up',
    shortDesc: 'Scale A4/Letter or 2-Up booklet spread',
    badge: 'v3.0',
    icon: <Maximize2 className="w-5 h-5 text-amber-500" />,
    iconName: 'Maximize2',
  },
  {
    type: 'diff-pdf',
    category: 'pdf',
    label: 'PDF Visual Diff',
    shortDesc: 'Side-by-side & difference overlay map',
    badge: 'v3.0',
    icon: <GitCompare className="w-5 h-5 text-teal-500" />,
    iconName: 'GitCompare',
  },
  {
    type: 'form-pdf',
    category: 'pdf',
    label: 'Fill & Flatten Forms',
    shortDesc: 'Interactive AcroForm filler & flatten',
    badge: 'v4.0',
    icon: <FileCheck className="w-5 h-5 text-blue-500" />,
    iconName: 'FileCheck',
  },
  {
    type: 'metadata-pdf',
    category: 'pdf',
    label: 'PDF Metadata & Privacy',
    shortDesc: 'Edit attributes & sanitize tracking metadata',
    badge: 'v4.0',
    icon: <Info className="w-5 h-5 text-purple-500" />,
    iconName: 'Info',
  },
  {
    type: 'extract-text-pdf',
    category: 'pdf',
    label: 'Extract Text Stream',
    shortDesc: 'Extract page text, live search & JSON export',
    badge: 'v4.0',
    icon: <FileText className="w-5 h-5 text-amber-500" />,
    iconName: 'FileText',
  },
  {
    type: 'markdown-to-pdf',
    category: 'pdf',
    label: 'Markdown to PDF',
    shortDesc: 'Live split-pane editor & A4 compiler',
    badge: 'v4.0',
    icon: <ScrollText className="w-5 h-5 text-emerald-500" />,
    iconName: 'ScrollText',
  },

  // 15-24: Image & Design Category
  {
    type: 'compress-image',
    category: 'image',
    label: 'Compress Image',
    shortDesc: 'Reduce PNG, JPG, and WebP size',
    icon: <ImageDown className="w-5 h-5 text-blue-500" />,
    iconName: 'ImageDown',
  },
  {
    type: 'image-to-pdf',
    category: 'image',
    label: 'Image to PDF',
    shortDesc: 'Convert photos to multi-page PDF',
    icon: <FileImage className="w-5 h-5 text-blue-500" />,
    iconName: 'FileImage',
  },
  {
    type: 'convert-image',
    category: 'image',
    label: 'Convert Format',
    shortDesc: 'Switch between WebP, PNG, and JPEG',
    icon: <RefreshCw className="w-5 h-5 text-blue-500" />,
    iconName: 'RefreshCw',
  },
  {
    type: 'crop-image',
    category: 'image',
    label: 'Crop & Resize',
    shortDesc: '1:1, 16:9, 9:16 and custom crop',
    icon: <Crop className="w-5 h-5 text-blue-500" />,
    iconName: 'Crop',
  },
  {
    type: 'filter-scanner',
    category: 'image',
    label: 'Document Scanner',
    shortDesc: 'B&W scan filter & strip EXIF privacy',
    icon: <Sparkles className="w-5 h-5 text-blue-500" />,
    iconName: 'Sparkles',
  },
  {
    type: 'favicon-gen',
    category: 'image',
    label: 'Favicon Generator',
    shortDesc: 'Package multi-size icons, ICO & manifest',
    badge: 'v3.0',
    icon: <Sparkles className="w-5 h-5 text-pink-500" />,
    iconName: 'Sparkles',
  },
  {
    type: 'color-palette',
    category: 'image',
    label: 'Color Palette',
    shortDesc: 'Extract quantized swatches & CSS variables',
    badge: 'v3.0',
    icon: <Palette className="w-5 h-5 text-emerald-500" />,
    iconName: 'Palette',
  },
  {
    type: 'svg-optimizer',
    category: 'image',
    label: 'SVG Optimizer',
    shortDesc: 'Minify SVG code & strip editor bloat',
    badge: 'v3.0',
    icon: <FileCode className="w-5 h-5 text-orange-500" />,
    iconName: 'FileCode',
  },
  {
    type: 'batch-watermark',
    category: 'image',
    label: 'Batch Watermark',
    shortDesc: 'Batch stamp logos/text & export to ZIP',
    badge: 'v4.0',
    icon: <Layers className="w-5 h-5 text-cyan-500" />,
    iconName: 'Layers',
  },
  {
    type: 'meme-maker',
    category: 'image',
    label: 'Meme Generator',
    shortDesc: 'Impact typography & instant viral memes',
    badge: 'v4.0',
    icon: <Smile className="w-5 h-5 text-pink-500" />,
    iconName: 'Smile',
  },

  // 25-33: Dev & Security Category
  {
    type: 'ocr-extract',
    category: 'smart',
    label: 'Client-Side OCR',
    shortDesc: 'Extract text from images locally',
    badge: 'AI Wasm',
    icon: <FileSearch className="w-5 h-5 text-purple-500" />,
    iconName: 'FileSearch',
  },
  {
    type: 'qr-suite',
    category: 'dev',
    label: 'QR Code Suite',
    shortDesc: 'Generate vector QR & decode from image',
    badge: 'v3.0',
    icon: <QrCode className="w-5 h-5 text-indigo-500" />,
    iconName: 'QrCode',
  },
  {
    type: 'code-poster',
    category: 'dev',
    label: 'Code Poster',
    shortDesc: 'Radiant social cards & PDF export',
    badge: 'v3.0',
    icon: <Code2 className="w-5 h-5 text-cyan-500" />,
    iconName: 'Code2',
  },
  {
    type: 'file-encrypt',
    category: 'dev',
    label: 'File Vault Encryptor',
    shortDesc: 'AES-256-GCM browser encryption & vault',
    badge: 'v4.0',
    icon: <KeyRound className="w-5 h-5 text-emerald-500" />,
    iconName: 'KeyRound',
  },
  {
    type: 'hash-verifier',
    category: 'dev',
    label: 'Hash & Checksum',
    shortDesc: 'Instant SHA-256/512 integrity verifier',
    badge: 'v4.0',
    icon: <Fingerprint className="w-5 h-5 text-amber-500" />,
    iconName: 'Fingerprint',
  },
  {
    type: 'steganography',
    category: 'dev',
    label: 'Image Steganography',
    shortDesc: 'Conceal secret messages inside PNG pixels',
    badge: 'v4.0',
    icon: <Ghost className="w-5 h-5 text-purple-500" />,
    iconName: 'Ghost',
  },
  {
    type: 'data-converter',
    category: 'dev',
    label: 'Data Converter',
    shortDesc: 'RFC 4180 JSON ⇄ CSV instant conversion',
    badge: 'v4.0',
    icon: <ArrowLeftRight className="w-5 h-5 text-indigo-500" />,
    iconName: 'ArrowLeftRight',
  },
  {
    type: 'base64-studio',
    category: 'dev',
    label: 'Base64 Studio',
    shortDesc: 'Encode files, Data URIs & decode binary',
    badge: 'v4.0',
    icon: <Binary className="w-5 h-5 text-cyan-500" />,
    iconName: 'Binary',
  },
  {
    type: 'regex-tester',
    category: 'dev',
    label: 'Regex Debugger',
    shortDesc: 'Live pattern highlighting & capture groups',
    badge: 'v4.0',
    icon: <Regex className="w-5 h-5 text-rose-500" />,
    iconName: 'Regex',
  },

  // 34-37: Media & Audio Category
  {
    type: 'video-frames',
    category: 'media',
    label: 'Video to Frames',
    shortDesc: 'Extract video frames to ZIP & storyboard',
    badge: 'v3.0',
    icon: <Video className="w-5 h-5 text-violet-500" />,
    iconName: 'Video',
  },
  {
    type: 'audio-trimmer',
    category: 'media',
    label: 'Audio Trimmer',
    shortDesc: 'Scrub waveform & export trimmed WAV',
    badge: 'v3.0',
    icon: <Music className="w-5 h-5 text-emerald-500" />,
    iconName: 'Music',
  },
  {
    type: 'screen-recorder',
    category: 'media',
    label: 'Screen Recorder',
    shortDesc: 'Capture display & audio with zero server load',
    badge: 'v4.0',
    icon: <MonitorPlay className="w-5 h-5 text-violet-500" />,
    iconName: 'MonitorPlay',
  },
  {
    type: 'audio-speed',
    category: 'media',
    label: 'Audio Speed & Reverse',
    shortDesc: '0.25x - 4x tempo adjust & backward export',
    badge: 'v4.0',
    icon: <Gauge className="w-5 h-5 text-teal-500" />,
    iconName: 'Gauge',
  },
];

export function ToolSwitcher({ activeTool, onToolChange }: ToolSwitcherProps) {
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredTools = useMemo(() => {
    return toolsList.filter((tool) => {
      let matchesCategory = false;
      if (selectedCategory === 'all') {
        matchesCategory = true;
      } else if (selectedCategory === 'smart' || selectedCategory === 'dev') {
        matchesCategory = tool.category === 'smart' || tool.category === 'dev';
      } else {
        matchesCategory = tool.category === selectedCategory;
      }

      const matchesSearch =
        tool.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.shortDesc.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const counts = {
    all: toolsList.length,
    pdf: toolsList.filter((t) => t.category === 'pdf').length,
    image: toolsList.filter((t) => t.category === 'image').length,
    dev: toolsList.filter((t) => t.category === 'smart' || t.category === 'dev').length,
    media: toolsList.filter((t) => t.category === 'media').length,
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Search and Category Filters */}
      <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 items-stretch sm:items-center justify-between">
        {/* Category Pill Tabs with smooth horizontal touch scroll */}
        <div className="flex items-center gap-1 sm:gap-1.5 p-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs overflow-x-auto no-scrollbar scroll-smooth">
          {[
            { id: 'all', label: 'All Utilities', count: counts.all },
            { id: 'pdf', label: 'PDF Suite', count: counts.pdf },
            { id: 'image', label: 'Images & Design', count: counts.image },
            { id: 'dev', label: 'Dev & Security', count: counts.dev },
            { id: 'media', label: 'Audio & Video', count: counts.media },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id as ToolCategory)}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 flex-shrink-0 ${
                selectedCategory === cat.id ||
                (cat.id === 'dev' && (selectedCategory === 'dev' || selectedCategory === 'smart'))
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  selectedCategory === cat.id ||
                  (cat.id === 'dev' && (selectedCategory === 'dev' || selectedCategory === 'smart'))
                    ? 'bg-blue-700 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                }`}
              >
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-60 md:w-64 flex-shrink-0">
          <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${toolsList.length} tools...`}
            className="w-full pl-8 sm:pl-9 pr-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Grid of Tools - Mobile-optimized columns and padding */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-2.5">
        {filteredTools.map((tool) => {
          const isActive = activeTool === tool.type;
          return (
            <button
              key={tool.type}
              type="button"
              onClick={() => onToolChange(tool.type)}
              className={`relative p-2.5 sm:p-3 rounded-2xl text-left border transition-all duration-200 cursor-pointer flex flex-col justify-between active:scale-[0.98] ${
                isActive
                  ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 shadow-sm shadow-blue-500/10 ring-2 ring-blue-500/30'
                  : 'border-gray-200/80 dark:border-gray-750 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-xs'
              }`}
            >
              {tool.badge && (
                <span
                  className={`absolute top-2 right-2 text-[8px] sm:text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md ${
                    tool.badge === 'v4.0'
                      ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                      : tool.badge === 'v3.0'
                        ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
                        : 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                  }`}
                >
                  {tool.badge}
                </span>
              )}

              <div className="p-1.5 sm:p-2 rounded-xl bg-gray-50 dark:bg-gray-750 w-fit mb-1.5 sm:mb-2">
                {tool.icon}
              </div>

              <div className="w-full min-w-0">
                <div className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                  {tool.label}
                </div>
                <div className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                  {tool.shortDesc}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
