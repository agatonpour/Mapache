
import { TIMEFRAMES, type Timeframe } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TimeframeSelectorProps {
  value: Timeframe;
  onChange: (timeframe: Timeframe) => void;
}

export function TimeframeSelector({ value, onChange }: TimeframeSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {TIMEFRAMES.map((timeframe) => (
        <Button
          key={timeframe.value}
          variant="ghost"
          size="sm"
          onClick={() => onChange(timeframe.value)}
          className={cn(
            "px-4 py-2 rounded-md transition-all",
            timeframe.value === value
              ? "border-2 border-blue-500 text-blue-700 font-semibold shadow-md bg-white"
              : "border border-gray-300 text-gray-500 hover:text-gray-900 hover:border-gray-400"
          )}
        >
          {timeframe.label}
        </Button>
      ))}
    </div>
  );
}
