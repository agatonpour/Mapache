
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

interface SensorGraphProps {
  data: SensorData[];
  type: SensorType;
}

export function SensorGraph({ data, type }: SensorGraphProps) {
  const config = SENSOR_CONFIG[type];

  const chartData = useMemo(
    () =>
      data.map((item) => ({
        timestamp: formatDate(item.timestamp),
        value: item.value,
      })),
    [data]
  );

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={type}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }} // Increased duration for smoother transitions
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
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              domain={[config.min, config.max]}
              tickFormatter={(value) => config.formatValue(value)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "none",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
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
              animationDuration={1000} // Increased animation duration
              isAnimationActive={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
    </AnimatePresence>
  );
}
