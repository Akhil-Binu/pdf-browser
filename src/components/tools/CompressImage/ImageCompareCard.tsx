import { ArrowRight, Download, CheckCircle2 } from 'lucide-react';
import type { CompressedImage } from '../../../types';
import { formatFileSize } from '../../../utils/format';
import { Button } from '../../ui/Button';

interface ImageCompareCardProps {
  item: CompressedImage;
  onDownload: (item: CompressedImage) => void;
}

export function ImageCompareCard({ item, onDownload }: ImageCompareCardProps) {
  const isPositiveSavings = item.savings > 0;
  const savingsColor =
    item.savings > 30
      ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
      : item.savings > 10
        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800'
        : isPositiveSavings
          ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
          : 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
      {/* Header with filename */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-750">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate max-w-xs sm:max-w-md">
          {item.original.name}
        </p>
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${savingsColor}`}
        >
          {isPositiveSavings ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              Saved {item.savings.toFixed(1)}%
            </>
          ) : (
            'Already optimal'
          )}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
        {/* Original */}
        <div className="flex items-center gap-3 flex-1 min-w-0 w-full sm:w-auto">
          <img
            src={item.original.preview}
            alt="Original"
            className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex-shrink-0"
          />
          <div className="min-w-0">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Original
            </span>
            <p className="text-base font-bold text-gray-800 dark:text-gray-200 mt-0.5">
              {formatFileSize(item.original.size)}
            </p>
          </div>
        </div>

        {/* Arrow */}
        <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-750 text-gray-400 flex-shrink-0">
          <ArrowRight className="w-4 h-4 rotate-90 sm:rotate-0" />
        </div>

        {/* Compressed */}
        <div className="flex items-center gap-3 flex-1 min-w-0 w-full sm:w-auto">
          <img
            src={item.compressed.preview}
            alt="Compressed"
            className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex-shrink-0"
          />
          <div className="min-w-0">
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Compressed
            </span>
            <p className="text-base font-bold text-gray-900 dark:text-gray-100 mt-0.5">
              {formatFileSize(item.compressed.size)}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="w-full sm:w-auto sm:self-center">
          <Button
            size="md"
            variant="secondary"
            icon={<Download className="w-4 h-4" />}
            onClick={() => onDownload(item)}
            className="w-full sm:w-auto"
          >
            Download
          </Button>
        </div>
      </div>
    </div>
  );
}
