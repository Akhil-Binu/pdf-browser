interface SliderProps {
  value: number;
  onChange: (val: number) => void;
  min: number;
  max: number;
  step: number;
  label: string;
  showValue?: boolean;
  unit?: string;
}

export function Slider({
  value,
  onChange,
  min,
  max,
  step,
  label,
  showValue = true,
  unit = '',
}: SliderProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
        {showValue && (
          <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
            {value}
            {unit}
          </span>
        )}
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />
      <div className="flex justify-between text-xs text-gray-400">
        <span>
          {min}
          {unit}
        </span>
        <span>
          {max}
          {unit}
        </span>
      </div>
    </div>
  );
}
