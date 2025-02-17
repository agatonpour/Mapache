
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

const INITIAL_DATA_POINTS = 180; // 3 minutes of data at 1 second intervals
const UPDATE_INTERVAL = 1000; // 1 second

export default function Index() {
  const [selectedSensor, setSelectedSensor] = useState<SensorType>("temperature");
  const [timeframe, setTimeframe] = useState<Timeframe>("3m");
  const [sensorData, setSensorData] = useState<Record<SensorType, SensorData[]>>(
    Object.fromEntries(
      Object.keys(SENSOR_CONFIG).map((type) => [
        type,
        generateMockData(type as SensorType, INITIAL_DATA_POINTS),
      ])
    ) as Record<SensorType, SensorData[]>
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setSensorData((prev) => {
        const now = new Date();
        return Object.fromEntries(
          Object.entries(prev).map(([type, data]) => [
            type,
            [
              ...data.slice(-INITIAL_DATA_POINTS + 1),
              {
                timestamp: now,
                value: generateMockData(type as SensorType, 1)[0].value,
                type: type as SensorType,
              },
            ],
          ])
        ) as Record<SensorType, SensorData[]>;
      });
    }, UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  const latestData = Object.fromEntries(
    Object.entries(sensorData).map(([type, data]) => [type, data[data.length - 1]])
  ) as Record<SensorType, SensorData>;

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
                data={sensorData[selectedSensor]}
                type={selectedSensor}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
