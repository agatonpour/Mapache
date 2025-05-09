
import React from "react";
import { SensorType, SENSOR_CONFIG } from "@/lib/mock-data";
import { formatTooltipLabel } from "@/lib/graph-utils";

interface SensorChartTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  sensorType: SensorType;
}

export function SensorChartTooltip({
  active,
  payload,
  label,
  sensorType
}: SensorChartTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const config = SENSOR_CONFIG[sensorType];
  const value = payload[0].value;
  
  // Special formatting for pressure values in tooltip
  let formattedValue = value;
  if (sensorType === 'pressure') {
    formattedValue = (value / 10).toFixed(1); // Ensure one decimal place for pressure
  }
  
  return (
    <div
      style={{
        backgroundColor: "white",
        border: "none",
        borderRadius: "8px",
        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
        padding: "8px 12px",
      }}
    >
      <p className="text-sm font-medium">{formatTooltipLabel(label || "")}</p>
      <p className="text-sm text-gray-700">
        <span className="font-medium">{config.label}:</span>{" "}
        {sensorType === 'pressure' ? formattedValue : config.formatValue(value)} {config.unit}
      </p>
    </div>
  );
}
