
import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { SensorType, SENSOR_CONFIG } from "@/lib/mock-data";
import { formatXAxisTick, formatDateTick, getDateTransitions } from "@/lib/graph-utils";
import { SensorChartTooltip } from "./SensorChartTooltip";

interface SensorChartProps {
  data: Array<{ timestamp: string; value: number; rawTimestamp: Date }>;
  type: SensorType;
  minValue: number;
  maxValue: number;
  padding: number;
  useTimeBased: boolean;
  spansMultipleDays: boolean;
}

export function SensorChart({
  data,
  type,
  minValue,
  maxValue,
  padding,
  useTimeBased,
  spansMultipleDays
}: SensorChartProps) {
  const config = SENSOR_CONFIG[type];
  
  // Get date transitions for reference lines (only for multi-day ranges)
  const dateTransitions = spansMultipleDays && !useTimeBased ? getDateTransitions(data) : [];

  // For single day view, get unique full hour timestamps
  const getFullHourTicks = () => {
    if (spansMultipleDays && !useTimeBased) {
      return dateTransitions.map(t => t.centerTimestamp).filter(Boolean);
    }
    
    const fullHourTicks = new Set<string>();
    data.forEach(point => {
      const date = new Date(point.timestamp);
      if (date.getMinutes() === 0 && date.getSeconds() === 0) {
        fullHourTicks.add(point.timestamp);
      }
    });
    return Array.from(fullHourTicks);
  };

  const xAxisTicks = getFullHourTicks();
  
  const formatXAxisTickValue = (timestamp: string): string => {
    if (spansMultipleDays && !useTimeBased) {
      return formatDateTick(timestamp);
    }
    return formatXAxisTick(timestamp);
  };

  return (
    <ResponsiveContainer>
      <LineChart 
        data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: spansMultipleDays ? 40 : 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        
        {/* Add prominent reference lines between dates for multi-day ranges */}
        {dateTransitions.slice(1).map((transition, index) => (
          <ReferenceLine
            key={`date-transition-${index}`}
            x={transition.timestamp}
            stroke="#000000"
            strokeWidth={2}
            strokeDasharray="4 2"
          />
        ))}
        
        <XAxis
          dataKey="timestamp"
          stroke="#000000"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={formatXAxisTickValue}
          height={30}
          interval={0}
          ticks={xAxisTicks}
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
          content={({active, payload, label}) => (
            <SensorChartTooltip 
              active={active} 
              payload={payload} 
              label={label} 
              sensorType={type} 
            />
          )}
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
  );
}
