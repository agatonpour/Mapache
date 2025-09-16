import React from "react";
import { StatusSensorCard } from "./StatusSensorCard";
import { STATUS_SENSOR_CONFIG, type SensorData, type StatusSensorType } from "@/lib/mock-data";

// Define a display order for status sensor cards
const statusSensorDisplayOrder: StatusSensorType[] = [
  "soc_percent",
  "battery_voltage_v",
  "solar_power_w", 
  "solar_voltage_v",
  "solar_current_ma",
  "alive_hhmm",
];

interface StatusSensorGridProps {
  sensorData: Record<StatusSensorType, SensorData[]>;
  selectedSensor: StatusSensorType;
  onSensorSelect: (type: StatusSensorType) => void;
}

export function StatusSensorGrid({ sensorData, selectedSensor, onSensorSelect }: StatusSensorGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {statusSensorDisplayOrder.map((type) => (
        <StatusSensorCard
          key={type}
          type={type}
          value={sensorData[type]?.at(-1)?.value || 0}
          timestamp={sensorData[type]?.at(-1)?.timestamp || new Date()}
          onClick={() => onSensorSelect(type)}
          isSelected={selectedSensor === type}
        />
      ))}
    </div>
  );
}