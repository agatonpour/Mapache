import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { StatusSensorChartTooltip } from "./StatusSensorChartTooltip";
import { STATUS_SENSOR_CONFIG, type StatusSensorType } from "@/lib/mock-data";
import { formatXAxisTick } from "@/lib/graph-utils";

interface ChartDataPoint {
  timestamp: number;
  value: number;
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

  // Create date transition markers for multi-day view
  const dateTransitions = React.useMemo(() => {
    if (!spansMultipleDays || data.length === 0) return [];
    
    const transitions = [];
    let currentDate = new Date(data[0].timestamp).toDateString();
    
    for (let i = 1; i < data.length; i++) {
      const newDate = new Date(data[i].timestamp).toDateString();
      if (newDate !== currentDate) {
        transitions.push({
          timestamp: data[i].timestamp,
          date: newDate
        });
        currentDate = newDate;
      }
    }
    
    return transitions;
  }, [data, spansMultipleDays]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        <XAxis
          dataKey="timestamp"
          type="number"
          scale="time"
          domain={['dataMin', 'dataMax']}
          tickFormatter={(timestamp) => formatXAxisTick(new Date(timestamp).toISOString())}
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: '#6b7280' }}
        />
        <YAxis
          domain={[
            (dataMin: number) => Math.max(config.min, dataMin - padding),
            (dataMax: number) => Math.min(config.max, dataMax + padding)
          ]}
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: '#6b7280' }}
          tickFormatter={config.formatValue}
        />
        <Tooltip
          content={<StatusSensorChartTooltip sensorType={type} />}
          cursor={{ strokeDasharray: '3 3', stroke: '#94a3b8' }}
        />
        
        {/* Date transition lines for multi-day view */}
        {dateTransitions.map((transition, index) => (
          <ReferenceLine
            key={index}
            x={transition.timestamp}
            stroke="#e5e7eb"
            strokeDasharray="2 2"
            strokeWidth={1}
          />
        ))}
        
        <Line
          type="monotone"
          dataKey="value"
          stroke={config.color}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, stroke: config.color, strokeWidth: 2, fill: "white" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}