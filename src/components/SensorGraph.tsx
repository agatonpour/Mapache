
import { useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SENSOR_CONFIG, type SensorData, type SensorType } from "@/lib/mock-data";
import { SensorChart } from "./SensorChart";
import { DateMarkers } from "./DateMarkers";
import { 
  dataSpansMultipleDays, 
  groupDataByDate
} from "@/lib/graph-utils";

interface SensorGraphProps {
  data: SensorData[];
  type: SensorType;
  dateRangeSpanDays?: number;
}

export function SensorGraph({ data, type, dateRangeSpanDays = 1 }: SensorGraphProps) {
  const config = SENSOR_CONFIG[type];

  // Check if data spans multiple days
  const spansMultipleDays = useMemo(() => dataSpansMultipleDays(data), [data]);

  // Group data by date for multi-day display
  const dateGroups = useMemo(() => groupDataByDate(data), [data, spansMultipleDays]);

  const chartData = useMemo(
    () =>
      data.map((item) => {
        // Apply transformation for display values
        let displayValue = item.value;
        
        // Transform values similar to SensorCard for consistency
        if (type === 'humidity') {
          displayValue = item.value * 10; // Multiply by 10 for correct percentage display
        } else if (type === 'pressure') {
          displayValue = item.value / 10; // Divide by 10 for proper hPa display 
        }
        
        return {
          timestamp: item.timestamp.toISOString(), // Store full timestamp as ISO string
          value: displayValue,
          rawTimestamp: item.timestamp, // Keep raw timestamp for custom formatting
        };
      }),
    [data, type]
  );

  // Calculate min and max for the y-axis
  const values = chartData.map(item => item.value);
  const minValue = values.length > 0 ? Math.min(...values) : 0;
  const maxValue = values.length > 0 ? Math.max(...values) : 100;
  const padding = (maxValue - minValue) * 0.1; // Add 10% padding to min/max

  // Determine whether to use date-based or time-based x-axis based on dateRangeSpanDays
  const useTimeBased = dateRangeSpanDays <= 3;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={type}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
        className="w-full"
      >
        <div className="w-full h-[400px]">
          <SensorChart 
            data={chartData}
            type={type}
            minValue={minValue}
            maxValue={maxValue}
            padding={padding}
            useTimeBased={useTimeBased}
            spansMultipleDays={spansMultipleDays}
          />
          
          {/* Custom date markers that appear below the chart */}
          {spansMultipleDays && !useTimeBased && (
            <DateMarkers dateGroups={dateGroups} />
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
