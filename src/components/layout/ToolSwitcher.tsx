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
} from 'lucide-react';
import type { ToolType, ToolCategory, ToolDefinition } from '../../types';

interface ToolSwitcherProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
}

const toolsList: (ToolDefinition & { icon: React.ReactNode })[] = [
  // 1-10: PDF Category
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

  // 11-18: Image Category
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

  // 19-21: Smart & Dev Category
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

  // 22-23: Media Category
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
    <div className="space-y-4">
      {/* Search and Category Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Category Pill Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm w-full sm:w-auto overflow-x-auto">
          {[
            { id: 'all', label: 'All Utilities', count: counts.all },
            { id: 'pdf', label: 'PDF Suite', count: counts.pdf },
            { id: 'image', label: 'Images & Design', count: counts.image },
            { id: 'dev', label: 'Dev & QR', count: counts.dev },
            { id: 'media', label: 'Audio & Video', count: counts.media },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id as ToolCategory)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                (selectedCategory === cat.id || (cat.id === 'dev' && (selectedCategory === 'dev' || selectedCategory === 'smart')))
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  (selectedCategory === cat.id || (cat.id === 'dev' && (selectedCategory === 'dev' || selectedCategory === 'smart')))
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
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search 23 tools..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Grid of Tools */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
        {filteredTools.map((tool) => {
          const isActive = activeTool === tool.type;
          return (
            <button
              key={tool.type}
              type="button"
              onClick={() => onToolChange(tool.type)}
              className={`relative p-3 rounded-2xl text-left border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                isActive
                  ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 shadow-md shadow-blue-500/10 ring-2 ring-blue-500/30'
                  : 'border-gray-200/80 dark:border-gray-750 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'
              }`}
            >
              {tool.badge && (
                <span className={`absolute top-2.5 right-2.5 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md ${
                  tool.badge === 'v3.0'
                    ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
                    : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                }`}>
                  {tool.badge}
                </span>
              )}

              <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-750 w-fit mb-2">
                {tool.icon}
              </div>

              <div>
                <div className="text-xs font-bold text-gray-900 dark:text-gray-100">
                  {tool.label}
                </div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
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
