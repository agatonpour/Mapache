import { formatNumber } from "./utils";

export interface SensorData {
  timestamp: Date;
  value: number;
  type: SensorType;
}

export type SensorType = "aqi" | "tvoc" | "eco2" | "pressure" | "humidity" | "temperature";

export const SENSOR_CONFIG: Record<SensorType, SensorConfig> = {
  temperature: {
    label: "Temperature",
    unit: "°C",
    color: "#ef4444",
    min: 15,
    max: 35,
    formatValue: (value) => value.toFixed(1),
  },
  humidity: {
    label: "Humidity",
    unit: "%",
    color: "#3b82f6",
    min: 20,
    max: 80,
    formatValue: (value) => value.toFixed(1),
  },
  pressure: {
    label: "Pressure",
    unit: "hPa",
    color: "#10b981",
    min: 980,
    max: 1020,
    formatValue: (value) => (value / 100).toFixed(1),
  },
  aqi: {
    label: "Air Quality Index",
    unit: "AQI",
    color: "#8b5cf6",
    min: 0,
    max: 5,
    formatValue: (value) => value.toFixed(1),
  },
  tvoc: {
    label: "TVOC",
    unit: "ppb",
    color: "#f59e0b",
    min: 0,
    max: 2000,
    formatValue: (value) => value.toFixed(0),
  },
  eco2: {
    label: "eCO2",
    unit: "ppm",
    color: "#6366f1",
    min: 400,
    max: 2000,
    formatValue: (value) => value.toFixed(0),
  },
} as const;

function generateRandomValue(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function generateMockData(type: SensorType, count: number): SensorData[] {
  const config = SENSOR_CONFIG[type];
  const now = new Date();
  return Array.from({ length: count }, (_, i) => ({
    timestamp: new Date(now.getTime() - (count - i - 1) * 1000),
    value: generateRandomValue(config.min, config.max),
    type,
  }));
}
