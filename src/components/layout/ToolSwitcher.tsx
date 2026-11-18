import { FilePlus2, ImageDown, FileImage } from 'lucide-react';
import type { ToolType } from '../../types';

interface ToolSwitcherProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
}

const tools: {
  type: ToolType;
  label: string;
  icon: React.ReactNode;
  description: string;
}[] = [
  {
    type: 'merge-pdf',
    label: 'Merge PDF',
    icon: <FilePlus2 className="w-5 h-5" />,
    description: 'Combine multiple PDFs',
  },
  {
    type: 'compress-image',
    label: 'Compress Image',
    icon: <ImageDown className="w-5 h-5" />,
    description: 'Reduce image file size',
  },
  {
    type: 'image-to-pdf',
    label: 'Image to PDF',
    icon: <FileImage className="w-5 h-5" />,
    description: 'Convert images to PDF',
  },
];

export function ToolSwitcher({ activeTool, onToolChange }: ToolSwitcherProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto">
      {tools.map((tool) => (
        <button
          key={tool.type}
          onClick={() => onToolChange(tool.type)}
          className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer ${
            activeTool === tool.type
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
          }`}
        >
          {tool.icon}
          <div className="text-left">
            <div className="font-medium text-sm">{tool.label}</div>
            <div
              className={`text-xs ${
                activeTool === tool.type
                  ? 'text-blue-100'
                  : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              {tool.description}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
