
import { motion } from "framer-motion";
import { SENSOR_CONFIG, type SensorType } from "@/lib/mock-data";

interface SensorCardProps {
  type: SensorType;
  value: number;
  timestamp: Date;
  onClick: () => void;
  isSelected: boolean;
}

export function SensorCard({ type, value, timestamp, onClick, isSelected }: SensorCardProps) {
  const config = SENSOR_CONFIG[type];

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "relative p-6 rounded-xl backdrop-blur-sm cursor-pointer transition-colors",
        "border border-gray-200/50 shadow-sm",
        "hover:border-gray-300/50",
        isSelected
          ? "bg-white/90 shadow-lg"
          : "bg-white/70 hover:bg-white/80"
      )}
    >
      <div className="flex flex-col gap-2">
        <div className="text-sm text-gray-500 font-medium">
          {config.label}
        </div>
        <div className="flex items-baseline gap-2">
          <div className="text-3xl font-semibold tracking-tight">
            {config.formatValue(value)}
          </div>
          <div className="text-sm text-gray-500">
            {config.unit}
          </div>
        </div>
        <div className="text-xs text-gray-400">
          {timestamp.toLocaleTimeString()}
        </div>
      </div>
    </motion.div>
  );
}
