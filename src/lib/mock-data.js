import { formatNumber } from "./utils";
export const SENSOR_CONFIG = {
    aqi: {
        label: "Air Quality Index",
        unit: "",
        min: 0,
        max: 500,
        color: "rgb(234, 179, 8)",
        formatValue: (v) => formatNumber(v, 0),
    },
    tvoc: {
        label: "TVOC",
        unit: "ppb",
        min: 0,
        max: 2000,
        color: "rgb(217, 119, 6)",
        formatValue: (v) => formatNumber(v, 0),
    },
    eco2: {
        label: "eCO₂",
        unit: "ppm",
        min: 400,
        max: 2000,
        color: "rgb(220, 38, 38)",
        formatValue: (v) => formatNumber(v, 0),
    },
    pressure: {
        label: "Pressure",
        unit: "hPa",
        min: 980,
        max: 1020,
        color: "rgb(37, 99, 235)",
        formatValue: (v) => formatNumber(v, 1),
    },
    humidity: {
        label: "Humidity",
        unit: "%",
        min: 0,
        max: 100,
        color: "rgb(147, 51, 234)",
        formatValue: (v) => formatNumber(v, 1),
    },
    temperature: {
        label: "Temperature",
        unit: "°C",
        min: -10,
        max: 40,
        color: "rgb(239, 68, 68)",
        formatValue: (v) => formatNumber(v, 1),
    },
};
function generateRandomValue(min, max) {
    return min + Math.random() * (max - min);
}
export function generateMockData(type, count) {
    const config = SENSOR_CONFIG[type];
    const now = new Date();
    return Array.from({ length: count }, (_, i) => ({
        timestamp: new Date(now.getTime() - (count - i - 1) * 1000),
        value: generateRandomValue(config.min, config.max),
        type,
    }));
}
