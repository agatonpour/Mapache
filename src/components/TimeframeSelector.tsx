
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
            "transition-colors",
            timeframe.value === value
              ? "bg-gray-100 text-gray-900"
              : "text-gray-500 hover:text-gray-900"
          )}
        >
          {timeframe.label}
        </Button>
      ))}
    </div>
  );
}
