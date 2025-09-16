import React from "react";
import { StatusSensorType, STATUS_SENSOR_CONFIG } from "@/lib/mock-data";
import { formatTooltipLabel } from "@/lib/graph-utils";

interface StatusSensorChartTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  sensorType: StatusSensorType;
}

export function StatusSensorChartTooltip({
  active,
  payload,
  label,
  sensorType
}: StatusSensorChartTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const config = STATUS_SENSOR_CONFIG[sensorType];
  const value = payload[0].value;
  
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
        {config.formatValue(value)} {config.unit}
      </p>
    </div>
  );
}