
import { formatNumber } from "./utils";

export interface SensorData {
  timestamp: Date;
  value: number;
  type: SensorType | StatusSensorType;
}

export interface SensorConfig {
  label: string;
  unit: string;
  color: string;
  min: number;
  max: number;
  formatValue: (value: number) => string;
}

export type SensorType = "aqi" | "tvoc" | "eco2" | "pressure" | "humidity" | "temperature";
export type StatusSensorType = "soc_percent" | "battery_voltage_v" | "solar_power_w" | "solar_voltage_v" | "solar_current_ma";

export const SENSOR_CONFIG: Record<SensorType, SensorConfig> = {
  temperature: {
    label: "Temperature",
    unit: "°C",
    color: "#ef4444",
    min: -10,
    max: 50,
    formatValue: (value: number) => value.toFixed(1),
  },
  humidity: {
    label: "Humidity",
    unit: "%",
    color: "#3b82f6",
    min: 0,
    max: 100,
    formatValue: (value: number) => value.toFixed(1),
  },
  pressure: {
    label: "Pressure",
    unit: "hPa",
    color: "#10b981",
    min: 900,
    max: 1100,
    formatValue: (value: number) => (value / 100).toFixed(1),
  },
  aqi: {
    label: "Air Quality Index",
    unit: "AQI",
    color: "#8b5cf6",
    min: 0,
    max: 500,
    formatValue: (value: number) => value.toFixed(1),
  },
  tvoc: {
    label: "TVOC",
    unit: "ppb",
    color: "#f59e0b",
    min: 0,
    max: 1800,
    formatValue: (value: number) => value.toFixed(0),
  },
  eco2: {
    label: "eCO2",
    unit: "ppm",
    color: "#6366f1",
    min: 0,
    max: 1200,
    formatValue: (value: number) => value.toFixed(0),
  },
} as const;

export const STATUS_SENSOR_CONFIG: Record<StatusSensorType, SensorConfig> = {
  soc_percent: {
    label: "State of Charge",
    unit: "%",
    color: "#10b981",
    min: 0,
    max: 100,
    formatValue: (value: number) => value.toFixed(1),
  },
  battery_voltage_v: {
    label: "Battery Voltage",
    unit: "V",
    color: "#3b82f6",
    min: 0,
    max: 5,
    formatValue: (value: number) => value.toFixed(2),
  },
  solar_power_w: {
    label: "Solar Power",
    unit: "W",
    color: "#f59e0b",
    min: 0,
    max: 10,
    formatValue: (value: number) => value.toFixed(2),
  },
  solar_voltage_v: {
    label: "Solar Voltage",
    unit: "V",
    color: "#ef4444",
    min: 0,
    max: 6,
    formatValue: (value: number) => value.toFixed(2),
  },
  solar_current_ma: {
    label: "Solar Current",
    unit: "A",
    color: "#8b5cf6",
    min: 0,
    max: 0.1,
    formatValue: (value: number) => value.toFixed(3),
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
