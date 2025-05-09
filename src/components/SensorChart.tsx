
import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { SensorType, SENSOR_CONFIG } from "@/lib/mock-data";
import { formatXAxisTick } from "@/lib/graph-utils";
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

  return (
    <ResponsiveContainer>
      <LineChart 
        data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: spansMultipleDays ? 40 : 5 }}
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
        {spansMultipleDays && !useTimeBased && (
          <XAxis
            dataKey="timestamp"
            axisLine={false}
            tickLine={false}
            height={25}
            xAxisId="date-axis"
            orientation="bottom"
            tick={null} 
            label=""   
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
