
import React from "react";
import { SensorCard } from "./SensorCard";
import { SENSOR_CONFIG, type SensorData, type SensorType } from "@/lib/mock-data";

// Define a display order for sensor cards to match Arduino's data output order
const sensorDisplayOrder: SensorType[] = [
  "aqi",
  "temperature",
  "humidity", 
  "pressure",
  "tvoc",
  "eco2",
];

interface SensorGridProps {
  sensorData: Record<SensorType, SensorData[]>;
  selectedSensor: SensorType;
  onSensorSelect: (type: SensorType) => void;
}

export function SensorGrid({ sensorData, selectedSensor, onSensorSelect }: SensorGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sensorDisplayOrder.map((type) => (
        <SensorCard
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
