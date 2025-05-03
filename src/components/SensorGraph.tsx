import { useEffect, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { SENSOR_CONFIG, type SensorData, type SensorType } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import { format } from "date-fns";

interface SensorGraphProps {
  data: SensorData[];
  type: SensorType;
}

export function SensorGraph({ data, type }: SensorGraphProps) {
  const config = SENSOR_CONFIG[type];

  // Function to format timestamp with date when spanning multiple days
  const formatXAxisTick = (timestamp: string) => {
    const date = new Date(timestamp);
    
    // Check if we have data spanning multiple days
    if (data.length > 0) {
      const firstDay = data[0].timestamp.getDate();
      const lastDay = data[data.length - 1].timestamp.getDate();
      
      // If data spans multiple days, include date information
      if (firstDay !== lastDay || data[0].timestamp.getMonth() !== data[data.length - 1].timestamp.getMonth()) {
        return format(date, 'MM-dd HH:mm');
      }
    }
    
    // Otherwise just show time
    return format(date, 'HH:mm:ss');
  };

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

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={type}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
        className="w-full h-[400px]"
      >
        <ResponsiveContainer>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="timestamp"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => formatXAxisTick(value)}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              domain={[
                Math.max(config.min, minValue - padding),
                Math.min(config.max, maxValue + padding)
              ]}
              tickFormatter={(value) => config.formatValue(value)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "none",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
              labelFormatter={(value) => {
                // Format the tooltip label with date if spanning multiple days
                const date = new Date(value);
                
                // Check if we have data spanning multiple days
                if (data.length > 0) {
                  const firstDay = data[0].timestamp.getDate();
                  const lastDay = data[data.length - 1].timestamp.getDate();
                  
                  // If data spans multiple days, include date information
                  if (firstDay !== lastDay || data[0].timestamp.getMonth() !== data[data.length - 1].timestamp.getMonth()) {
                    return format(date, 'yyyy-MM-dd HH:mm:ss');
                  }
                }
                
                return format(date, 'HH:mm:ss');
              }}
              formatter={(value: number) =>
                [config.formatValue(value) + " " + config.unit, config.label]
              }
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={config.color}
              strokeWidth={2}
              dot={false}
              animationDuration={1000}
              isAnimationActive={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
    </AnimatePresence>
  );
}
