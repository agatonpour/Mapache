
import React from "react";
import { SensorCard } from "./SensorCard";
import { SENSOR_CONFIG, type SensorData, type SensorType } from "@/lib/mock-data";

interface SensorGridProps {
  sensorData: Record<SensorType, SensorData[]>;
  selectedSensor: SensorType;
  onSensorSelect: (type: SensorType) => void;
}

export function SensorGrid({ sensorData, selectedSensor, onSensorSelect }: SensorGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Object.entries(SENSOR_CONFIG).map(([type]) => (
        <SensorCard
          key={type}
          type={type as SensorType}
          value={sensorData[type as SensorType]?.at(-1)?.value || 0}
          timestamp={sensorData[type as SensorType]?.at(-1)?.timestamp || new Date()}
          onClick={() => onSensorSelect(type as SensorType)}
          isSelected={selectedSensor === type}
        />
      ))}
    </div>
  );
}
