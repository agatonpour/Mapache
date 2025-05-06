
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

  // Check if data spans multiple days
  const spansMultipleDays = useMemo(() => {
    if (data.length < 2) return false;
    
    const firstDay = data[0].timestamp.toISOString().split('T')[0];
    const lastDay = data[data.length - 1].timestamp.toISOString().split('T')[0];
    
    return firstDay !== lastDay;
  }, [data]);

  // Group data by date for multi-day display
  const dateGroups = useMemo(() => {
    if (!spansMultipleDays) return [];
    
    const groups = new Map<string, { date: string, firstIndex: number }>();
    
    data.forEach((item, index) => {
      const dateKey = item.timestamp.toISOString().split('T')[0];
      if (!groups.has(dateKey)) {
        groups.set(dateKey, { 
          date: format(item.timestamp, 'MMM dd'), 
          firstIndex: index
        });
      }
    });
    
    return Array.from(groups.values());
  }, [data, spansMultipleDays]);

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

  // Format time only for x-axis ticks
  const formatXAxisTick = (timestamp: string) => {
    const date = new Date(timestamp);
    return format(date, 'HH:mm:ss');
  };

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
          <ResponsiveContainer>
            <LineChart 
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: spansMultipleDays ? 30 : 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="timestamp"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatXAxisTick}
                height={30}
              />
              
              {/* Add a second XAxis for date labels when spanning multiple days */}
              {spansMultipleDays && (
                <XAxis
                  dataKey="timestamp"
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  tickFormatter={() => ''}
                  height={20}
                  xAxisId="date-axis"
                  tick={(props) => {
                    const { x, y, payload } = props;
                    const index = chartData.findIndex(d => d.timestamp === payload.value);
                    
                    // Check if this tick corresponds to the first data point of any date
                    const dateLabel = dateGroups.find(group => group.firstIndex === index);
                    
                    if (dateLabel) {
                      return (
                        <text
                          x={x}
                          y={y + 15}
                          textAnchor="middle"
                          fill="#666"
                          fontSize={11}
                          fontWeight="500"
                        >
                          {dateLabel.date}
                        </text>
                      );
                    }
                    return null;
                  }}
                />
              )}
              
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
                  const date = new Date(value);
                  // Always show full date and time in tooltip
                  return format(date, 'yyyy-MM-dd HH:mm:ss');
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
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
