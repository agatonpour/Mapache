
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { SensorCard } from "@/components/SensorCard";
import { SensorGraph } from "@/components/SensorGraph";
import { TimeframeSelector } from "@/components/TimeframeSelector";
import {
  generateMockData,
  SENSOR_CONFIG,
  type SensorData,
  type SensorType,
} from "@/lib/mock-data";
import { type Timeframe } from "@/lib/utils";

const UPDATE_INTERVAL = 5000; // Update every 5 seconds instead of every second
const DATA_POINTS = {
  "3m": 36, // 3 minutes = 36 points at 5-second intervals
  "1h": 720, // 1 hour = 720 points at 5-second intervals
  "24h": 17280, // 24 hours
  "1w": 120960, // 1 week
  "1m": 518400, // 1 month
  "1y": 6220800, // 1 year
} as const;

export default function Index() {
  const [selectedSensor, setSelectedSensor] = useState<SensorType>("temperature");
  const [timeframe, setTimeframe] = useState<Timeframe>("3m");
  const [sensorData, setSensorData] = useState<Record<SensorType, SensorData[]>>(
    Object.fromEntries(
      Object.keys(SENSOR_CONFIG).map((type) => [
        type,
        generateMockData(type as SensorType, DATA_POINTS["3m"]),
      ])
    ) as Record<SensorType, SensorData[]>
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setSensorData((prev) => {
        const now = new Date();
        return Object.fromEntries(
          Object.entries(prev).map(([type, data]) => {
            // Calculate the cutoff time based on the current timeframe
            const timeframeDurations = {
              "3m": 3 * 60 * 1000,
              "1h": 60 * 60 * 1000,
              "24h": 24 * 60 * 60 * 1000,
              "1w": 7 * 24 * 60 * 60 * 1000,
              "1m": 30 * 24 * 60 * 60 * 1000,
              "1y": 365 * 24 * 60 * 60 * 1000,
            };
            
            const cutoffTime = now.getTime() - timeframeDurations[timeframe];
            
            // Filter out data points older than the cutoff time
            const filteredData = data.filter(
              (point) => point.timestamp.getTime() > cutoffTime
            );

            return [
              type,
              [
                ...filteredData,
                {
                  timestamp: now,
                  value: generateMockData(type as SensorType, 1)[0].value,
                  type: type as SensorType,
                },
              ],
            ];
          })
        ) as Record<SensorType, SensorData[]>;
      });
    }, UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, [timeframe]); // Add timeframe as dependency to update filtering when timeframe changes

  const latestData = Object.fromEntries(
    Object.entries(sensorData).map(([type, data]) => [type, data[data.length - 1]])
  ) as Record<SensorType, SensorData>;

  // Filter data for the selected timeframe
  const filteredData = Object.fromEntries(
    Object.entries(sensorData).map(([type, data]) => {
      const now = new Date();
      const timeframeDurations = {
        "3m": 3 * 60 * 1000,
        "1h": 60 * 60 * 1000,
        "24h": 24 * 60 * 60 * 1000,
        "1w": 7 * 24 * 60 * 60 * 1000,
        "1m": 30 * 24 * 60 * 60 * 1000,
        "1y": 365 * 24 * 60 * 60 * 1000,
      };
      
      const cutoffTime = now.getTime() - timeframeDurations[timeframe];
      return [
        type,
        data.filter((point) => point.timestamp.getTime() > cutoffTime),
      ];
    })
  ) as Record<SensorType, SensorData[]>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Raccoonbot Interface
            </h1>
            <p className="text-gray-500">
              Real-time environmental sensor monitoring
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(SENSOR_CONFIG).map(([type]) => (
              <SensorCard
                key={type}
                type={type as SensorType}
                value={latestData[type as SensorType].value}
                timestamp={latestData[type as SensorType].timestamp}
                onClick={() => setSelectedSensor(type as SensorType)}
                isSelected={selectedSensor === type}
              />
            ))}
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="text-lg font-medium text-gray-900">
                {SENSOR_CONFIG[selectedSensor].label} History
              </div>
              <TimeframeSelector value={timeframe} onChange={setTimeframe} />
            </div>

            <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl p-4 shadow-sm">
              <SensorGraph
                data={filteredData[selectedSensor]}
                type={selectedSensor}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
