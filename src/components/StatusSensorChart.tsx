import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { StatusSensorChartTooltip } from "./StatusSensorChartTooltip";
import { STATUS_SENSOR_CONFIG, type StatusSensorType } from "@/lib/mock-data";
import { formatXAxisTick, formatDateTick, getDateTransitions } from "@/lib/graph-utils";

interface ChartDataPoint {
  timestamp: string;
  value: number;
  rawTimestamp: Date;
  formattedTime: string;
  formattedDate: string;
  formattedDateTime: string;
}

interface StatusSensorChartProps {
  data: ChartDataPoint[];
  type: StatusSensorType;
  minValue: number;
  maxValue: number;
  padding: number;
  useTimeBased: boolean;
  spansMultipleDays: boolean;
}

export function StatusSensorChart({
  data,
  type,
  minValue,
  maxValue,
  padding,
  useTimeBased,
  spansMultipleDays
}: StatusSensorChartProps) {
  const config = STATUS_SENSOR_CONFIG[type];
  
  // Get date transitions for reference lines (only for multi-day ranges)
  const dateTransitions = spansMultipleDays && !useTimeBased ? getDateTransitions(data) : [];

  // Track displayed hours to prevent duplicates for single day view
  const displayedHours = new Set<string>();
  
  const formatUniqueXAxisTick = (timestamp: string): string => {
    if (spansMultipleDays && !useTimeBased) {
      return formatDateTick(timestamp);
    }
    
    const hourString = formatXAxisTick(timestamp);
    
    if (displayedHours.has(hourString)) {
      return '';
    }
    
    displayedHours.add(hourString);
    return hourString;
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
          tickFormatter={formatUniqueXAxisTick}
          height={30}
          interval={spansMultipleDays && !useTimeBased ? 0 : "preserveStartEnd"}
          ticks={spansMultipleDays && !useTimeBased ? dateTransitions.map(t => t.centerTimestamp).filter(Boolean) : undefined}
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
            <StatusSensorChartTooltip 
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