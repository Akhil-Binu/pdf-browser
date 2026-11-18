interface ProgressBarProps {
  progress: number;
  label?: string;
  variant?: 'default' | 'success' | 'warning';
}

export function ProgressBar({
  progress,
  label,
  variant = 'default',
}: ProgressBarProps) {
  const colorClasses: Record<string, string> = {
    default: 'bg-blue-600',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
  };

  return (
    <div className="w-full">
      {(label || progress >= 0) && (
        <div className="flex items-center justify-between mb-1">
          {label && (
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {label}
            </span>
          )}
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            {Math.round(progress)}%
          </span>
        </div>
      )}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${colorClasses[variant]}`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}
