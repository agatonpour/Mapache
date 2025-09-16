import React, { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { StatusSensorChart } from "./StatusSensorChart";
import { STATUS_SENSOR_CONFIG, type SensorData, type StatusSensorType } from "@/lib/mock-data";

interface StatusSensorGraphProps {
  data: SensorData[];
  type: StatusSensorType;
  dateRangeSpanDays?: number;
}

export function StatusSensorGraph({ data, type, dateRangeSpanDays = 1 }: StatusSensorGraphProps) {
  const config = STATUS_SENSOR_CONFIG[type];
  
  const spansMultipleDays = useMemo(() => dateRangeSpanDays > 1, [dateRangeSpanDays]);
  
  const chartData = useMemo(() => {
    return data.map((item) => ({
      timestamp: item.timestamp.getTime(),
      value: item.value,
      formattedTime: item.timestamp.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
      }),
      formattedDate: item.timestamp.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      formattedDateTime: item.timestamp.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    }));
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No data available for the selected time period
      </div>
    );
  }

  const values = chartData.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const padding = Math.max((maxValue - minValue) * 0.1, 1);
  
  const useTimeBased = !spansMultipleDays;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${type}-${dateRangeSpanDays}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="h-64"
      >
        <StatusSensorChart
          data={chartData}
          type={type}
          minValue={minValue}
          maxValue={maxValue}
          padding={padding}
          useTimeBased={useTimeBased}
          spansMultipleDays={spansMultipleDays}
        />
      </motion.div>
    </AnimatePresence>
  );
}